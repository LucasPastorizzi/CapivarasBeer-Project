import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const NOME_COOKIE = "capivaras_sessao";

/** Um turno inteiro cabe em oito horas; depois disso o balcão relogga. */
const DURACAO_SEGUNDOS = 60 * 60 * 8;

export type Papel = "DONO" | "BALCONISTA";

export type Sessao = {
  usuarioId: string;
  nome: string;
  papel: Papel;
};

/**
 * Se a conexão é HTTPS de verdade.
 *
 * Marcar o cookie como `secure` numa conexão HTTP faz o navegador descartá-lo
 * sem avisar: o login dá certo, redireciona, e a próxima requisição chega sem
 * sessão — um vaivém eterno para a tela de entrada. Amarrar isso a
 * NODE_ENV era errado, porque "produção" não implica HTTPS.
 *
 * COOKIE_SECURE força o valor quando o proxy da hospedagem não repassa o
 * cabeçalho de protocolo.
 */
async function conexaoSegura(): Promise<boolean> {
  const forcado = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (forcado === "true") return true;
  if (forcado === "false") return false;

  const protocolo = (await headers()).get("x-forwarded-proto");
  if (protocolo) return protocolo.split(",")[0].trim() === "https";

  return process.env.NODE_ENV === "production";
}

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
    secure: await conexaoSegura(),
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

/** Se o segredo de assinatura está configurado. Usado para diagnóstico. */
export function segredoConfigurado(): boolean {
  return Boolean(process.env.SESSION_SECRET);
}
