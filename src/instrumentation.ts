/**
 * Roda uma vez quando o servidor sobe, antes de atender a primeira
 * requisição.
 *
 * É onde o modo de demonstração cria o banco efêmero. Fazer isso na primeira
 * consulta seria tarde: a página já teria começado a renderizar contra um
 * banco inexistente.
 */
export async function register() {
  // Só o runtime Node tem sistema de arquivos; o de borda não roda isto.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { prepararDemonstracao } = await import("@/lib/demonstracao");
  await prepararDemonstracao();
}
