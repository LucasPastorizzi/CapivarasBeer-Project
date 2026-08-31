import { FormularioEstoque } from "@/components/formulario-estoque";
import { Painel, Vazio } from "@/components/ui";
import { exigirDono } from "@/lib/autenticacao";
import { formatarCentavos } from "@/lib/dinheiro";
import {
  listarMovimentos,
  produtosPorCategoria,
  ROTULO_MOVIMENTO,
} from "@/lib/estoque";

export const metadata = { title: "Estoque" };
export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const TOM: Record<string, string> = {
  ENTRADA: "bg-ok-fundo text-ok",
  SAIDA_VENDA: "bg-surface-alto text-ink-medio",
  AJUSTE: "bg-alerta-fundo text-alerta",
  PERDA: "bg-perigo-fundo text-perigo",
};

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PaginaEstoque({
  searchParams,
}: PageProps<"/estoque">) {
  await exigirDono();

  const parametros = await searchParams;
  const tipo = primeiro(parametros.tipo) ?? "";

  const [grupos, movimentos] = await Promise.all([
    produtosPorCategoria(),
    listarMovimentos({ tipo: tipo || undefined }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
        <p className="mt-1 max-w-prose text-sm text-ink-medio">
          Toda alteração de estoque vira um registro aqui — inclusive as vendas.
          É o que permite responder, meses depois, por que a contagem mudou.
        </p>
      </header>

      <Painel titulo="Registrar movimento">
        <FormularioEstoque grupos={grupos} />
      </Painel>

      <Painel
        titulo="Últimos movimentos"
        acao={
          <form>
            <label htmlFor="tipo" className="sr-only">
              Filtrar por tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={tipo}
              className="rounded-campo border border-borda bg-surface-alto px-2 py-1 text-xs text-ink"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(ROTULO_MOVIMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="ml-2 rounded-campo border border-borda px-2 py-1 text-xs text-ink-medio transition-colors duration-150 hover:text-ink"
            >
              Filtrar
            </button>
          </form>
        }
      >
        {movimentos.length === 0 ? (
          <Vazio
            titulo="Nenhum movimento registrado"
            descricao={
              tipo
                ? "Nenhum movimento desse tipo até agora. Tente outro filtro."
                : "Assim que houver uma entrada de mercadoria ou uma venda, o histórico aparece aqui."
            }
          />
        ) : (
          <ul className="-my-2 divide-y divide-borda">
            {movimentos.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tipo escrito, não só colorido: no histórico de auditoria
                        a cor é reforço, nunca a informação. */}
                    <span
                      className={`rounded-campo px-1.5 py-0.5 text-xs font-medium ${TOM[m.tipo] ?? TOM.SAIDA_VENDA}`}
                    >
                      {ROTULO_MOVIMENTO[m.tipo] ?? m.tipo}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {m.produto.nome}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-fraco">
                    {dataHora.format(m.criadoEm)} · {m.usuario.nome}
                    {m.venda && ` · venda nº ${m.venda.numero}`}
                    {m.observacao && ` · ${m.observacao}`}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    data-numerico
                    className={
                      "text-sm font-semibold " +
                      (m.quantidade > 0 ? "text-ok" : "text-ink")
                    }
                  >
                    {m.quantidade > 0 ? "+" : ""}
                    {m.quantidade} {m.produto.unidade}
                  </p>
                  {m.custoUnitarioCentavos !== null && (
                    <p data-numerico className="text-xs text-ink-fraco">
                      {formatarCentavos(m.custoUnitarioCentavos)} cada
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Painel>
    </div>
  );
}
