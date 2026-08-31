import Link from "next/link";
import { sair } from "@/app/login/acoes";
import { AssinaturaFlypi } from "@/components/flypi";
import { SeloCapivara } from "@/components/marca";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/navegacao";
import { exigirSessao } from "@/lib/autenticacao";
import { emModoDemonstracao } from "@/lib/demonstracao";
import { rotaInicial } from "@/lib/autenticacao";

function Marca({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-campo px-3 py-4 transition-colors duration-150 hover:text-marca"
    >
      <SeloCapivara className="size-8" />
      <span className="leading-none">
        <span className="font-display text-xl">Capivaras Beer</span>
        <span className="mt-1 block text-xs text-ink-fraco">
          Lindolfo Collor
        </span>
      </span>
    </Link>
  );
}

function Rodape({ nome, papel }: { nome: string; papel: string }) {
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mt-auto">
      <div className="border-t border-borda p-3">
        <div className="flex items-center gap-2.5 px-1 pt-1 pb-2">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full border border-borda text-xs font-medium text-ink-medio"
          >
            {iniciais}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{nome}</p>
            <p className="text-xs text-ink-fraco">
              {papel === "DONO" ? "Dono" : "Balconista"}
            </p>
          </div>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="w-full rounded-campo px-3 py-2 text-left text-sm text-ink-medio transition-colors duration-150 hover:bg-surface hover:text-ink"
          >
            Sair
          </button>
        </form>
      </div>

      {/* Quem fez assina embaixo de tudo; quem usa ocupa o topo. */}
      <div className="border-t border-borda px-4 py-3">
        <AssinaturaFlypi />
      </div>
    </div>
  );
}

export default async function LayoutDoApp({ children }: LayoutProps<"/">) {
  // A sessão é verificada aqui e de novo em cada página: o layout protege a
  // navegação, mas não é barreira de autorização por si só.
  const sessao = await exigirSessao();
  const demonstracao = emModoDemonstracao();

  // A faixa de demonstração é fixa no topo, então tudo que também é fixo
  // precisa descer a mesma altura — senão ela cobre o cabeçalho.
  const recuo = demonstracao ? "top-7" : "top-0";
  const alturaLateral = demonstracao ? "h-[calc(100dvh-1.75rem)]" : "h-dvh";

  return (
    <div className="flex min-h-dvh">
      <aside
        className={`sticky ${recuo} ${alturaLateral} hidden w-60 shrink-0 flex-col border-r border-borda bg-sidebar md:flex`}
      >
        <Marca href={rotaInicial(sessao.papel)} />
        <NavegacaoLateral papel={sessao.papel} />
        <Rodape nome={sessao.nome} papel={sessao.papel} />
      </aside>

      {demonstracao && (
        <p
          role="status"
          className="fixed inset-x-0 top-0 z-[var(--z-aviso)] bg-marca px-4 py-1.5 text-center text-xs font-medium text-sidebar"
        >
          Demonstração · os dados são fictícios e se perdem periodicamente
        </p>
      )}

      {/* Cabeçalho só no celular, onde não há barra lateral para se localizar. */}
      <header
        className={`fixed inset-x-0 ${recuo} z-[var(--z-fixo)] flex items-center gap-2.5 border-b border-borda bg-sidebar px-4 py-2.5 md:hidden`}
      >
        <SeloCapivara className="size-7" />
        <span className="font-display text-lg leading-none">Capivaras Beer</span>
      </header>

      {/* Os espaçamentos no celular abrem lugar para o cabeçalho fixo em cima
          e a barra de navegação embaixo. */}
      <main
        className={`min-w-0 flex-1 px-4 pb-24 md:px-8 md:pb-12 ${
          demonstracao ? "pt-[5.5rem] md:pt-14" : "pt-16 md:pt-8"
        }`}
      >
        <div className="mx-auto max-w-[80rem]">{children}</div>
      </main>

      <NavegacaoInferior papel={sessao.papel} />
    </div>
  );
}
