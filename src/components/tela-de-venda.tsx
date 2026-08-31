"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  registrarVenda,
  type ResultadoVenda,
} from "@/app/(app)/pdv/acoes";
import { Aviso, Botao, CampoDinheiro, Linha, Tecla } from "@/components/ui";
import {
  FORMAS_PAGAMENTO,
  ROTULO_PAGAMENTO,
  type FormaPagamento,
} from "@/lib/pagamentos";
import { formatarCentavos, inputParaCentavos } from "@/lib/dinheiro";
import type { ProdutoParaVenda } from "@/lib/pdv";
import { normalizar } from "@/lib/texto";

type ItemDoCarrinho = {
  produto: ProdutoParaVenda;
  quantidade: number;
};

const LIMITE_RESULTADOS = 8;

export function TelaDeVenda({ produtos }: { produtos: ProdutoParaVenda[] }) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const [carrinho, setCarrinho] = useState<ItemDoCarrinho[]>([]);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [recebido, setRecebido] = useState("");
  const [desconto, setDesconto] = useState("");
  const [resultado, setResultado] = useState<ResultadoVenda | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const campoBusca = useRef<HTMLInputElement>(null);

  // O índice de busca é montado uma vez, não a cada tecla.
  const indice = useMemo(
    () =>
      produtos.map((p) => ({
        produto: p,
        alvo: normalizar(`${p.nome} ${p.categoria}`),
      })),
    [produtos],
  );

  const termo = normalizar(busca);

  const resultados = useMemo(() => {
    if (!termo) return [];
    return indice
      .filter((i) => i.alvo.includes(termo))
      .slice(0, LIMITE_RESULTADOS)
      .map((i) => i.produto);
  }, [indice, termo]);

  /**
   * O leitor de código de barras digita o código inteiro e manda Enter. Quando
   * o texto casa exatamente com um código, o produto entra sem passar pela
   * lista — é a diferença entre bipar e escolher.
   */
  const porCodigoExato = useMemo(
    () => produtos.find((p) => p.codigoBarras && p.codigoBarras === busca.trim()),
    [produtos, busca],
  );

  const subtotalCentavos = carrinho.reduce(
    (soma, i) => soma + i.produto.precoVendaCentavos * i.quantidade,
    0,
  );
  const descontoCentavos = Math.min(
    inputParaCentavos(desconto) ?? 0,
    subtotalCentavos,
  );
  const totalCentavos = subtotalCentavos - descontoCentavos;
  const recebidoCentavos = inputParaCentavos(recebido) ?? 0;
  const trocoCentavos = recebidoCentavos - totalCentavos;

  const faltaDinheiro = forma === "DINHEIRO" && recebidoCentavos < totalCentavos;
  const podeFinalizar = carrinho.length > 0 && !faltaDinheiro && !enviando;

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

    setBusca("");
    setSelecionado(0);
    setResultado(null);
    campoBusca.current?.focus();
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
    setBusca("");
    setDesconto("");
    setRecebido("");
    setSelecionado(0);
    campoBusca.current?.focus();
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

  function aoTeclarNaBusca(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      const alvo = porCodigoExato ?? resultados[selecionado];
      if (alvo) adicionar(alvo);
      return;
    }
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setSelecionado((i) => Math.min(i + 1, resultados.length - 1));
      return;
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setSelecionado((i) => Math.max(i - 1, 0));
      return;
    }
    if (evento.key === "Escape") {
      setBusca("");
      setSelecionado(0);
    }
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
        <div>
          <label htmlFor="busca" className="mb-1.5 block text-sm font-medium">
            Produto
          </label>
          <input
            ref={campoBusca}
            id="busca"
            autoFocus
            autoComplete="off"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setSelecionado(0);
            }}
            onKeyDown={aoTeclarNaBusca}
            placeholder="Bipe o código de barras ou digite o nome"
            className="w-full rounded-campo border border-borda bg-surface-alto px-3 py-3 text-base text-ink transition-colors duration-150 hover:border-borda-forte"
            role="combobox"
            aria-expanded={resultados.length > 0}
            aria-controls="resultados-busca"
          />
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-fraco">
            <span className="flex items-center gap-1.5">
              <Tecla>↑</Tecla>
              <Tecla>↓</Tecla>
              escolhe
            </span>
            <span className="flex items-center gap-1.5">
              <Tecla>Enter</Tecla>
              adiciona
            </span>
            <span className="flex items-center gap-1.5">
              <Tecla>Ctrl</Tecla>
              <Tecla>Enter</Tecla>
              finaliza
            </span>
            <span className="flex items-center gap-1.5">
              <Tecla>Esc</Tecla>
              limpa
            </span>
          </p>
        </div>

        {termo && (
          <ul
            id="resultados-busca"
            role="listbox"
            className="divide-y divide-borda overflow-hidden rounded-painel border border-borda bg-surface"
          >
            {resultados.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-medio">
                Nenhum produto encontrado para “{busca}”.
              </li>
            )}
            {resultados.map((p, indiceItem) => {
              const ativo = indiceItem === selecionado;
              const semEstoque = p.estoqueAtual <= 0;
              return (
                <li key={p.id} role="option" aria-selected={ativo}>
                  <button
                    type="button"
                    disabled={semEstoque}
                    onClick={() => adicionar(p)}
                    onMouseEnter={() => setSelecionado(indiceItem)}
                    className={
                      "flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-150 " +
                      "disabled:cursor-not-allowed disabled:opacity-50 " +
                      (ativo ? "bg-surface-alto" : "hover:bg-surface-alto")
                    }
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {p.nome}
                      </span>
                      <span className="text-xs text-ink-fraco">
                        {p.categoria} ·{" "}
                        {semEstoque ? (
                          <span className="text-perigo">sem estoque</span>
                        ) : (
                          `${p.estoqueAtual} em estoque`
                        )}
                      </span>
                    </span>
                    <span data-numerico className="text-sm font-medium">
                      {formatarCentavos(p.precoVendaCentavos)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

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
                  "rounded-campo border px-3 py-2 text-sm transition-colors duration-150 " +
                  (forma === f
                    ? "border-ouro bg-ouro-fundo font-medium text-ouro"
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

          <div className="mt-4">
            <CampoDinheiro
              id="desconto"
              rotulo="Desconto"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
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
