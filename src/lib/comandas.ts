import "server-only";

import { buscarCaixaAberto } from "@/lib/caixa";
import { prisma } from "@/lib/prisma";

/**
 * Consultas da comanda.
 *
 * Uma comanda só faz sentido dentro do turno que a abriu: ela representa
 * consumo que ainda não virou dinheiro na gaveta. Por isso tudo aqui parte do
 * caixa aberto.
 */

export async function listarComandasAbertas() {
  const caixa = await buscarCaixaAberto();
  if (!caixa) return [];

  const comandas = await prisma.comanda.findMany({
    where: { caixaId: caixa.id, status: "ABERTA" },
    include: {
      abertaPor: { select: { nome: true } },
      itens: { select: { subtotalCentavos: true, quantidade: true } },
    },
    orderBy: { abertaEm: "asc" },
  });

  return comandas.map((c) => ({
    id: c.id,
    numero: c.numero,
    identificacao: c.identificacao,
    abertaEm: c.abertaEm,
    abertaPor: c.abertaPor.nome,
    itens: c.itens.reduce((soma, i) => soma + i.quantidade, 0),
    totalCentavos: c.itens.reduce((soma, i) => soma + i.subtotalCentavos, 0),
  }));
}

export async function buscarComanda(numero: number) {
  return prisma.comanda.findUnique({
    where: { numero },
    include: {
      abertaPor: { select: { nome: true } },
      caixa: { select: { id: true, status: true } },
      venda: { select: { numero: true, totalCentavos: true } },
      itens: {
        include: {
          produto: { select: { nome: true, unidade: true, estoqueAtual: true } },
          lancadoPor: { select: { nome: true } },
        },
        orderBy: { criadoEm: "desc" },
      },
    },
  });
}

export type ComandaDetalhada = NonNullable<
  Awaited<ReturnType<typeof buscarComanda>>
>;

export function somarComanda(itens: { subtotalCentavos: number; quantidade: number }[]) {
  return {
    totalCentavos: itens.reduce((soma, i) => soma + i.subtotalCentavos, 0),
    unidades: itens.reduce((soma, i) => soma + i.quantidade, 0),
  };
}

/** Comandas fechadas do turno, para conferência no fim da noite. */
export async function comandasFechadasDoTurno() {
  const caixa = await buscarCaixaAberto();
  if (!caixa) return [];

  return prisma.comanda.findMany({
    where: { caixaId: caixa.id, status: { in: ["FECHADA", "CANCELADA"] } },
    include: {
      venda: { select: { numero: true, totalCentavos: true } },
      itens: { select: { subtotalCentavos: true } },
    },
    orderBy: { fechadaEm: "desc" },
    take: 20,
  });
}
