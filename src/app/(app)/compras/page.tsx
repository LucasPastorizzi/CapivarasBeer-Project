import Link from "next/link";
import { Painel, Vazio } from "@/components/ui";
import { exigirDono } from "@/lib/autenticacao";
import { montarListaDeCompra } from "@/lib/compras";
import { formatarCentavos } from "@/lib/dinheiro";

export const metadata = { title: "Compras" };
export const dynamic = "force-dynamic";

const HORIZONTES = [
  { dias: 7, rotulo: "1 semana" },
  { dias: 14, rotulo: "2 semanas" },
  { dias: 30, rotulo: "1 mês" },
];

const diaCurto = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function diasAte(data: Date): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((data.getTime() - hoje.getTime()) / 86400000);
}

export default async function PaginaCompras({
  searchParams,
}: PageProps<"/compras">) {
  await exigirDono();

  const parametros = await searchParams;
  const bruto = Number(primeiro(parametros.dias));
  const horizonte = HORIZONTES.some((h) => h.dias === bruto) ? bruto : 14;

  const lista = await montarListaDeCompra(horizonte);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.125rem] leading-none font-normal">
            Compras
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-medio">
            O que pedir para atravessar as próximas{" "}
            {horizonte === 30 ? "4 semanas" : `${horizonte} dias`}, calculado
            pelo que a loja vendeu de verdade nas últimas{" "}
            {lista.diasDeHistorico / 7} semanas.
          </p>
        </div>

        {lista.paraComprar.length > 0 && (
          <a
            href={`/compras/exportar?dias=${horizonte}`}
            className="rounded-acao border border-borda px-5 py-2 text-sm transition-colors duration-150 hover:bg-surface-alto"
          >
            Baixar lista
          </a>
        )}
      </header>

      <nav aria-label="Período de cobertura" className="flex flex-wrap gap-2">
        {HORIZONTES.map((h) => (
          <Link
            key={h.dias}
            href={`/compras?dias=${h.dias}`}
            aria-current={h.dias === horizonte ? "page" : undefined}
            className={
              "rounded-acao border px-4 py-1.5 text-sm transition-colors duration-150 " +
              (h.dias === horizonte
                ? "border-marca bg-marca-fundo font-medium text-marca"
                : "border-borda text-ink-medio hover:border-borda-forte hover:text-ink")
            }
          >
            {h.rotulo}
          </Link>
        ))}
      </nav>

      {lista.paraComprar.length === 0 ? (
        <Painel>
          <Vazio
            titulo="Nada a comprar por enquanto"
            descricao={`No ritmo das últimas ${lista.diasDeHistorico / 7} semanas, o estoque atravessa os próximos ${horizonte} dias. Aumente o período acima para enxergar mais longe.`}
          />
        </Painel>
      ) : (
        <>
          <section className="rounded-painel border border-borda bg-surface p-6">
            <dl className="grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-ink-medio">Itens na lista</dt>
                <dd
                  data-numerico
                  className="mt-1 text-2xl leading-tight font-semibold"
                >
                  {lista.paraComprar.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-medio">Acabam em até 7 dias</dt>
                <dd
                  data-numerico
                  className={
                    "mt-1 text-2xl leading-tight font-semibold " +
                    (lista.urgentes > 0 ? "text-alerta" : "text-ink")
                  }
                >
                  {lista.urgentes}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-medio">Custo da lista</dt>
                <dd
                  data-numerico
                  className="mt-1 text-2xl leading-tight font-semibold"
                >
                  {formatarCentavos(lista.custoTotalCentavos)}
                </dd>
                {/* Uma lista de compras sem preço obriga a somar no fim, e é
                    aí que a compra estoura o caixa. */}
                <p className="mt-1.5 text-xs text-ink-fraco">
                  Pelo último custo cadastrado
                </p>
              </div>
            </dl>
          </section>

          <Painel titulo="Pedir ao fornecedor">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-borda text-left text-xs text-ink-fraco">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Produto
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      Tem
                    </th>
                    <th
                      scope="col"
                      className="hidden py-2 pr-4 text-right font-medium sm:table-cell"
                    >
                      Vende/sem
                    </th>
                    <th scope="col" className="py-2 pr-4 text-left font-medium">
                      Acaba
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      Pedir
                    </th>
                    <th
                      scope="col"
                      className="hidden py-2 text-right font-medium lg:table-cell"
                    >
                      Custo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {lista.paraComprar.map((l) => {
                    const dias = l.acabaEm ? diasAte(l.acabaEm) : null;
                    const urgente = dias !== null && dias <= 7;

                    return (
                      <tr
                        key={l.id}
                        className="transition-colors duration-150 hover:bg-surface-alto"
                      >
                        <td className="py-2.5 pr-4">
                          <Link
                            href={`/produtos/${l.id}`}
                            className="font-medium hover:text-marca"
                          >
                            {l.nome}
                          </Link>
                          <span className="block text-xs text-ink-fraco">
                            {l.categoria}
                            {l.multiploCompra > 1 &&
                              ` · caixa de ${l.multiploCompra}`}
                          </span>
                        </td>
                        <td
                          data-numerico
                          className="py-2.5 pr-4 text-right text-ink-medio"
                        >
                          {l.estoqueAtual}
                        </td>
                        <td
                          data-numerico
                          className="hidden py-2.5 pr-4 text-right text-ink-medio sm:table-cell"
                        >
                          {l.porSemana.toFixed(1).replace(".", ",")}
                        </td>
                        <td className="py-2.5 pr-4">
                          {/* Urgência com texto e não só cor: quem não
                              distingue o âmbar precisa ler a data. */}
                          {l.acabaEm ? (
                            <span
                              className={urgente ? "text-alerta" : "text-ink-medio"}
                            >
                              {diaCurto.format(l.acabaEm)}
                              {dias !== null && dias <= 2 && " · em breve"}
                            </span>
                          ) : (
                            <span className="text-ink-fraco">
                              passa do período
                            </span>
                          )}
                        </td>
                        <td
                          data-numerico
                          className="py-2.5 pr-4 text-right font-semibold"
                        >
                          {l.sugestao}{" "}
                          <span className="text-xs font-normal text-ink-fraco">
                            {l.unidade}
                          </span>
                        </td>
                        <td
                          data-numerico
                          className="hidden py-2.5 text-right text-ink-medio lg:table-cell"
                        >
                          {formatarCentavos(l.custoDaSugestaoCentavos)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Painel>
        </>
      )}

      <p className="max-w-prose text-xs text-ink-fraco">
        A conta usa a média por dia da semana, não por dia corrido: a loja fecha
        domingo e segunda, e sábado vende mais que terça. Produto com menos de
        três vendas no período fica de fora, porque projetar em cima disso seria
        inventar.
      </p>
    </div>
  );
}
