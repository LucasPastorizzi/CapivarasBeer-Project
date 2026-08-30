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
  "inline-flex items-center justify-center gap-2 rounded-campo px-4 py-2 text-sm font-medium " +
  "transition-colors duration-150 ease-saida " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTES: Record<VarianteBotao, string> = {
  primario:
    "bg-ouro text-bg hover:bg-ouro-forte active:bg-ouro-forte disabled:hover:bg-ouro",
  secundario:
    "border border-borda bg-surface text-ink hover:bg-surface-alto hover:border-borda-forte active:bg-surface disabled:hover:bg-surface",
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
