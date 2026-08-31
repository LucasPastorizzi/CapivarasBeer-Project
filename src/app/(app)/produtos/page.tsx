import Link from "next/link";
import { IconeAlerta } from "@/components/icones";
import { exigirDono } from "@/lib/autenticacao";
import { formatarCentavos, margemPercentual } from "@/lib/dinheiro";
import { listarCategorias, listarProdutos } from "@/lib/produtos";

export const metadata = { title: "Produtos" };
export const dynamic = "force-dynamic";

const SITUACOES = [
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "inativos", rotulo: "Inativos" },
  { valor: "todos", rotulo: "Todos" },
] as const;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PaginaProdutos({
  searchParams,
}: PageProps<"/produtos">) {
  await exigirDono();

  const parametros = await searchParams;
  const busca = primeiro(parametros.busca) ?? "";
  const categoriaId = primeiro(parametros.categoria) ?? "";
  const situacaoBruta = primeiro(parametros.situacao);
  const situacao =
    situacaoBruta === "inativos" || situacaoBruta === "todos"
      ? situacaoBruta
      : "ativos";

  const [produtos, categorias] = await Promise.all([
    listarProdutos({ busca, categoriaId: categoriaId || undefined, situacao }),
    listarCategorias(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Produtos</h1>
          <p className="mt-1 text-sm text-ink-medio">
            {produtos.length}{" "}
            {produtos.length === 1 ? "produto listado" : "produtos listados"}
          </p>
        </div>
        <Link
          href="/produtos/novo"
          className="rounded-campo bg-ouro px-4 py-2 text-sm font-medium text-bg transition-colors duration-150 hover:bg-ouro-forte"
        >
          Novo produto
        </Link>
      </header>

      {/* Filtro por GET: o dono pode guardar o link de "cervejas em falta". */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-1.5">
          <label htmlFor="busca" className="block text-sm font-medium">
            Buscar
          </label>
          <input
            id="busca"
            name="busca"
            defaultValue={busca}
            placeholder="Nome ou código de barras"
            className="w-full rounded-campo border border-borda bg-surface-alto px-3 py-2 text-base text-ink transition-colors duration-150 hover:border-borda-forte"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="categoria" className="block text-sm font-medium">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={categoriaId}
            className="rounded-campo border border-borda bg-surface-alto px-3 py-2 text-base text-ink"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c._count.produtos})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="situacao" className="block text-sm font-medium">
            Situação
          </label>
          <select
            id="situacao"
            name="situacao"
            defaultValue={situacao}
            className="rounded-campo border border-borda bg-surface-alto px-3 py-2 text-base text-ink"
          >
            {SITUACOES.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-campo border border-borda bg-surface px-4 py-2 text-sm transition-colors duration-150 hover:bg-surface-alto"
        >
          Filtrar
        </button>
      </form>

      {produtos.length === 0 ? (
        <div className="rounded-painel border border-borda bg-surface p-8 text-center">
          <p className="text-sm text-ink-medio">
            {busca || categoriaId
              ? "Nenhum produto encontrado com esses filtros."
              : "Nenhum produto cadastrado ainda."}
          </p>
          <Link
            href="/produtos/novo"
            className="mt-3 inline-block text-sm text-neon underline-offset-4 hover:underline"
          >
            Cadastrar o primeiro produto
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-painel border border-borda bg-surface">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-xs text-ink-fraco">
                <th scope="col" className="px-4 py-3 font-medium">
                  Produto
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoria
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Custo
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Venda
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Margem
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Estoque
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {produtos.map((p) => {
                const emFalta = p.estoqueAtual <= p.estoqueMinimo;
                const margem = margemPercentual(
                  p.precoCustoCentavos,
                  p.precoVendaCentavos,
                );

                return (
                  <tr
                    key={p.id}
                    className="transition-colors duration-150 hover:bg-surface-alto"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/produtos/${p.id}`}
                        className="font-medium hover:text-ouro"
                      >
                        {p.nome}
                      </Link>
                      {!p.ativo && (
                        <span className="ml-2 rounded-campo bg-surface-alto px-1.5 py-0.5 text-xs text-ink-fraco">
                          inativo
                        </span>
                      )}
                      {p.codigoBarras && (
                        <span className="block text-xs text-ink-fraco">
                          {p.codigoBarras}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-medio">
                      {p.categoria.nome}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-medio">
                      {formatarCentavos(p.precoCustoCentavos)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatarCentavos(p.precoVendaCentavos)}
                    </td>
                    <td
                      className={
                        "px-4 py-3 text-right " +
                        (margem < 0 ? "text-perigo" : "text-ink-medio")
                      }
                    >
                      {margem.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {emFalta ? (
                        <span className="inline-flex items-center gap-1.5 text-alerta">
                          <IconeAlerta className="size-3.5" />
                          {p.estoqueAtual}
                        </span>
                      ) : (
                        p.estoqueAtual
                      )}
                      <span className="ml-1 text-xs text-ink-fraco">
                        {p.unidade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
