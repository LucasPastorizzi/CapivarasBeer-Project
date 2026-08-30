"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "@/app/login/acoes";
import { Aviso, Botao, Campo } from "@/components/ui";

export function FormularioLogin({ proximo }: { proximo?: string }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(
    entrar,
    {},
  );

  return (
    <form action={acao} className="space-y-4">
      {proximo && <input type="hidden" name="proximo" value={proximo} />}

      <Campo
        id="email"
        name="email"
        rotulo="E-mail"
        type="email"
        autoComplete="username"
        required
        // Repõe o que já havia sido digitado quando a senha falhou.
        defaultValue={estado.email}
        key={estado.email}
        // O balconista abre o sistema no início do turno e digita direto.
        autoFocus
        placeholder="voce@capivarasbeer.com.br"
      />

      <Campo
        id="senha"
        name="senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        required
      />

      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}

      <Botao type="submit" carregando={enviando} className="w-full">
        {enviando ? "Entrando…" : "Entrar"}
      </Botao>
    </form>
  );
}
