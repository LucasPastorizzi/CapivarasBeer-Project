import "server-only";

import bcrypt from "bcryptjs";
import type { ProdutoModel } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";

/**
 * Povoa o banco de demonstração: catálogo, usuários e três semanas de
 * movimento plausível.
 *
 * É a mesma ideia dos scripts `db:seed` e `db:demo`, mas escrita para rodar
 * dentro do servidor, num arranque a frio. Por isso é enxuta: menos produtos
 * e menos dias que o gerador completo, porque quem abre a vitrine espera a
 * página, não um povoamento.
 */

const CATEGORIAS: [string, string][] = [
  ["Cerveja", "#f59e0b"],
  ["Destilado", "#7c3aed"],
  ["Refrigerante", "#0ea5e9"],
  ["Energético", "#84cc16"],
  ["Água", "#38bdf8"],
  ["Gelo", "#94a3b8"],
  ["Tabacaria", "#78716c"],
  ["Salgadinho", "#ea580c"],
];

/** [nome, categoria, custo, venda, estoque, mínimo, embalagem] */
const PRODUTOS: [string, string, number, number, number, number, number][] = [
  ["Skol Lata 350ml", "Cerveja", 280, 500, 96, 24, 12],
  ["Brahma Lata 350ml", "Cerveja", 290, 500, 38, 24, 12],
  ["Antarctica Lata 350ml", "Cerveja", 285, 500, 54, 24, 12],
  ["Heineken Long Neck 330ml", "Cerveja", 550, 900, 41, 12, 24],
  ["Budweiser Long Neck 330ml", "Cerveja", 480, 800, 28, 12, 24],
  ["Original Garrafa 600ml", "Cerveja", 890, 1400, 19, 6, 12],
  ["Corona Long Neck 330ml", "Cerveja", 620, 1000, 22, 12, 24],
  ["Spaten Lata 350ml", "Cerveja", 320, 550, 47, 24, 12],
  ["Smirnoff 998ml", "Destilado", 2800, 4500, 9, 3, 6],
  ["Cachaça 51 965ml", "Destilado", 1400, 2200, 11, 3, 12],
  ["Gin Tanqueray 750ml", "Destilado", 9500, 13900, 4, 2, 6],
  ["Coca-Cola Lata 350ml", "Refrigerante", 250, 500, 33, 24, 6],
  ["Guaraná Antarctica Lata 350ml", "Refrigerante", 230, 450, 26, 24, 6],
  ["Coca-Cola 2L", "Refrigerante", 700, 1100, 17, 6, 6],
  ["Red Bull 250ml", "Energético", 700, 1200, 14, 12, 4],
  ["Monster 473ml", "Energético", 800, 1300, 16, 12, 4],
  ["Água Mineral 500ml", "Água", 120, 300, 31, 24, 12],
  ["Gelo 2kg", "Gelo", 400, 900, 8, 10, 10],
  ["Gelo de Coco 1kg", "Gelo", 500, 1200, 7, 6, 6],
  ["Carvão 3kg", "Tabacaria", 900, 1800, 12, 5, 5],
  ["Amendoim 150g", "Salgadinho", 300, 600, 21, 10, 10],
  ["Batata Frita 100g", "Salgadinho", 400, 800, 15, 10, 10],
];

/** Peso por dia da semana. A loja fecha domingo e segunda. */
const PESO_DIA = [0, 0, 0.55, 0.6, 0.7, 1, 1.4];
const PAGAMENTOS: [string, number][] = [
  ["PIX", 0.42],
  ["DEBITO", 0.24],
  ["DINHEIRO", 0.2],
  ["CREDITO", 0.14],
];

const DIAS = 21;

function sortearPagamento(): string {
  const n = Math.random();
  let acumulado = 0;
  for (const [forma, peso] of PAGAMENTOS) {
    acumulado += peso;
    if (n <= acumulado) return forma;
  }
  return "PIX";
}

