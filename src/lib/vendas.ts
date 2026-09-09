import "server-only";

import { fimDoDia, inicioDoDia, inicioDoMes } from "@/lib/datas";
import { prisma } from "@/lib/prisma";
import type { Papel } from "@/lib/sessao";

export const PERIODOS_VENDA = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7dias", rotulo: "7 dias" },
  { valor: "mes", rotulo: "Este mês" },
] as const;

export type PeriodoVenda = (typeof PERIODOS_VENDA)[number]["valor"];

function intervalo(periodo: PeriodoVenda) {
  const agora = new Date();
  if (periodo === "hoje") {
    return { de: inicioDoDia(agora), ate: fimDoDia(agora) };
  }
  if (periodo === "7dias") {
    const de = inicioDoDia(agora);
    de.setDate(de.getDate() - 6);
    return { de, ate: fimDoDia(agora) };
  }
  return { de: inicioDoMes(agora), ate: fimDoDia(agora) };
}

/**
 * O balconista só enxerga as vendas do turno aberto.
 *
 * Ele precisa disso para conferir e corrigir o que acabou de registrar. O
 * histórico dos turnos anteriores é do dono — é ali que se lê faturamento, e
 * faturamento não é informação de balcão.
 */
async function recorteDoPapel(papel: Papel) {
  if (papel === "DONO") return {};

  const aberto = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    select: { id: true },
    orderBy: { abertoEm: "desc" },
  });

  // Sem caixa aberto o balconista não tem turno, logo não tem vendas a ver.
  return { caixaId: aberto?.id ?? "__sem_caixa__" };
}

export async function listarVendas({
  papel,
  periodo = "hoje",
  numero,
  situacao,
}: {
  papel: Papel;
  periodo?: PeriodoVenda;
  numero?: number;
  situacao?: "CONCLUIDA" | "CANCELADA";
}) {
  const recorte = await recorteDoPapel(papel);

  // Busca por número ignora o período: quem digita um número sabe o que quer,
  // e obrigá-lo a acertar também o mês seria burocracia.
  const janela = intervalo(periodo);

  return prisma.venda.findMany({
    where: {
      ...recorte,
      ...(numero
        ? { numero }
        : { criadoEm: { gte: janela.de, lt: janela.ate } }),
      ...(situacao ? { status: situacao } : {}),
    },
    include: {
      usuario: { select: { nome: true } },
      _count: { select: { itens: true } },
    },
    orderBy: { numero: "desc" },
    take: 100,
  });
}

export async function buscarVenda(numero: number, papel: Papel) {
  const recorte = await recorteDoPapel(papel);

  return prisma.venda.findFirst({
    where: { numero, ...recorte },
    include: {
      usuario: { select: { nome: true } },
      caixa: {
        select: {
          id: true,
          abertoEm: true,
          status: true,
          usuarioAbertura: { select: { nome: true } },
        },
      },
      itens: {
        include: { produto: { select: { nome: true, unidade: true } } },
      },
    },
  });
}

export type VendaDetalhada = NonNullable<Awaited<ReturnType<typeof buscarVenda>>>;
