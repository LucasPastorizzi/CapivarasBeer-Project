import Link from "next/link";
import { GraficoDiario, MaisVendidos, MixDePagamento } from "@/components/graficos";
import { IconeAlerta, IconeOk } from "@/components/icones";
import { Painel, Variacao } from "@/components/ui";
import { exigirDono } from "@/lib/autenticacao";
import { formatarDataLonga, formatarHora, nomeDoMes } from "@/lib/datas";
import { formatarCentavos } from "@/lib/dinheiro";
import { carregarPainel } from "@/lib/painel";

export const metadata = { title: "Painel" };

// O painel lê o caixa e as vendas do instante — nunca uma versão em cache.
export const dynamic = "force-dynamic";

function Total({
  rotulo,
  valor,
  apoio,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  apoio: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-medio">{rotulo}</dt>
      <dd
        data-numerico
        className={
          "mt-1 font-semibold tracking-tight text-ink " +
          // O destaque cresce só quando há largura para ele. Fixo em 2.25rem,
          // o total do mês invadia o rótulo da coluna vizinha.
          (destaque
            ? "text-2xl leading-tight lg:text-[2rem]"
            : "text-xl leading-tight lg:text-2xl")
        }
      >
        {valor}
      </dd>
      <p className="mt-2">{apoio}</p>
    </div>
  );
}

export default async function PaginaPainel() {
  // Faturamento e margem são do dono; o balconista é desviado para o PDV.
  await exigirDono();

  const {
    agora,
    hoje,
    referencia,
    mes,
    serie,
    mix,
    topProdutos,
    produtosEmFalta,
    caixaAberto,
    totalProdutos,
  } = await carregarPainel();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="mt-1 text-sm text-ink-medio first-letter:uppercase">
          {formatarDataLonga(agora)}
        </p>
      </header>

      {/* O número de hoje é o que o dono abre o sistema para ver, então ele
          é maior que os outros dois em vez de dividir o mesmo peso. */}
      <section aria-labelledby="titulo-totais">
        <h2 id="titulo-totais" className="sr-only">
          Totais de venda
        </h2>
        <dl className="grid gap-6 rounded-painel border border-borda bg-surface p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Total
            destaque
            rotulo="Vendido hoje"
            valor={formatarCentavos(hoje.totalCentavos)}
            apoio={
              <Variacao
                atualCentavos={hoje.totalCentavos}
                referenciaCentavos={referencia.totalCentavos}
                rotuloReferencia="semana passada"
              />
            }
          />
          <Total
            rotulo={`Vendido em ${nomeDoMes(agora)}`}
            valor={formatarCentavos(mes.totalCentavos)}
            apoio={
              <span className="text-xs text-ink-fraco">
                {mes.quantidade === 0
                  ? "Nenhuma venda no mês"
                  : `${mes.quantidade} ${mes.quantidade === 1 ? "venda" : "vendas"}`}
              </span>
            }
          />
          <Total
            rotulo="Ticket médio do mês"
            valor={formatarCentavos(mes.ticketMedioCentavos)}
            apoio={
              <span className="text-xs text-ink-fraco">
                {mes.quantidade === 0
                  ? "Sem base de cálculo"
                  : `Média de ${mes.quantidade} vendas`}
              </span>
            }
          />
        </dl>
      </section>

      <Painel titulo="Últimos 14 dias">
        <GraficoDiario serie={serie} />
      </Painel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo={`Como pagaram em ${nomeDoMes(agora)}`}>
          <MixDePagamento linhas={mix} />
        </Painel>

        <Painel titulo={`Mais vendidos em ${nomeDoMes(agora)}`}>
          <MaisVendidos produtos={topProdutos} />
        </Painel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Caixa">
          {caixaAberto ? (
            <div className="flex items-start gap-3">
              <IconeOk className="mt-0.5 size-5 shrink-0 text-ok" />
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
            <p className="text-sm text-ink-medio">
              Nenhum caixa aberto.{" "}
              <Link
                href="/caixa"
                className="text-neon underline-offset-4 hover:underline"
              >
                Abra o caixa
              </Link>{" "}
              antes da primeira venda do turno — é ele que separa o dinheiro de
              hoje do de ontem.
            </p>
          )}
        </Painel>

        <Painel
          titulo="Precisa repor"
          acao={
            produtosEmFalta.length > 0 ? (
              <Link
                href="/produtos"
                className="text-xs text-neon underline-offset-4 hover:underline"
              >
                Ver catálogo
              </Link>
            ) : undefined
          }
        >
          {produtosEmFalta.length === 0 ? (
            <p className="text-sm text-ink-medio">
              Todos os {totalProdutos} produtos estão acima do estoque mínimo.
            </p>
          ) : (
            <ul className="-my-1 divide-y divide-borda">
              {produtosEmFalta.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: p.categoria.cor }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.nome}</p>
                      <p className="text-xs text-ink-fraco">
                        {p.categoria.nome}
                      </p>
                    </div>
                  </div>
                  {/* Ícone e texto acompanham a cor: quem não distingue o
                      âmbar ainda lê o estado. */}
                  <span
                    data-numerico
                    className="inline-flex items-center gap-1.5 rounded-campo bg-alerta-fundo px-2 py-1 text-xs font-medium text-alerta"
                  >
                    <IconeAlerta className="size-3.5" />
                    {p.estoqueAtual} de {p.estoqueMinimo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </div>
  );
}
