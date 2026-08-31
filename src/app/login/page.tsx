import { FormularioLogin } from "@/components/formulario-login";
import { AssinaturaFlypi } from "@/components/flypi";
import { SeloCapivara } from "@/components/marca";

export const metadata = { title: "Entrar" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { proximo } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <SeloCapivara className="size-12" />
          <h1 className="mt-4 font-display text-3xl leading-none">
            Capivaras Beer
          </h1>
          <p className="mt-1 text-sm text-ink-medio">
            Gestão da loja · Lindolfo Collor
          </p>
        </div>

        <div className="rounded-painel border border-borda bg-surface p-6">
          <FormularioLogin
            proximo={typeof proximo === "string" ? proximo : undefined}
          />
        </div>

        <p className="mt-6 text-center text-xs text-ink-fraco">
          Terça a quinta 17h–23h · Sexta 17h–00h · Sábado 15h–00h
        </p>

        <div className="mt-6 flex justify-center border-t border-borda pt-6">
          <AssinaturaFlypi />
        </div>
      </div>
    </main>
  );
}
