import "server-only";

import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { buscarCaixaAberto, resumirCaixa, ultimosCaixasFechados } from "@/lib/caixa";
import { formatarHora } from "@/lib/datas";
import { formatarCentavos, formatarPercentual } from "@/lib/dinheiro";
import { ROTULO_PAGAMENTO } from "@/lib/pagamentos";
import { prisma } from "@/lib/prisma";
import {
  carregarRelatorio,
  PERIODOS,
  rentabilidadePorProduto,
  resolverIntervalo,
  type Periodo,
} from "@/lib/relatorios";
import { normalizar } from "@/lib/texto";

/**
 * Ferramentas que o assistente pode chamar.
 *
 * Todas são somente leitura, por decisão e não por acaso: um assistente que
 * pode alterar estoque ou cancelar venda transforma uma frase ambígua em
 * prejuízo. Quem escreve no banco continua sendo a pessoa, pelas telas.
 */

const periodo = z
  .enum(PERIODOS.map((p) => p.valor) as [Periodo, ...Periodo[]])
  .describe(
    "Recorte de tempo. hoje | 7dias | 30dias | mes (mês corrente) | mespassado",
  );

const dataBR = new Intl.DateTimeFormat("pt-BR");

function descreverIntervalo(p: Periodo): string {
  const { de, ate } = resolverIntervalo(p);
  return `${dataBR.format(de)} a ${dataBR.format(new Date(ate.getTime() - 1))}`;
}

const resumoDeVendas = betaZodTool({
  name: "resumo_de_vendas",
  description:
    "Faturamento, custo da mercadoria, lucro bruto, margem, número de vendas e ticket médio num período, com comparação contra o período anterior de mesma duração.",
  inputSchema: z.object({ periodo }),
  run: async ({ periodo: p }) => {
    const { resumo, resumoAnterior } = await carregarRelatorio(p);

    return JSON.stringify({
      periodo: descreverIntervalo(p),
      faturamento: formatarCentavos(resumo.receitaCentavos),
      custo_da_mercadoria: formatarCentavos(resumo.custoCentavos),
      lucro_bruto: formatarCentavos(resumo.lucroBrutoCentavos),
      margem: formatarPercentual(resumo.margemPercentual),
      vendas: resumo.quantidade,
      unidades: resumo.unidades,
      ticket_medio: formatarCentavos(resumo.ticketMedioCentavos),
      descontos: formatarCentavos(resumo.descontoCentavos),
      periodo_anterior: {
        faturamento: formatarCentavos(resumoAnterior.receitaCentavos),
        lucro_bruto: formatarCentavos(resumoAnterior.lucroBrutoCentavos),
        vendas: resumoAnterior.quantidade,
      },
    });
  },
});

const vendasPorDia = betaZodTool({
  name: "vendas_por_dia",
  description:
    "Faturamento dia a dia dentro do período. Útil para responder qual dia vendeu mais, como foi o fim de semana ou se há tendência.",
  inputSchema: z.object({ periodo }),
  run: async ({ periodo: p }) => {
    const { serie } = await carregarRelatorio(p);
    const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });

    return JSON.stringify({
      periodo: descreverIntervalo(p),
      dias: serie.map((ponto) => ({
        data: dataBR.format(ponto.data),
        dia_da_semana: semana.format(ponto.data),
        faturamento: formatarCentavos(ponto.totalCentavos),
      })),
    });
  },
});

const produtosMaisRentaveis = betaZodTool({
  name: "produtos_mais_rentaveis",
  description:
    "Ranking de produtos por lucro no período, com unidades vendidas, faturamento, custo e margem de cada um. Ordenado por lucro, não por faturamento.",
  inputSchema: z.object({
    periodo,
    limite: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe("Quantos produtos trazer. Padrão 10."),
  }),
  run: async ({ periodo: p, limite }) => {
    const linhas = await rentabilidadePorProduto(
      resolverIntervalo(p),
      limite ?? 10,
    );

    return JSON.stringify({
      periodo: descreverIntervalo(p),
      produtos: linhas.map((l) => ({
        nome: l.nome,
        categoria: l.categoria,
        unidades: l.unidades,
        faturamento: formatarCentavos(l.receitaCentavos),
        custo: formatarCentavos(l.custoCentavos),
        lucro: formatarCentavos(l.lucroCentavos),
        margem: formatarPercentual(l.margemPercentual),
      })),
    });
  },
});

const formasDePagamento = betaZodTool({
  name: "formas_de_pagamento",
  description:
    "Quanto entrou por dinheiro, Pix, débito e crédito no período, com número de vendas de cada forma.",
  inputSchema: z.object({ periodo }),
  run: async ({ periodo: p }) => {
    const { mix, resumo } = await carregarRelatorio(p);

    return JSON.stringify({
      periodo: descreverIntervalo(p),
      total: formatarCentavos(resumo.receitaCentavos),
      formas: mix.map((l) => ({
        forma: ROTULO_PAGAMENTO[l.forma],
        vendas: l.quantidade,
        total: formatarCentavos(l.totalCentavos),
        participacao:
          resumo.receitaCentavos > 0
            ? formatarPercentual(
                (l.totalCentavos / resumo.receitaCentavos) * 100,
                0,
              )
            : "0%",
      })),
    });
  },
});

