import "server-only";

import { fimDoDia, inicioDoDia, inicioDoMes } from "@/lib/datas";
import { FORMAS_PAGAMENTO, type FormaPagamento } from "@/lib/pagamentos";
import { prisma } from "@/lib/prisma";

export const PERIODOS = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7dias", rotulo: "Últimos 7 dias" },
  { valor: "30dias", rotulo: "Últimos 30 dias" },
  { valor: "mes", rotulo: "Este mês" },
  { valor: "mespassado", rotulo: "Mês passado" },
] as const;

export type Periodo = (typeof PERIODOS)[number]["valor"];

export type Intervalo = { de: Date; ate: Date; rotulo: string };

/**
 * Resolve o período escolhido em um intervalo concreto.
 *
 * `ate` é sempre exclusivo (o instante seguinte ao último), para que uma venda
 * às 23h59 do último dia entre no relatório. Comparar com `<=` sobre a data
 * perderia essa venda — que numa loja que fecha à meia-noite é justamente a
 * hora de mais movimento.
 */
export function resolverIntervalo(periodo: Periodo): Intervalo {
  const agora = new Date();

  if (periodo === "hoje") {
    return { de: inicioDoDia(agora), ate: fimDoDia(agora), rotulo: "hoje" };
  }

  if (periodo === "7dias" || periodo === "30dias") {
    const dias = periodo === "7dias" ? 7 : 30;
    const de = inicioDoDia(agora);
    de.setDate(de.getDate() - (dias - 1));
    return { de, ate: fimDoDia(agora), rotulo: `nos últimos ${dias} dias` };
  }

  if (periodo === "mespassado") {
    const de = inicioDoMes(agora);
    de.setMonth(de.getMonth() - 1);
    const ate = inicioDoMes(agora);
    return { de, ate, rotulo: "no mês passado" };
  }

  return { de: inicioDoMes(agora), ate: fimDoDia(agora), rotulo: "neste mês" };
}

/** O período imediatamente anterior, de mesma duração, para comparação. */
export function intervaloAnterior({ de, ate }: Intervalo): Intervalo {
  const duracao = ate.getTime() - de.getTime();
  return {
    de: new Date(de.getTime() - duracao),
    ate: new Date(de.getTime()),
    rotulo: "período anterior",
  };
}

async function resumirPeriodo({ de, ate }: Intervalo) {
  const [vendas, itens] = await Promise.all([
    prisma.venda.aggregate({
      where: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } },
      _sum: { totalCentavos: true, descontoCentavos: true },
      _count: { _all: true },
    }),
    prisma.itemVenda.findMany({
      where: { venda: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } } },
      select: { quantidade: true, custoUnitarioCentavos: true },
    }),
  ]);

  const receitaCentavos = vendas._sum.totalCentavos ?? 0;
  const descontoCentavos = vendas._sum.descontoCentavos ?? 0;
  const quantidade = vendas._count._all;

  // O custo vem do que foi gravado no item no momento da venda, não do preço
  // de custo atual do produto: se o fornecedor reajustou depois, a margem
  // daquele mês continua sendo a que realmente aconteceu.
  const custoCentavos = itens.reduce(
    (soma, i) => soma + i.custoUnitarioCentavos * i.quantidade,
    0,
  );

  const lucroBrutoCentavos = receitaCentavos - custoCentavos;

  return {
    receitaCentavos,
    custoCentavos,
    lucroBrutoCentavos,
    descontoCentavos,
    quantidade,
    unidades: itens.reduce((soma, i) => soma + i.quantidade, 0),
    ticketMedioCentavos:
      quantidade > 0 ? Math.round(receitaCentavos / quantidade) : 0,
    margemPercentual:
      receitaCentavos > 0 ? (lucroBrutoCentavos / receitaCentavos) * 100 : 0,
  };
}

