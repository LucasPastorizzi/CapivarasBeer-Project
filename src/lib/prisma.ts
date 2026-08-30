import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// A partir do Prisma 7 o client exige um driver adapter explícito. Trocar de
// SQLite para PostgreSQL em produção significa trocar apenas este adapter.
function criarClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });

  return new PrismaClient({ adapter });
}

// Em desenvolvimento o hot reload do Next recria os módulos a cada alteração.
// Sem o cache no globalThis, cada recarga abriria uma nova conexão até o
// SQLite recusar novas aberturas.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? criarClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
