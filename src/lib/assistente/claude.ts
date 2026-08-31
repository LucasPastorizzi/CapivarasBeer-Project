import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { CONSULTAS } from "@/lib/assistente/consultas";
import type {
  EventoAssistente,
  MensagemNeutra,
  Provedor,
} from "@/lib/assistente/provedor";

/** As mesmas consultas, no formato de tool use da Anthropic. */
function ferramentas() {
  return CONSULTAS.map((consulta) =>
    betaZodTool({
      name: consulta.nome,
      description: consulta.descricao,
      inputSchema: consulta.parametros,
      run: async (entrada) => consulta.executar(entrada as never),
    }),
  );
}

async function* conversar({
  instrucoes,
  mensagens,
}: {
  instrucoes: string;
  mensagens: MensagemNeutra[];
}): AsyncGenerator<EventoAssistente> {
  const cliente = new Anthropic();

  const runner = cliente.beta.messages.toolRunner({
    model: process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-5",
    // Respostas de balcão são curtas; o teto contém engano, não a resposta.
    max_tokens: 8000,
    // O trabalho pesado é das consultas — o modelo escolhe qual chamar e
    // resume. Esforço médio dá a mesma resposta por menos.
    output_config: { effort: "medium" },
    system: instrucoes,
    tools: ferramentas(),
    messages: mensagens.map((m) => ({ role: m.papel, content: m.texto })),
    stream: true,
  });

  for await (const transmissao of runner) {
    for await (const evento of transmissao) {
      if (
        evento.type === "content_block_start" &&
        evento.content_block.type === "tool_use"
      ) {
        yield { tipo: "ferramenta", nome: evento.content_block.name };
      }

      if (
        evento.type === "content_block_delta" &&
        evento.delta.type === "text_delta"
      ) {
        yield { tipo: "texto", texto: evento.delta.text };
      }
    }

    const mensagem = await transmissao.finalMessage();

    // O runner não retoma sozinho um turno pausado: sem isto a resposta
    // terminaria no meio, sem erro nenhum.
    if (mensagem.stop_reason === "pause_turn") {
      runner.pushMessages({ role: "assistant", content: mensagem.content });
    }
  }
}

function descreverErro(erro: unknown): string {
  if (erro instanceof Anthropic.AuthenticationError) {
    return "A chave da Anthropic foi recusada. Confira a ANTHROPIC_API_KEY no servidor.";
  }
  if (erro instanceof Anthropic.RateLimitError) {
    return "Muitas perguntas em pouco tempo. Espere alguns segundos e tente de novo.";
  }
  if (erro instanceof Anthropic.APIError) {
    return `O serviço respondeu com erro ${erro.status}. Tente de novo em instantes.`;
  }
  return "Não consegui completar a resposta. Tente de novo.";
}

export const provedorClaude: Provedor = {
  nome: "Claude",
  configurado: () => Boolean(process.env.ANTHROPIC_API_KEY),
  comoConfigurar:
    "Falta a chave ANTHROPIC_API_KEY no arquivo .env do servidor. Pegue a sua em console.anthropic.com.",
  conversar,
  descreverErro,
};
