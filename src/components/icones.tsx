/**
 * Ícones em traço, 1.5px, grade de 24. Um só estilo em todo o sistema — mistura
 * de família de ícone é o tipo de inconsistência que faz uma ferramenta parecer
 * remendada.
 */
type Props = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconePainel({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 13h6V3H3zM15 21h6V11h-6zM3 21h6v-4H3zM15 7h6V3h-6z" />
    </svg>
  );
}

export function IconePdv({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  );
}

export function IconeProdutos({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M8 3h8l1 4H7zM7 7h10v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />
      <path d="M10 12h4" />
    </svg>
  );
}

export function IconeEstoque({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  );
}

export function IconeCaixa({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v4M18 10v4" />
    </svg>
  );
}

export function IconeRelatorios({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function IconeAlerta({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 2.8 19.5h18.4z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

export function IconeOk({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.3 2.4 2.4 4.6-4.9" />
    </svg>
  );
}

/**
 * Balão de conversa, não faísca.
 *
 * A estrelinha virou o carimbo universal de "tem IA aqui" e não diz nada
 * sobre o que a tela faz. O que se faz aqui é perguntar.
 */
export function IconeAssistente({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M20.5 12.4c0 4-3.8 7.2-8.5 7.2-1 0-2-.15-2.9-.42L4 20.8l1.5-3.7c-1.3-1.25-2-2.9-2-4.7 0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z" />
      <path d="M10.1 10.4a2 2 0 0 1 3.9.6c0 1.3-2 1.6-2 2.6M12 16.1h.01" />
    </svg>
  );
}
