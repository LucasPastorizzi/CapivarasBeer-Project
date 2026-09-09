/**
 * Limites que o sistema impõe por papel.
 *
 * Fica fora dos módulos server-only porque a tela precisa avisar antes de a
 * pessoa tentar — e o servidor precisa recusar mesmo assim. Regra escrita em
 * dois lugares diverge; regra escrita aqui e lida pelos dois, não.
 */

import type { Papel } from "@/lib/sessao";

/**
 * Desconto máximo que cada papel concede, em pontos percentuais.
 *
 * O balconista tem limite porque desconto é a forma mais silenciosa de tirar
 * dinheiro do caixa: a venda fecha, o estoque baixa, e a diferença nunca
 * aparece como falta. Dez por cento cobre o arredondamento de fim de noite —
 * "deixa em vinte" — sem abrir espaço para o resto.
 */
export const DESCONTO_MAXIMO: Record<Papel, number> = {
  DONO: 100,
  BALCONISTA: 10,
};

export function tetoDeDesconto(papel: Papel, subtotalCentavos: number): number {
  return Math.floor((subtotalCentavos * DESCONTO_MAXIMO[papel]) / 100);
}

export function descontoPermitido(
  papel: Papel,
  subtotalCentavos: number,
  descontoCentavos: number,
): boolean {
  return descontoCentavos <= tetoDeDesconto(papel, subtotalCentavos);
}