async function serieDoPeriodo({ de, ate }: Intervalo) {
  const vendas = await prisma.venda.findMany({
    where: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } },
    select: { criadoEm: true, totalCentavos: true },
  });

  const baldes = new Map<string, number>();
  const cursor = inicioDoDia(de);
  while (cursor < ate) {
    baldes.set(cursor.toDateString(), 0);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const venda of vendas) {
    const chave = inicioDoDia(venda.criadoEm).toDateString();
    if (baldes.has(chave)) {
      baldes.set(chave, (baldes.get(chave) ?? 0) + venda.totalCentavos);
    }
  }

  return [...baldes.entries()].map(([chave, totalCentavos]) => ({
    data: new Date(chave),
    totalCentavos,
  }));
}

async function mixDoPeriodo({ de, ate }: Intervalo) {
  const linhas = await prisma.venda.groupBy({
    by: ["formaPagamento"],
    where: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } },
    _sum: { totalCentavos: true },
    _count: { _all: true },
  });

  return FORMAS_PAGAMENTO.map((forma) => {
    const linha = linhas.find((l) => l.formaPagamento === forma);
    return {
      forma: forma as FormaPagamento,
      totalCentavos: linha?._sum.totalCentavos ?? 0,
      quantidade: linha?._count._all ?? 0,
    };
  });
}

export type LinhaRentabilidade = {
  id: string;
  nome: string;
  categoria: string;
  unidades: number;
  receitaCentavos: number;
  custoCentavos: number;
  lucroCentavos: number;
  margemPercentual: number;
};

/**
 * Rentabilidade por produto.
 *
 * Ordena por lucro, não por faturamento: o que sustenta a loja é o que sobra,
 * e um item de giro alto com margem magra pode render menos que um de giro
 * baixo com margem gorda.
 */
export async function rentabilidadePorProduto(
  { de, ate }: Intervalo,
  limite = 15,
): Promise<LinhaRentabilidade[]> {
  const itens = await prisma.itemVenda.findMany({
    where: { venda: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } } },
    select: {
      produtoId: true,
      quantidade: true,
      subtotalCentavos: true,
      custoUnitarioCentavos: true,
      produto: { select: { nome: true, categoria: { select: { nome: true } } } },
    },
  });

  const acumulado = new Map<string, LinhaRentabilidade>();

  for (const item of itens) {
    const atual = acumulado.get(item.produtoId) ?? {
      id: item.produtoId,
      nome: item.produto.nome,
      categoria: item.produto.categoria.nome,
      unidades: 0,
      receitaCentavos: 0,
      custoCentavos: 0,
      lucroCentavos: 0,
      margemPercentual: 0,
    };

    atual.unidades += item.quantidade;
    atual.receitaCentavos += item.subtotalCentavos;
    atual.custoCentavos += item.custoUnitarioCentavos * item.quantidade;
    acumulado.set(item.produtoId, atual);
  }

  return [...acumulado.values()]
    .map((linha) => ({
      ...linha,
      lucroCentavos: linha.receitaCentavos - linha.custoCentavos,
      margemPercentual:
        linha.receitaCentavos > 0
          ? ((linha.receitaCentavos - linha.custoCentavos) /
              linha.receitaCentavos) *
            100
          : 0,
    }))
    .sort((a, b) => b.lucroCentavos - a.lucroCentavos)
    .slice(0, limite);
}

export async function carregarRelatorio(periodo: Periodo) {
  const intervalo = resolverIntervalo(periodo);
  const anterior = intervaloAnterior(intervalo);

  const [resumo, resumoAnterior, serie, mix, rentabilidade] = await Promise.all([
    resumirPeriodo(intervalo),
    resumirPeriodo(anterior),
    serieDoPeriodo(intervalo),
    mixDoPeriodo(intervalo),
    rentabilidadePorProduto(intervalo),
  ]);

  return { intervalo, resumo, resumoAnterior, serie, mix, rentabilidade };
}

export type DadosRelatorio = Awaited<ReturnType<typeof carregarRelatorio>>;
