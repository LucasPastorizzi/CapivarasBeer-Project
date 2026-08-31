"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeAssistente,
  IconeCaixa,
  IconeEstoque,
  IconePainel,
  IconePdv,
  IconeProdutos,
  IconeRelatorios,
} from "@/components/icones";

type Papel = "DONO" | "BALCONISTA";

type Item = {
  href: string;
  rotulo: string;
  Icone: (p: { className?: string }) => React.ReactElement;
  soDono?: boolean;
};

/**
 * O menu é agrupado por momento de uso, não por ordem alfabética.
 *
 * "Balcão" é o que se usa com cliente na frente; "Gestão" é o que o dono abre
 * depois que a loja fecha. O balconista só enxerga o primeiro grupo, então
 * para ele o menu não tem cabeçalho nenhum — dividir duas linhas em seções
 * seria burocracia.
 */
const GRUPOS: { titulo: string; itens: Item[] }[] = [
  {
    titulo: "Balcão",
    itens: [
      { href: "/pdv", rotulo: "Vender", Icone: IconePdv },
      { href: "/caixa", rotulo: "Caixa", Icone: IconeCaixa },
    ],
  },
  {
    titulo: "Gestão",
    itens: [
      { href: "/", rotulo: "Painel", Icone: IconePainel, soDono: true },
      { href: "/produtos", rotulo: "Produtos", Icone: IconeProdutos, soDono: true },
      { href: "/estoque", rotulo: "Estoque", Icone: IconeEstoque, soDono: true },
      { href: "/relatorios", rotulo: "Relatórios", Icone: IconeRelatorios, soDono: true },
      { href: "/assistente", rotulo: "Assistente", Icone: IconeAssistente, soDono: true },
    ],
  },
];

function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function gruposDoPapel(papel: Papel) {
  if (papel === "DONO") return GRUPOS;
  return GRUPOS.map((g) => ({
    ...g,
    itens: g.itens.filter((i) => !i.soDono),
  })).filter((g) => g.itens.length > 0);
}

function itensPlanos(papel: Papel) {
  return gruposDoPapel(papel).flatMap((g) => g.itens);
}

/** Barra lateral do desktop, onde o operador tem teclado e espaço horizontal. */
export function NavegacaoLateral({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const grupos = gruposDoPapel(papel);
  const mostrarTitulos = grupos.length > 1;

  return (
    <nav aria-label="Seções do sistema" className="flex flex-col gap-5 px-3 py-2">
      {grupos.map((grupo) => (
        <div key={grupo.titulo}>
          {mostrarTitulos && (
            <h2 className="mb-1.5 px-3 text-xs font-medium text-ink-fraco">
              {grupo.titulo}
            </h2>
          )}
          <ul className="flex flex-col gap-0.5">
            {grupo.itens.map(({ href, rotulo, Icone }) => {
              const ativo = estaAtivo(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={ativo ? "page" : undefined}
                    className={[
                      "flex items-center gap-3 rounded-campo px-3 py-2 text-sm",
                      "transition-colors duration-150 ease-saida",
                      ativo
                        ? "bg-ouro-fundo font-medium text-ouro"
                        : "text-ink-medio hover:bg-surface hover:text-ink",
                    ].join(" ")}
                  >
                    <Icone className="size-[1.125rem] shrink-0" />
                    {rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** No celular a lateral vira barra inferior: o polegar alcança, a tela respira. */
export function NavegacaoInferior({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const itens = itensPlanos(papel);

  return (
    <nav
      aria-label="Seções do sistema"
      className="fixed inset-x-0 bottom-0 z-[var(--z-fixo)] flex border-t border-borda bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {itens.map(({ href, rotulo, Icone }) => {
        const ativo = estaAtivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={[
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs",
              "transition-colors duration-150",
              ativo ? "text-ouro" : "text-ink-medio",
            ].join(" ")}
          >
            <Icone className="size-5" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
