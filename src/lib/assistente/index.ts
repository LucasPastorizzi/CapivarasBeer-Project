import "server-only";

import { provedorClaude } from "@/lib/assistente/claude";
import { provedorOpenAI } from "@/lib/assistente/openai";
import type { Provedor } from "@/lib/assistente/provedor";

const PROVEDORES: Record<string, Provedor> = {
  openai: provedorOpenAI,
  claude: provedorClaude,
};

/**
 * Escolhe quem responde.
 *
 * ASSISTENTE_IA manda, quando definida. Sem ela, vale a chave que existir —
 * assim quem só tem uma das duas não precisa configurar nada além da chave.
 */
export function escolherProvedor(): Provedor {
  const escolhido = process.env.ASSISTENTE_IA?.trim().toLowerCase();
  if (escolhido && PROVEDORES[escolhido]) return PROVEDORES[escolhido];

  return (
    Object.values(PROVEDORES).find((p) => p.configurado()) ?? provedorOpenAI
  );
}

export type { EventoAssistente, MensagemNeutra, Provedor } from "@/lib/assistente/provedor";
