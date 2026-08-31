import "server-only";

import { prisma } from "@/lib/prisma";

// Reexporta para quem já consome o vocabulário via lib/estoque.
export {
  TIPOS_MANUAIS,
  ROTULO_MOVIMENTO,
  type TipoManual,
} from "@/lib/movimentos";

export type FiltroMovimentos = {
  produtoId?: string;
  tipo?: string;
};

export async function listarMovimentos(
  filtro: FiltroMovimentos = {},
  quantidade = 60,
) {
  return prisma.movimentoEstoque.findMany({
    where: {
      ...(filtro.produtoId ? { produtoId: filtro.produtoId } : {}),
      ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
    },
    include: {
      produto: { select: { nome: true, unidade: true } },
      usuario: { select: { nome: true } },
      venda: { select: { numero: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: quantidade,
  });
}

/** Produtos agrupados por categoria, para o seletor do formulário. */
export async function produtosPorCategoria() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    select: {
      id: true,
      nome: true,
      estoqueAtual: true,
      unidade: true,
      categoria: { select: { nome: true } },
    },
    orderBy: [{ categoria: { nome: "asc" } }, { nome: "asc" }],
  });

  const grupos = new Map<string, typeof produtos>();
  for (const p of produtos) {
    const atual = grupos.get(p.categoria.nome) ?? [];
    atual.push(p);
    grupos.set(p.categoria.nome, atual);
  }

  return [...grupos.entries()].map(([categoria, itens]) => ({
    categoria,
    itens,
  }));
}

export type ProdutosAgrupados = Awaited<ReturnType<typeof produtosPorCategoria>>;
