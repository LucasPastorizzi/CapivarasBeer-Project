import Link from "next/link";
import { sair } from "@/app/login/acoes";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/navegacao";
import { exigirSessao } from "@/lib/autenticacao";

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

function Rodape({ nome, papel }: { nome: string; papel: string }) {
  return (
    <div className="mt-auto border-t border-borda p-3">
      <p className="px-3 text-sm font-medium">{nome}</p>
      <p className="px-3 text-xs text-ink-fraco">
        {papel === "DONO" ? "Dono" : "Balconista"}
      </p>
      <form action={sair}>
        <button
          type="submit"
          className="mt-2 w-full rounded-campo px-3 py-2 text-left text-sm text-ink-medio transition-colors duration-150 hover:bg-surface hover:text-ink"
        >
          Sair
        </button>
      </form>
    </div>
  );
}

export default async function LayoutDoApp({ children }: LayoutProps<"/">) {
  // A sessão é verificada aqui e de novo em cada página: o layout protege a
  // navegação, mas não é barreira de autorização por si só.
  const sessao = await exigirSessao();

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-borda bg-sidebar md:flex">
        <Marca />
        <NavegacaoLateral papel={sessao.papel} />
        <Rodape nome={sessao.nome} papel={sessao.papel} />
      </aside>

      {/* pb-20 no celular abre espaço para a barra inferior não cobrir conteúdo. */}
      <main className="min-w-0 flex-1 px-4 pt-6 pb-20 md:px-8 md:pb-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <NavegacaoInferior papel={sessao.papel} />
    </div>
  );
}
