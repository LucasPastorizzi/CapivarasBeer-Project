import { prisma } from "@/lib/prisma";
import {
  fimDoDia,
  fimDoMes,
  inicioDoDia,
  inicioDoMes,
} from "@/lib/datas";

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

export async function carregarPainel() {
  const agora = new Date();

  const [hoje, mes, produtosEmFalta, caixaAberto, totalProdutos] =
    await Promise.all([
      somarVendas(inicioDoDia(agora), fimDoDia(agora)),
      somarVendas(inicioDoMes(agora), fimDoMes(agora)),
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

  return { agora, hoje, mes, produtosEmFalta, caixaAberto, totalProdutos };
}
