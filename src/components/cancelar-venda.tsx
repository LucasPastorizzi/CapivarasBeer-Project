"use client";

import { useActionState, useState } from "react";
import {
  cancelarVenda,
  type EstadoCancelamento,
} from "@/app/(app)/vendas/acoes";
import { Aviso, Botao, Campo } from "@/components/ui";
import { formatarCentavos } from "@/lib/dinheiro";

export function CancelarVenda({
  numero,
  totalCentavos,
  quantidadeDeItens,
}: {
  numero: number;
  totalCentavos: number;
  quantidadeDeItens: number;
}) {
  const [estado, acao, enviando] = useActionState<EstadoCancelamento, FormData>(
    cancelarVenda,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  if (estado.ok) return <Aviso tom="ok">{estado.ok}</Aviso>;

  // O cancelamento fica atrás de um segundo clique de propósito. Ele mexe em
  // dinheiro e em estoque, e um botão solto ao lado dos itens é clicado sem
  // querer no meio de uma noite cheia.
  if (!confirmando) {
    return (
      <Botao
        type="button"
        variante="perigo"
        onClick={() => setConfirmando(true)}
      >
        Cancelar esta venda
      </Botao>
    );
  }

  return (
    <form action={acao} className="max-w-md space-y-4">
      <input type="hidden" name="numero" value={numero} />

      <p className="text-sm text-ink-medio">
        Cancelar devolve ao estoque {quantidadeDeItens}{" "}
        {quantidadeDeItens === 1 ? "item" : "itens"} e tira{" "}
        <strong data-numerico className="text-ink">
          {formatarCentavos(totalCentavos)}
        </strong>{" "}
        do faturamento do turno. A venda continua visível, marcada como
        cancelada.
      </p>

      <Campo
        id="motivo"
        name="motivo"
        rotulo="Motivo do cancelamento"
        required
        minLength={5}
        autoFocus
        placeholder="Cliente desistiu, produto errado, valor errado…"
        dica="Fica gravado com o seu nome."
      />

      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}

      <div className="flex flex-wrap gap-2">
        <Botao type="submit" variante="perigo" carregando={enviando}>
          {enviando ? "Cancelando…" : "Confirmar cancelamento"}
        </Botao>
        <Botao
          type="button"
          variante="secundario"
          onClick={() => setConfirmando(false)}
          disabled={enviando}
        >
          Voltar
        </Botao>
      </div>
    </form>
  );
}
