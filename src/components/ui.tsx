/**
 * Vocabulário de componentes do sistema. Um botão de salvar precisa ter a
 * mesma cara em toda tela; quando difere, uma das duas está errada.
 *
 * Todo controle interativo entrega os sete estados: padrão, hover, foco,
 * ativo, desabilitado, carregando e erro.
 */
import type { ComponentProps, ReactNode } from "react";

type VarianteBotao = "primario" | "secundario" | "perigo";

const BASE_BOTAO =
  "inline-flex items-center justify-center gap-2 rounded-acao px-5 py-2 text-sm font-medium " +
  "transition-colors duration-150 ease-saida " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTES: Record<VarianteBotao, string> = {
  primario:
    "bg-marca text-sidebar hover:bg-marca-forte active:bg-marca-forte disabled:hover:bg-marca",
  secundario:
    "border border-borda text-ink hover:bg-surface-alto hover:border-borda-forte active:bg-surface disabled:hover:bg-transparent",
  perigo:
    "border border-perigo/40 bg-perigo-fundo text-perigo hover:border-perigo active:bg-perigo-fundo",
};

export function Botao({
  variante = "primario",
  carregando = false,
  children,
  className = "",
  disabled,
  ...resto
}: ComponentProps<"button"> & {
  variante?: VarianteBotao;
  carregando?: boolean;
}) {
  return (
    <button
      {...resto}
      disabled={disabled || carregando}
      // Leitor de tela precisa saber que o botão está ocupado, não travado.
      aria-busy={carregando || undefined}
      className={`${BASE_BOTAO} ${VARIANTES[variante]} ${className}`}
    >
      {carregando && <Girador />}
      {children}
    </button>
  );
}

function Girador() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Campo({
  rotulo,
  id,
  dica,
  erro,
  className = "",
  ...resto
}: ComponentProps<"input"> & {
  rotulo: string;
  id: string;
  dica?: ReactNode;
  erro?: string;
}) {
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {rotulo}
      </label>
      <input
        {...resto}
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[idDica, idErro].filter(Boolean).join(" ") || undefined}
        className={
          "w-full rounded-campo border bg-surface-alto px-3 py-2 text-base text-ink " +
          "transition-colors duration-150 " +
          "disabled:cursor-not-allowed disabled:opacity-50 " +
          (erro ? "border-perigo " : "border-borda hover:border-borda-forte ") +
          className
        }
      />
      {dica && (
        <p id={idDica} className="text-xs text-ink-fraco">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-xs text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Aviso de resultado de uma ação. Cor sempre acompanhada de texto. */
export function Aviso({
  tom,
  children,
}: {
  tom: "erro" | "ok" | "alerta";
  children: ReactNode;
}) {
  const tons = {
    erro: "border-perigo/40 bg-perigo-fundo text-perigo",
    ok: "border-ok/40 bg-ok-fundo text-ok",
    alerta: "border-alerta/40 bg-alerta-fundo text-alerta",
  } as const;

  return (
    <p
      role={tom === "erro" ? "alert" : "status"}
      className={`rounded-campo border px-3 py-2 text-sm ${tons[tom]}`}
    >
      {children}
    </p>
  );
}

/**
 * Campo de dinheiro. Teclado numérico no celular, prefixo fixo em R$ e sempre
 * alinhado à direita — coluna de valor só é conferível alinhada pela unidade.
 */
export function CampoDinheiro({
  rotulo,
  id,
  dica,
  erro,
  ...resto
}: ComponentProps<"input"> & {
  rotulo: string;
  id: string;
  dica?: ReactNode;
  erro?: string;
}) {
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {rotulo}
      </label>
      <div
        className={
          "flex items-center rounded-campo border bg-surface-alto " +
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-neon " +
          (erro ? "border-perigo" : "border-borda hover:border-borda-forte")
        }
      >
        <span aria-hidden className="pl-3 text-sm text-ink-medio">
          R$
        </span>
        <input
          {...resto}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          aria-invalid={erro ? true : undefined}
          aria-describedby={[idDica, idErro].filter(Boolean).join(" ") || undefined}
          data-numerico
          className="w-full bg-transparent px-2 py-2 text-right text-base text-ink outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {dica && (
        <p id={idDica} className="text-xs text-ink-fraco">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-xs text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Painel: a única moldura de conteúdo do sistema. Nunca aninhado. */
export function Painel({
  titulo,
  acao,
  children,
}: {
  titulo?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-painel border border-borda bg-surface">
      {titulo && (
        <header className="flex items-center justify-between gap-3 border-b border-borda px-5 py-3.5">
          <h2 className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-medio uppercase">
            {titulo}
          </h2>
          {acao}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Linha rótulo/valor de um extrato. */
export function Linha({
  rotulo,
  valor,
  apoio,
  destaque = false,
  tom,
}: {
  rotulo: string;
  valor: string;
  apoio?: string;
  destaque?: boolean;
  tom?: "ok" | "perigo" | "alerta";
}) {
  const cor =
    tom === "ok"
      ? "text-ok"
      : tom === "perigo"
        ? "text-perigo"
        : tom === "alerta"
          ? "text-alerta"
          : destaque
            ? "text-ink"
            : "text-ink";

  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={destaque ? "text-sm font-medium" : "text-sm text-ink-medio"}>
        {rotulo}
        {apoio && <span className="ml-1.5 text-xs text-ink-fraco">{apoio}</span>}
      </span>
      <span
        data-numerico
        className={`${destaque ? "text-base font-semibold" : "text-sm"} ${cor}`}
      >
        {valor}
      </span>
    </div>
  );
}

/** Tecla física, para as dicas de atalho do balcão. */
export function Tecla({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[5px] border border-borda bg-surface-alto px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-medio">
      {children}
    </kbd>
  );
}

/**
 * Esqueleto de carregamento. Ocupa a forma do conteúdo que vem, para a página
 * não pular quando ele chega — girador no meio do conteúdo faz o operador
 * esperar sem saber o que esperar.
 */
export function Esqueleto({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-campo bg-surface-alto ${className}`}
    />
  );
}

/** Estado vazio: diz o que aconteceu e qual é o próximo passo. */
export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium text-ink">{titulo}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-medio">
        {descricao}
      </p>
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

/** Variação de um número contra um período de referência. */
export function Variacao({
  atualCentavos,
  referenciaCentavos,
  rotuloReferencia,
}: {
  atualCentavos: number;
  referenciaCentavos: number;
  rotuloReferencia: string;
}) {
  // Sem base de comparação não existe variação: mostrar "+100%" contra zero é
  // um número que não quer dizer nada.
  if (referenciaCentavos === 0) {
    return (
      <span className="text-xs text-ink-fraco">
        Sem {rotuloReferencia} para comparar
      </span>
    );
  }

  const variacao =
    ((atualCentavos - referenciaCentavos) / referenciaCentavos) * 100;
  const subiu = variacao >= 0;

  return (
    <span
      className={`text-xs ${subiu ? "text-ok" : "text-perigo"}`}
      data-numerico
    >
      {subiu ? "▲" : "▼"} {Math.abs(variacao).toFixed(0)}% vs {rotuloReferencia}
    </span>
  );
}
