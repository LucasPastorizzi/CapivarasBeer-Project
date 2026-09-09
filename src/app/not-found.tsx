import Link from "next/link";
import { SeloCapivara } from "@/components/marca";

/**
 * Página não encontrada fora do sistema — quem chega sem sessão num endereço
 * que não existe. Sem barra lateral, porque não há sessão para montá-la.
 */
export default function NaoEncontrado() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10 text-center">
      <div>
        <SeloCapivara className="mx-auto size-10" />
        <h1 className="mt-4 font-display text-3xl leading-none">
          Não encontrei esta página
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-medio">
          O endereço pode estar errado. Entre no sistema para continuar.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-acao bg-marca px-5 py-2 text-sm font-medium text-sidebar transition-colors duration-150 hover:bg-marca-forte"
        >
          Ir para a entrada
        </Link>
      </div>
    </main>
  );
}
