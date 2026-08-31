"use client";

import { useActionState, useState } from "react";
import {
  registrarMovimento,
  type EstadoEstoque,
} from "@/app/(app)/estoque/acoes";
import { Aviso, Botao, Campo, CampoDinheiro } from "@/components/ui";
import type { ProdutosAgrupados } from "@/lib/estoque";
import { TIPOS_MANUAIS, type TipoManual } from "@/lib/movimentos";

const DESCRICAO: Record<TipoManual, { rotulo: string; explica: string }> = {
  ENTRADA: {
    rotulo: "Entrada",
    explica: "Mercadoria que chegou do fornecedor.",
  },
  AJUSTE: {
    rotulo: "Ajuste",
    explica:
      "Contagem na prateleira não bateu com o sistema. Informe o que existe de verdade.",
  },
  PERDA: {
    rotulo: "Perda",
    explica: "Quebrou, venceu, estragou ou sumiu.",
  },
};

export function FormularioEstoque({
  grupos,
}: {
  grupos: ProdutosAgrupados;
}) {
  const [estado, acao, enviando] = useActionState<EstadoEstoque, FormData>(
    registrarMovimento,
    {},
  );

  const [tipo, setTipo] = useState<TipoManual>("ENTRADA");
  const [produtoId, setProdutoId] = useState("");

  const selecionado = grupos
    .flatMap((g) => g.itens)
    .find((p) => p.id === produtoId);

  return (
    <form action={acao} className="max-w-xl space-y-5">
      <input type="hidden" name="tipo" value={tipo} />

      <div>
        <span className="mb-2 block text-sm font-medium">Tipo de movimento</span>
        {/* Três opções mutuamente exclusivas e sempre visíveis: um seletor
            escondido faria a pessoa procurar "perda" dentro de uma lista. */}
        <div
          role="radiogroup"
          aria-label="Tipo de movimento"
          className="grid grid-cols-3 gap-2"
        >
          {TIPOS_MANUAIS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => setTipo(t)}
              className={
                "rounded-acao border px-3 py-2 text-sm transition-colors duration-150 " +
                (tipo === t
                  ? "border-marca bg-marca-fundo font-medium text-marca"
                  : "border-borda text-ink-medio hover:border-borda-forte hover:text-ink")
              }
            >
              {DESCRICAO[t].rotulo}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-fraco">{DESCRICAO[tipo].explica}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="produtoId" className="block text-sm font-medium">
          Produto
        </label>
        <select
          id="produtoId"
          name="produtoId"
          required
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          className="w-full rounded-campo border border-borda bg-surface-alto px-3 py-2 text-base text-ink transition-colors duration-150 hover:border-borda-forte"
        >
          <option value="" disabled>
            Escolha o produto
          </option>
          {grupos.map((g) => (
            <optgroup key={g.categoria} label={g.categoria}>
              {g.itens.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.estoqueAtual} {p.unidade}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selecionado && (
          <p className="text-xs text-ink-fraco" data-numerico>
            O sistema tem {selecionado.estoqueAtual} {selecionado.unidade} deste
            produto.
          </p>
        )}
      </div>

      {tipo === "AJUSTE" ? (
        <Campo
          id="contagem"
          name="contagem"
          rotulo="Quantidade contada na prateleira"
          type="number"
          min={0}
          step={1}
          required
          dica="Informe o que existe de verdade. O sistema calcula a diferença sozinho."
        />
      ) : (
        <Campo
          id="quantidade"
          name="quantidade"
          rotulo={tipo === "ENTRADA" ? "Quantidade recebida" : "Quantidade perdida"}
          type="number"
          min={1}
          step={1}
          required
        />
      )}

      {tipo === "ENTRADA" && (
        <div className="space-y-3">
          <CampoDinheiro
            id="custoUnitario"
            name="custoUnitario"
            rotulo="Custo unitário desta compra"
            dica="Opcional. Serve para acompanhar quanto o fornecedor cobrou."
          />
          <label className="flex items-start gap-2.5 text-sm text-ink-medio">
            <input
              type="checkbox"
              name="atualizarCusto"
              className="mt-0.5 size-4 accent-[var(--color-marca)]"
            />
            <span>
              Passar a usar este valor como custo do produto
              <span className="block text-xs text-ink-fraco">
                Deixe desmarcado se foi uma compra promocional — senão a margem
                de todos os relatórios futuros passa a usar um custo que não se
                repete.
              </span>
            </span>
          </label>
        </div>
      )}

      <Campo
        id="observacao"
        name="observacao"
        rotulo={tipo === "ENTRADA" ? "Observação" : "Motivo"}
        required={tipo !== "ENTRADA"}
        placeholder={
          tipo === "ENTRADA"
            ? "Nota 1234, fornecedor Bebidas Sul"
            : tipo === "PERDA"
              ? "Caixa caiu no depósito"
              : "Contagem do fim do mês"
        }
      />

      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      {estado.ok && <Aviso tom="ok">{estado.ok}</Aviso>}

      <Botao type="submit" carregando={enviando}>
        {enviando ? "Registrando…" : "Registrar movimento"}
      </Botao>
    </form>
  );
}
