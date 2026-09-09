-- CreateTable
CREATE TABLE "Comanda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "identificacao" TEXT NOT NULL,
    "caixaId" TEXT NOT NULL,
    "abertaPorId" TEXT NOT NULL,
    "abertaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadaEm" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "observacao" TEXT,
    "vendaId" TEXT,
    CONSTRAINT "Comanda_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comanda_abertaPorId_fkey" FOREIGN KEY ("abertaPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comanda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemComanda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comandaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitarioCentavos" INTEGER NOT NULL,
    "custoUnitarioCentavos" INTEGER NOT NULL,
    "subtotalCentavos" INTEGER NOT NULL,
    "lancadoPorId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemComanda_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemComanda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemComanda_lancadoPorId_fkey" FOREIGN KEY ("lancadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Comanda_numero_key" ON "Comanda"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Comanda_vendaId_key" ON "Comanda"("vendaId");

-- CreateIndex
CREATE INDEX "Comanda_status_idx" ON "Comanda"("status");

-- CreateIndex
CREATE INDEX "Comanda_caixaId_idx" ON "Comanda"("caixaId");

-- CreateIndex
CREATE INDEX "ItemComanda_comandaId_idx" ON "ItemComanda"("comandaId");
