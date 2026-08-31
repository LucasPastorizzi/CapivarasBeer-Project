/**
 * Marca da loja.
 *
 * O logo real do Capivaras Beer é a capivara de óculos com a caneca — desenho
 * detalhado que vira mancha a 32 pixels. Aqui ela é silhueta de perfil: a
 * cabeça retangular e o focinho rombudo que identificam o bicho.
 *
 * Em branco, e não em amarelo: o amarelo é do sistema e marca o que se
 * clica. Uma marca amarela ao lado de um botão amarelo faz o olho procurar
 * ação onde só há identidade.
 */
export function SeloCapivara({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 text-ink ${className}`}
      aria-hidden
    >
      <g fill="currentColor">
        {/* orelha, encostada na cabeça para as duas lerem como uma massa só */}
        <circle cx="7.9" cy="8.2" r="2.2" />
        {/* cabeça de perfil, terminando no focinho rombudo à direita */}
        <path d="M4.4 13.4c0-3.1 2.5-5.4 5.9-5.4h2.4c1.9 0 3.5.7 4.6 1.9l1.7 1.9c.6.6.9 1.3.9 2 0 2.1-2 3.6-4.8 3.6h-4.9c-3.4 0-5.8-1.9-5.8-4Z" />
      </g>
      {/* olho e narina vazados no fundo da barra lateral */}
      <circle cx="13.6" cy="12.1" r="1.05" className="fill-sidebar" />
      <circle cx="19" cy="13.4" r="0.62" className="fill-sidebar" />
    </svg>
  );
}
