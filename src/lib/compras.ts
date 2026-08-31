import "server-only";

import { inicioDoDia } from "@/lib/datas";
import { prisma } from "@/lib/prisma";

/**
 * Sugestão de compra a partir do giro real.
 *
 * O alerta de "abaixo do mínimo" que o sistema já tinha responde à pergunta
 * errada. O mínimo é um número que alguém chutou uma vez e nunca revisou; ele
 * diz que acabou, não quanto pedir nem quando vai acabar.
 *
 * Aqui a conta parte do que a loja realmente vendeu.
 */

/** Janela de histórico. Quatro semanas cobrem a variação entre semanas. */
const DIAS_DE_HISTORICO = 28;

/** Abaixo disto o histórico é ruído, e projetar em cima seria inventar. */
const MINIMO_DE_VENDAS_PARA_PROJETAR = 3;

export type LinhaDeCompra = {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  multiploCompra: number;
  precoCustoCentavos: number;
  /** Unidades vendidas na janela inteira. */
  vendidoNaJanela: number;
  /** Ritmo semanal, já ponderado pelos dias em que a loja abre. */
  porSemana: number;
  /** Quando o estoque zera no ritmo atual. Null se não zera no horizonte. */
  acabaEm: Date | null;
  /** Demanda esperada até o fim do horizonte escolhido. */
  demandaNoHorizonte: number;
  /** Quanto pedir, já arredondado para o múltiplo de compra. */
  sugestao: number;
  custoDaSugestaoCentavos: number;
  /** Por que não há sugestão confiável, quando for o caso. */
  ressalva: string | null;
};

/**
 * Demanda média por dia da semana.
 *
 * Dividir por dias corridos seria o erro fácil: a loja fecha domingo e
 * segunda, e sábado vende o dobro de terça. Uma média achatada diz que o
 * estoque dura sete dias quando ele morre na sexta à noite.
 */
function mediaPorDiaDaSemana(
  vendasPorData: Map<string, number>,
  inicio: Date,
  dias: number,
): number[] {
  const soma = new Array(7).fill(0);
  const ocorrencias = new Array(7).fill(0);

  for (let i = 0; i < dias; i += 1) {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    const semana = dia.getDay();

    soma[semana] += vendasPorData.get(dia.toDateString()) ?? 0;
    ocorrencias[semana] += 1;
  }

  return soma.map((total, i) =>
    ocorrencias[i] > 0 ? total / ocorrencias[i] : 0,
  );
}

export async function montarListaDeCompra(horizonteEmDias = 14) {
  const agora = new Date();
  const inicio = inicioDoDia(agora);
  inicio.setDate(inicio.getDate() - DIAS_DE_HISTORICO);

  const [produtos, itens] = await Promise.all([
    prisma.produto.findMany({
      where: { ativo: true },
      include: { categoria: { select: { nome: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.itemVenda.findMany({
      where: {
        venda: { status: "CONCLUIDA", criadoEm: { gte: inicio } },
      },
      select: {
        produtoId: true,
        quantidade: true,
        venda: { select: { criadoEm: true } },
      },
    }),
  ]);

  // Vendas por produto e por dia, para reconstruir o ritmo de cada semana.
  const porProduto = new Map<string, Map<string, number>>();
  for (const item of itens) {
    const dia = inicioDoDia(item.venda.criadoEm).toDateString();
    const mapa = porProduto.get(item.produtoId) ?? new Map<string, number>();
    mapa.set(dia, (mapa.get(dia) ?? 0) + item.quantidade);
    porProduto.set(item.produtoId, mapa);
  }

  const linhas: LinhaDeCompra[] = produtos.map((produto) => {
    const vendasPorData = porProduto.get(produto.id) ?? new Map();
    const vendidoNaJanela = [...vendasPorData.values()].reduce(
      (soma, n) => soma + n,
      0,
    );

    const media = mediaPorDiaDaSemana(vendasPorData, inicio, DIAS_DE_HISTORICO);
    const porSemana = media.reduce((soma, n) => soma + n, 0);

    // Projeta dia a dia a partir de amanhã, usando o dia da semana de cada um.
    let restante = produto.estoqueAtual;
    let acabaEm: Date | null = null;
    let demandaNoHorizonte = 0;

    for (let i = 1; i <= horizonteEmDias; i += 1) {
      // A projeção parte de hoje, não do começo da janela de histórico.
      const dia = inicioDoDia(agora);
      dia.setDate(dia.getDate() + i);
      const esperado = media[dia.getDay()];

      demandaNoHorizonte += esperado;

      if (acabaEm === null && restante - esperado <= 0 && esperado > 0) {
        acabaEm = dia;
      }
      restante -= esperado;
    }

    const semHistorico = vendidoNaJanela < MINIMO_DE_VENDAS_PARA_PROJETAR;

    // Pedir o que falta para atravessar o horizonte e ainda encostar no
    // mínimo, nunca menos que zero.
    const bruto = Math.ceil(
      demandaNoHorizonte + produto.estoqueMinimo - produto.estoqueAtual,
    );

    const multiplo = Math.max(1, produto.multiploCompra);
    const sugestao =
      semHistorico || bruto <= 0
        ? 0
        : Math.ceil(bruto / multiplo) * multiplo;

    return {
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria.nome,
      unidade: produto.unidade,
      estoqueAtual: produto.estoqueAtual,
      estoqueMinimo: produto.estoqueMinimo,
      multiploCompra: multiplo,
      precoCustoCentavos: produto.precoCustoCentavos,
      vendidoNaJanela,
      porSemana,
      acabaEm,
      demandaNoHorizonte,
      sugestao,
      custoDaSugestaoCentavos: sugestao * produto.precoCustoCentavos,
      ressalva: semHistorico
        ? vendidoNaJanela === 0
          ? "Sem venda nas últimas 4 semanas"
          : "Histórico curto demais para projetar"
        : null,
    };
  });

  const paraComprar = linhas
    .filter((l) => l.sugestao > 0)
    // O que acaba antes vem primeiro: a lista é lida de cima para baixo e a
    // urgência precisa estar onde o olho começa.
    .sort((a, b) => {
      if (a.acabaEm && b.acabaEm) return a.acabaEm.getTime() - b.acabaEm.getTime();
      if (a.acabaEm) return -1;
      if (b.acabaEm) return 1;
      return b.porSemana - a.porSemana;
    });

  const semSugestao = linhas.filter((l) => l.sugestao === 0);

  return {
    horizonteEmDias,
    diasDeHistorico: DIAS_DE_HISTORICO,
    paraComprar,
    semSugestao,
    custoTotalCentavos: paraComprar.reduce(
      (soma, l) => soma + l.custoDaSugestaoCentavos,
      0,
    ),
    /** Quantos itens acabam antes do próximo fim de semana. */
    urgentes: paraComprar.filter(
      (l) => l.acabaEm !== null && l.acabaEm.getTime() - agora.getTime() <= 7 * 86400000,
    ).length,
  };
}

export type ListaDeCompra = Awaited<ReturnType<typeof montarListaDeCompra>>;
