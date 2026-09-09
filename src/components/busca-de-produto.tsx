"use client";

import { useMemo, useRef, useState } from "react";
import { Tecla } from "@/components/ui";
import { formatarCentavos } from "@/lib/dinheiro";
import type { ProdutoParaVenda } from "@/lib/pdv";
import { normalizar } from "@/lib/texto";

/**
 * Busca de produto por teclado e leitor de código de barras.
 *
 * Nasceu dentro do PDV e saiu de lá quando a comanda passou a precisar da
 * mesma coisa. Duas buscas copiadas divergem: uma ganha acento, a outra
 * ganha código de barras, e o balconista descobre a diferença na pior hora.
 */

const LIMITE_RESULTADOS = 8;

export function BuscaDeProduto({
  produtos,
  aoEscolher,
  aoFinalizar,
  rotulo = "Produto",
  autoFocus = true,
}: {
  produtos: ProdutoParaVenda[];
  aoEscolher: (produto: ProdutoParaVenda) => void;
  /** Ctrl+Enter. Opcional: nem toda tela tem um "finalizar". */
  aoFinalizar?: () => void;
  rotulo?: string;
  autoFocus?: boolean;
}) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const campo = useRef<HTMLInputElement>(null);

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

  function escolher(produto: ProdutoParaVenda) {
    aoEscolher(produto);
    setBusca("");
    setSelecionado(0);
    campo.current?.focus();
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Enter") {
      if ((evento.ctrlKey || evento.metaKey) && aoFinalizar) {
        evento.preventDefault();
        aoFinalizar();
        return;
      }
      evento.preventDefault();
      const alvo = porCodigoExato ?? resultados[selecionado];
      if (alvo) escolher(alvo);
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

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="busca" className="mb-1.5 block text-sm font-medium">
          {rotulo}
        </label>
        <input
          ref={campo}
          id="busca"
          autoFocus={autoFocus}
          autoComplete="off"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setSelecionado(0);
          }}
          onKeyDown={aoTeclar}
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
          {aoFinalizar && (
            <span className="flex items-center gap-1.5">
              <Tecla>Ctrl</Tecla>
              <Tecla>Enter</Tecla>
              finaliza
            </span>
          )}
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
                  onClick={() => escolher(p)}
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
    </div>
  );
}
