import Link from "next/link";
import { Painel, Vazio } from "@/components/ui";

/**
 * Página não encontrada dentro do sistema.
 *
 * A tela padrão do Next sai fora do layout, em inglês e sem saída — parece
 * que o sistema quebrou. Aqui a pessoa continua dentro do app, com a barra
 * lateral do lado e um caminho de volta.
 */
export default function NaoEncontrado() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[2.125rem] leading-none font-normal">
          Não encontrei
        </h1>
      </header>

      <Painel>
        <Vazio
          titulo="Esta página não existe"
          descricao="O endereço pode estar errado, ou o registro que você procura foi removido do sistema."
          acao={
            <Link
              href="/"
              className="rounded-acao bg-marca px-5 py-2 text-sm font-medium text-sidebar transition-colors duration-150 hover:bg-marca-forte"
            >
              Voltar ao painel
            </Link>
          }
        />
      </Painel>
    </div>
  );
}
