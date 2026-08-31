"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarSessao, encerrarSessao, segredoConfigurado } from "@/lib/sessao";
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

  // Sem o segredo, assinar a sessão lançaria uma exceção genérica e a tela
  // diria apenas "algo deu errado". Em servidor recém-configurado esta é a
  // falha mais comum, então ela se identifica.
  if (!segredoConfigurado()) {
    return {
      erro: "O servidor está sem a variável SESSION_SECRET. Gere uma com `openssl rand -base64 32` e reinicie a aplicação.",
      email,
    };
  }

  let usuario;
  try {
    usuario = await prisma.usuario.findUnique({ where: { email } });
  } catch (erro) {
    console.error("Falha ao consultar o banco no login", erro);
    return {
      erro: "Não consegui falar com o banco de dados. Confira a DATABASE_URL do servidor e se as migrações foram aplicadas.",
      email,
    };
  }

  // Banco vazio é um sintoma diferente de senha errada, e dizer "e-mail ou
  // senha incorretos" mandaria a pessoa procurar no lugar errado.
  if (!usuario && (await prisma.usuario.count()) === 0) {
    return {
      erro: "O banco de dados não tem nenhum usuário. Rode as migrações e o seed no servidor (`npx prisma migrate deploy` e `npm run db:seed`).",
      email,
    };
  }
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
