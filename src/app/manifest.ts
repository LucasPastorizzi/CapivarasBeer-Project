import type { MetadataRoute } from "next";

/**
 * Manifesto que transforma o sistema em aplicativo instalável.
 *
 * Instalado, ele abre em janela própria — sem barra de endereço, sem abas —
 * e ganha ícone na área de trabalho. Para o balconista a diferença prática é
 * grande: não dá para fechar a loja sem querer clicando no X da aba errada,
 * e o Ctrl+W não mata a venda em andamento.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Capivaras Beer — Gestão",
    short_name: "Capivaras",
    description:
      "Vendas, estoque, caixa e relatórios da conveniência Capivaras Beer.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#15120e",
    theme_color: "#080604",
    icons: [
      {
        src: "/icone.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icone-mascara.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity"],
  };
}
