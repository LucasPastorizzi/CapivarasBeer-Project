"use client";

import { useState, useTransition } from "react";
import { lancarItem } from "@/app/(app)/comandas/acoes";
import { BuscaDeProduto } from "@/components/busca-de-produto";
import { Aviso } from "@/components/ui";
import type { ProdutoParaVenda } from "@/lib/pdv";

/**
 * Lançamento de rodadas.
 *
 * Cada produto escolhido vai direto para a conta, sem carrinho intermediário.
 * No balcão o pedido chega em partes — "mais duas long neck" — e obrigar a
 * montar um carrinho e confirmar acrescentaria dois passos a algo que acontece
 * vinte vezes por noite.
 */
export function LancarNaComanda({
  numero,
  produtos,
}: {
  numero: number;
  produtos: ProdutoParaVenda[];
}) {
  const [enviando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<string | null>(null);

  function lancar(produto: ProdutoParaVenda) {
    setErro(null);

    iniciar(async () => {
      const dados = new FormData();
      dados.set("numero", String(numero));
      dados.set("produtoId", produto.id);
      dados.set("quantidade", "1");

      const resposta = await lancarItem({}, dados);

      if (resposta.erro) {
        setErro(resposta.erro);
        setUltimo(null);
      } else {
        // Confirmação curta e nomeada: o balconista precisa saber que entrou,
        // sem tirar os olhos do cliente.
        setUltimo(produto.nome);
      }
    });
  }

  return (
    <div className="space-y-3">
      <BuscaDeProduto produtos={produtos} aoEscolher={lancar} />

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      {ultimo && !erro && (
        <p role="status" className="text-sm text-ok">
          {ultimo} lançado{enviando ? "…" : "."}
        </p>
      )}
    </div>
  );
}
