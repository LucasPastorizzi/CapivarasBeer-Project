"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeCaixa,
  IconeEstoque,
  IconePainel,
  IconePdv,
  IconeProdutos,
  IconeRelatorios,
} from "@/components/icones";

type Item = {
  href: string;
  rotulo: string;
  Icone: (p: { className?: string }) => React.ReactElement;
};

export const ITENS: Item[] = [
  { href: "/", rotulo: "Painel", Icone: IconePainel },
  { href: "/pdv", rotulo: "Vender", Icone: IconePdv },
  { href: "/produtos", rotulo: "Produtos", Icone: IconeProdutos },
  { href: "/estoque", rotulo: "Estoque", Icone: IconeEstoque },
  { href: "/caixa", rotulo: "Caixa", Icone: IconeCaixa },
  { href: "/relatorios", rotulo: "Relatórios", Icone: IconeRelatorios },
];

function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Barra lateral do desktop, onde o operador tem teclado e espaço horizontal. */
export function NavegacaoLateral() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do sistema" className="flex flex-col gap-1 p-3">
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = estaAtivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={[
              "flex items-center gap-3 rounded-campo px-3 py-2 text-sm transition-colors duration-150",
              ativo
                ? "bg-ouro-fundo font-medium text-ouro"
                : "text-ink-medio hover:bg-surface hover:text-ink",
            ].join(" ")}
          >
            <Icone className="size-5 shrink-0" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** No celular a lateral vira barra inferior: o polegar alcança, a tela respira. */
export function NavegacaoInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seções do sistema"
      className="fixed inset-x-0 bottom-0 z-[var(--z-fixo)] grid grid-cols-6 border-t border-borda bg-sidebar md:hidden"
    >
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = estaAtivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={[
              "flex flex-col items-center gap-1 py-2 text-xs transition-colors duration-150",
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
