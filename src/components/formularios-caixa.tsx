"use client";

import { useActionState, useState } from "react";
import {
  abrirCaixa,
  fecharCaixa,
  registrarMovimento,
  type EstadoAcao,
} from "@/app/(app)/caixa/acoes";
import { Aviso, Botao, Campo, CampoDinheiro, Linha } from "@/components/ui";
import { formatarCentavos, inputParaCentavos } from "@/lib/dinheiro";

export function FormularioAbrirCaixa() {
  const [estado, acao, enviando] = useActionState<EstadoAcao, FormData>(
    abrirCaixa,
    {},
  );

  return (
    <form action={acao} className="max-w-sm space-y-4">
      <CampoDinheiro
        id="valorAbertura"
        name="valorAbertura"
        rotulo="Troco inicial na gaveta"
        required
        autoFocus
        dica="Quanto em dinheiro está na gaveta agora, antes da primeira venda."
      />
      <Campo
        id="observacao"
        name="observacao"
        rotulo="Observação"
        placeholder="Opcional"
      />
      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      <Botao type="submit" carregando={enviando}>
        {enviando ? "Abrindo…" : "Abrir caixa"}
      </Botao>
    </form>
  );
}

export function FormularioMovimento({
  tipo,
}: {
  tipo: "SANGRIA" | "SUPRIMENTO";
}) {
  const [estado, acao, enviando] = useActionState<EstadoAcao, FormData>(
    registrarMovimento,
    {},
  );

  const sangria = tipo === "SANGRIA";

  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="tipo" value={tipo} />
      <CampoDinheiro
        id={`valor-${tipo}`}
        name="valor"
        rotulo={sangria ? "Valor retirado" : "Valor colocado"}
        required
      />
      <Campo
        id={`motivo-${tipo}`}
        name="motivo"
        rotulo="Motivo"
        required
        minLength={3}
        placeholder={sangria ? "Depósito no banco" : "Troco de R$ 100"}
      />
      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      {estado.ok && <Aviso tom="ok">{estado.ok}</Aviso>}
      <Botao type="submit" variante="secundario" carregando={enviando}>
        {sangria ? "Registrar sangria" : "Registrar suprimento"}
      </Botao>
    </form>
  );
}

export function FormularioFecharCaixa({
  esperadoNaGavetaCentavos,
}: {
  esperadoNaGavetaCentavos: number;
}) {
  const [estado, acao, enviando] = useActionState<EstadoAcao, FormData>(
    fecharCaixa,
    {},
  );

  const [contado, setContado] = useState("");

  // A diferença aparece enquanto a pessoa digita, não depois de confirmar.
  // Quem contou errado descobre com a gaveta ainda aberta na frente.
  const contadoCentavos = inputParaCentavos(contado);
  const diferenca =
    contadoCentavos === null ? null : contadoCentavos - esperadoNaGavetaCentavos;

  return (
    <form action={acao} className="max-w-sm space-y-4">
      <CampoDinheiro
        id="valorContado"
        name="valorContado"
        rotulo="Dinheiro contado na gaveta"
        required
        value={contado}
        onChange={(e) => setContado(e.target.value)}
        dica="Conte as notas e moedas e informe o total."
      />

      <div className="rounded-campo border border-borda px-3 py-2">
        <Linha
          rotulo="Esperado na gaveta"
          valor={formatarCentavos(esperadoNaGavetaCentavos)}
        />
        {diferenca !== null && (
          <Linha
            rotulo={
              diferenca === 0
                ? "Confere"
                : diferenca > 0
                  ? "Sobra"
                  : "Falta"
            }
            valor={formatarCentavos(Math.abs(diferenca))}
            destaque
            tom={diferenca === 0 ? "ok" : diferenca > 0 ? "alerta" : "perigo"}
          />
        )}
      </div>

      <Campo
        id="observacao-fechamento"
        name="observacao"
        rotulo="Observação"
        placeholder={
          diferenca !== null && diferenca !== 0
            ? "Explique a diferença"
            : "Opcional"
        }
      />

      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      <Botao type="submit" carregando={enviando}>
        {enviando ? "Fechando…" : "Fechar caixa"}
      </Botao>
    </form>
  );
}
