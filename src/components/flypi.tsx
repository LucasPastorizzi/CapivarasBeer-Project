/**
 * Assinatura da Flypi Enterprise.
 *
 * O sistema é um produto da Flypi entregue ao Capivaras Beer: a marca de quem
 * fez fica no rodapé e na entrada, discreta, e a marca de quem usa ocupa o
 * topo. Inverter isso faria a loja se sentir hóspede do próprio sistema.
 */
export function SimboloFlypi({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      {/* Asa: a diagonal ascendente do logotipo, reduzida ao traço que a
          identifica em tamanho pequeno. */}
      <path
        d="M4 19.5 19.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.5 19.5c0-5.5 4.5-10 10-10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AssinaturaFlypi({
  className = "",
}: {
  className?: string;
}) {
  return (
    <a
      href="https://flypi.com.br"
      target="_blank"
      rel="noreferrer noopener"
      className={`group inline-flex items-center gap-1.5 text-ink-fraco transition-colors duration-150 hover:text-ink ${className}`}
    >
      <SimboloFlypi className="size-3.5" />
      <span className="text-xs">
        por <span className="font-medium">Flypi</span> Enterprise
      </span>
    </a>
  );
}
