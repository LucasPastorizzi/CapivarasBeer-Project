import "server-only";

/**
 * Contrato entre a rota e a IA.
 *
 * A rota não sabe qual serviço está atrás — ela pede uma conversa e recebe um
 * fluxo de eventos. Trocar de provedor é escrever um arquivo novo que atenda
 * a este contrato; a interface, as instruções e as sete consultas ao banco
 * continuam iguais.
 */

export type MensagemNeutra = { papel: "user" | "assistant"; texto: string };

export type EventoAssistente =
  | { tipo: "ferramenta"; nome: string }
  | { tipo: "texto"; texto: string };

export type Provedor = {
  /** Nome exibido em log e mensagens de erro. */
  nome: string;
  /** Se a credencial necessária está presente. */
  configurado: () => boolean;
  /** O que dizer quando falta configurar. */
  comoConfigurar: string;
  conversar: (argumentos: {
    instrucoes: string;
    mensagens: MensagemNeutra[];
  }) => AsyncGenerator<EventoAssistente>;
  /** Traduz um erro do SDK para algo que o dono da loja entenda. */
  descreverErro: (erro: unknown) => string;
};
