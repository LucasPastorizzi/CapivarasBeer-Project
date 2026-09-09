import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelarVenda } from "@/components/cancelar-venda";
import { Aviso, Linha, Painel } from "@/components/ui";
import { exigirSessao } from "@/lib/autenticacao";
import { formatarCentavos } from "@/lib/dinheiro";
import { ROTULO_PAGAMENTO, type FormaPagamento } from "@/lib/pagamentos";
import { buscarVenda } from "@/lib/vendas";

export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PaginaVenda({
  params,
}: PageProps<"/vendas/[numero]">) {
  const sessao = await exigirSessao();
  const { numero } = await params;

  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const venda = await buscarVenda(n, sessao.papel);
  if (!venda) notFound();

  const cancelada = venda.status === "CANCELADA";
  const lucroCentavos = venda.itens.reduce(
    (soma, i) => soma + (i.precoUnitarioCentavos - i.custoUnitarioCentavos) * i.quantidade,
    0,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-ink-fraco">
          <Link href="/vendas" className="hover:text-ink">
            Vendas
          </Link>
        </p>
        <h1 className="font-display text-[2.125rem] leading-none font-normal">
          Venda nº {venda.numero}
        </h1>
        <p className="mt-2 text-sm text-ink-medio first-letter:uppercase">
          {dataHora.format(venda.criadoEm)} · {venda.usuario.nome}
        </p>
      </header>

      {cancelada && (
        <Aviso tom="erro">
          Venda cancelada
          {venda.canceladaEm && ` em ${dataHora.format(venda.canceladaEm)}`}
          {venda.canceladaPor && ` por ${venda.canceladaPor.nome}`}
          {venda.motivoCancelamento && `: ${venda.motivoCancelamento}`}. O
          estoque dos itens foi devolvido e ela não entra em nenhum relatório.
        </Aviso>
      )}

      <Painel titulo="Itens">
        <ul className="-my-1 divide-y divide-borda">
          {venda.itens.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.produto.nome}</p>
                <p data-numerico className="text-xs text-ink-fraco">
                  {item.quantidade} {item.produto.unidade} ×{" "}
                  {formatarCentavos(item.precoUnitarioCentavos)}
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
            rotulo="Subtotal"
            valor={formatarCentavos(venda.subtotalCentavos)}
          />
          {venda.descontoCentavos > 0 && (
            <Linha
              rotulo="Desconto"
              valor={`− ${formatarCentavos(venda.descontoCentavos)}`}
            />
          )}
          <Linha
            rotulo="Total"
            valor={formatarCentavos(venda.totalCentavos)}
            destaque
          />
        </div>
      </Painel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Pagamento e turno">
          <Linha
            rotulo="Forma de pagamento"
            valor={
              ROTULO_PAGAMENTO[venda.formaPagamento as FormaPagamento] ??
              venda.formaPagamento
            }
          />
          <Linha
            rotulo="Turno aberto por"
            valor={venda.caixa.usuarioAbertura.nome}
          />
          <Linha
            rotulo="Situação do caixa"
            valor={venda.caixa.status === "ABERTO" ? "Aberto" : "Fechado"}
          />
        </Painel>

        {!cancelada && (
          <Painel titulo="Corrigir">
            <p className="mb-4 max-w-prose text-sm text-ink-medio">
              Errou o item, o valor ou o cliente desistiu? Cancelar devolve o
              estoque e tira o valor do turno — sem apagar a venda, porque o
              número do cupom já foi para a mão do cliente.
            </p>
            <CancelarVenda
              numero={venda.numero}
              totalCentavos={venda.totalCentavos}
              quantidadeDeItens={venda.itens.length}
            />
          </Painel>
        )}

        {/* Margem é informação do dono: o balconista não precisa saber quanto
            a loja ganhou em cada venda que ele passou. */}
        {sessao.papel === "DONO" && !cancelada && (
          <Painel titulo="Resultado">
            <Linha
              rotulo="Custo da mercadoria"
              valor={formatarCentavos(venda.totalCentavos - lucroCentavos)}
            />
            <Linha
              rotulo="Lucro bruto"
              valor={formatarCentavos(lucroCentavos)}
              destaque
              tom={lucroCentavos >= 0 ? "ok" : "perigo"}
            />
            <p className="mt-2 text-xs text-ink-fraco">
              Pelo custo gravado no momento da venda.
            </p>
          </Painel>
        )}
      </div>
    </div>
  );
}
