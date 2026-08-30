/**
 * Formas de pagamento aceitas no balcão.
 *
 * Fica fora dos módulos server-only porque a tela de venda, que roda no
 * navegador, precisa das mesmas opções e dos mesmos rótulos que o servidor
 * valida — duas listas separadas divergem no primeiro dia.
 */
export const FORMAS_PAGAMENTO = [
  "DINHEIRO",
  "PIX",
  "DEBITO",
  "CREDITO",
] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const ROTULO_PAGAMENTO: Record<FormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  DEBITO: "Débito",
  CREDITO: "Crédito",
};
