-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'BALCONISTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#f59e0b',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "categoriaId" TEXT NOT NULL,
    "precoCustoCentavos" INTEGER NOT NULL DEFAULT 0,
    "precoVendaCentavos" INTEGER NOT NULL,
    "estoqueAtual" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimentoEstoque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produtoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "custoUnitarioCentavos" INTEGER,
    "observacao" TEXT,
    "vendaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimentoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MovimentoEstoque_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MovimentoEstoque_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Caixa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioAberturaId" TEXT NOT NULL,
    "valorAberturaCentavos" INTEGER NOT NULL DEFAULT 0,
    "abertoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" DATETIME,
    "valorFechamentoCentavos" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "observacao" TEXT,
    CONSTRAINT "Caixa_usuarioAberturaId_fkey" FOREIGN KEY ("usuarioAberturaId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimentoCaixa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caixaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimentoCaixa_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MovimentoCaixa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Venda" (
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
    CONSTRAINT "Venda_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemVenda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitarioCentavos" INTEGER NOT NULL,
    "custoUnitarioCentavos" INTEGER NOT NULL DEFAULT 0,
    "subtotalCentavos" INTEGER NOT NULL,
    CONSTRAINT "ItemVenda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemVenda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_codigoBarras_key" ON "Produto"("codigoBarras");

-- CreateIndex
CREATE INDEX "Produto_categoriaId_idx" ON "Produto"("categoriaId");

-- CreateIndex
CREATE INDEX "Produto_nome_idx" ON "Produto"("nome");

-- CreateIndex
CREATE INDEX "MovimentoEstoque_produtoId_idx" ON "MovimentoEstoque"("produtoId");

-- CreateIndex
CREATE INDEX "MovimentoEstoque_criadoEm_idx" ON "MovimentoEstoque"("criadoEm");

-- CreateIndex
CREATE INDEX "Caixa_abertoEm_idx" ON "Caixa"("abertoEm");

-- CreateIndex
CREATE INDEX "Caixa_status_idx" ON "Caixa"("status");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_caixaId_idx" ON "MovimentoCaixa"("caixaId");

-- CreateIndex
CREATE UNIQUE INDEX "Venda_numero_key" ON "Venda"("numero");

-- CreateIndex
CREATE INDEX "Venda_criadoEm_idx" ON "Venda"("criadoEm");

-- CreateIndex
CREATE INDEX "Venda_caixaId_idx" ON "Venda"("caixaId");

-- CreateIndex
CREATE INDEX "Venda_status_idx" ON "Venda"("status");

-- CreateIndex
CREATE INDEX "ItemVenda_vendaId_idx" ON "ItemVenda"("vendaId");

-- CreateIndex
CREATE INDEX "ItemVenda_produtoId_idx" ON "ItemVenda"("produtoId");
