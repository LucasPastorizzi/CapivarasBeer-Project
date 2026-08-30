import "server-only";

import { prisma } from "@/lib/prisma";

export type ProdutoParaVenda = {
  id: string;
  nome: string;
  codigoBarras: string | null;
  precoVendaCentavos: number;
  estoqueAtual: number;
  categoria: string;
};

/**
 * Catálogo inteiro de uma vez.
 *
 * Uma conveniência trabalha com centenas de itens, não milhões: mandar tudo
 * para o navegador uma vez torna a busca instantânea a cada tecla. Buscar no
 * servidor a cada letra colocaria a latência da rede entre o balconista e o
 * cliente na fila.
 */
export async function listarProdutosParaVenda(): Promise<ProdutoParaVenda[]> {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    select: {
      id: true,
      nome: true,
      codigoBarras: true,
      precoVendaCentavos: true,
      estoqueAtual: true,
      categoria: { select: { nome: true } },
    },
    orderBy: { nome: "asc" },
  });

  return produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    codigoBarras: p.codigoBarras,
    precoVendaCentavos: p.precoVendaCentavos,
    estoqueAtual: p.estoqueAtual,
    categoria: p.categoria.nome,
  }));
}
