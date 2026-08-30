/**
 * Normaliza texto para busca: sem acento, em minúsculas.
 *
 * Fica fora dos módulos server-only porque a busca do PDV roda no navegador,
 * a cada tecla digitada. O intervalo ̀-ͯ são as marcas de acento
 * que o NFD separa da letra base.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
