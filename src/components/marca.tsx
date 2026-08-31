/**
 * Marca do sistema.
 *
 * O logo real da loja é a capivara de óculos com a caneca — desenho detalhado
 * que vira mancha a 36 pixels numa barra lateral. Aqui ela vira silhueta de
 * perfil: a cabeça retangular e o focinho rombudo que identificam o bicho,
 * com a orelha encostada na cabeça em vez de flutuando ao lado.
 */
export function SeloCapivara({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-painel bg-ouro ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[72%]">
        <g className="fill-bg">
          {/* orelha, encostada na cabeça para as duas lerem como uma massa só */}
          <circle cx="7.9" cy="8.2" r="2.2" />
          {/* cabeça de perfil, terminando no focinho rombudo à direita */}
          <path d="M4.4 13.4c0-3.1 2.5-5.4 5.9-5.4h2.4c1.9 0 3.5.7 4.6 1.9l1.7 1.9c.6.6.9 1.3.9 2 0 2.1-2 3.6-4.8 3.6h-4.9c-3.4 0-5.8-1.9-5.8-4Z" />
        </g>
        {/* olho e narina vazados: o dourado do fundo aparece por eles */}
        <circle cx="13.6" cy="12.1" r="1.05" className="fill-ouro" />
        <circle cx="19" cy="13.4" r="0.62" className="fill-ouro" />
      </svg>
    </span>
  );
}