const situacaoDoEstoque = betaZodTool({
  name: "situacao_do_estoque",
  description:
    "Estoque atual dos produtos. Use filtro 'abaixo_do_minimo' para saber o que precisa repor, ou 'todos' para o panorama completo.",
  inputSchema: z.object({
    filtro: z
      .enum(["abaixo_do_minimo", "todos"])
      .describe("abaixo_do_minimo traz só o que precisa de reposição."),
    limite: z.number().int().min(1).max(60).optional(),
  }),
  run: async ({ filtro, limite }) => {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
        ...(filtro === "abaixo_do_minimo"
          ? { estoqueAtual: { lte: prisma.produto.fields.estoqueMinimo } }
          : {}),
      },
      select: {
        nome: true,
        estoqueAtual: true,
        estoqueMinimo: true,
        unidade: true,
        precoVendaCentavos: true,
        categoria: { select: { nome: true } },
      },
      orderBy: { estoqueAtual: "asc" },
      take: limite ?? 25,
    });

    return JSON.stringify({
      filtro,
      total_encontrado: produtos.length,
      produtos: produtos.map((p) => ({
        nome: p.nome,
        categoria: p.categoria.nome,
        estoque: `${p.estoqueAtual} ${p.unidade}`,
        minimo: p.estoqueMinimo,
        preco: formatarCentavos(p.precoVendaCentavos),
      })),
    });
  },
});

const detalhesDoProduto = betaZodTool({
  name: "detalhes_do_produto",
  description:
    "Tudo sobre um produto pelo nome (busca parcial, sem exigir acento): preço, custo, margem, estoque e últimos movimentos.",
  inputSchema: z.object({
    termo: z.string().min(2).describe("Parte do nome do produto. Ex: 'heineken'"),
  }),
  run: async ({ termo }) => {
    // A busca do banco é sensível a acento; filtramos em memória com a mesma
    // normalização das telas, para o assistente encontrar o que o dono acha.
    const todos = await prisma.produto.findMany({
      include: {
        categoria: { select: { nome: true } },
        movimentos: {
          orderBy: { criadoEm: "desc" },
          take: 5,
          select: {
            tipo: true,
            quantidade: true,
            observacao: true,
            criadoEm: true,
          },
        },
      },
    });

    const alvo = normalizar(termo);
    const achados = todos
      .filter((p) => normalizar(p.nome).includes(alvo))
      .slice(0, 5);

    if (achados.length === 0) {
      return JSON.stringify({
        encontrado: false,
        mensagem: `Nenhum produto com "${termo}" no nome.`,
      });
    }

    return JSON.stringify({
      encontrado: true,
      produtos: achados.map((p) => ({
        nome: p.nome,
        categoria: p.categoria.nome,
        ativo: p.ativo,
        preco_de_venda: formatarCentavos(p.precoVendaCentavos),
        preco_de_custo: formatarCentavos(p.precoCustoCentavos),
        margem:
          p.precoVendaCentavos > 0
            ? formatarPercentual(
                ((p.precoVendaCentavos - p.precoCustoCentavos) /
                  p.precoVendaCentavos) *
                  100,
              )
            : "sem preço de venda",
        estoque: `${p.estoqueAtual} ${p.unidade}`,
        estoque_minimo: p.estoqueMinimo,
        codigo_de_barras: p.codigoBarras ?? "não cadastrado",
        ultimos_movimentos: p.movimentos.map((m) => ({
          tipo: m.tipo,
          quantidade: m.quantidade,
          quando: dataBR.format(m.criadoEm),
          observacao: m.observacao,
        })),
      })),
    });
  },
});

const situacaoDoCaixa = betaZodTool({
  name: "situacao_do_caixa",
  description:
    "Se há caixa aberto agora, quanto se espera na gaveta, e como fecharam os últimos turnos (incluindo sobras e faltas).",
  inputSchema: z.object({}),
  run: async () => {
    const aberto = await buscarCaixaAberto();
    const resumo = aberto ? await resumirCaixa(aberto.id) : null;
    const historico = await ultimosCaixasFechados(5);

    return JSON.stringify({
      caixa_aberto: resumo
        ? {
            aberto_em: formatarHora(resumo.caixa.abertoEm),
            operador: resumo.caixa.usuarioAbertura.nome,
            troco_inicial: formatarCentavos(resumo.caixa.valorAberturaCentavos),
            faturamento_do_turno: formatarCentavos(resumo.faturamentoCentavos),
            vendas_do_turno: resumo.quantidadeVendas,
            esperado_na_gaveta: formatarCentavos(
              resumo.esperadoNaGavetaCentavos,
            ),
            sangrias: formatarCentavos(resumo.sangriasCentavos),
          }
        : null,
      turnos_anteriores: historico.map((h) => ({
        fechado_em: h.caixa.fechadoEm ? dataBR.format(h.caixa.fechadoEm) : null,
        operador: h.caixa.usuarioAbertura.nome,
        vendas: h.quantidadeVendas,
        faturamento: formatarCentavos(h.faturamentoCentavos),
        diferenca:
          h.diferencaCentavos === null
            ? "sem conferência"
            : h.diferencaCentavos === 0
              ? "conferiu certo"
              : h.diferencaCentavos > 0
                ? `sobrou ${formatarCentavos(h.diferencaCentavos)}`
                : `faltou ${formatarCentavos(Math.abs(h.diferencaCentavos))}`,
      })),
    });
  },
});

export const FERRAMENTAS = [
  resumoDeVendas,
  vendasPorDia,
  produtosMaisRentaveis,
  formasDePagamento,
  situacaoDoEstoque,
  detalhesDoProduto,
  situacaoDoCaixa,
];

/** Nome legível de cada ferramenta, para mostrar o que está sendo consultado. */
export const ROTULO_FERRAMENTA: Record<string, string> = {
  resumo_de_vendas: "Somando as vendas",
  vendas_por_dia: "Abrindo o dia a dia",
  produtos_mais_rentaveis: "Calculando a rentabilidade",
  formas_de_pagamento: "Separando as formas de pagamento",
  situacao_do_estoque: "Conferindo o estoque",
  detalhes_do_produto: "Procurando o produto",
  situacao_do_caixa: "Olhando o caixa",
};
