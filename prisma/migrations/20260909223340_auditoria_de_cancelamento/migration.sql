-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Venda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "caixaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "subtotalCentavos" INTEGER NOT NULL,
    "descontoCentavos" INTEGER NOT NULL DEFAULT 0,
    "totalCentavos" INTEGER NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONCLUIDA',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceladaEm" DATETIME,
    "canceladaPorId" TEXT,
    "motivoCancelamento" TEXT,
    CONSTRAINT "Venda_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venda_canceladaPorId_fkey" FOREIGN KEY ("canceladaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Venda" ("caixaId", "canceladaEm", "criadoEm", "descontoCentavos", "formaPagamento", "id", "numero", "status", "subtotalCentavos", "totalCentavos", "usuarioId") SELECT "caixaId", "canceladaEm", "criadoEm", "descontoCentavos", "formaPagamento", "id", "numero", "status", "subtotalCentavos", "totalCentavos", "usuarioId" FROM "Venda";
DROP TABLE "Venda";
ALTER TABLE "new_Venda" RENAME TO "Venda";
CREATE UNIQUE INDEX "Venda_numero_key" ON "Venda"("numero");
CREATE INDEX "Venda_criadoEm_idx" ON "Venda"("criadoEm");
CREATE INDEX "Venda_caixaId_idx" ON "Venda"("caixaId");
CREATE INDEX "Venda_status_idx" ON "Venda"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
