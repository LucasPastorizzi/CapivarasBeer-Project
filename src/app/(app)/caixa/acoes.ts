"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirSessao } from "@/lib/autenticacao";
import { buscarCaixaAberto, resumirCaixa } from "@/lib/caixa";
import { inputParaCentavos } from "@/lib/dinheiro";
import { prisma } from "@/lib/prisma";

export type EstadoAcao = { erro?: string; ok?: string };

/** Aceita "150,00", "150.00", "R$ 150,00". Recusa negativo e texto solto. */
const dinheiro = (rotulo: string) =>
  z
    .string()
    .transform((texto) => inputParaCentavos(texto))
    .refine((c): c is number => c !== null, {
      message: `Informe ${rotulo} como número. Exemplo: 150,00`,
    })
    .refine((c) => c >= 0, { message: `${rotulo} não pode ser negativo.` })
    // Um turno de conveniência não movimenta cem mil reais em espécie; um
    // valor desses é dedo escorregando no teclado, não caixa de verdade.
    .refine((c) => c <= 10_000_000, {
      message: `${rotulo} parece alto demais. Confira o valor.`,
    });

const esquemaAbertura = z.object({
  valorAbertura: dinheiro("o troco inicial"),
  observacao: z.string().trim().max(280).optional(),
});

export async function abrirCaixa(
  _anterior: EstadoAcao,
  dados: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();

  const analise = esquemaAbertura.safeParse({
    valorAbertura: dados.get("valorAbertura") ?? "",
    observacao: dados.get("observacao") ?? undefined,
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0].message };
  }

  // Dois caixas abertos ao mesmo tempo tornam impossível dizer a qual turno
  // uma venda pertence.
  if (await buscarCaixaAberto()) {
    return { erro: "Já existe um caixa aberto. Feche-o antes de abrir outro." };
  }

  await prisma.caixa.create({
    data: {
      usuarioAberturaId: sessao.usuarioId,
      valorAberturaCentavos: analise.data.valorAbertura,
      observacao: analise.data.observacao || null,
    },
  });

  revalidatePath("/caixa");
  revalidatePath("/");
  return { ok: "Caixa aberto. Bom turno." };
}

const esquemaMovimento = z.object({
  tipo: z.enum(["SANGRIA", "SUPRIMENTO"]),
  valor: dinheiro("o valor"),
  motivo: z.string().trim().min(3, "Explique o motivo em poucas palavras."),
});

export async function registrarMovimento(
  _anterior: EstadoAcao,
  dados: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();

  const analise = esquemaMovimento.safeParse({
    tipo: dados.get("tipo"),
    valor: dados.get("valor") ?? "",
    motivo: dados.get("motivo") ?? "",
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0].message };
  }

  const caixa = await buscarCaixaAberto();
  if (!caixa) return { erro: "Nenhum caixa aberto." };

  const { tipo, valor, motivo } = analise.data;

  if (valor === 0) {
    return { erro: "O valor precisa ser maior que zero." };
  }

  // Sangria maior que o dinheiro em gaveta deixaria o caixa negativo — é
  // sempre erro de digitação, não operação real.
  if (tipo === "SANGRIA") {
    const { esperadoNaGavetaCentavos } = await resumirCaixa(caixa.id);
    if (valor > esperadoNaGavetaCentavos) {
      return {
        erro: "A sangria é maior que o dinheiro em caixa. Confira o valor.",
      };
    }
  }

  await prisma.movimentoCaixa.create({
    data: {
      caixaId: caixa.id,
      tipo,
      valorCentavos: valor,
      motivo,
      usuarioId: sessao.usuarioId,
    },
  });

  revalidatePath("/caixa");
  return {
    ok: tipo === "SANGRIA" ? "Sangria registrada." : "Suprimento registrado.",
  };
}

const esquemaFechamento = z.object({
  valorContado: dinheiro("o valor contado"),
  observacao: z.string().trim().max(280).optional(),
});

export async function fecharCaixa(
  _anterior: EstadoAcao,
  dados: FormData,
): Promise<EstadoAcao> {
  await exigirSessao();

  const analise = esquemaFechamento.safeParse({
    valorContado: dados.get("valorContado") ?? "",
    observacao: dados.get("observacao") ?? undefined,
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0].message };
  }

  const caixa = await buscarCaixaAberto();
  if (!caixa) return { erro: "Nenhum caixa aberto." };

  await prisma.caixa.update({
    where: { id: caixa.id },
    data: {
      status: "FECHADO",
      fechadoEm: new Date(),
      valorFechamentoCentavos: analise.data.valorContado,
      observacao: analise.data.observacao || caixa.observacao,
    },
  });

  revalidatePath("/caixa");
  revalidatePath("/");
  return { ok: "Caixa fechado." };
}
