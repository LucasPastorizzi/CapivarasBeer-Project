import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { sessaoAtual } from "@/lib/autenticacao";
import { FERRAMENTAS } from "@/lib/assistente/ferramentas";
import { montarInstrucoes } from "@/lib/assistente/instrucoes";

/** O laço de ferramentas pode levar dezenas de segundos. */
export const maxDuration = 120;

const esquema = z.object({
  mensagens: z
    .array(
      z.object({
        papel: z.enum(["user", "assistant"]),
        texto: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    // A conversa inteira é reenviada a cada turno. Um teto evita que uma aba
    // esquecida aberta a noite toda vire uma conta inesperada.
    .max(40),
});

type Evento =
  | { tipo: "ferramenta"; nome: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "fim" };

export async function POST(requisicao: Request) {
  const sessao = await sessaoAtual();
  if (!sessao) return new Response("Não autenticado.", { status: 401 });

  // O assistente lê faturamento, custo e margem: é informação do dono.
  if (sessao.papel !== "DONO") {
    return new Response("Sem permissão.", { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        erro: "O assistente ainda não foi configurado. Falta a chave ANTHROPIC_API_KEY no arquivo .env do servidor.",
      },
      { status: 503 },
    );
  }

  const corpo = await requisicao.json().catch(() => null);
  const analise = esquema.safeParse(corpo);
  if (!analise.success) {
    return Response.json({ erro: "Conversa inválida." }, { status: 400 });
  }

  const cliente = new Anthropic();

  const runner = cliente.beta.messages.toolRunner({
    model: "claude-opus-5",
    // Respostas de balcão são curtas; o teto existe para conter engano, não
    // para limitar a resposta.
    max_tokens: 8000,
    // O trabalho pesado é das ferramentas — o modelo escolhe qual chamar e
    // resume. Esforço médio dá a mesma resposta por menos.
    output_config: { effort: "medium" },
    system: montarInstrucoes(sessao.nome),
    tools: FERRAMENTAS,
    messages: analise.data.mensagens.map((m) => ({
      role: m.papel,
      content: m.texto,
    })),
    stream: true,
  });

  const codificador = new TextEncoder();

  const fluxo = new ReadableStream({
    async start(controlador) {
      const enviar = (evento: Evento) =>
        controlador.enqueue(codificador.encode(JSON.stringify(evento) + "\n"));

      try {
        for await (const transmissao of runner) {
          for await (const evento of transmissao) {
            if (
              evento.type === "content_block_start" &&
              evento.content_block.type === "tool_use"
            ) {
              // Mostrar qual consulta está rodando evita a tela parada que
              // faz o usuário achar que travou.
              enviar({ tipo: "ferramenta", nome: evento.content_block.name });
            }

            if (
              evento.type === "content_block_delta" &&
              evento.delta.type === "text_delta"
            ) {
              enviar({ tipo: "texto", texto: evento.delta.text });
            }
          }

          const mensagem = await transmissao.finalMessage();

          // O runner não retoma sozinho um turno pausado: sem isto a resposta
          // termina no meio, sem erro nenhum.
          if (mensagem.stop_reason === "pause_turn") {
            runner.pushMessages({
              role: "assistant",
              content: mensagem.content,
            });
          }
        }

        enviar({ tipo: "fim" });
      } catch (erro) {
        console.error("Falha no assistente", erro);

        const mensagem =
          erro instanceof Anthropic.AuthenticationError
            ? "A chave da API foi recusada. Confira a ANTHROPIC_API_KEY no servidor."
            : erro instanceof Anthropic.RateLimitError
              ? "Muitas perguntas em pouco tempo. Espere alguns segundos e tente de novo."
              : erro instanceof Anthropic.APIError
                ? `O serviço respondeu com erro ${erro.status}. Tente de novo em instantes.`
                : "Não consegui completar a resposta. Tente de novo.";

        enviar({ tipo: "erro", mensagem });
      } finally {
        controlador.close();
      }
    },
  });

  return new Response(fluxo, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
