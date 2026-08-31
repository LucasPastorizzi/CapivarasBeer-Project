import "server-only";

import { fimDoDia, fimDoMes, inicioDoDia, inicioDoMes } from "@/lib/datas";
import { FORMAS_PAGAMENTO, type FormaPagamento } from "@/lib/pagamentos";
import { prisma } from "@/lib/prisma";

async function somarVendas(de: Date, ate: Date) {
  const resultado = await prisma.venda.aggregate({
    where: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } },
    _sum: { totalCentavos: true },
    _count: { _all: true },
  });

  const total = resultado._sum.totalCentavos ?? 0;
  const quantidade = resultado._count._all;

  return {
    totalCentavos: total,
    quantidade,
    // Ticket médio só existe se houve venda; zero dividido por zero na tela
    // vira "NaN" e destrói a confiança no resto do painel.
    ticketMedioCentavos: quantidade > 0 ? Math.round(total / quantidade) : 0,
  };
}

/**
 * Faturamento por dia dos últimos `dias` dias, incluindo hoje.
 *
 * Os dias sem venda entram com zero em vez de sumir: um buraco na série é
 * informação — foi segunda-feira, a loja não abriu — e uma barra ausente
 * mente sobre o ritmo da semana.
 */
async function serieDiaria(dias: number) {
  const inicio = inicioDoDia();
  inicio.setDate(inicio.getDate() - (dias - 1));

  const vendas = await prisma.venda.findMany({
    where: { status: "CONCLUIDA", criadoEm: { gte: inicio } },
    select: { criadoEm: true, totalCentavos: true },
  });

  const baldes = new Map<string, number>();
  for (let i = 0; i < dias; i += 1) {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    baldes.set(dia.toDateString(), 0);
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

async function mixDePagamento(de: Date, ate: Date) {
  const linhas = await prisma.venda.groupBy({
    by: ["formaPagamento"],
    where: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } },
    _sum: { totalCentavos: true },
    _count: { _all: true },
  });

  // Ordem fixa das formas: a cor segue a forma de pagamento, nunca a posição
  // no ranking. Se o Pix passar o dinheiro, cada um mantém a própria cor.
  return FORMAS_PAGAMENTO.map((forma) => {
    const linha = linhas.find((l) => l.formaPagamento === forma);
    return {
      forma: forma as FormaPagamento,
      totalCentavos: linha?._sum.totalCentavos ?? 0,
      quantidade: linha?._count._all ?? 0,
    };
  });
}

async function maisVendidos(de: Date, ate: Date, quantos = 5) {
  const linhas = await prisma.itemVenda.groupBy({
    by: ["produtoId"],
    where: { venda: { status: "CONCLUIDA", criadoEm: { gte: de, lt: ate } } },
    _sum: { quantidade: true, subtotalCentavos: true },
    orderBy: { _sum: { quantidade: "desc" } },
    take: quantos,
  });

  if (linhas.length === 0) return [];

  const produtos = await prisma.produto.findMany({
    where: { id: { in: linhas.map((l) => l.produtoId) } },
    select: { id: true, nome: true, categoria: { select: { nome: true } } },
  });

  return linhas.map((l) => {
    const produto = produtos.find((p) => p.id === l.produtoId);
    return {
      id: l.produtoId,
      nome: produto?.nome ?? "Produto removido",
      categoria: produto?.categoria.nome ?? "—",
      unidades: l._sum.quantidade ?? 0,
      totalCentavos: l._sum.subtotalCentavos ?? 0,
    };
  });
}

export async function carregarPainel() {
  const agora = new Date();

  // A comparação útil não é com ontem, é com o mesmo dia da semana passada:
  // um sábado de conveniência não se parece com a terça anterior.
  const mesmoDiaSemanaPassada = new Date(agora);
  mesmoDiaSemanaPassada.setDate(agora.getDate() - 7);

  const [
    hoje,
    referencia,
    mes,
    serie,
    mix,
    topProdutos,
    produtosEmFalta,
    caixaAberto,
    totalProdutos,
  ] = await Promise.all([
    somarVendas(inicioDoDia(agora), fimDoDia(agora)),
    somarVendas(
      inicioDoDia(mesmoDiaSemanaPassada),
      fimDoDia(mesmoDiaSemanaPassada),
    ),
    somarVendas(inicioDoMes(agora), fimDoMes(agora)),
    serieDiaria(14),
    mixDePagamento(inicioDoMes(agora), fimDoMes(agora)),
    maisVendidos(inicioDoMes(agora), fimDoMes(agora)),
    prisma.produto.findMany({
      where: {
        ativo: true,
        estoqueAtual: { lte: prisma.produto.fields.estoqueMinimo },
      },
      select: {
        id: true,
        nome: true,
        estoqueAtual: true,
        estoqueMinimo: true,
        categoria: { select: { nome: true, cor: true } },
      },
      orderBy: { estoqueAtual: "asc" },
      take: 8,
    }),
    prisma.caixa.findFirst({
      where: { status: "ABERTO" },
      select: {
        id: true,
        abertoEm: true,
        valorAberturaCentavos: true,
        usuarioAbertura: { select: { nome: true } },
      },
      orderBy: { abertoEm: "desc" },
    }),
    prisma.produto.count({ where: { ativo: true } }),
  ]);

  return {
    agora,
    hoje,
    referencia,
    mes,
    serie,
    mix,
    topProdutos,
    produtosEmFalta,
    caixaAberto,
    totalProdutos,
  };
}

export type DadosPainel = Awaited<ReturnType<typeof carregarPainel>>;
