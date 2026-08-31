/**
 * Vocabulário dos movimentos de estoque.
 *
 * Fica fora do módulo server-only porque o formulário roda no navegador e
 * precisa dos mesmos tipos e rótulos que o servidor valida — duas listas
 * separadas divergem no primeiro dia.
 */

/**
 * Tipos que uma pessoa registra à mão.
 *
 * SAIDA_VENDA não entra aqui: ela nasce da venda, dentro da transação do PDV.
 * Deixar alguém lançar uma saída de venda manualmente criaria faturamento sem
 * venda — dinheiro que não existe.
 */
export const TIPOS_MANUAIS = ["ENTRADA", "AJUSTE", "PERDA"] as const;
export type TipoManual = (typeof TIPOS_MANUAIS)[number];

export const ROTULO_MOVIMENTO: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA_VENDA: "Venda",
  AJUSTE: "Ajuste",
  PERDA: "Perda",
};
