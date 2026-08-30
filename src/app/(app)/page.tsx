import Link from "next/link";
import { IconeAlerta, IconeOk } from "@/components/icones";
import { formatarDataLonga, formatarHora, nomeDoMes } from "@/lib/datas";
import { formatarCentavos } from "@/lib/dinheiro";
import { exigirDono } from "@/lib/autenticacao";
import { carregarPainel } from "@/lib/painel";

export const metadata = { title: "Painel" };

// O painel lê o caixa e as vendas do instante — nunca uma versão em cache.
export const dynamic = "force-dynamic";

function Total({
  rotulo,
  valor,
  apoio,
}: {
  rotulo: string;
  valor: string;
  apoio: string;
}) {
  return (
    <div className="border-b border-borda pb-4 last:border-b-0 sm:border-b-0 sm:border-r sm:pr-6 sm:pb-0 sm:last:border-r-0">
      <dt className="text-sm text-ink-medio">{rotulo}</dt>
      <dd
        data-numerico
        className="mt-1 text-2xl font-semibold tracking-tight text-ink"
      >
        {valor}
      </dd>
      <p className="mt-0.5 text-xs text-ink-fraco">{apoio}</p>
    </div>
  );
}

export default async function PaginaPainel() {
  // Faturamento e margem são do dono; o balconista é desviado para o PDV.
  await exigirDono();

  const { agora, hoje, mes, produtosEmFalta, caixaAberto, totalProdutos } =
    await carregarPainel();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Painel</h1>
        <p className="mt-1 text-sm text-ink-medio first-letter:uppercase">
          {formatarDataLonga(agora)}
        </p>
      </header>

      <section aria-labelledby="titulo-totais">
        <h2 id="titulo-totais" className="sr-only">
          Totais de venda
        </h2>
        <dl className="grid gap-4 rounded-painel border border-borda bg-surface p-5 sm:grid-cols-3 sm:gap-6">
          <Total
            rotulo="Vendido hoje"
            valor={formatarCentavos(hoje.totalCentavos)}
            apoio={
              hoje.quantidade === 0
                ? "Nenhuma venda ainda"
                : `${hoje.quantidade} ${hoje.quantidade === 1 ? "venda" : "vendas"}`
            }
          />
          <Total
            rotulo={`Vendido em ${nomeDoMes(agora)}`}
            valor={formatarCentavos(mes.totalCentavos)}
            apoio={
              mes.quantidade === 0
                ? "Nenhuma venda no mês"
                : `${mes.quantidade} ${mes.quantidade === 1 ? "venda" : "vendas"}`
            }
          />
          <Total
            rotulo="Ticket médio do mês"
            valor={formatarCentavos(mes.ticketMedioCentavos)}
            apoio={
              mes.quantidade === 0
                ? "Sem base de cálculo"
                : `Média de ${mes.quantidade} vendas`
            }
          />
        </dl>
      </section>

      <section aria-labelledby="titulo-caixa">
        <h2 id="titulo-caixa" className="mb-3 text-lg font-semibold">
          Caixa
        </h2>
        {caixaAberto ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-painel border border-borda bg-surface p-5">
            <IconeOk className="size-5 text-ok" />
            <p className="text-sm">
              Aberto desde{" "}
              <strong className="font-medium">
                {formatarHora(caixaAberto.abertoEm)}
              </strong>{" "}
              por {caixaAberto.usuarioAbertura.nome}, com{" "}
              <span data-numerico>
                {formatarCentavos(caixaAberto.valorAberturaCentavos)}
              </span>{" "}
              de troco inicial.
            </p>
          </div>
        ) : (
          <div className="rounded-painel border border-borda bg-surface p-5">
            <p className="text-sm text-ink-medio">
              Nenhum caixa aberto. Abra o caixa antes da primeira venda do turno
              — é ele que separa o dinheiro de hoje do de ontem.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-falta">
        <h2 id="titulo-falta" className="mb-3 text-lg font-semibold">
          Precisa repor
        </h2>
        {produtosEmFalta.length === 0 ? (
          <p className="rounded-painel border border-borda bg-surface p-5 text-sm text-ink-medio">
            Todos os {totalProdutos} produtos estão acima do estoque mínimo.
          </p>
        ) : (
          <ul className="divide-y divide-borda overflow-hidden rounded-painel border border-borda bg-surface">
            {produtosEmFalta.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors duration-150 hover:bg-surface-alto"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-ink-fraco">{p.categoria.nome}</p>
                </div>
                {/* Ícone e texto acompanham a cor: quem não distingue o âmbar
                    ainda lê o estado. */}
                <span
                  data-numerico
                  className="inline-flex items-center gap-1.5 rounded-campo bg-alerta-fundo px-2 py-1 text-xs font-medium text-alerta"
                >
                  <IconeAlerta className="size-3.5" />
                  {p.estoqueAtual} de {p.estoqueMinimo} mínimo
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-ink-fraco">
        <Link href="/pdv" className="text-neon underline-offset-4 hover:underline">
          Ir para a tela de venda
        </Link>
      </p>
    </div>
  );
}
