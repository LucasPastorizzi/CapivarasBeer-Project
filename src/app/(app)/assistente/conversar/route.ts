import { z } from "zod";
import { escolherProvedor } from "@/lib/assistente";
import { montarInstrucoes } from "@/lib/assistente/instrucoes";
import { sessaoAtual } from "@/lib/autenticacao";

/** O laço de consultas pode levar dezenas de segundos. */
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

  const provedor = escolherProvedor();

  if (!provedor.configurado()) {
    return Response.json(
      { erro: `O assistente ainda não foi configurado. ${provedor.comoConfigurar}` },
      { status: 503 },
    );
  }

  const corpo = await requisicao.json().catch(() => null);
  const analise = esquema.safeParse(corpo);
  if (!analise.success) {
    return Response.json({ erro: "Conversa inválida." }, { status: 400 });
  }

  const codificador = new TextEncoder();

  const fluxo = new ReadableStream({
    async start(controlador) {
      const enviar = (evento: Evento) =>
        controlador.enqueue(codificador.encode(JSON.stringify(evento) + "\n"));

      try {
        const conversa = provedor.conversar({
          instrucoes: montarInstrucoes(sessao.nome),
          mensagens: analise.data.mensagens,
        });

        for await (const evento of conversa) {
          enviar(evento);
        }

        enviar({ tipo: "fim" });
      } catch (erro) {
        console.error(`Falha no assistente (${provedor.nome})`, erro);
        enviar({ tipo: "erro", mensagem: provedor.descreverErro(erro) });
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
