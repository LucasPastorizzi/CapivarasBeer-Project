// Todo valor monetário circula pelo sistema em centavos (inteiro). Estas
// funções são a única fronteira onde ele vira texto para o usuário e volta.

const formatador = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** 1250 -> "R$ 12,50" */
export function formatarCentavos(centavos: number): string {
  return formatador.format(centavos / 100);
}

/** 1250 -> "12,50" (sem o símbolo, para usar dentro de inputs) */
export function centavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

/**
 * Converte o que o usuário digitou em centavos.
 * Aceita "12,50", "12.50", "R$ 12,50" e "1.234,56".
 * Retorna null quando o texto não representa um valor válido.
 */
export function inputParaCentavos(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, "").trim();
  if (limpo === "") return null;

  // Se tem vírgula, ela é o separador decimal e os pontos são de milhar.
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;

  const valor = Number(normalizado);
  if (!Number.isFinite(valor)) return null;

  return Math.round(valor * 100);
}

/** Margem de lucro em pontos percentuais sobre o preço de venda. */
export function margemPercentual(
  custoCentavos: number,
  vendaCentavos: number,
): number {
  if (vendaCentavos <= 0) return 0;
  return ((vendaCentavos - custoCentavos) / vendaCentavos) * 100;
}

/**
 * Percentual no formato brasileiro: 40,9% e não 40.9%.
 *
 * `toFixed` sempre devolve ponto decimal. Numa tela em português isso lê como
 * erro de digitação — ou pior, como milhar.
 */
export function formatarPercentual(valor: number, casas = 1): string {
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}
