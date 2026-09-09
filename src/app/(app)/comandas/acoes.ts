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
