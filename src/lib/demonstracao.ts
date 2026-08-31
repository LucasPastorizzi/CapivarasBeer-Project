import "server-only";

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Banco efêmero para o ambiente de demonstração.
 *
 * A loja roda no balcão, com o banco em arquivo no disco da máquina. Já a
 * vitrine na Vercel não tem disco permanente: o que ela tem é `/tmp`, que é
 * gravável mas some quando a instância recicla.
 *
 * Então aqui o banco nasce no primeiro acesso — migrações e catálogo — e
 * morre junto com a instância. Ninguém perde nada, porque nada ali é real.
 *
 * A alternativa seria um PostgreSQL na nuvem, o que obrigaria a manter duas
 * histórias de migração: uma para a loja e outra para a vitrine. Duas
 * histórias divergem, e a que ninguém usa no dia a dia diverge primeiro.
 */

export function emModoDemonstracao(): boolean {
  return process.env.MODO_DEMONSTRACAO === "true";
}

function caminhoDoBanco(): string {
  return (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(
    /^file:/,
    "",
  );
}

/** Executa as migrações na ordem em que foram criadas. */
function aplicarMigracoes(caminho: string): number {
  const pasta = join(process.cwd(), "prisma", "migrations");
  if (!existsSync(pasta)) {
    throw new Error(
      "Pasta de migrações não encontrada no pacote. Confira outputFileTracingIncludes no next.config.ts.",
    );
  }

  const banco = new Database(caminho);
  // WAL deixa leitura e escrita conviverem sem travar uma na outra.
  banco.pragma("journal_mode = WAL");

  const versoes = readdirSync(pasta)
    .filter((n) => existsSync(join(pasta, n, "migration.sql")))
    .sort();

  for (const versao of versoes) {
    banco.exec(readFileSync(join(pasta, versao, "migration.sql"), "utf8"));
  }

  banco.close();
  return versoes.length;
}

// Uma instância pode receber várias requisições ao mesmo tempo no arranque.
// A promessa guardada aqui garante que o banco seja criado uma vez só; as
// outras requisições esperam a mesma.
let arranque: Promise<void> | null = null;

export function prepararDemonstracao(): Promise<void> {
  if (!emModoDemonstracao()) return Promise.resolve();
  arranque ??= criar();
  return arranque;
}

async function criar(): Promise<void> {
  const caminho = caminhoDoBanco();

  if (existsSync(caminho)) return;

  const pasta = dirname(caminho);
  if (pasta && pasta !== "." && !existsSync(pasta)) {
    mkdirSync(pasta, { recursive: true });
  }

  const inicio = Date.now();
  const migracoes = aplicarMigracoes(caminho);

  // O povoamento vem depois das migrações, e usa o Prisma normal: importar
  // aqui dentro evita que o cliente seja criado antes do banco existir.
  const { semearCatalogo } = await import("@/lib/demonstracao-dados");
  const resumo = await semearCatalogo();

  console.log(
    `Demonstração pronta em ${Date.now() - inicio}ms: ${migracoes} migrações, ` +
      `${resumo.produtos} produtos, ${resumo.vendas} vendas.`,
  );
}
