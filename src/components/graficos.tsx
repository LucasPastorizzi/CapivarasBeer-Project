"use client";

import { useId, useState } from "react";
import { formatarCentavos } from "@/lib/dinheiro";
import { ROTULO_PAGAMENTO, type FormaPagamento } from "@/lib/pagamentos";

/** Ordem fixa. A cor segue a forma de pagamento, nunca a posição no ranking. */
export const COR_DA_FORMA: Record<FormaPagamento, string> = {
  DINHEIRO: "var(--color-serie-1)",
  PIX: "var(--color-serie-2)",
  DEBITO: "var(--color-serie-3)",
  CREDITO: "var(--color-serie-4)",
};

const diaCurto = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });
const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

type PontoDiario = { data: Date; totalCentavos: number };

/**
 * Faturamento por dia. Série única, então não há legenda: o título nomeia.
 * Barras finas, extremidade arredondada apenas no topo e ancorada na linha de
 * base — a base arredondada faria a barra parecer flutuar.
 */
export function GraficoDiario({ serie }: { serie: PontoDiario[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const idTitulo = useId();

  const maximo = Math.max(...serie.map((p) => p.totalCentavos), 1);
  const temDados = serie.some((p) => p.totalCentavos > 0);

  // Com muitos dias os rótulos se encavalam e nenhum fica legível. Acima de
  // 16 colunas mostramos um a cada três, mantendo sempre o primeiro e o
  // último para o leitor saber onde a série começa e termina.
  const passoDoRotulo = serie.length > 16 ? 3 : 1;

  if (!temDados) {
    return (
      <p className="py-6 text-sm text-ink-medio">
        Nenhuma venda no período. O gráfico aparece assim que o primeiro turno
        for registrado.
      </p>
    );
  }

  const hoje = new Date().toDateString();

  return (
    <div className="relative">
      <div
        role="img"
        aria-labelledby={idTitulo}
        className="flex h-40 items-end gap-1.5"
      >
        {/* A descrição é montada a partir da série, não escrita à mão: o
            mesmo gráfico serve 14 dias no painel e 31 nos relatórios, e um
            rótulo fixo faria o leitor de tela anunciar um período errado. */}
        <span id={idTitulo} className="sr-only">
          Faturamento de {serie.length}{" "}
          {serie.length === 1 ? "dia" : "dias"}, de{" "}
          {dataCompleta.format(serie[0].data)} a{" "}
          {dataCompleta.format(serie[serie.length - 1].data)}.
        </span>

        {serie.map((ponto, i) => {
          const altura = (ponto.totalCentavos / maximo) * 100;
          const ehHoje = ponto.data.toDateString() === hoje;

          return (
            <button
              key={ponto.data.toISOString()}
              type="button"
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
              // O alvo de toque é a coluna inteira, não só a barra pintada.
              className="group relative flex h-full flex-1 flex-col justify-end rounded-campo"
              aria-label={`${dataCompleta.format(ponto.data)}: ${formatarCentavos(ponto.totalCentavos)}`}
            >
              <span
                className="w-full rounded-t-[4px] transition-[height,opacity] duration-200 ease-saida"
                style={{
                  height: `${Math.max(altura, ponto.totalCentavos > 0 ? 2 : 0)}%`,
                  backgroundColor: ehHoje
                    ? "var(--color-marca)"
                    : "var(--color-serie-1)",
                  opacity: ativo === null || ativo === i ? 1 : 0.45,
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1.5 text-center text-xs text-ink-fraco">
        {serie.map((ponto, i) => {
          const mostrar =
            i % passoDoRotulo === 0 || i === serie.length - 1;
          return (
            <span key={ponto.data.toISOString()} className="min-w-0 flex-1">
              {mostrar ? diaCurto.format(ponto.data) : ""}
            </span>
          );
        })}
      </div>

      {ativo !== null && (
        <div
          role="status"
          className="mt-3 rounded-campo border border-borda bg-surface-alto px-3 py-2 text-sm"
        >
          <span className="text-ink-medio capitalize">
            {diaSemana.format(serie[ativo].data).replace(".", "")},{" "}
            {dataCompleta.format(serie[ativo].data).split(", ")[1]}
          </span>{" "}
          ·{" "}
          <strong data-numerico>
            {formatarCentavos(serie[ativo].totalCentavos)}
          </strong>
        </div>
      )}
    </div>
  );
}

type LinhaMix = {
  forma: FormaPagamento;
  totalCentavos: number;
  quantidade: number;
};

/**
 * Composição do faturamento por forma de pagamento: uma barra empilhada com
 * 2px de respiro entre segmentos, mais as linhas rotuladas embaixo. A cor
 * nunca carrega a identidade sozinha — cada forma aparece escrita.
 */
export function MixDePagamento({ linhas }: { linhas: LinhaMix[] }) {
  const [ativo, setAtivo] = useState<FormaPagamento | null>(null);
  const total = linhas.reduce((soma, l) => soma + l.totalCentavos, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-ink-medio">
        Sem vendas no mês para comparar formas de pagamento.
      </p>
    );
  }

  const comValor = linhas.filter((l) => l.totalCentavos > 0);

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        {comValor.map((l) => (
          <span
            key={l.forma}
            className="h-full rounded-full transition-opacity duration-200"
            style={{
              width: `${(l.totalCentavos / total) * 100}%`,
              backgroundColor: COR_DA_FORMA[l.forma],
              opacity: ativo === null || ativo === l.forma ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      <ul className="space-y-1.5">
        {comValor.map((l) => (
          <li
            key={l.forma}
            onMouseEnter={() => setAtivo(l.forma)}
            onMouseLeave={() => setAtivo(null)}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-ink-medio">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COR_DA_FORMA[l.forma] }}
              />
              {ROTULO_PAGAMENTO[l.forma]}
              <span className="text-xs text-ink-fraco">
                {l.quantidade}×
              </span>
            </span>
            {/* Colunas de largura fixa: percentual e valor precisam alinhar
                entre as linhas para a comparação ser feita de relance. */}
            <span className="flex shrink-0 items-baseline gap-3">
              <span
                data-numerico
                className="w-9 text-right text-xs text-ink-fraco"
              >
                {Math.round((l.totalCentavos / total) * 100)}%
              </span>
              <span data-numerico className="w-24 text-right font-medium">
                {formatarCentavos(l.totalCentavos)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ProdutoRanking = {
  id: string;
  nome: string;
  categoria: string;
  unidades: number;
  totalCentavos: number;
};

/** Ranking: barras horizontais com rótulo direto, série única. */
export function MaisVendidos({ produtos }: { produtos: ProdutoRanking[] }) {
  if (produtos.length === 0) {
    return (
      <p className="text-sm text-ink-medio">
        Nenhuma venda no mês ainda. Assim que o balcão registrar as primeiras,
        os campeões aparecem aqui.
      </p>
    );
  }

  const maximo = Math.max(...produtos.map((p) => p.unidades), 1);

  return (
    <ol className="space-y-3">
      {produtos.map((p) => (
        <li key={p.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{p.nome}</span>
            <span data-numerico className="shrink-0 text-ink-medio">
              {p.unidades} un · {formatarCentavos(p.totalCentavos)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-alto">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-saida"
              style={{
                width: `${(p.unidades / maximo) * 100}%`,
                backgroundColor: "var(--color-serie-1)",
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
