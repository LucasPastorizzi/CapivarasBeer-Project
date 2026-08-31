/**
 * Gera três semanas de movimento plausível para explorar o sistema cheio.
 *
 * Não é seed: o seed cria o catálogo real que a loja vai usar, este script
 * cria histórico fictício. Separar os dois evita que dado de demonstração
 * entre em produção por engano.
 *
 * Executar com `npm run db:demo`. Para voltar ao catálogo limpo,
 * `npm run db:reset`.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

const DIAS = 21;

/**
 * Movimento relativo por dia da semana, seguindo o horário real da loja:
 * fecha domingo e segunda, enche na sexta e no sábado.
 */
const PESO_DIA = [0, 0, 0.55, 0.6, 0.7, 1, 1.4];

/** Formas de pagamento com a distribuição típica de uma conveniência. */
const PAGAMENTOS: [string, number][] = [
  ["PIX", 0.42],
  ["DEBITO", 0.24],
  ["DINHEIRO", 0.2],
  ["CREDITO", 0.14],
];

function sortear<T>(itens: T[]): T {
  return itens[Math.floor(Math.random() * itens.length)];
}

function sortearPagamento(): string {
  const n = Math.random();
  let acumulado = 0;
  for (const [forma, peso] of PAGAMENTOS) {
    acumulado += peso;
    if (n <= acumulado) return forma;
  }
  return "PIX";
}

async function main() {
  const dono = await prisma.usuario.findFirstOrThrow({ where: { papel: "DONO" } });
  const balconista = await prisma.usuario.findFirst({
    where: { papel: "BALCONISTA" },
  });
  const operador = balconista ?? dono;

  const produtos = await prisma.produto.findMany({ where: { ativo: true } });
  if (produtos.length === 0) {
    throw new Error("Nenhum produto cadastrado. Rode `npm run db:seed` antes.");
  }

  // Cerveja e gelo saem muito mais que destilado: repetir os campeões na
  // urna faz a curva de "mais vendidos" ter a forma que a loja tem.
  const urna = produtos.flatMap((p) => {
    const categoria = p.nome.toLowerCase();
    const repeticoes = /lata|long neck|gelo|garrafa/.test(categoria) ? 6 : 1;
    return Array.from({ length: repeticoes }, () => p);
  });

  // Reabastece antes de vender, senão três semanas de venda zeram a
  // prateleira e o histórico fica mentindo sobre o estoque de hoje.
  for (const produto of produtos) {
    const reposicao = 400;
    await prisma.produto.update({
      where: { id: produto.id },
      data: { estoqueAtual: { increment: reposicao } },
    });
    await prisma.movimentoEstoque.create({
      data: {
        produtoId: produto.id,
        tipo: "ENTRADA",
        quantidade: reposicao,
        custoUnitarioCentavos: produto.precoCustoCentavos,
        observacao: "Reposição para dados de demonstração",
        usuarioId: dono.id,
      },
    });
  }

  const ultimoNumero =
    (await prisma.venda.findFirst({ orderBy: { numero: "desc" } }))?.numero ?? 0;
  let numero = ultimoNumero;
  let totalVendas = 0;

  for (let d = DIAS - 1; d >= 0; d -= 1) {
    const dia = new Date();
    dia.setDate(dia.getDate() - d);
    dia.setHours(17, 0, 0, 0);

    const peso = PESO_DIA[dia.getDay()];
    if (peso === 0) continue;

    const quantidadeDeVendas = Math.round((8 + Math.random() * 10) * peso);
    if (quantidadeDeVendas === 0) continue;

    const abertura = new Date(dia);
    const caixa = await prisma.caixa.create({
      data: {
        usuarioAberturaId: operador.id,
        valorAberturaCentavos: 15000,
        abertoEm: abertura,
        status: "FECHADO",
      },
    });

    let dinheiroNoCaixa = 15000;

    for (let v = 0; v < quantidadeDeVendas; v += 1) {
      const momento = new Date(dia);
      momento.setHours(17 + Math.floor(Math.random() * 6));
      momento.setMinutes(Math.floor(Math.random() * 60));

      const quantosItens = 1 + Math.floor(Math.random() * 3);
      const escolhidos = new Map<string, number>();
      for (let i = 0; i < quantosItens; i += 1) {
        const p = sortear(urna);
        escolhidos.set(p.id, (escolhidos.get(p.id) ?? 0) + 1 + Math.floor(Math.random() * 2));
      }

      const linhas = [...escolhidos.entries()].map(([id, quantidade]) => {
        const produto = produtos.find((p) => p.id === id)!;
        return {
          produto,
          quantidade,
          subtotalCentavos: produto.precoVendaCentavos * quantidade,
        };
      });

      const subtotalCentavos = linhas.reduce((s, l) => s + l.subtotalCentavos, 0);
      const formaPagamento = sortearPagamento();
      numero += 1;

      const venda = await prisma.venda.create({
        data: {
          numero,
          caixaId: caixa.id,
          usuarioId: operador.id,
          subtotalCentavos,
          descontoCentavos: 0,
          totalCentavos: subtotalCentavos,
          formaPagamento,
          criadoEm: momento,
          itens: {
            create: linhas.map((l) => ({
              produtoId: l.produto.id,
              quantidade: l.quantidade,
              precoUnitarioCentavos: l.produto.precoVendaCentavos,
              custoUnitarioCentavos: l.produto.precoCustoCentavos,
              subtotalCentavos: l.subtotalCentavos,
            })),
          },
        },
      });

      for (const l of linhas) {
        await prisma.produto.update({
          where: { id: l.produto.id },
          data: { estoqueAtual: { decrement: l.quantidade } },
        });
        await prisma.movimentoEstoque.create({
          data: {
            produtoId: l.produto.id,
            tipo: "SAIDA_VENDA",
            quantidade: -l.quantidade,
            custoUnitarioCentavos: l.produto.precoCustoCentavos,
            vendaId: venda.id,
            usuarioId: operador.id,
            criadoEm: momento,
          },
        });
      }

      if (formaPagamento === "DINHEIRO") dinheiroNoCaixa += subtotalCentavos;
      totalVendas += 1;
    }

    // Fecha o turno conferindo certo na maioria das noites e com pequena
    // diferença de vez em quando, que é o que acontece de verdade.
    const desvio = Math.random() < 0.25 ? Math.round((Math.random() - 0.5) * 800) : 0;
    const fechamento = new Date(dia);
    fechamento.setHours(23, 45, 0, 0);

    await prisma.caixa.update({
      where: { id: caixa.id },
      data: {
        fechadoEm: fechamento,
        valorFechamentoCentavos: dinheiroNoCaixa + desvio,
      },
    });
  }

  console.log(`${totalVendas} vendas geradas em ${DIAS} dias.`);
  console.log(`Total de vendas no banco: ${await prisma.venda.count()}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
