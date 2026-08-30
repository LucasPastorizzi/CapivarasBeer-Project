import "server-only";

import { FORMAS_PAGAMENTO } from "@/lib/pagamentos";
import { prisma } from "@/lib/prisma";

// Reexporta para quem já consome estas constantes via lib/caixa.
export {
  FORMAS_PAGAMENTO,
  ROTULO_PAGAMENTO,
  type FormaPagamento,
} from "@/lib/pagamentos";

export async function buscarCaixaAberto() {
  return prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    include: { usuarioAbertura: { select: { nome: true } } },
    orderBy: { abertoEm: "desc" },
  });
}

export type ResumoCaixa = Awaited<ReturnType<typeof resumirCaixa>>;

/**
 * Fecha a conta do turno.
 *
 * A distinção que importa: só dinheiro entra na gaveta. Pix, débito e crédito
 * entram no faturamento do turno mas não no que o operador conta na mão, e
 * misturar os dois é a causa clássica de "quebra de caixa" que não existe.
 */
export async function resumirCaixa(caixaId: string) {
  const [caixa, porPagamento, movimentos] = await Promise.all([
    prisma.caixa.findUniqueOrThrow({
      where: { id: caixaId },
      include: { usuarioAbertura: { select: { nome: true } } },
    }),
    prisma.venda.groupBy({
      by: ["formaPagamento"],
      where: { caixaId, status: "CONCLUIDA" },
      _sum: { totalCentavos: true },
      _count: { _all: true },
    }),
    prisma.movimentoCaixa.findMany({
      where: { caixaId },
      include: { usuario: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  const vendasPorForma = FORMAS_PAGAMENTO.map((forma) => {
    const linha = porPagamento.find((p) => p.formaPagamento === forma);
    return {
      forma,
      totalCentavos: linha?._sum.totalCentavos ?? 0,
      quantidade: linha?._count._all ?? 0,
    };
  });

  const faturamentoCentavos = vendasPorForma.reduce(
    (soma, v) => soma + v.totalCentavos,
    0,
  );
  const quantidadeVendas = vendasPorForma.reduce(
    (soma, v) => soma + v.quantidade,
    0,
  );
  const emDinheiroCentavos =
    vendasPorForma.find((v) => v.forma === "DINHEIRO")?.totalCentavos ?? 0;

  const sangriasCentavos = movimentos
    .filter((m) => m.tipo === "SANGRIA")
    .reduce((soma, m) => soma + m.valorCentavos, 0);
  const suprimentosCentavos = movimentos
    .filter((m) => m.tipo === "SUPRIMENTO")
    .reduce((soma, m) => soma + m.valorCentavos, 0);

  const esperadoNaGavetaCentavos =
    caixa.valorAberturaCentavos +
    emDinheiroCentavos +
    suprimentosCentavos -
    sangriasCentavos;

  // Só existe diferença depois que alguém contou a gaveta.
  const diferencaCentavos =
    caixa.valorFechamentoCentavos === null
      ? null
      : caixa.valorFechamentoCentavos - esperadoNaGavetaCentavos;

  return {
    caixa,
    movimentos,
    vendasPorForma,
    faturamentoCentavos,
    quantidadeVendas,
    emDinheiroCentavos,
    sangriasCentavos,
    suprimentosCentavos,
    esperadoNaGavetaCentavos,
    diferencaCentavos,
  };
}

export async function ultimosCaixasFechados(quantidade = 5) {
  const caixas = await prisma.caixa.findMany({
    where: { status: "FECHADO" },
    include: { usuarioAbertura: { select: { nome: true } } },
    orderBy: { fechadoEm: "desc" },
    take: quantidade,
  });

  // O resumo de cada um é recalculado a partir dos lançamentos, nunca lido de
  // um total gravado: assim um estorno antigo aparece no histórico.
  return Promise.all(caixas.map((c) => resumirCaixa(c.id)));
}
