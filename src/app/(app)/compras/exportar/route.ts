import { sessaoAtual } from "@/lib/autenticacao";
import { montarListaDeCompra } from "@/lib/compras";
import { formatarCentavos } from "@/lib/dinheiro";

/** Escapa um campo para CSV: nome com vírgula quebraria a coluna. */
function campo(valor: string | number): string {
  return `"${String(valor).replace(/"/g, '""')}"`;
}

export async function GET(requisicao: Request) {
  const sessao = await sessaoAtual();
  if (!sessao) return new Response("Não autenticado.", { status: 401 });
  if (sessao.papel !== "DONO") {
    return new Response("Sem permissão.", { status: 403 });
  }

  const url = new URL(requisicao.url);
  const bruto = Number(url.searchParams.get("dias"));
  const horizonte = [7, 14, 30].includes(bruto) ? bruto : 14;

  const lista = await montarListaDeCompra(horizonte);
  const dataBR = new Intl.DateTimeFormat("pt-BR");

  const linhas: string[] = [];
  linhas.push(campo(`Capivaras Beer — lista de compra (${horizonte} dias)`));
  linhas.push([campo("Gerada em"), campo(dataBR.format(new Date()))].join(";"));
  linhas.push([campo("Custo estimado"), campo(formatarCentavos(lista.custoTotalCentavos))].join(";"));
  linhas.push("");

  linhas.push(
    [
      campo("Produto"),
      campo("Categoria"),
      campo("Em estoque"),
      campo("Vende por semana"),
      campo("Acaba em"),
      campo("Pedir"),
      campo("Embalagem"),
      campo("Custo estimado"),
    ].join(";"),
  );

  for (const l of lista.paraComprar) {
    linhas.push(
      [
        campo(l.nome),
        campo(l.categoria),
        campo(l.estoqueAtual),
        campo(l.porSemana.toFixed(1).replace(".", ",")),
        campo(l.acabaEm ? dataBR.format(l.acabaEm) : "passa do período"),
        campo(l.sugestao),
        campo(l.multiploCompra > 1 ? `caixa de ${l.multiploCompra}` : "unidade"),
        campo(formatarCentavos(l.custoDaSugestaoCentavos)),
      ].join(";"),
    );
  }

  // Ponto e vírgula e BOM: é o que faz o Excel em português abrir com as
  // colunas separadas e os acentos certos.
  const csv = "﻿" + linhas.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compras-${horizonte}dias.csv"`,
    },
  });
}
