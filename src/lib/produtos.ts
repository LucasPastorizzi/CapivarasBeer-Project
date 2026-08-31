import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizar } from "@/lib/texto";

export type FiltroProdutos = {
  busca?: string;
  categoriaId?: string;
  situacao?: "ativos" | "inativos" | "todos";
};

export async function listarCategorias() {
  return prisma.categoria.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { produtos: true } } },
  });
}

export async function listarProdutos(filtro: FiltroProdutos = {}) {
  const { busca, categoriaId, situacao = "ativos" } = filtro;

  const produtos = await prisma.produto.findMany({
    where: {
      ...(situacao === "todos" ? {} : { ativo: situacao === "ativos" }),
      ...(categoriaId ? { categoriaId } : {}),
    },
    include: { categoria: { select: { nome: true, cor: true } } },
    orderBy: [{ nome: "asc" }],
  });

  if (!busca?.trim()) return produtos;

  // O LIKE do SQLite ignora acento de forma inconsistente, então o filtro de
  // texto acontece aqui, com a mesma normalização que o PDV usa. Buscar
  // "agua" na lista e no balcão precisa devolver a mesma coisa.
  const termo = normalizar(busca);

  return produtos.filter(
    (p) =>
      normalizar(p.nome).includes(termo) ||
      normalizar(p.categoria.nome).includes(termo) ||
      p.codigoBarras?.includes(busca.trim()),
  );
}

export async function buscarProduto(id: string) {
  return prisma.produto.findUnique({
    where: { id },
    include: { categoria: { select: { nome: true } } },
  });
}
