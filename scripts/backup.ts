/**
 * Backup do banco, com verificação.
 *
 * Duas decisões que separam backup de cópia de arquivo:
 *
 * 1. Usa a API de backup do SQLite, não `cp`. Copiar o arquivo enquanto uma
 *    venda está sendo gravada produz um banco corrompido — e o problema só
 *    aparece no dia em que você precisa restaurar.
 * 2. Abre a cópia e roda verificação de integridade antes de considerar o
 *    backup válido. Backup que ninguém testou não é backup, é esperança.
 *
 * Executar com `npm run backup`. Em produção, uma vez por dia.
 */
import Database from "better-sqlite3";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

/** Quantas cópias manter. Um mês cobre "só percebi semana passada". */
const COPIAS_MANTIDAS = 30;

function caminhoDoBanco(): string {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  return url.replace(/^file:/, "");
}

function carimbo(): string {
  const agora = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}_${p(agora.getHours())}${p(agora.getMinutes())}`;
}

async function main() {
  const origem = caminhoDoBanco();

  if (!existsSync(origem)) {
    console.error(`Banco não encontrado em ${origem}. Nada a copiar.`);
    process.exit(1);
  }

  const pasta = process.env.BACKUP_DIR ?? "./backups";
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });

  const destino = join(pasta, `capivaras_${carimbo()}.db`);

  const banco = new Database(origem, { readonly: true });
  await banco.backup(destino);
  banco.close();

  // Verificação: abre a cópia e pergunta ao próprio SQLite se ela está sã.
  const copia = new Database(destino, { readonly: true });
  const integridade = copia
    .prepare("PRAGMA integrity_check")
    .get() as { integrity_check: string };

  const vendas = copia.prepare("SELECT COUNT(*) AS total FROM Venda").get() as {
    total: number;
  };
  const produtos = copia
    .prepare("SELECT COUNT(*) AS total FROM Produto")
    .get() as { total: number };
  copia.close();

  if (integridade.integrity_check !== "ok") {
    console.error(`Backup gerado mas REPROVADO na verificação: ${integridade.integrity_check}`);
    console.error(`Arquivo suspeito mantido para análise: ${destino}`);
    process.exit(1);
  }

  const tamanho = (statSync(destino).size / 1024 / 1024).toFixed(1);
  console.log(
    `Backup OK: ${destino} (${tamanho} MB) — ${vendas.total} vendas, ${produtos.total} produtos.`,
  );

  // Rotação: mantém as mais recentes e apaga o excedente.
  const copias = readdirSync(pasta)
    .filter((n) => n.startsWith("capivaras_") && n.endsWith(".db"))
    .sort()
    .reverse();

  for (const antiga of copias.slice(COPIAS_MANTIDAS)) {
    unlinkSync(join(pasta, antiga));
    console.log(`Backup antigo removido: ${antiga}`);
  }

  console.log(`${Math.min(copias.length, COPIAS_MANTIDAS)} cópias guardadas em ${pasta}`);
}

main().catch((erro) => {
  console.error("Falha no backup:", erro);
  process.exit(1);
});
