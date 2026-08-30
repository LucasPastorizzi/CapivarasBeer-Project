import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { lerSessao, type Papel, type Sessao } from "@/lib/sessao";

/**
 * Camada de acesso a dados de autenticação.
 *
 * Toda página e toda Server Action verifica permissão AQUI, e não no proxy.
 * O proxy faz apenas o desvio otimista: Server Actions são alcançáveis por
 * POST direto, sem passar pela navegação, então checagem só na borda é
 * checagem nenhuma.
 */

/** Memoizado por requisição: várias camadas podem pedir sem reler o cookie. */
export const sessaoAtual = cache(async (): Promise<Sessao | null> => {
  return lerSessao();
});

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  return sessao;
}

export async function exigirDono(): Promise<Sessao> {
  const sessao = await exigirSessao();

  // O balconista cai no PDV em vez de numa tela de erro: ele não fez nada
  // errado, só clicou onde não devia aparecer para ele.
  if (sessao.papel !== "DONO") redirect("/pdv");

  return sessao;
}

/** Rotas que o balconista enxerga. O dono enxerga tudo. */
const ROTAS_DO_BALCONISTA = ["/pdv", "/caixa"];

export function podeAcessar(papel: Papel, rota: string): boolean {
  if (papel === "DONO") return true;
  return ROTAS_DO_BALCONISTA.some((permitida) => rota.startsWith(permitida));
}

export function rotaInicial(papel: Papel): string {
  return papel === "DONO" ? "/" : "/pdv";
}
