import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import { CONSULTAS } from "@/lib/assistente/consultas";
import type {
  EventoAssistente,
  MensagemNeutra,
  Provedor,
} from "@/lib/assistente/provedor";

/**
 * O modelo é configurável porque o catálogo da OpenAI muda com frequência e a
 * conta de cada um libera modelos diferentes. Se o escolhido não existir, o
 * erro abaixo lista os que a conta realmente tem.
 */
const MODELO_PADRAO = "gpt-4o";

function modelo(): string {
  return process.env.OPENAI_MODEL?.trim() || MODELO_PADRAO;
}

/** As mesmas consultas, no formato de function calling da OpenAI. */
function ferramentas(): OpenAI.Chat.Completions.ChatCompletionFunctionTool[] {
  return CONSULTAS.map((consulta) => {
    // O Zod carimba "$schema" no esquema gerado. É metadado do documento, não
    // descrição de parâmetro, e validadores mais estritos recusam a chave.
    const esquema = z.toJSONSchema(consulta.parametros) as Record<
      string,
      unknown
    >;
    delete esquema.$schema;

    return {
      type: "function",
      function: {
        name: consulta.nome,
        description: consulta.descricao,
        parameters: esquema,
      },
    };
  });
}

async function* conversar({
  instrucoes,
  mensagens,
}: {
  instrucoes: string;
  mensagens: MensagemNeutra[];
}): AsyncGenerator<EventoAssistente> {
  const cliente = new OpenAI();

  const historico: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: instrucoes },
    ...mensagens.map((m) => ({ role: m.papel, content: m.texto }) as const),
  ];

  // Teto de voltas: o modelo consulta, lê o resultado e às vezes consulta de
  // novo. Sem limite, uma escolha ruim de ferramenta viraria laço infinito
  // gastando crédito.
  for (let volta = 0; volta < 8; volta += 1) {
    const transmissao = await cliente.chat.completions.create({
      model: modelo(),
      messages: historico,
      tools: ferramentas(),
      stream: true,
    });

    let texto = "";
    // Os pedidos de ferramenta chegam fatiados e identificados por índice:
    // o nome vem num pedaço, os argumentos em vários outros.
    const emMontagem = new Map<
      number,
      { id: string; nome: string; argumentos: string }
    >();

    for await (const pedaco of transmissao) {
      const delta = pedaco.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        texto += delta.content;
        yield { tipo: "texto", texto: delta.content };
      }

      for (const chamada of delta.tool_calls ?? []) {
        const atual = emMontagem.get(chamada.index) ?? {
          id: "",
          nome: "",
          argumentos: "",
        };

        if (chamada.id) atual.id = chamada.id;
        if (chamada.function?.name) {
          atual.nome = chamada.function.name;
          yield { tipo: "ferramenta", nome: atual.nome };
        }
        if (chamada.function?.arguments) {
          atual.argumentos += chamada.function.arguments;
        }

        emMontagem.set(chamada.index, atual);
      }
    }

    const chamadas = [...emMontagem.values()].filter((c) => c.nome);

    if (chamadas.length === 0) return;

    historico.push({
      role: "assistant",
      content: texto || null,
      tool_calls: chamadas.map((c) => ({
        id: c.id,
        type: "function" as const,
        function: { name: c.nome, arguments: c.argumentos || "{}" },
      })),
    });

    for (const chamada of chamadas) {
      historico.push({
        role: "tool",
        tool_call_id: chamada.id,
        content: await executar(chamada.nome, chamada.argumentos),
      });
    }
  }

  yield {
    tipo: "texto",
    texto:
      "\n\nParei aqui: precisei de consultas demais para responder isso. Tente perguntar de forma mais específica.",
  };
}

/**
 * Executa a consulta pedida.
 *
 * Erro de ferramenta volta como resultado, não como exceção: o modelo precisa
 * saber que aquela consulta falhou para tentar outra ou avisar a pessoa, em
 * vez de a conversa inteira morrer.
 */
async function executar(nome: string, argumentosBrutos: string): Promise<string> {
  const consulta = CONSULTAS.find((c) => c.nome === nome);
  if (!consulta) {
    return JSON.stringify({ erro: `A consulta "${nome}" não existe.` });
  }

  try {
    const argumentos = JSON.parse(argumentosBrutos || "{}");
    const validado = consulta.parametros.parse(argumentos);
    return await consulta.executar(validado as never);
  } catch (erro) {
    return JSON.stringify({
      erro:
        erro instanceof z.ZodError
          ? `Parâmetros inválidos para ${nome}: ${erro.issues[0]?.message}`
          : `A consulta ${nome} falhou.`,
    });
  }
}

function descreverErro(erro: unknown): string {
  if (erro instanceof OpenAI.AuthenticationError) {
    return "A chave da OpenAI foi recusada. Confira a OPENAI_API_KEY no servidor.";
  }
  if (erro instanceof OpenAI.RateLimitError) {
    return "A OpenAI limitou as requisições agora. Espere alguns segundos e tente de novo.";
  }
  if (erro instanceof OpenAI.NotFoundError) {
    // O engano mais provável é um modelo que a conta não tem.
    return `O modelo "${modelo()}" não existe ou não está liberado para esta conta. Defina OPENAI_MODEL no .env com um modelo disponível.`;
  }
  if (erro instanceof OpenAI.APIError) {
    return `A OpenAI respondeu com erro ${erro.status}. Tente de novo em instantes.`;
  }
  return "Não consegui completar a resposta. Tente de novo.";
}

export const provedorOpenAI: Provedor = {
  nome: "OpenAI",
  configurado: () => Boolean(process.env.OPENAI_API_KEY),
  comoConfigurar:
    "Falta a chave OPENAI_API_KEY no arquivo .env do servidor. Pegue a sua em platform.openai.com/api-keys.",
  conversar,
  descreverErro,
};
