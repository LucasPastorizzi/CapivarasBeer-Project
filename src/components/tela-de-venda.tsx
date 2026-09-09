"use client";

import { useEffect, useState, useTransition } from "react";
import {
  registrarVenda,
  type ResultadoVenda,
} from "@/app/(app)/pdv/acoes";
import { BuscaDeProduto } from "@/components/busca-de-produto";
import { Aviso, Botao, CampoDinheiro, Linha } from "@/components/ui";
import {
  FORMAS_PAGAMENTO,
  ROTULO_PAGAMENTO,
  type FormaPagamento,
} from "@/lib/pagamentos";
import { formatarCentavos, inputParaCentavos } from "@/lib/dinheiro";
import type { ProdutoParaVenda } from "@/lib/pdv";
import { DESCONTO_MAXIMO, tetoDeDesconto } from "@/lib/politicas";
import type { Papel } from "@/lib/sessao";

type ItemDoCarrinho = {
  produto: ProdutoParaVenda;
  quantidade: number;
};

export function TelaDeVenda({
  produtos,
  papel,
}: {
  produtos: ProdutoParaVenda[];
  papel: Papel;
}) {
  const [carrinho, setCarrinho] = useState<ItemDoCarrinho[]>([]);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [recebido, setRecebido] = useState("");
  const [desconto, setDesconto] = useState("");
  const [resultado, setResultado] = useState<ResultadoVenda | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const subtotalCentavos = carrinho.reduce(
    (soma, i) => soma + i.produto.precoVendaCentavos * i.quantidade,
    0,
  );
  const descontoDigitado = Math.min(
    inputParaCentavos(desconto) ?? 0,
    subtotalCentavos,
  );

  // O teto aparece na tela antes de a pessoa tentar fechar a venda. O
  // servidor recusa de todo jeito, mas descobrir o limite só no erro é
  // desrespeito com quem está de frente para o cliente.
  const tetoCentavos = tetoDeDesconto(papel, subtotalCentavos);
  const descontoAcimaDoTeto = descontoDigitado > tetoCentavos;
  const descontoCentavos = descontoAcimaDoTeto ? 0 : descontoDigitado;
  const totalCentavos = subtotalCentavos - descontoCentavos;
  const recebidoCentavos = inputParaCentavos(recebido) ?? 0;
  const trocoCentavos = recebidoCentavos - totalCentavos;

  const faltaDinheiro = forma === "DINHEIRO" && recebidoCentavos < totalCentavos;
  const podeFinalizar =
    carrinho.length > 0 && !faltaDinheiro && !descontoAcimaDoTeto && !enviando;

  function adicionar(produto: ProdutoParaVenda) {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id);

      // Bipar duas vezes o mesmo item soma quantidade em vez de criar
      // uma segunda linha idêntica.
      if (existente) {
        return atual.map((i) =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i,
        );
      }
      return [...atual, { produto, quantidade: 1 }];
    });

    setResultado(null);
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((atual) =>
      atual.flatMap((i) => {
        if (i.produto.id !== produtoId) return [i];
        const nova = i.quantidade + delta;
        return nova <= 0 ? [] : [{ ...i, quantidade: nova }];
      }),
    );
  }

  function limpar() {
    setCarrinho([]);
    setDesconto("");
    setRecebido("");
  }

  function finalizar() {
    if (!podeFinalizar) return;

    iniciarEnvio(async () => {
      const resposta = await registrarVenda({
        itens: carrinho.map((i) => ({
          produtoId: i.produto.id,
          quantidade: i.quantidade,
        })),
        formaPagamento: forma,
        descontoCentavos,
        recebidoCentavos,
      });

      setResultado(resposta);
      if ("ok" in resposta) limpar();
    });
  }

  // Ctrl+Enter fecha a venda de qualquer campo: a mão não sai do teclado.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Enter" && (evento.ctrlKey || evento.metaKey)) {
        evento.preventDefault();
        finalizar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <BuscaDeProduto
          produtos={produtos}
          aoEscolher={adicionar}
          aoFinalizar={finalizar}
        />

        <div className="overflow-hidden rounded-painel border border-borda bg-surface">
          <h2 className="border-b border-borda px-4 py-3 text-sm font-semibold">
            Carrinho
            {carrinho.length > 0 && (
              <span className="ml-2 text-xs font-normal text-ink-fraco">
                {carrinho.length} {carrinho.length === 1 ? "item" : "itens"}
              </span>
            )}
          </h2>

          {carrinho.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-medio">
              Bipe o primeiro produto para começar a venda.
            </p>
          ) : (
            <ul className="divide-y divide-borda">
              {carrinho.map((item) => (
                <li
                  key={item.produto.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.produto.nome}
                    </p>
                    <p data-numerico className="text-xs text-ink-fraco">
                      {formatarCentavos(item.produto.precoVendaCentavos)} cada
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <BotaoQuantidade
                      rotulo={`Diminuir ${item.produto.nome}`}
                      onClick={() => alterarQuantidade(item.produto.id, -1)}
                    >
                      −
                    </BotaoQuantidade>
                    <span
                      data-numerico
                      className="w-8 text-center text-sm font-medium"
                    >
                      {item.quantidade}
                    </span>
                    <BotaoQuantidade
                      rotulo={`Aumentar ${item.produto.nome}`}
                      desabilitado={item.quantidade >= item.produto.estoqueAtual}
                      onClick={() => alterarQuantidade(item.produto.id, 1)}
                    >
                      +
                    </BotaoQuantidade>
                  </div>

                  <span
                    data-numerico
                    className="w-24 text-right text-sm font-semibold"
                  >
                    {formatarCentavos(
                      item.produto.precoVendaCentavos * item.quantidade,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-painel border border-borda bg-surface p-4">
          <Linha
            rotulo="Subtotal"
            valor={formatarCentavos(subtotalCentavos)}
          />
          {descontoCentavos > 0 && (
            <Linha
              rotulo="Desconto"
              valor={`− ${formatarCentavos(descontoCentavos)}`}
            />
          )}
          <div className="mt-1 border-t border-borda pt-1">
            <Linha
              rotulo="Total"
              valor={formatarCentavos(totalCentavos)}
              destaque
            />
          </div>
        </div>

        <fieldset className="rounded-painel border border-borda bg-surface p-4">
          <legend className="px-1 text-sm font-semibold">Pagamento</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FORMAS_PAGAMENTO.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setForma(f)}
                aria-pressed={forma === f}
                className={
                  "rounded-acao border px-3 py-2 text-sm transition-colors duration-150 " +
                  (forma === f
                    ? "border-marca bg-marca-fundo font-medium text-marca"
                    : "border-borda text-ink-medio hover:border-borda-forte hover:text-ink")
                }
              >
                {ROTULO_PAGAMENTO[f]}
              </button>
            ))}
          </div>

          {forma === "DINHEIRO" && (
            <div className="mt-4 space-y-3">
              <CampoDinheiro
                id="recebido"
                rotulo="Recebido"
                value={recebido}
                onChange={(e) => setRecebido(e.target.value)}
              />
              {recebido !== "" && (
                <div className="rounded-campo border border-borda px-3 py-2">
                  <Linha
                    rotulo={trocoCentavos >= 0 ? "Troco" : "Falta"}
                    valor={formatarCentavos(Math.abs(trocoCentavos))}
                    destaque
                    tom={trocoCentavos >= 0 ? "ok" : "perigo"}
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-4 space-y-2">
            <CampoDinheiro
              id="desconto"
              rotulo="Desconto"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              erro={
                descontoAcimaDoTeto
                  ? `Seu limite é ${DESCONTO_MAXIMO[papel]}% — no máximo ${formatarCentavos(tetoCentavos)} nesta venda.`
                  : undefined
              }
              dica={
                DESCONTO_MAXIMO[papel] < 100 && !descontoAcimaDoTeto
                  ? `Até ${DESCONTO_MAXIMO[papel]}% do valor da venda.`
                  : undefined
              }
            />
          </div>
        </fieldset>

        {resultado && "erro" in resultado && (
          <Aviso tom="erro">{resultado.erro}</Aviso>
        )}
        {resultado && "ok" in resultado && (
          <Aviso tom="ok">
            Venda nº {resultado.numero} registrada —{" "}
            {formatarCentavos(resultado.totalCentavos)}
            {resultado.trocoCentavos > 0 &&
              `. Troco de ${formatarCentavos(resultado.trocoCentavos)}.`}
          </Aviso>
        )}

        <div className="flex gap-2">
          <Botao
            type="button"
            onClick={finalizar}
            disabled={!podeFinalizar}
            carregando={enviando}
            className="flex-1"
          >
            {enviando ? "Registrando…" : "Finalizar venda"}
          </Botao>
          {carrinho.length > 0 && (
            <Botao type="button" variante="secundario" onClick={limpar}>
              Limpar
            </Botao>
          )}
        </div>
      </aside>
    </div>
  );
}

function BotaoQuantidade({
  children,
  rotulo,
  onClick,
  desabilitado = false,
}: {
  children: React.ReactNode;
  rotulo: string;
  onClick: () => void;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      className="size-8 rounded-campo border border-borda text-ink-medio transition-colors duration-150 hover:border-borda-forte hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
