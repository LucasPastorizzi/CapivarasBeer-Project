import Link from "next/link";
import { TelaDeVenda } from "@/components/tela-de-venda";
import { Painel } from "@/components/ui";
import { exigirSessao } from "@/lib/autenticacao";
import { buscarCaixaAberto } from "@/lib/caixa";
import { formatarHora } from "@/lib/datas";
import { listarProdutosParaVenda } from "@/lib/pdv";

export const metadata = { title: "Vender" };
export const dynamic = "force-dynamic";

export default async function PaginaPdv() {
  await exigirSessao();

  const caixa = await buscarCaixaAberto();

  // Sem caixa aberto não há a qual turno atribuir a venda. A tela vazia
  // aponta o caminho em vez de só informar o bloqueio.
  if (!caixa) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">Vender</h1>
        </header>
        <Painel titulo="Caixa fechado">
          <p className="max-w-prose text-sm text-ink-medio">
            Não dá para registrar venda sem caixa aberto — é ele que separa o
            dinheiro deste turno do turno anterior e permite conferir a gaveta
            no fim da noite.
          </p>
          <Link
            href="/caixa"
            className="mt-4 inline-flex rounded-campo bg-ouro px-4 py-2 text-sm font-medium text-bg transition-colors duration-150 hover:bg-ouro-forte"
          >
            Abrir o caixa
          </Link>
        </Painel>
      </div>
    );
  }

  const produtos = await listarProdutosParaVenda();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Vender</h1>
        <p className="text-sm text-ink-medio">
          Caixa aberto às {formatarHora(caixa.abertoEm)}
        </p>
      </header>

      <TelaDeVenda produtos={produtos} />
    </div>
  );
}
