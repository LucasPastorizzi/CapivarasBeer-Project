import Link from "next/link";
import { Painel, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/autenticacao";
import { buscarCaixaAberto } from "@/lib/caixa";
import { comandasFechadasDoTurno, listarComandasAbertas } from "@/lib/comandas";
import { formatarHora } from "@/lib/datas";
import { formatarCentavos } from "@/lib/dinheiro";

export const metadata = { title: "Comandas" };
export const dynamic = "force-dynamic";

/** Há quanto tempo a mesa está aberta, em linguagem de balcão. */
function tempoAberta(desde: Date): string {
  const minutos = Math.floor((Date.now() - desde.getTime()) / 60000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, "0")}`;
}

export default async function PaginaComandas() {
  await exigirSessao();

  const caixa = await buscarCaixaAberto();

  if (!caixa) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-[2.125rem] leading-none font-normal">
            Comandas
          </h1>
        </header>
        <Painel>
          <Vazio
            titulo="Caixa fechado"
            descricao="A comanda é consumo que ainda não virou dinheiro na gaveta — ela só existe dentro de um turno. Abra o caixa para começar a noite."
            acao={
              <Link
                href="/caixa"
                className="rounded-acao bg-marca px-5 py-2 text-sm font-medium text-sidebar transition-colors duration-150 hover:bg-marca-forte"
              >
                Abrir o caixa
              </Link>
            }
          />
        </Painel>
      </div>
    );
  }

  const [abertas, fechadas] = await Promise.all([
    listarComandasAbertas(),
    comandasFechadasDoTurno(),
  ]);

  const totalAberto = abertas.reduce((s, c) => s + c.totalCentavos, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.125rem] leading-none font-normal">
            Comandas
          </h1>
          <p className="mt-2 text-sm text-ink-medio">
            Contas abertas de quem está consumindo no local.
          </p>
        </div>
        <Link
          href="/comandas/nova"
          className="rounded-acao bg-marca px-5 py-2 text-sm font-medium text-sidebar transition-colors duration-150 hover:bg-marca-forte"
        >
          Abrir comanda
        </Link>
      </header>

      {abertas.length === 0 ? (
        <Painel>
          <Vazio
            titulo="Nenhuma mesa aberta"
            descricao="Quando alguém sentar e pedir, abra uma comanda para ir lançando as rodadas e cobrar tudo no fim."
          />
        </Painel>
      ) : (
        <>
          {/* O total em aberto é dinheiro que já saiu da geladeira e ainda não
              entrou na gaveta. É o número que o dono precisa ver de relance. */}
          <div className="rounded-painel border border-borda bg-surface px-6 py-4">
            <p className="text-sm text-ink-medio">
              {abertas.length}{" "}
              {abertas.length === 1 ? "conta aberta" : "contas abertas"},
              somando{" "}
              <strong data-numerico className="text-ink">
                {formatarCentavos(totalAberto)}
              </strong>{" "}
              ainda por receber.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {abertas.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/comandas/${c.numero}`}
                  className="flex h-full flex-col justify-between gap-4 rounded-painel border border-borda bg-surface p-5 transition-colors duration-150 hover:border-borda-forte hover:bg-surface-alto"
                >
                  <div>
                    <p className="text-lg font-medium">{c.identificacao}</p>
                    <p className="mt-0.5 text-xs text-ink-fraco">
                      nº {c.numero} · aberta há {tempoAberta(c.abertaEm)} ·{" "}
                      {formatarHora(c.abertaEm)}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-ink-fraco">
                      {c.itens === 0
                        ? "sem lançamentos"
                        : `${c.itens} ${c.itens === 1 ? "item" : "itens"}`}
                    </span>
                    <span
                      data-numerico
                      className="text-lg font-semibold tracking-tight"
                    >
                      {formatarCentavos(c.totalCentavos)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {fechadas.length > 0 && (
        <Painel titulo="Já fechadas neste turno">
          <ul className="-my-1 divide-y divide-borda">
            {fechadas.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-2.5"
              >
                <div>
                  <p className="text-sm">
                    {c.identificacao}
                    {c.status === "CANCELADA" && (
                      <span className="ml-2 rounded-campo bg-perigo-fundo px-1.5 py-0.5 text-xs font-medium text-perigo">
                        cancelada
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-fraco">
                    nº {c.numero}
                    {c.fechadaEm && ` · ${formatarHora(c.fechadaEm)}`}
                    {c.venda && ` · virou a venda nº ${c.venda.numero}`}
                  </p>
                </div>
                <span data-numerico className="text-sm">
                  {formatarCentavos(
                    c.venda?.totalCentavos ??
                      c.itens.reduce((s, i) => s + i.subtotalCentavos, 0),
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Painel>
      )}
    </div>
  );
}
