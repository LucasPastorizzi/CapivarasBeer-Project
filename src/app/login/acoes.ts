"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarSessao, encerrarSessao } from "@/lib/sessao";
import { podeAcessar, rotaInicial } from "@/lib/autenticacao";

/**
 * `email` volta junto do erro para o formulário repreenchê-lo: o React reseta
 * campos não controlados quando a ação termina, e perder o e-mail a cada
 * senha errada é retrabalho para quem está com fila no balcão.
 */
export type EstadoLogin = { erro?: string; email?: string };

/**
 * Hash descartável usado quando o e-mail não existe. Sem ele, a resposta para
 * "e-mail inexistente" volta muito mais rápido que a de "senha errada", e essa
 * diferença de tempo revela quais e-mails têm conta.
 */
const HASH_FALSO = bcrypt.hashSync("senha-inexistente", 10);

export async function entrar(
  _anterior: EstadoLogin,
  dados: FormData,
): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(dados.get("senha") ?? "");
  const proximo = String(dados.get("proximo") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha o e-mail e a senha.", email };
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const confere = await bcrypt.compare(senha, usuario?.senhaHash ?? HASH_FALSO);

  // Mensagem única para e-mail errado, senha errada e conta desativada: dizer
  // qual dos três falhou entrega informação a quem está tentando adivinhar.
  if (!usuario || !usuario.ativo || !confere) {
    return { erro: "E-mail ou senha incorretos.", email };
  }

  const papel = usuario.papel === "DONO" ? "DONO" : "BALCONISTA";

  await criarSessao({ usuarioId: usuario.id, nome: usuario.nome, papel });

  const destino =
    proximo.startsWith("/") && podeAcessar(papel, proximo)
      ? proximo
      : rotaInicial(papel);

  redirect(destino);
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/login");
}