export async function semearCatalogo() {
  const senha = await bcrypt.hash(
    process.env.SENHA_DEMONSTRACAO ?? "capivaras123",
    10,
  );

  const dono = await prisma.usuario.create({
    data: {
      nome: "Dono",
      email: "dono@capivarasbeer.com.br",
      senhaHash: senha,
      papel: "DONO",
    },
  });
  const balcao = await prisma.usuario.create({
    data: {
      nome: "Balcão",
      email: "balcao@capivarasbeer.com.br",
      senhaHash: senha,
      papel: "BALCONISTA",
    },
  });

  const categorias = new Map<string, string>();
  for (const [nome, cor] of CATEGORIAS) {
    const c = await prisma.categoria.create({ data: { nome, cor } });
    categorias.set(nome, c.id);
  }

  const produtos: ProdutoModel[] = [];
  for (const [nome, cat, custo, venda, estoque, minimo, multiplo] of PRODUTOS) {
    produtos.push(
      await prisma.produto.create({
        data: {
          nome,
          categoriaId: categorias.get(cat)!,
          precoCustoCentavos: custo,
          precoVendaCentavos: venda,
          estoqueAtual: estoque,
          estoqueMinimo: minimo,
          multiploCompra: multiplo,
        },
      }),
    );
  }

  // Campeões de giro repetidos na urna, para o ranking ter a forma que a loja
  // tem: cerveja e gelo saem muito mais que destilado.
  const urna = produtos.flatMap((p) =>
    /Lata|Long Neck|Gelo|Garrafa/.test(p.nome)
      ? Array.from({ length: 6 }, () => p)
      : [p],
  );

  let numero = 0;
  let totalVendas = 0;

  for (let d = DIAS - 1; d >= 1; d -= 1) {
    const dia = new Date();
    dia.setDate(dia.getDate() - d);
    dia.setHours(19, 0, 0, 0);

    const peso = PESO_DIA[dia.getDay()];
    if (peso === 0) continue;

    const caixa = await prisma.caixa.create({
      data: {
        usuarioAberturaId: balcao.id,
        valorAberturaCentavos: 15000,
        abertoEm: dia,
        fechadoEm: new Date(dia.getTime() + 5 * 3600000),
        valorFechamentoCentavos: 15000,
        status: "FECHADO",
      },
    });

    const quantas = Math.round((7 + Math.random() * 7) * peso);

    for (let v = 0; v < quantas; v += 1) {
      const momento = new Date(dia);
      momento.setHours(17 + Math.floor(Math.random() * 6));
      momento.setMinutes(Math.floor(Math.random() * 60));

      const linhas = new Map<string, number>();
      for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i += 1) {
        const p = urna[Math.floor(Math.random() * urna.length)];
        linhas.set(p.id, (linhas.get(p.id) ?? 0) + 1);
      }

      const itens = [...linhas.entries()].map(([id, quantidade]) => {
        const p = produtos.find((x) => x.id === id)!;
        return {
          produtoId: p.id,
          quantidade,
          precoUnitarioCentavos: p.precoVendaCentavos,
          custoUnitarioCentavos: p.precoCustoCentavos,
          subtotalCentavos: p.precoVendaCentavos * quantidade,
        };
      });

      const subtotal = itens.reduce((s, i) => s + i.subtotalCentavos, 0);
      numero += 1;

      await prisma.venda.create({
        data: {
          numero,
          caixaId: caixa.id,
          usuarioId: balcao.id,
          subtotalCentavos: subtotal,
          descontoCentavos: 0,
          totalCentavos: subtotal,
          formaPagamento: sortearPagamento(),
          criadoEm: momento,
          itens: { create: itens },
        },
      });

      totalVendas += 1;
    }
  }

  // Um caixa aberto para a vitrine mostrar o PDV funcionando de verdade.
  await prisma.caixa.create({
    data: {
      usuarioAberturaId: balcao.id,
      valorAberturaCentavos: 15000,
      status: "ABERTO",
    },
  });

  return { produtos: produtos.length, vendas: totalVendas, dono: dono.email };
}
