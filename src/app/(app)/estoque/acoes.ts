"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirDono } from "@/lib/autenticacao";
import { inputParaCentavos } from "@/lib/dinheiro";
import { prisma } from "@/lib/prisma";

export type EstadoEstoque = { erro?: string; ok?: string };

const inteiroPositivo = z
  .string()
  .transform((t) => Number(t))
  .refine((n) => Number.isInteger(n) && n > 0, {
    message: "A quantidade precisa ser um número inteiro maior que zero.",
  });

const inteiroNaoNegativo = z
  .string()
  .transform((t) => Number(t))
  .refine((n) => Number.isInteger(n) && n >= 0, {
    message: "A contagem precisa ser um número inteiro igual ou maior que zero.",
  });

const esquema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("ENTRADA"),
    produtoId: z.string().min(1, "Escolha o produto."),
    quantidade: inteiroPositivo,
    custoUnitario: z.string(),
    atualizarCusto: z.string().optional(),
    observacao: z.string().trim().max(280).optional(),
  }),
  z.object({
    tipo: z.literal("AJUSTE"),
    produtoId: z.string().min(1, "Escolha o produto."),
    // Na contagem a pessoa informa o que existe na prateleira, não a
    // diferença. Pedir a diferença obriga a fazer subtração de cabeça na
    // frente da estante — e é aí que o estoque se descola da realidade.
    contagem: inteiroNaoNegativo,
    observacao: z.string().trim().min(3, "Explique o motivo do ajuste."),
  }),
  z.object({
    tipo: z.literal("PERDA"),
    produtoId: z.string().min(1, "Escolha o produto."),
    quantidade: inteiroPositivo,
    observacao: z.string().trim().min(3, "Explique o que aconteceu."),
  }),
]);

export async function registrarMovimento(
  _anterior: EstadoEstoque,
  dados: FormData,
): Promise<EstadoEstoque> {
  const sessao = await exigirDono();

  const analise = esquema.safeParse({
    tipo: dados.get("tipo"),
    produtoId: String(dados.get("produtoId") ?? ""),
    quantidade: String(dados.get("quantidade") ?? ""),
    contagem: String(dados.get("contagem") ?? ""),
    custoUnitario: String(dados.get("custoUnitario") ?? ""),
    atualizarCusto: dados.get("atualizarCusto") ? "sim" : undefined,
    observacao: String(dados.get("observacao") ?? ""),
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0].message };
  }

  const entrada = analise.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id: entrada.produtoId },
      });
      if (!produto) throw new ErroDeEstoque("Produto não encontrado.");

      let delta: number;
      let custoUnitarioCentavos: number | null = null;
      let observacao = entrada.observacao?.trim() || null;

      if (entrada.tipo === "ENTRADA") {
        delta = entrada.quantidade;

        if (entrada.custoUnitario.trim() !== "") {
          const custo = inputParaCentavos(entrada.custoUnitario);
          if (custo === null || custo < 0) {
            throw new ErroDeEstoque(
              "Informe o custo unitário como número. Exemplo: 2,80",
            );
          }
          custoUnitarioCentavos = custo;

          // O custo do produto só muda se a pessoa pedir. Uma compra
          // promocional não deve reescrever o custo de referência sozinha.
          if (entrada.atualizarCusto) {
            await tx.produto.update({
              where: { id: produto.id },
              data: { precoCustoCentavos: custo },
            });
          }
        }
      } else if (entrada.tipo === "PERDA") {
        if (entrada.quantidade > produto.estoqueAtual) {
          throw new ErroDeEstoque(
            `Não é possível perder ${entrada.quantidade}: há ${produto.estoqueAtual} em estoque.`,
          );
        }
        delta = -entrada.quantidade;
        custoUnitarioCentavos = produto.precoCustoCentavos;
      } else {
        delta = entrada.contagem - produto.estoqueAtual;
        if (delta === 0) {
          throw new ErroDeEstoque(
            `A contagem bate com o sistema: ${produto.estoqueAtual} em estoque. Nada a ajustar.`,
          );
        }
        observacao = `${observacao} (sistema tinha ${produto.estoqueAtual}, contagem ${entrada.contagem})`;
      }

      const atualizado = await tx.produto.update({
        where: { id: produto.id },
        data: { estoqueAtual: { increment: delta } },
      });

      await tx.movimentoEstoque.create({
        data: {
          produtoId: produto.id,
          tipo: entrada.tipo,
          quantidade: delta,
          custoUnitarioCentavos,
          observacao,
          usuarioId: sessao.usuarioId,
        },
      });

      return { nome: produto.nome, delta, estoque: atualizado.estoqueAtual };
    });

    revalidatePath("/estoque");
    revalidatePath("/produtos");
    revalidatePath("/pdv");
    revalidatePath("/");

    const sinal = resultado.delta > 0 ? "+" : "";
    return {
      ok: `${resultado.nome}: ${sinal}${resultado.delta}. Estoque agora em ${resultado.estoque}.`,
    };
  } catch (erro) {
    if (erro instanceof ErroDeEstoque) return { erro: erro.message };
    console.error("Falha ao registrar movimento de estoque", erro);
    return { erro: "Não foi possível registrar o movimento. Tente de novo." };
  }
}

/** Erro esperado de regra de negócio, distinto de falha técnica. */
class ErroDeEstoque extends Error {}
