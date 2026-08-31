import { Esqueleto } from "@/components/ui";

/**
 * Enquanto a página carrega, o esqueleto ocupa a forma do que vem — assim o
 * conteúdo não empurra a tela quando chega. Girador no meio do nada faz o
 * operador esperar sem saber o que esperar.
 */
export default function Carregando() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Esqueleto className="h-8 w-40" />
        <Esqueleto className="h-4 w-56" />
      </div>
      <Esqueleto className="h-32 w-full rounded-painel" />
      <Esqueleto className="h-56 w-full rounded-painel" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Esqueleto className="h-48 w-full rounded-painel" />
        <Esqueleto className="h-48 w-full rounded-painel" />
      </div>
      <span className="sr-only" role="status">
        Carregando…
      </span>
    </div>
  );
}
