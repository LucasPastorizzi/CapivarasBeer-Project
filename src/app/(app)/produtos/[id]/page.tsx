import Link from "next/link";
import { notFound } from "next/navigation";
import { alternarAtivo } from "@/app/(app)/produtos/acoes";
import { FormularioProduto } from "@/components/formulario-produto";
import { Aviso, Painel } from "@/components/ui";
import { exigirDono } from "@/lib/autenticacao";
import { formatarCentavos } from "@/lib/dinheiro";
import { buscarProduto, listarCategorias } from "@/lib/produtos";

export const dynamic = "force-dynamic";

export default async function PaginaProduto({
  params,
  searchParams,
}: PageProps<"/produtos/[id]">) {
  await exigirDono();

  const { id } = await params;
  const { salvo } = await searchParams;

  const [produto, categorias] = await Promise.all([
    buscarProduto(id),
    listarCategorias(),
  ]);

  if (!produto) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-fraco">
            <Link href="/produtos" className="hover:text-ink">
              Produtos
            </Link>
          </p>
          <h1 className="font-display text-[2.125rem] leading-none font-normal">
            {produto.nome}
          </h1>
          <p className="mt-1 text-sm text-ink-medio">
            {produto.categoria.nome} · {produto.estoqueAtual} {produto.unidade}{" "}
            em estoque · vendendo a{" "}
            {formatarCentavos(produto.precoVendaCentavos)}
          </p>
        </div>

        {/* Desativar não apaga: as vendas antigas continuam apontando aqui. */}
        <form action={alternarAtivo}>
          <input type="hidden" name="id" value={produto.id} />
          <button
            type="submit"
            className="rounded-campo border border-borda px-3 py-2 text-sm text-ink-medio transition-colors duration-150 hover:bg-surface-alto hover:text-ink"
          >
            {produto.ativo ? "Desativar produto" : "Reativar produto"}
          </button>
        </form>
      </header>

      {salvo && <Aviso tom="ok">Produto cadastrado.</Aviso>}

      {!produto.ativo && (
        <Aviso tom="alerta">
          Produto desativado: não aparece na busca do balcão e não pode ser
          vendido. O histórico de vendas dele continua nos relatórios.
        </Aviso>
      )}

      <Painel>
        <FormularioProduto
          categorias={categorias}
          produto={{
            id: produto.id,
            nome: produto.nome,
            categoriaId: produto.categoriaId,
            precoCustoCentavos: produto.precoCustoCentavos,
            precoVendaCentavos: produto.precoVendaCentavos,
            estoqueMinimo: produto.estoqueMinimo,
            unidade: produto.unidade,
            codigoBarras: produto.codigoBarras,
            multiploCompra: produto.multiploCompra,
          }}
        />
      </Painel>
    </div>
  );
}
