/**
 * Popula o banco com o catálogo típico de uma conveniência de bebidas e um
 * usuário dono para o primeiro acesso.
 *
 * É idempotente: roda quantas vezes precisar sem duplicar registro.
 * Executar com `npm run db:seed`.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

const CATEGORIAS = [
  { nome: "Cerveja", cor: "#f59e0b" },
  { nome: "Destilado", cor: "#7c3aed" },
  { nome: "Vinho", cor: "#be123c" },
  { nome: "Refrigerante", cor: "#0ea5e9" },
  { nome: "Energético", cor: "#84cc16" },
  { nome: "Água", cor: "#38bdf8" },
  { nome: "Gelo", cor: "#94a3b8" },
  { nome: "Tabacaria", cor: "#78716c" },
  { nome: "Salgadinho", cor: "#ea580c" },
];

/** [nome, categoria, custo em centavos, venda em centavos, estoque, mínimo] */
const PRODUTOS: [string, string, number, number, number, number][] = [
  ["Skol Lata 350ml", "Cerveja", 280, 500, 120, 24],
  ["Brahma Lata 350ml", "Cerveja", 290, 500, 96, 24],
  ["Antarctica Lata 350ml", "Cerveja", 285, 500, 72, 24],
  ["Heineken Long Neck 330ml", "Cerveja", 550, 900, 48, 12],
  ["Budweiser Long Neck 330ml", "Cerveja", 480, 800, 36, 12],
  ["Original Garrafa 600ml", "Cerveja", 890, 1400, 24, 6],
  ["Corona Long Neck 330ml", "Cerveja", 620, 1000, 24, 12],
  ["Spaten Lata 350ml", "Cerveja", 320, 550, 60, 24],
  ["Smirnoff 998ml", "Destilado", 2800, 4500, 12, 3],
  ["Absolut 1L", "Destilado", 6500, 9900, 6, 2],
  ["Cachaça 51 965ml", "Destilado", 1400, 2200, 10, 3],
  ["Jack Daniel's 1L", "Destilado", 12000, 17900, 4, 2],
  ["Gin Tanqueray 750ml", "Destilado", 9500, 13900, 5, 2],
  ["Vinho Tinto Seco 750ml", "Vinho", 2200, 3500, 8, 3],
  ["Coca-Cola Lata 350ml", "Refrigerante", 250, 500, 72, 24],
  ["Guaraná Antarctica Lata 350ml", "Refrigerante", 230, 450, 60, 24],
  ["Coca-Cola 2L", "Refrigerante", 700, 1100, 24, 6],
  ["Red Bull 250ml", "Energético", 700, 1200, 36, 12],
  ["Monster 473ml", "Energético", 800, 1300, 24, 12],
  ["Água Mineral 500ml", "Água", 120, 300, 48, 24],
  ["Água com Gás 500ml", "Água", 150, 350, 24, 12],
  ["Gelo 2kg", "Gelo", 400, 900, 40, 10],
  ["Gelo de Coco 1kg", "Gelo", 500, 1200, 20, 6],
  ["Carvão 3kg", "Tabacaria", 900, 1800, 15, 5],
  ["Isqueiro", "Tabacaria", 200, 500, 30, 10],
  ["Amendoim 150g", "Salgadinho", 300, 600, 25, 10],
  ["Batata Frita 100g", "Salgadinho", 400, 800, 20, 10],
];

async function main() {
  const senhaPadrao = process.env.SENHA_DONO ?? "capivaras123";

  const dono = await prisma.usuario.upsert({
    where: { email: "dono@capivarasbeer.com.br" },
    update: {},
    create: {
      nome: "Dono",
      email: "dono@capivarasbeer.com.br",
      senhaHash: await bcrypt.hash(senhaPadrao, 10),
      papel: "DONO",
    },
  });

  const balconista = await prisma.usuario.upsert({
    where: { email: "balcao@capivarasbeer.com.br" },
    update: {},
    create: {
      nome: "Balcão",
      email: "balcao@capivarasbeer.com.br",
      senhaHash: await bcrypt.hash(senhaPadrao, 10),
      papel: "BALCONISTA",
    },
  });

  const categorias = new Map<string, string>();
  for (const c of CATEGORIAS) {
    const categoria = await prisma.categoria.upsert({
      where: { nome: c.nome },
      update: { cor: c.cor },
      create: c,
    });
    categorias.set(categoria.nome, categoria.id);
  }

  let criados = 0;
  for (const [nome, cat, custo, venda, estoque, minimo] of PRODUTOS) {
    const categoriaId = categorias.get(cat);
    if (!categoriaId) continue;

    const existente = await prisma.produto.findFirst({ where: { nome } });
    if (existente) continue;

    const produto = await prisma.produto.create({
      data: {
        nome,
        categoriaId,
        precoCustoCentavos: custo,
        precoVendaCentavos: venda,
        estoqueAtual: estoque,
        estoqueMinimo: minimo,
      },
    });

    // O estoque inicial entra como movimento para que a trilha de auditoria
    // explique de onde veio cada unidade em prateleira.
    await prisma.movimentoEstoque.create({
      data: {
        produtoId: produto.id,
        tipo: "ENTRADA",
        quantidade: estoque,
        custoUnitarioCentavos: custo,
        observacao: "Carga inicial do sistema",
        usuarioId: dono.id,
      },
    });
    criados += 1;
  }

  console.log(`Usuários: ${dono.email} e ${balconista.email} (senha: ${senhaPadrao})`);
  console.log(`Categorias: ${categorias.size}`);
  console.log(`Produtos criados agora: ${criados} (catálogo total: ${await prisma.produto.count()})`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
