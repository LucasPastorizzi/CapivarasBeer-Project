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

type Papel = "DONO" | "BALCONISTA";

type Item = {
  href: string;
  rotulo: string;
  Icone: (p: { className?: string }) => React.ReactElement;
  /** Quando true, some do menu do balconista. */
  soDono?: boolean;
};

const ITENS: Item[] = [
  { href: "/", rotulo: "Painel", Icone: IconePainel, soDono: true },
  { href: "/pdv", rotulo: "Vender", Icone: IconePdv },
  { href: "/produtos", rotulo: "Produtos", Icone: IconeProdutos, soDono: true },
  { href: "/estoque", rotulo: "Estoque", Icone: IconeEstoque, soDono: true },
  { href: "/caixa", rotulo: "Caixa", Icone: IconeCaixa },
  { href: "/relatorios", rotulo: "Relatórios", Icone: IconeRelatorios, soDono: true },
];

function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** O menu esconde o que o papel não alcança; o servidor é quem barra. */
function itensDoPapel(papel: Papel) {
  return papel === "DONO" ? ITENS : ITENS.filter((i) => !i.soDono);
}

/** Barra lateral do desktop, onde o operador tem teclado e espaço horizontal. */
export function NavegacaoLateral({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const itens = itensDoPapel(papel);

  return (
    <nav aria-label="Seções do sistema" className="flex flex-col gap-1 p-3">
      {itens.map(({ href, rotulo, Icone }) => {
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
export function NavegacaoInferior({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const itens = itensDoPapel(papel);

  return (
    <nav
      aria-label="Seções do sistema"
      className="fixed inset-x-0 bottom-0 z-[var(--z-fixo)] flex border-t border-borda bg-sidebar md:hidden"
    >
      {itens.map(({ href, rotulo, Icone }) => {
        const ativo = estaAtivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={[
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors duration-150",
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
