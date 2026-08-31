import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O modo de demonstração cria o banco no arranque aplicando as migrações.
  // Sem isto, os arquivos .sql não entram no pacote da função e o banco
  // nasceria vazio — a vitrine subiria sem nenhuma tabela.
  outputFileTracingIncludes: {
    "/**": ["./prisma/migrations/**/*.sql"],
  },
};

export default nextConfig;
