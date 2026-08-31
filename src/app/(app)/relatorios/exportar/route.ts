import { sessaoAtual } from "@/lib/autenticacao";
import { formatarCentavos, formatarPercentual } from "@/lib/dinheiro";
import {
  carregarRelatorio,
  PERIODOS,
  type Periodo,
} from "@/lib/relatorios";

function ehPeriodo(valor: string | null): valor is Periodo {
  return PERIODOS.some((p) => p.valor === valor);
}

/**
 * Escapa um campo para CSV: aspas duplicadas e o campo inteiro entre aspas.
 * Nome de produto com vírgula ("Coca-Cola 2L, retornável") quebraria a coluna.
 */
function campo(valor: string | number): string {
  const texto = String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

export async function GET(requisicao: Request) {
  // Route Handler não passa pelo layout: a permissão é conferida aqui, e a
  // resposta é um 403 em vez de um redirecionamento, porque quem chama é um
  // download e não uma navegação.
  const sessao = await sessaoAtual();
  if (!sessao) {
    return new Response("Não autenticado.", { status: 401 });
  }
  if (sessao.papel !== "DONO") {
    return new Response("Sem permissão para exportar relatórios.", {
      status: 403,
    });
  }

  const url = new URL(requisicao.url);
  const bruto = url.searchParams.get("periodo");
  const periodo: Periodo = ehPeriodo(bruto) ? bruto : "mes";

  const { intervalo, resumo, serie, mix, rentabilidade } =
    await carregarRelatorio(periodo);

  const dataBR = new Intl.DateTimeFormat("pt-BR");
  const ultimoDia = new Date(intervalo.ate.getTime() - 1);

  const linhas: string[] = [];

  linhas.push(campo("Capivaras Beer — relatório"));
  linhas.push(
    [campo("Período"), campo(`${dataBR.format(intervalo.de)} a ${dataBR.format(ultimoDia)}`)].join(";"),
  );
  linhas.push("");

  linhas.push([campo("Resumo"), campo("Valor")].join(";"));
  for (const [rotulo, valor] of [
    ["Faturamento", formatarCentavos(resumo.receitaCentavos)],
    ["Custo da mercadoria", formatarCentavos(resumo.custoCentavos)],
    ["Lucro bruto", formatarCentavos(resumo.lucroBrutoCentavos)],
    ["Margem", formatarPercentual(resumo.margemPercentual)],
    ["Descontos concedidos", formatarCentavos(resumo.descontoCentavos)],
    ["Vendas registradas", String(resumo.quantidade)],
    ["Unidades vendidas", String(resumo.unidades)],
    ["Ticket médio", formatarCentavos(resumo.ticketMedioCentavos)],
  ]) {
    linhas.push([campo(rotulo), campo(valor)].join(";"));
  }
  linhas.push("");

  linhas.push([campo("Dia"), campo("Faturamento")].join(";"));
  for (const ponto of serie) {
    linhas.push(
      [campo(dataBR.format(ponto.data)), campo(formatarCentavos(ponto.totalCentavos))].join(";"),
    );
  }
  linhas.push("");

  linhas.push([campo("Forma de pagamento"), campo("Vendas"), campo("Total")].join(";"));
  for (const l of mix) {
    linhas.push(
      [campo(l.forma), campo(l.quantidade), campo(formatarCentavos(l.totalCentavos))].join(";"),
    );
  }
  linhas.push("");

  linhas.push(
    [
      campo("Produto"),
      campo("Categoria"),
      campo("Unidades"),
      campo("Faturou"),
      campo("Custo"),
      campo("Lucro"),
      campo("Margem"),
    ].join(";"),
  );
  for (const l of rentabilidade) {
    linhas.push(
      [
        campo(l.nome),
        campo(l.categoria),
        campo(l.unidades),
        campo(formatarCentavos(l.receitaCentavos)),
        campo(formatarCentavos(l.custoCentavos)),
        campo(formatarCentavos(l.lucroCentavos)),
        campo(formatarPercentual(l.margemPercentual)),
      ].join(";"),
    );
  }

  // Ponto e vírgula como separador e BOM no início: é o que faz o Excel em
  // português abrir o arquivo com as colunas separadas e os acentos certos.
  const csv = "﻿" + linhas.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="capivaras-${periodo}.csv"`,
    },
  });
}
