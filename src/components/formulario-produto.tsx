"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  atualizarProduto,
  criarProduto,
  type EstadoProduto,
} from "@/app/(app)/produtos/acoes";
import { Aviso, Botao, Campo, CampoDinheiro } from "@/components/ui";
import {
  centavosParaInput,
  formatarCentavos,
  formatarPercentual,
  inputParaCentavos,
  margemPercentual,
} from "@/lib/dinheiro";

type Categoria = { id: string; nome: string };

type ProdutoExistente = {
  id: string;
  nome: string;
  categoriaId: string;
  precoCustoCentavos: number;
  precoVendaCentavos: number;
  estoqueMinimo: number;
  unidade: string;
  codigoBarras: string | null;
};

export function FormularioProduto({
  categorias,
  produto,
}: {
  categorias: Categoria[];
  produto?: ProdutoExistente;
}) {
  const editando = produto !== undefined;

  const [estado, acao, enviando] = useActionState<EstadoProduto, FormData>(
    editando ? atualizarProduto : criarProduto,
    {},
  );

  const [custo, setCusto] = useState(
    produto ? centavosParaInput(produto.precoCustoCentavos) : "",
  );
  const [venda, setVenda] = useState(
    produto ? centavosParaInput(produto.precoVendaCentavos) : "",
  );

  const custoCentavos = inputParaCentavos(custo) ?? 0;
  const vendaCentavos = inputParaCentavos(venda) ?? 0;
  const lucroCentavos = vendaCentavos - custoCentavos;
  const margem = margemPercentual(custoCentavos, vendaCentavos);

  // O dono decide preço olhando margem, não preço isolado. Mostrar o lucro
  // enquanto ele digita evita descobrir o prejuízo no relatório do mês.
  const mostrarMargem = vendaCentavos > 0;

  return (
    <form action={acao} className="max-w-xl space-y-5">
      {editando && <input type="hidden" name="id" value={produto.id} />}

      <Campo
        id="nome"
        name="nome"
        rotulo="Nome"
        required
        minLength={2}
        autoFocus={!editando}
        defaultValue={produto?.nome}
        placeholder="Skol Lata 350ml"
        dica="Como aparece na busca do balcão. Inclua volume e embalagem."
      />

      <div className="space-y-1.5">
        <label htmlFor="categoriaId" className="block text-sm font-medium">
          Categoria
        </label>
        <select
          id="categoriaId"
          name="categoriaId"
          required
          defaultValue={produto?.categoriaId ?? ""}
          className="w-full rounded-campo border border-borda bg-surface-alto px-3 py-2 text-base text-ink transition-colors duration-150 hover:border-borda-forte"
        >
          <option value="" disabled>
            Escolha uma categoria
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDinheiro
          id="precoCusto"
          name="precoCusto"
          rotulo="Preço de custo"
          value={custo}
          onChange={(e) => setCusto(e.target.value)}
          dica="Quanto você paga no fornecedor."
        />
        <CampoDinheiro
          id="precoVenda"
          name="precoVenda"
          rotulo="Preço de venda"
          required
          value={venda}
          onChange={(e) => setVenda(e.target.value)}
          dica="Quanto o cliente paga."
        />
      </div>

      {mostrarMargem && (
        <div
          className={
            "rounded-campo border px-3 py-2 text-sm " +
            (lucroCentavos < 0
              ? "border-perigo/40 bg-perigo-fundo text-perigo"
              : "border-borda text-ink-medio")
          }
        >
          {lucroCentavos < 0 ? (
            <>
              Prejuízo de{" "}
              <strong data-numerico>
                {formatarCentavos(Math.abs(lucroCentavos))}
              </strong>{" "}
              por unidade — o preço de venda está abaixo do custo.
            </>
          ) : (
            <>
              Lucro de{" "}
              <strong data-numerico>{formatarCentavos(lucroCentavos)}</strong>{" "}
              por unidade, margem de{" "}
              <strong data-numerico>{formatarPercentual(margem)}</strong>.
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="estoqueMinimo"
          name="estoqueMinimo"
          rotulo="Estoque mínimo"
          type="number"
          min={0}
          step={1}
          defaultValue={produto?.estoqueMinimo ?? 0}
          dica="Abaixo disso o produto aparece em “Precisa repor”."
        />
        {!editando && (
          <Campo
            id="estoqueInicial"
            name="estoqueInicial"
            rotulo="Estoque atual"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            dica="Quantas unidades existem na prateleira agora."
          />
        )}
        {editando && (
          <Campo
            id="unidade"
            name="unidade"
            rotulo="Unidade"
            defaultValue={produto.unidade}
            maxLength={6}
            dica="UN, KG, CX…"
          />
        )}
      </div>

      {!editando && (
        <Campo
          id="unidade"
          name="unidade"
          rotulo="Unidade"
          defaultValue="UN"
          maxLength={6}
          dica="UN, KG, CX…"
        />
      )}

      <Campo
        id="codigoBarras"
        name="codigoBarras"
        rotulo="Código de barras"
        defaultValue={produto?.codigoBarras ?? ""}
        placeholder="Bipe o produto com o leitor"
        dica="Opcional, mas é o que permite vender bipando em vez de digitar."
      />

      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      {estado.ok && <Aviso tom="ok">{estado.ok}</Aviso>}

      <div className="flex gap-2">
        <Botao type="submit" carregando={enviando}>
          {enviando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar produto"}
        </Botao>
        <Link
          href="/produtos"
          className="inline-flex items-center rounded-campo border border-borda px-4 py-2 text-sm text-ink-medio transition-colors duration-150 hover:bg-surface-alto hover:text-ink"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}
