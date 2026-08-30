import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE_SESSAO } from "@/lib/sessao";

/**
 * No Next 16 o middleware passou a se chamar proxy.
 *
 * Aqui só existe o desvio otimista — se não há cookie, nem renderiza a página
 * protegida. A autorização de verdade acontece em cada página e Server Action,
 * porque este arquivo não valida assinatura nem consulta o banco.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const temCookie = request.cookies.has(NOME_COOKIE_SESSAO);

  if (!temCookie && pathname !== "/login") {
    const destino = new URL("/login", request.url);
    // Guarda onde a pessoa queria chegar para devolvê-la após o login.
    if (pathname !== "/") destino.searchParams.set("proximo", pathname);
    return NextResponse.redirect(destino);
  }

  if (temCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
