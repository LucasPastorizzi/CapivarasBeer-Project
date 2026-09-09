import Link from "next/link";
import { Painel, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/autenticacao";
import { formatarCentavos } from "@/lib/dinheiro";
import { ROTULO_PAGAMENTO, type FormaPagamento } from "@/lib/pagamentos";
import { listarVendas, PERIODOS_VENDA, type PeriodoVenda } from "@/lib/vendas";

export const metadata = { title: "Vendas" };
export const dynamic = "force-dynamic";

const horaData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function primeiro(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PaginaVendas({
  searchParams,
}: PageProps<"/vendas">) {
  const sessao = await exigirSessao();
  const parametros = await searchParams;

  const bruto = primeiro(parametros.periodo);
  const periodo: PeriodoVenda = PERIODOS_VENDA.some((p) => p.valor === bruto)
    ? (bruto as PeriodoVenda)
    : "hoje";

  const buscaNumero = primeiro(parametros.numero)?.trim();
  const numero = buscaNumero ? Number(buscaNumero) : undefined;
  const numeroValido = numero !== undefined && Number.isInteger(numero) && numero > 0;

  const vendas = await listarVendas({
    papel: sessao.papel,
    periodo,
    numero: numeroValido ? numero : undefined,
  });

  const concluidas = vendas.filter((v) => v.status === "CONCLUIDA");
  const total = concluidas.reduce((s, v) => s + v.totalCentavos, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[2.125rem] leading-none font-normal">
          Vendas
        </h1>
        <p className="mt-2 text-sm text-ink-medio">
          {sessao.papel === "DONO"
            ? "Toda venda registrada, com o que foi vendido em cada uma."
            : "As vendas do turno aberto, para conferir e corrigir o que acabou de passar."}
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <nav aria-label="Período" className="flex flex-wrap gap-2">
          {PERIODOS_VENDA.map((p) => (
            <Link
              key={p.valor}
              href={`/vendas?periodo=${p.valor}`}
              aria-current={p.valor === periodo && !numeroValido ? "page" : undefined}
              className={
                "rounded-acao border px-4 py-1.5 text-sm transition-colors duration-150 " +
                (p.valor === periodo && !numeroValido
                  ? "border-marca bg-marca-fundo font-medium text-marca"
                  : "border-borda text-ink-medio hover:border-borda-forte hover:text-ink")
              }
            >
              {p.rotulo}
            </Link>
          ))}
        </nav>

        {/* Busca por número: é assim que se acha uma venda no mundo real —
            o cliente volta com o cupom na mão. */}
        <form className="flex items-end gap-2">
          <div className="space-y-1.5">
            <label htmlFor="numero" className="block text-sm font-medium">
              Nº da venda
            </label>
            <input
              id="numero"
              name="numero"
              inputMode="numeric"
              defaultValue={buscaNumero ?? ""}
              placeholder="47"
              className="w-28 rounded-campo border border-borda bg-surface-alto px-3 py-2 text-base text-ink transition-colors duration-150 hover:border-borda-forte"
            />
          </div>
          <button
            type="submit"
            className="rounded-acao border border-borda px-5 py-2 text-sm transition-colors duration-150 hover:bg-surface-alto"
          >
            Buscar
          </button>
        </form>
      </div>

      {vendas.length === 0 ? (
        <Painel>
          <Vazio
            titulo={numeroValido ? `Nenhuma venda com o número ${numero}` : "Nenhuma venda no período"}
            descricao={
              numeroValido
                ? "Confira o número no cupom, ou troque o período acima."
                : "Assim que o balcão registrar a primeira venda, ela aparece aqui."
            }
          />
        </Painel>
      ) : (
        <>
          <Painel titulo={`${concluidas.length} vendas · ${formatarCentavos(total)}`}>
            <ul className="-my-1 divide-y divide-borda">
              {vendas.map((v) => {
                const cancelada = v.status === "CANCELADA";
                return (
                  <li key={v.id}>
                    <Link
                      href={`/vendas/${v.numero}`}
                      className="-mx-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-campo px-2 py-3 transition-colors duration-150 hover:bg-surface-alto"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          <span data-numerico>nº {v.numero}</span>
                          {/* Cancelada não é só cor: o estado vem escrito. */}
                          {cancelada && (
                            <span className="ml-2 rounded-campo bg-perigo-fundo px-1.5 py-0.5 text-xs font-medium text-perigo">
                              cancelada
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink-fraco">
                          {horaData.format(v.criadoEm)} · {v.usuario.nome} ·{" "}
                          {v._count.itens}{" "}
                          {v._count.itens === 1 ? "item" : "itens"} ·{" "}
                          {ROTULO_PAGAMENTO[v.formaPagamento as FormaPagamento] ??
                            v.formaPagamento}
                        </p>
                      </div>
                      <span
                        data-numerico
                        className={
                          "text-sm font-semibold " +
                          (cancelada ? "text-ink-fraco line-through" : "text-ink")
                        }
                      >
                        {formatarCentavos(v.totalCentavos)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Painel>

          {vendas.length === 100 && (
            <p className="text-xs text-ink-fraco">
              Mostrando as 100 vendas mais recentes do período. Use a busca por
              número para achar uma anterior.
            </p>
          )}
        </>
      )}
    </div>
  );
}
