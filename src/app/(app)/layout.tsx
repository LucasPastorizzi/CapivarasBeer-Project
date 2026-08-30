import Link from "next/link";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/navegacao";

/** Marca reduzida ao essencial: a inicial da capivara e o nome. */
function Marca() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-campo px-3 py-4 transition-colors duration-150 hover:text-ouro"
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-campo bg-ouro font-semibold text-bg"
      >
        C
      </span>
      <span className="text-sm leading-tight font-semibold">
        Capivaras Beer
        <span className="block text-xs font-normal text-ink-fraco">
          Gestão da loja
        </span>
      </span>
    </Link>
  );
}

export default function LayoutDoApp({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-borda bg-sidebar md:flex">
        <Marca />
        <NavegacaoLateral />
      </aside>

      {/* pb-20 no celular abre espaço para a barra inferior não cobrir conteúdo. */}
      <main className="min-w-0 flex-1 px-4 pt-6 pb-20 md:px-8 md:pb-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <NavegacaoInferior />
    </div>
  );
}
