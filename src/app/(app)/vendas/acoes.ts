"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirSessao } from "@/lib/autenticacao";
import { prisma } from "@/lib/prisma";

export type EstadoCancelamento = { erro?: string; ok?: string };

const esquema = z.object({
  numero: z.coerce.number().int().positive(),
  motivo: z
    .string()
    .trim()
    .min(5, "Explique o motivo em poucas palavras — no mínimo cinco letras."),
});

/** Erro esperado de regra de negócio, distinto de falha técnica. */
class ErroDeCancelamento extends Error {}

/**
 * Cancela uma venda e desfaz o que ela causou.
 *
 * Cancelar não é apagar. A venda continua no banco marcada como cancelada,
 * porque o número do cupom foi entregue ao cliente e uma numeração com buraco
 * é pior que uma venda cancelada visível.
 *
 * Desfazer significa três coisas numa transação só: devolver o estoque de cada
 * item, gravar a devolução na trilha de movimentos, e marcar a venda. Se
 * qualquer parte falhar, nada acontece — uma venda cancelada cujo estoque não
 * voltou é pior que nenhum cancelamento.
 */
export async function cancelarVenda(
  _anterior: EstadoCancelamento,
  dados: FormData,
): Promise<EstadoCancelamento> {
  const sessao = await exigirSessao();

  const analise = esquema.safeParse({
    numero: dados.get("numero"),
    motivo: dados.get("motivo"),
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0].message };
  }

  const { numero, motivo } = analise.data;

  try {
    await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.findUnique({
        where: { numero },
        include: { itens: true, caixa: { select: { status: true } } },
      });

      if (!venda) throw new ErroDeCancelamento("Venda não encontrada.");

      if (venda.status === "CANCELADA") {
        throw new ErroDeCancelamento("Esta venda já está cancelada.");
      }

      // O balconista corrige o próprio turno; turno fechado já foi conferido
      // contra o dinheiro da gaveta, e mexer nele depois desfaz a conferência.
      if (venda.caixa.status !== "ABERTO" && sessao.papel !== "DONO") {
        throw new ErroDeCancelamento(
          "O turno desta venda já foi fechado. Só o dono pode cancelar uma venda de turno fechado.",
        );
      }

      for (const item of venda.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoqueAtual: { increment: item.quantidade } },
        });

        // A devolução entra como AJUSTE e não como ENTRADA: mercadoria não
        // chegou do fornecedor, ela nunca saiu da loja. Chamar de entrada
        // inflaria o total comprado no mês.
        await tx.movimentoEstoque.create({
          data: {
            produtoId: item.produtoId,
            tipo: "AJUSTE",
            quantidade: item.quantidade,
            custoUnitarioCentavos: item.custoUnitarioCentavos,
            observacao: `Devolução por cancelamento da venda nº ${numero}`,
            usuarioId: sessao.usuarioId,
          },
        });
      }

      await tx.venda.update({
        where: { id: venda.id },
        data: {
          status: "CANCELADA",
          canceladaEm: new Date(),
          canceladaPorId: sessao.usuarioId,
          motivoCancelamento: motivo,
        },
      });
    });
  } catch (erro) {
    if (erro instanceof ErroDeCancelamento) return { erro: erro.message };
    console.error("Falha ao cancelar venda", erro);
    return { erro: "Não foi possível cancelar a venda. Tente de novo." };
  }

  revalidatePath("/vendas");
  revalidatePath(`/vendas/${numero}`);
  revalidatePath("/caixa");
  revalidatePath("/relatorios");
  revalidatePath("/compras");
  revalidatePath("/estoque");
  revalidatePath("/pdv");
  revalidatePath("/");

  return { ok: "Venda cancelada e estoque devolvido." };
}
