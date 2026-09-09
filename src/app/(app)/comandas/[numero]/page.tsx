import Link from "next/link";
import { notFound } from "next/navigation";
import { LancarNaComanda } from "@/components/lancar-na-comanda";
import { Linha, Painel, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/autenticacao";
import { buscarComanda, somarComanda } from "@/lib/comandas";
import { formatarHora } from "@/lib/datas";
import { formatarCentavos } from "@/lib/dinheiro";
import { listarProdutosParaVenda } from "@/lib/pdv";

export const dynamic = "force-dynamic";

export default async function PaginaComanda({
  params,
}: PageProps<"/comandas/[numero]">) {
  await exigirSessao();

  const { numero } = await params;
  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const comanda = await buscarComanda(n);
  if (!comanda) notFound();

  const aberta = comanda.status === "ABERTA";
  const { totalCentavos, unidades } = somarComanda(comanda.itens);
  const produtos = aberta ? await listarProdutosParaVenda() : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-fraco">
            <Link href="/comandas" className="hover:text-ink">
              Comandas
            </Link>
          </p>
          <h1 className="font-display text-[2.125rem] leading-none font-normal">
            {comanda.identificacao}
          </h1>
          <p className="mt-2 text-sm text-ink-medio">
            nº {comanda.numero} · aberta às {formatarHora(comanda.abertaEm)} por{" "}
            {comanda.abertaPor.nome}
            {comanda.observacao && ` · ${comanda.observacao}`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-ink-fraco">Consumo até agora</p>
          <p
            data-numerico
            className="text-2xl leading-none font-semibold tracking-tight"
          >
            {formatarCentavos(totalCentavos)}
          </p>
        </div>
      </header>

      {aberta && (
        <Painel titulo="Lançar rodada">
          <LancarNaComanda numero={comanda.numero} produtos={produtos} />
        </Painel>
      )}

      <Painel
        titulo={`Consumo${unidades > 0 ? ` · ${unidades} ${unidades === 1 ? "item" : "itens"}` : ""}`}
      >
        {comanda.itens.length === 0 ? (
          <Vazio
            titulo="Nada lançado ainda"
            descricao="Bipe ou digite o primeiro pedido acima. Cada rodada entra direto na conta."
          />
        ) : (
          <>
            <ul className="-my-1 divide-y divide-borda">
              {comanda.itens.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.produto.nome}</p>
                    <p data-numerico className="text-xs text-ink-fraco">
                      {item.quantidade} {item.produto.unidade} ×{" "}
                      {formatarCentavos(item.precoUnitarioCentavos)} ·{" "}
                      {formatarHora(item.criadoEm)} · {item.lancadoPor.nome}
                    </p>
                  </div>
                  <span data-numerico className="text-sm font-medium">
                    {formatarCentavos(item.subtotalCentavos)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-borda pt-3">
              <Linha
                rotulo="Total da conta"
                valor={formatarCentavos(totalCentavos)}
                destaque
              />
            </div>
          </>
        )}
      </Painel>
    </div>
  );
}
