import Link from "next/link";
import { FormularioComanda } from "@/components/formulario-comanda";
import { Painel, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/autenticacao";
import { buscarCaixaAberto } from "@/lib/caixa";

export const metadata = { title: "Abrir comanda" };
export const dynamic = "force-dynamic";

export default async function PaginaNovaComanda() {
  await exigirSessao();
  const caixa = await buscarCaixaAberto();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-ink-fraco">
          <Link href="/comandas" className="hover:text-ink">
            Comandas
          </Link>
        </p>
        <h1 className="font-display text-[2.125rem] leading-none font-normal">
          Abrir comanda
        </h1>
      </header>

      <Painel>
        {caixa ? (
          <FormularioComanda />
        ) : (
          <Vazio
            titulo="Caixa fechado"
            descricao="Abra o caixa antes: a comanda pertence a um turno, e é nele que o consumo vira dinheiro no fim da noite."
            acao={
              <Link
                href="/caixa"
                className="rounded-acao bg-marca px-5 py-2 text-sm font-medium text-sidebar transition-colors duration-150 hover:bg-marca-forte"
              >
                Abrir o caixa
              </Link>
            }
          />
        )}
      </Painel>
    </div>
  );
}
