"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirSessao } from "@/lib/autenticacao";
import { buscarCaixaAberto } from "@/lib/caixa";
import { prisma } from "@/lib/prisma";

export type EstadoComanda = { erro?: string; ok?: string };

const esquemaAbertura = z.object({
  identificacao: z
    .string()
    .trim()
    .min(1, "Diga a mesa ou o nome de quem está consumindo.")
    .max(40),
  observacao: z.string().trim().max(200).optional(),
});

export async function abrirComanda(
  _anterior: EstadoComanda,
  dados: FormData,
): Promise<EstadoComanda> {
  const sessao = await exigirSessao();

  const analise = esquemaAbertura.safeParse({
    identificacao: dados.get("identificacao") ?? "",
    observacao: dados.get("observacao") ?? undefined,
  });

  if (!analise.success) return { erro: analise.error.issues[0].message };

  const caixa = await buscarCaixaAberto();
  if (!caixa) {
    return {
      erro: "Nenhum caixa aberto. Abra o caixa antes de abrir comanda.",
    };
  }

  const { identificacao, observacao } = analise.data;

  // Duas mesas com a mesma identificação no mesmo turno é receita para cobrar
  // a conta errada. O sistema recusa antes de existirem duas "Mesa 3".
  const repetida = await prisma.comanda.findFirst({
    where: { caixaId: caixa.id, status: "ABERTA", identificacao },
  });

  if (repetida) {
    return {
      erro: `Já existe uma comanda aberta como "${identificacao}" (nº ${repetida.numero}). Use outro nome ou lance nela.`,
    };
  }

  let numero: number;

  try {
    const comanda = await prisma.$transaction(async (tx) => {
      // O SQLite não permite autoincrement fora da chave primária, então o
      // número sai daqui de dentro — onde a transação impede que duas mesas
      // abertas ao mesmo tempo recebam o mesmo.
      const ultima = await tx.comanda.findFirst({
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      return tx.comanda.create({
        data: {
          numero: (ultima?.numero ?? 0) + 1,
          identificacao,
          observacao: observacao || null,
          caixaId: caixa.id,
          abertaPorId: sessao.usuarioId,
        },
      });
    });

    numero = comanda.numero;
  } catch (erro) {
    console.error("Falha ao abrir comanda", erro);
    return { erro: "Não foi possível abrir a comanda. Tente de novo." };
  }

  revalidatePath("/comandas");
  redirect(`/comandas/${numero}`);
}

/** Erro esperado de regra de negócio, distinto de falha técnica. */
class ErroDeComanda extends Error {}

const esquemaLancamento = z.object({
  numero: z.coerce.number().int().positive(),
  produtoId: z.string().min(1),
  quantidade: z.coerce.number().int().positive().max(99),
});

/**
 * Lança uma rodada na comanda.
 *
 * O estoque baixa aqui, não no fechamento. A garrafa sai da geladeira quando
 * é servida: se a baixa esperasse a conta ser paga, a prateleira mentiria a
 * noite inteira e o PDV venderia cerveja que já está na mesa.
 *
 * A consequência é que existe consumo sem venda enquanto a conta está aberta —
 * o que é exatamente a realidade que a comanda representa. O movimento entra
 * como SAIDA_COMANDA justamente para não ser confundido com faturamento.
 */
export async function lancarItem(
  _anterior: EstadoComanda,
  dados: FormData,
): Promise<EstadoComanda> {
  const sessao = await exigirSessao();

  const analise = esquemaLancamento.safeParse({
    numero: dados.get("numero"),
    produtoId: dados.get("produtoId"),
    quantidade: dados.get("quantidade") ?? 1,
  });

  if (!analise.success) return { erro: "Lançamento inválido." };

  const { numero, produtoId, quantidade } = analise.data;

  try {
    await prisma.$transaction(async (tx) => {
      const comanda = await tx.comanda.findUnique({
        where: { numero },
        include: { caixa: { select: { status: true } } },
      });

      if (!comanda) throw new ErroDeComanda("Comanda não encontrada.");
      if (comanda.status !== "ABERTA") {
        throw new ErroDeComanda("Esta comanda já foi fechada.");
      }
      if (comanda.caixa.status !== "ABERTO") {
        throw new ErroDeComanda("O turno desta comanda já foi fechado.");
      }

      const produto = await tx.produto.findUnique({ where: { id: produtoId } });
      if (!produto || !produto.ativo) {
        throw new ErroDeComanda("Produto não encontrado.");
      }

      // O estoque é reconferido aqui dentro: entre abrir a tela e lançar, o
      // outro balconista pode ter vendido a última no PDV.
      if (produto.estoqueAtual < quantidade) {
        throw new ErroDeComanda(
          `Estoque insuficiente de ${produto.nome}: restam ${produto.estoqueAtual}.`,
        );
      }

      // Mesmo produto na mesma conta vira quantidade, não linha repetida — a
      // conta impressa no fim fica legível.
      const existente = await tx.itemComanda.findFirst({
        where: { comandaId: comanda.id, produtoId },
      });

      if (existente) {
        await tx.itemComanda.update({
          where: { id: existente.id },
          data: {
            quantidade: { increment: quantidade },
            subtotalCentavos: {
              increment: produto.precoVendaCentavos * quantidade,
            },
          },
        });
      } else {
        await tx.itemComanda.create({
          data: {
            comandaId: comanda.id,
            produtoId,
            quantidade,
            precoUnitarioCentavos: produto.precoVendaCentavos,
            custoUnitarioCentavos: produto.precoCustoCentavos,
            subtotalCentavos: produto.precoVendaCentavos * quantidade,
            lancadoPorId: sessao.usuarioId,
          },
        });
      }

      await tx.produto.update({
        where: { id: produtoId },
        data: { estoqueAtual: { decrement: quantidade } },
      });

      await tx.movimentoEstoque.create({
        data: {
          produtoId,
          tipo: "SAIDA_COMANDA",
          quantidade: -quantidade,
          custoUnitarioCentavos: produto.precoCustoCentavos,
          observacao: `Comanda nº ${numero} — ${comanda.identificacao}`,
          usuarioId: sessao.usuarioId,
        },
      });
    });
  } catch (erro) {
    if (erro instanceof ErroDeComanda) return { erro: erro.message };
    console.error("Falha ao lançar item na comanda", erro);
    return { erro: "Não foi possível lançar o item. Tente de novo." };
  }

  revalidatePath(`/comandas/${numero}`);
  revalidatePath("/comandas");
  revalidatePath("/pdv");
  revalidatePath("/estoque");

  return { ok: "Lançado." };
}
