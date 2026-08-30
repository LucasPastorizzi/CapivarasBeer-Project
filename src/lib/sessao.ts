import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const NOME_COOKIE = "capivaras_sessao";

/** Um turno inteiro cabe em oito horas; depois disso o balcão relogga. */
const DURACAO_SEGUNDOS = 60 * 60 * 8;

export type Papel = "DONO" | "BALCONISTA";

export type Sessao = {
  usuarioId: string;
  nome: string;
  papel: Papel;
};

function chave() {
  const segredo = process.env.SESSION_SECRET;

  // Falhar aqui é melhor que assinar sessão com chave vazia: sem o segredo,
  // qualquer um forjaria um cookie de DONO.
  if (!segredo) {
    throw new Error(
      "SESSION_SECRET não definida. Gere uma com: openssl rand -base64 32",
    );
  }

  return new TextEncoder().encode(segredo);
}

export async function criarSessao(sessao: Sessao): Promise<void> {
  const expiraEm = new Date(Date.now() + DURACAO_SEGUNDOS * 1000);

  const token = await new SignJWT({ ...sessao })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiraEm)
    .sign(chave());

  const armazem = await cookies();
  armazem.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  });
}

/** Devolve a sessão do cookie, ou null se ausente, adulterada ou expirada. */
export async function lerSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get(NOME_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, chave(), {
      algorithms: ["HS256"],
    });

    const { usuarioId, nome, papel } = payload as Record<string, unknown>;

    if (
      typeof usuarioId !== "string" ||
      typeof nome !== "string" ||
      (papel !== "DONO" && papel !== "BALCONISTA")
    ) {
      return null;
    }

    return { usuarioId, nome, papel };
  } catch {
    // Assinatura inválida ou token expirado: trata como visitante.
    return null;
  }
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(NOME_COOKIE);
}

export const NOME_COOKIE_SESSAO = NOME_COOKIE;
