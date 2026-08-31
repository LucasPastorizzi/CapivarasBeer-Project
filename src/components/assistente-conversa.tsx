"use client";

import { useEffect, useRef, useState } from "react";
import { Aviso, Botao } from "@/components/ui";

type Mensagem = { papel: "user" | "assistant"; texto: string };

const ROTULO_FERRAMENTA: Record<string, string> = {
  resumo_de_vendas: "Somando as vendas",
  vendas_por_dia: "Abrindo o dia a dia",
  produtos_mais_rentaveis: "Calculando a rentabilidade",
  formas_de_pagamento: "Separando as formas de pagamento",
  situacao_do_estoque: "Conferindo o estoque",
  sugestao_de_compra: "Calculando a reposição",
  detalhes_do_produto: "Procurando o produto",
  situacao_do_caixa: "Olhando o caixa",
};

const SUGESTOES = [
  "Como foi o movimento este mês?",
  "Qual produto me dá mais lucro?",
  "O que preciso comprar essa semana?",
  "Qual dia da semana vende melhor?",
];

export function AssistenteConversa() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [consultando, setConsultando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, consultando]);

  async function perguntar(pergunta: string) {
    const texto = pergunta.trim();
    if (!texto || ocupado) return;

    const historico: Mensagem[] = [...mensagens, { papel: "user", texto }];
    setMensagens(historico);
    setEntrada("");
    setErro(null);
    setOcupado(true);

    try {
      const resposta = await fetch("/assistente/conversar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: historico }),
      });

      if (!resposta.ok || !resposta.body) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Não consegui falar com o assistente.");
        return;
      }

      // A resposta chega em linhas JSON; o texto é acrescentado à última
      // mensagem conforme chega, para a leitura começar antes do fim.
      setMensagens([...historico, { papel: "assistant", texto: "" }]);

      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();
      let restante = "";

      while (true) {
        const { done, value } = await leitor.read();
        if (done) break;

        restante += decodificador.decode(value, { stream: true });
        const linhas = restante.split("\n");
        restante = linhas.pop() ?? "";

        for (const linha of linhas) {
          if (!linha.trim()) continue;
          const evento = JSON.parse(linha);

          if (evento.tipo === "ferramenta") {
            setConsultando(ROTULO_FERRAMENTA[evento.nome] ?? "Consultando");
          } else if (evento.tipo === "texto") {
            setConsultando(null);
            setMensagens((atual) => {
              const copia = [...atual];
              const ultima = copia[copia.length - 1];
              copia[copia.length - 1] = {
                ...ultima,
                texto: ultima.texto + evento.texto,
              };
              return copia;
            });
          } else if (evento.tipo === "erro") {
            setErro(evento.mensagem);
          }
        }
      }
    } catch {
      setErro("A conexão caiu no meio da resposta. Tente de novo.");
    } finally {
      setOcupado(false);
      setConsultando(null);
      campo.current?.focus();
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <div className="flex-1 space-y-4">
        {mensagens.length === 0 ? (
          <div className="rounded-painel border border-borda bg-surface p-6">
            <p className="text-sm text-ink-medio">
              Pergunte sobre a loja em português. O assistente consulta os
              dados reais antes de responder — ele não chuta número.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => perguntar(s)}
                    className="rounded-acao border border-borda px-4 py-1.5 text-sm text-ink-medio transition-colors duration-150 hover:border-borda-forte hover:text-ink"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          mensagens.map((m, i) => (
            <div
              key={i}
              className={m.papel === "user" ? "flex justify-end" : ""}
            >
              <div
                className={
                  m.papel === "user"
                    ? "max-w-[85%] rounded-painel bg-surface-alto px-4 py-2.5 text-sm"
                    : "max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap"
                }
              >
                {m.texto ||
                  (m.papel === "assistant" && !consultando ? (
                    <span className="text-ink-fraco">Pensando…</span>
                  ) : null)}
              </div>
            </div>
          ))
        )}

        {consultando && (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-ink-fraco"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-marca" aria-hidden />
            {consultando}…
          </p>
        )}

        {erro && <Aviso tom="erro">{erro}</Aviso>}

        <div ref={fim} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          perguntar(entrada);
        }}
        className="sticky bottom-20 flex items-end gap-2 rounded-painel border border-borda bg-surface p-2 md:bottom-4"
      >
        <label htmlFor="pergunta" className="sr-only">
          Pergunta
        </label>
        <textarea
          ref={campo}
          id="pergunta"
          rows={1}
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia, Shift+Enter quebra linha — o que se espera de um
            // campo de conversa.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              perguntar(entrada);
            }
          }}
          placeholder="Pergunte sobre vendas, estoque, caixa ou margem…"
          className="max-h-40 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-base text-ink outline-none placeholder:text-ink-medio"
        />
        <Botao type="submit" disabled={!entrada.trim()} carregando={ocupado}>
          Perguntar
        </Botao>
      </form>
    </div>
  );
}
