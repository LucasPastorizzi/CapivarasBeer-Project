"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirSessao } from "@/lib/autenticacao";
import { buscarCaixaAberto } from "@/lib/caixa";
import { FORMAS_PAGAMENTO } from "@/lib/pagamentos";
import { prisma } from "@/lib/prisma";

export type ResultadoVenda =
  | { erro: string }
  | {
      ok: true;
      numero: number;
      totalCentavos: number;
      trocoCentavos: number;
    };

const esquema = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.string().min(1),
        quantidade: z.number().int().positive().max(999),
      }),
    )
    .min(1, "Adicione ao menos um produto antes de finalizar."),
  formaPagamento: z.enum(FORMAS_PAGAMENTO),
  descontoCentavos: z.number().int().min(0),
  recebidoCentavos: z.number().int().min(0),
});

export type EntradaVenda = z.input<typeof esquema>;

/**
 * Registra a venda.
 *
 * O cliente manda apenas o que ele legitimamente sabe: quais produtos, quantos
 * de cada, forma de pagamento. Preço, subtotal e total são lidos e calculados
 * do banco — quem confia no preço enviado pelo navegador aceita qualquer
 * preço que alguém queira enviar.
 *
 * Tudo acontece numa transação: ou a venda existe com seus itens, sua baixa de
 * estoque e sua trilha de auditoria, ou nada aconteceu. Uma venda pela metade
 * é pior que venda nenhuma, porque ninguém percebe.
 */
export async function registrarVenda(
  entrada: EntradaVenda,
): Promise<ResultadoVenda> {
  const sessao = await exigirSessao();

  const analise = esquema.safeParse(entrada);
  if (!analise.success) {
    return { erro: analise.error.issues[0].message };
  }

  const { itens, formaPagamento, descontoCentavos, recebidoCentavos } =
    analise.data;

  const caixa = await buscarCaixaAberto();
  if (!caixa) {
    return { erro: "Nenhum caixa aberto. Abra o caixa antes de vender." };
  }

  // Um mesmo produto pode ter sido bipado várias vezes: consolida antes de
  // conferir estoque, senão duas linhas de 5 passam por 5 e não por 10.
  const quantidadePorProduto = new Map<string, number>();
  for (const item of itens) {
    quantidadePorProduto.set(
      item.produtoId,
      (quantidadePorProduto.get(item.produtoId) ?? 0) + item.quantidade,
    );
  }

  try {
    const venda = await prisma.$transaction(async (tx) => {
      const produtos = await tx.produto.findMany({
        where: { id: { in: [...quantidadePorProduto.keys()] } },
      });

      if (produtos.length !== quantidadePorProduto.size) {
        throw new ErroDeVenda(
          "Algum produto do carrinho não existe mais. Refaça a venda.",
        );
      }

      let subtotalCentavos = 0;
      const linhas = produtos.map((produto) => {
        const quantidade = quantidadePorProduto.get(produto.id)!;

        if (produto.estoqueAtual < quantidade) {
          throw new ErroDeVenda(
            `Estoque insuficiente de ${produto.nome}: restam ${produto.estoqueAtual}.`,
          );
        }

        const subtotal = produto.precoVendaCentavos * quantidade;
        subtotalCentavos += subtotal;

        return {
          produto,
          quantidade,
          subtotalCentavos: subtotal,
        };
      });

      if (descontoCentavos > subtotalCentavos) {
        throw new ErroDeVenda("O desconto é maior que o valor da venda.");
      }

      const totalCentavos = subtotalCentavos - descontoCentavos;

      if (formaPagamento === "DINHEIRO" && recebidoCentavos < totalCentavos) {
        throw new ErroDeVenda("O valor recebido é menor que o total da venda.");
      }

      // O SQLite não permite autoincrement fora da chave primária, então o
      // número do cupom é atribuído aqui dentro, onde a transação garante que
      // duas vendas simultâneas não recebam o mesmo.
      const ultima = await tx.venda.findFirst({
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      const criada = await tx.venda.create({
        data: {
          numero: (ultima?.numero ?? 0) + 1,
          caixaId: caixa.id,
          usuarioId: sessao.usuarioId,
          subtotalCentavos,
          descontoCentavos,
          totalCentavos,
          formaPagamento,
          itens: {
            create: linhas.map((l) => ({
              produtoId: l.produto.id,
              quantidade: l.quantidade,
              precoUnitarioCentavos: l.produto.precoVendaCentavos,
              custoUnitarioCentavos: l.produto.precoCustoCentavos,
              subtotalCentavos: l.subtotalCentavos,
            })),
          },
        },
      });

      for (const linha of linhas) {
        await tx.produto.update({
          where: { id: linha.produto.id },
          data: { estoqueAtual: { decrement: linha.quantidade } },
        });

        await tx.movimentoEstoque.create({
          data: {
            produtoId: linha.produto.id,
            tipo: "SAIDA_VENDA",
            quantidade: -linha.quantidade,
            custoUnitarioCentavos: linha.produto.precoCustoCentavos,
            vendaId: criada.id,
            usuarioId: sessao.usuarioId,
          },
        });
      }

      return criada;
    });

    revalidatePath("/pdv");
    revalidatePath("/caixa");
    revalidatePath("/");

    return {
      ok: true,
      numero: venda.numero,
      totalCentavos: venda.totalCentavos,
      trocoCentavos:
        formaPagamento === "DINHEIRO"
          ? recebidoCentavos - venda.totalCentavos
          : 0,
    };
  } catch (erro) {
    if (erro instanceof ErroDeVenda) return { erro: erro.message };
    console.error("Falha ao registrar venda", erro);
    return { erro: "Não foi possível registrar a venda. Tente de novo." };
  }
}

/** Erro esperado de regra de negócio, distinto de falha técnica. */
class ErroDeVenda extends Error {}
