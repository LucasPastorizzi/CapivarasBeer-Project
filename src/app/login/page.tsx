import { FormularioLogin } from "@/components/formulario-login";

export const metadata = { title: "Entrar" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { proximo } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-painel bg-ouro text-lg font-semibold text-bg"
          >
            C
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Capivaras Beer
            </h1>
            <p className="text-sm text-ink-medio">Gestão da loja</p>
          </div>
        </div>

        <FormularioLogin proximo={typeof proximo === "string" ? proximo : undefined} />
      </div>
    </main>
  );
}
