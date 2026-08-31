import Link from "next/link";
import { GraficoDiario, MixDePagamento } from "@/components/graficos";
import { Painel, Vazio } from "@/components/ui";
import { exigirDono } from "@/lib/autenticacao";
import { formatarCentavos, formatarPercentual } from "@/lib/dinheiro";
import {
  carregarRelatorio,
  PERIODOS,
  type Periodo,
} from "@/lib/relatorios";

export const metadata = { title: "Relatórios" };
export const dynamic = "force-dynamic";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function ehPeriodo(valor: string | undefined): valor is Periodo {
  return PERIODOS.some((p) => p.valor === valor);
}

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function Indicador({
  rotulo,
  valor,
  apoio,
  tom,
}: {
  rotulo: string;
  valor: string;
  apoio?: React.ReactNode;
  tom?: "ok" | "perigo";
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-medio">{rotulo}</dt>
      <dd
        data-numerico
        className={
          "mt-1 text-xl leading-tight font-semibold tracking-tight lg:text-2xl " +
          (tom === "ok" ? "text-ok" : tom === "perigo" ? "text-perigo" : "text-ink")
        }
      >
        {valor}
      </dd>
      {apoio && <p className="mt-1.5 text-xs text-ink-fraco">{apoio}</p>}
    </div>
  );
}

function Comparativo({
  atual,
  anterior,
}: {
  atual: number;
  anterior: number;
}) {
  if (anterior === 0) {
    return <span>Sem período anterior para comparar</span>;
  }
  const variacao = ((atual - anterior) / anterior) * 100;
  const subiu = variacao >= 0;
  return (
    <span className={subiu ? "text-ok" : "text-perigo"} data-numerico>
      {subiu ? "▲" : "▼"} {Math.abs(variacao).toFixed(0)}% ·{" "}
      {formatarCentavos(anterior)} antes
    </span>
  );
}

