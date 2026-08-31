-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "categoriaId" TEXT NOT NULL,
    "precoCustoCentavos" INTEGER NOT NULL DEFAULT 0,
    "precoVendaCentavos" INTEGER NOT NULL,
    "estoqueAtual" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "multiploCompra" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Produto" ("ativo", "atualizadoEm", "categoriaId", "codigoBarras", "criadoEm", "estoqueAtual", "estoqueMinimo", "id", "nome", "precoCustoCentavos", "precoVendaCentavos", "unidade") SELECT "ativo", "atualizadoEm", "categoriaId", "codigoBarras", "criadoEm", "estoqueAtual", "estoqueMinimo", "id", "nome", "precoCustoCentavos", "precoVendaCentavos", "unidade" FROM "Produto";
DROP TABLE "Produto";
ALTER TABLE "new_Produto" RENAME TO "Produto";
CREATE UNIQUE INDEX "Produto_codigoBarras_key" ON "Produto"("codigoBarras");
CREATE INDEX "Produto_categoriaId_idx" ON "Produto"("categoriaId");
CREATE INDEX "Produto_nome_idx" ON "Produto"("nome");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
