"use client";

import { useActionState } from "react";
import { abrirComanda, type EstadoComanda } from "@/app/(app)/comandas/acoes";
import { Aviso, Botao, Campo } from "@/components/ui";

const SUGESTOES = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Balcão"];

export function FormularioComanda() {
  const [estado, acao, enviando] = useActionState<EstadoComanda, FormData>(
    abrirComanda,
    {},
  );

  return (
    <form action={acao} className="max-w-md space-y-5">
      <Campo
        id="identificacao"
        name="identificacao"
        rotulo="Mesa ou nome"
        required
        maxLength={40}
        autoFocus
        autoComplete="off"
        placeholder="Mesa 3"
        dica="É por aqui que o balconista vai achar a conta quando pedirem a segunda rodada."
      />

      {/* Atalhos para as mesas de sempre: digitar "Mesa 3" cinquenta vezes por
          noite é trabalho que o sistema pode poupar. */}
      <div className="flex flex-wrap gap-2">
        {SUGESTOES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              const campo = document.getElementById(
                "identificacao",
              ) as HTMLInputElement | null;
              if (campo) {
                campo.value = s;
                campo.focus();
              }
            }}
            className="rounded-acao border border-borda px-3 py-1 text-sm text-ink-medio transition-colors duration-150 hover:border-borda-forte hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>

      <Campo
        id="observacao"
        name="observacao"
        rotulo="Observação"
        maxLength={200}
        placeholder="Opcional — aniversário, grupo grande…"
      />

      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}

      <Botao type="submit" carregando={enviando}>
        {enviando ? "Abrindo…" : "Abrir comanda"}
      </Botao>
    </form>
  );
}