export default async function PaginaRelatorios({
  searchParams,
}: PageProps<"/relatorios">) {
  await exigirDono();

  const parametros = await searchParams;
  const bruto = primeiro(parametros.periodo);
  const periodo: Periodo = ehPeriodo(bruto) ? bruto : "mes";

  const { intervalo, resumo, resumoAnterior, serie, mix, rentabilidade } =
    await carregarRelatorio(periodo);

  // `ate` é exclusivo; para mostrar ao usuário voltamos um instante.
  const ultimoDia = new Date(intervalo.ate.getTime() - 1);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.125rem] leading-none font-normal">Relatórios</h1>
          <p className="mt-1 text-sm text-ink-medio">
            {dataCurta.format(intervalo.de)} a {dataCurta.format(ultimoDia)}
          </p>
        </div>

        <a
          href={`/relatorios/exportar?periodo=${periodo}`}
          className="rounded-acao border border-borda px-5 py-2 text-sm transition-colors duration-150 hover:bg-surface-alto"
        >
          Baixar planilha
        </a>
      </header>

      {/* Filtro por link, não por formulário: cada período vira uma URL que o
          dono pode guardar ou mandar para o contador. */}
      <nav aria-label="Período do relatório" className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <Link
            key={p.valor}
            href={`/relatorios?periodo=${p.valor}`}
            aria-current={p.valor === periodo ? "page" : undefined}
            className={
              "rounded-acao border px-4 py-1.5 text-sm transition-colors duration-150 " +
              (p.valor === periodo
                ? "border-marca bg-marca-fundo font-medium text-marca"
                : "border-borda text-ink-medio hover:border-borda-forte hover:text-ink")
            }
          >
            {p.rotulo}
          </Link>
        ))}
      </nav>

      {resumo.quantidade === 0 ? (
        <Painel>
          <Vazio
            titulo="Nenhuma venda no período"
            descricao={`Não há vendas registradas ${intervalo.rotulo}. Escolha outro período acima ou registre a primeira venda no balcão.`}
            acao={
              <Link
                href="/pdv"
                className="rounded-acao bg-marca px-5 py-2 text-sm font-medium text-sidebar transition-colors duration-150 hover:bg-marca-forte"
              >
                Ir para o balcão
              </Link>
            }
          />
        </Painel>
      ) : (
        <>
          <section aria-labelledby="titulo-resumo">
            <h2 id="titulo-resumo" className="sr-only">
              Resumo do período
            </h2>
            <dl className="grid gap-6 rounded-painel border border-borda bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4">
              <Indicador
                rotulo="Faturamento"
                valor={formatarCentavos(resumo.receitaCentavos)}
                apoio={
                  <Comparativo
                    atual={resumo.receitaCentavos}
                    anterior={resumoAnterior.receitaCentavos}
                  />
                }
              />
              <Indicador
                rotulo="Custo da mercadoria"
                valor={formatarCentavos(resumo.custoCentavos)}
                apoio={`${resumo.unidades} unidades vendidas`}
              />
              <Indicador
                rotulo="Lucro bruto"
                valor={formatarCentavos(resumo.lucroBrutoCentavos)}
                tom={resumo.lucroBrutoCentavos >= 0 ? "ok" : "perigo"}
                apoio={
                  <Comparativo
                    atual={resumo.lucroBrutoCentavos}
                    anterior={resumoAnterior.lucroBrutoCentavos}
                  />
                }
              />
              <Indicador
                rotulo="Margem"
                valor={formatarPercentual(resumo.margemPercentual)}
                apoio={`Ticket médio ${formatarCentavos(resumo.ticketMedioCentavos)}`}
              />
            </dl>
            <p className="mt-3 max-w-prose text-xs text-ink-fraco">
              O custo usado é o que foi gravado em cada item no momento da
              venda. Se o fornecedor reajustou depois, a margem deste período
              continua sendo a que realmente aconteceu.
            </p>
          </section>

          <Painel titulo="Faturamento por dia">
            <GraficoDiario serie={serie} />
          </Painel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Painel titulo="Formas de pagamento">
              <MixDePagamento linhas={mix} />
            </Painel>

            <Painel titulo="Números do período">
              <dl className="space-y-2.5 text-sm">
                {[
                  ["Vendas registradas", String(resumo.quantidade)],
                  ["Unidades vendidas", String(resumo.unidades)],
                  ["Ticket médio", formatarCentavos(resumo.ticketMedioCentavos)],
                  ["Descontos concedidos", formatarCentavos(resumo.descontoCentavos)],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo} className="flex justify-between gap-4">
                    <dt className="text-ink-medio">{rotulo}</dt>
                    <dd data-numerico className="font-medium">
                      {valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </Painel>
          </div>

          <Painel titulo="Onde está o lucro">
            <p className="mb-4 max-w-prose text-sm text-ink-medio">
              Ordenado pelo que sobra, não pelo que fatura: um item de giro alto
              com margem magra pode render menos que um de giro baixo com margem
              gorda.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-borda text-left text-xs text-ink-fraco">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Produto
                    </th>
                    <th scope="col" className="hidden py-2 pr-4 text-right font-medium sm:table-cell">
                      Unidades
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      Faturou
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      Lucro
                    </th>
                    <th scope="col" className="hidden py-2 text-right font-medium lg:table-cell">
                      Margem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {rentabilidade.map((l) => (
                    <tr key={l.id} className="transition-colors duration-150 hover:bg-surface-alto">
                      <td className="py-2.5 pr-4">
                        <span className="font-medium">{l.nome}</span>
                        <span className="block text-xs text-ink-fraco">
                          {l.categoria}
                        </span>
                      </td>
                      <td data-numerico className="hidden py-2.5 pr-4 text-right text-ink-medio sm:table-cell">
                        {l.unidades}
                      </td>
                      <td data-numerico className="py-2.5 pr-4 text-right text-ink-medio">
                        {formatarCentavos(l.receitaCentavos)}
                      </td>
                      <td
                        data-numerico
                        className={
                          "py-2.5 pr-4 text-right font-medium " +
                          (l.lucroCentavos < 0 ? "text-perigo" : "text-ink")
                        }
                      >
                        {formatarCentavos(l.lucroCentavos)}
                      </td>
                      <td
                        data-numerico
                        className={
                          "hidden py-2.5 text-right lg:table-cell " +
                          (l.margemPercentual < 0 ? "text-perigo" : "text-ink-medio")
                        }
                      >
                        {formatarPercentual(l.margemPercentual, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Painel>
        </>
      )}
    </div>
  );
}
