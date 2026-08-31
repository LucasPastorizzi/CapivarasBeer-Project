"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirDono } from "@/lib/autenticacao";
import { inputParaCentavos } from "@/lib/dinheiro";
import { prisma } from "@/lib/prisma";

export type EstadoProduto = { erro?: string; ok?: string };

const dinheiro = (rotulo: string) =>
  z
    .string()
    .transform((texto) => inputParaCentavos(texto))
    .refine((c): c is number => c !== null, {
      message: `Informe ${rotulo} como número. Exemplo: 5,00`,
    })
    .refine((c) => c >= 0, { message: `${rotulo} não pode ser negativo.` });

/**
 * Custo em branco vale zero, não erro.
 *
 * Quem cadastra um produto no meio do expediente nem sempre tem a nota do
 * fornecedor à mão. Exigir o custo aí trava o cadastro por uma informação que
 * pode ser preenchida depois — e o produto sem custo só perde o cálculo de
 * margem, não a capacidade de ser vendido.
 */
const dinheiroOpcional = (rotulo: string) =>
  z
    .string()
    .transform((texto) => (texto.trim() === "" ? "0" : texto))
    .pipe(dinheiro(rotulo));

const inteiro = (rotulo: string) =>
  z
    .string()
    .transform((t) => (t.trim() === "" ? 0 : Number(t)))
    .refine((n) => Number.isInteger(n) && n >= 0, {
      message: `${rotulo} precisa ser um número inteiro igual ou maior que zero.`,
    });

const esquema = z.object({
  nome: z.string().trim().min(2, "O nome precisa ter ao menos 2 letras."),
  categoriaId: z.string().min(1, "Escolha uma categoria."),
  precoCusto: dinheiroOpcional("o preço de custo"),
  precoVenda: dinheiro("o preço de venda"),
  estoqueMinimo: inteiro("O estoque mínimo"),
  unidade: z.string().trim().min(1).max(6).default("UN"),
  // Vazio vira null: string vazia em coluna única faria o segundo produto
  // sem código colidir com o primeiro.
  codigoBarras: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

function lerFormulario(dados: FormData) {
  return {
    nome: String(dados.get("nome") ?? ""),
    categoriaId: String(dados.get("categoriaId") ?? ""),
    precoCusto: String(dados.get("precoCusto") ?? "0"),
    precoVenda: String(dados.get("precoVenda") ?? ""),
    estoqueMinimo: String(dados.get("estoqueMinimo") ?? "0"),
    unidade: String(dados.get("unidade") || "UN"),
    codigoBarras: String(dados.get("codigoBarras") ?? ""),
  };
}

/** O Prisma sinaliza violação de coluna única com o código P2002. */
function ehCodigoDuplicado(erro: unknown): boolean {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    (erro as { code: unknown }).code === "P2002"
  );
}

export async function criarProduto(
  _anterior: EstadoProduto,
  dados: FormData,
): Promise<EstadoProduto> {
  const sessao = await exigirDono();

  const analise = esquema.safeParse(lerFormulario(dados));
  if (!analise.success) return { erro: analise.error.issues[0].message };

  const estoqueInicial = Number(dados.get("estoqueInicial") ?? 0);
  if (!Number.isInteger(estoqueInicial) || estoqueInicial < 0) {
    return { erro: "O estoque inicial precisa ser um número inteiro." };
  }

  let id: string;

  try {
    const produto = await prisma.$transaction(async (tx) => {
      const criado = await tx.produto.create({
        data: {
          nome: analise.data.nome,
          categoriaId: analise.data.categoriaId,
          precoCustoCentavos: analise.data.precoCusto,
          precoVendaCentavos: analise.data.precoVenda,
          estoqueMinimo: analise.data.estoqueMinimo,
          unidade: analise.data.unidade,
          codigoBarras: analise.data.codigoBarras,
          estoqueAtual: estoqueInicial,
        },
      });

      // Estoque inicial nasce como movimento para que a contagem continue
      // reconstituível a partir da trilha, e não de um número solto.
      if (estoqueInicial > 0) {
        await tx.movimentoEstoque.create({
          data: {
            produtoId: criado.id,
            tipo: "ENTRADA",
            quantidade: estoqueInicial,
            custoUnitarioCentavos: analise.data.precoCusto,
            observacao: "Estoque informado no cadastro",
            usuarioId: sessao.usuarioId,
          },
        });
      }

      return criado;
    });

    id = produto.id;
  } catch (erro) {
    if (ehCodigoDuplicado(erro)) {
      return { erro: "Já existe um produto com esse código de barras." };
    }
    console.error("Falha ao criar produto", erro);
    return { erro: "Não foi possível salvar o produto. Tente de novo." };
  }

  revalidatePath("/produtos");
  revalidatePath("/pdv");
  redirect(`/produtos/${id}?salvo=1`);
}

export async function atualizarProduto(
  _anterior: EstadoProduto,
  dados: FormData,
): Promise<EstadoProduto> {
  await exigirDono();

  const id = String(dados.get("id") ?? "");
  if (!id) return { erro: "Produto não identificado." };

  const analise = esquema.safeParse(lerFormulario(dados));
  if (!analise.success) return { erro: analise.error.issues[0].message };

  try {
    await prisma.produto.update({
      where: { id },
      data: {
        nome: analise.data.nome,
        categoriaId: analise.data.categoriaId,
        precoCustoCentavos: analise.data.precoCusto,
        precoVendaCentavos: analise.data.precoVenda,
        estoqueMinimo: analise.data.estoqueMinimo,
        unidade: analise.data.unidade,
        codigoBarras: analise.data.codigoBarras,
      },
    });
  } catch (erro) {
    if (ehCodigoDuplicado(erro)) {
      return { erro: "Já existe um produto com esse código de barras." };
    }
    console.error("Falha ao atualizar produto", erro);
    return { erro: "Não foi possível salvar o produto. Tente de novo." };
  }

  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
  revalidatePath("/pdv");
  return { ok: "Alterações salvas." };
}

/**
 * Produto sai de circulação desativado, nunca apagado: excluir quebraria as
 * vendas antigas que apontam para ele e apagaria o histórico junto.
 */
export async function alternarAtivo(dados: FormData): Promise<void> {
  await exigirDono();

  const id = String(dados.get("id") ?? "");
  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) return;

  await prisma.produto.update({
    where: { id },
    data: { ativo: !produto.ativo },
  });

  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
  revalidatePath("/pdv");
}

const esquemaCategoria = z.object({
  nome: z.string().trim().min(2, "O nome da categoria é muito curto."),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor."),
});

export async function criarCategoria(
  _anterior: EstadoProduto,
  dados: FormData,
): Promise<EstadoProduto> {
  await exigirDono();

  const analise = esquemaCategoria.safeParse({
    nome: dados.get("nome") ?? "",
    cor: dados.get("cor") ?? "#f59e0b",
  });

  if (!analise.success) return { erro: analise.error.issues[0].message };

  const existente = await prisma.categoria.findUnique({
    where: { nome: analise.data.nome },
  });

  if (existente) return { erro: "Já existe uma categoria com esse nome." };

  await prisma.categoria.create({ data: analise.data });

  revalidatePath("/produtos");
  return { ok: `Categoria ${analise.data.nome} criada.` };
}
