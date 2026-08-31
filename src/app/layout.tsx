import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// A serifada da Flypi. Um só peso, porque ela aparece só em título de página
// e no logotipo — não há hierarquia dentro dela para justificar mais.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Capivaras Beer",
    template: "%s · Capivaras Beer",
  },
  description:
    "Sistema de gestão do Capivaras Beer: vendas, estoque, caixa e relatórios.",
  applicationName: "Capivaras Beer",
  authors: [{ name: "Flypi Enterprise", url: "https://flypi.com.br" }],
  creator: "Flypi Enterprise",
  publisher: "Flypi Enterprise",
  icons: { icon: "/icone.svg", apple: "/icone.svg" },
  // Instalado no celular, abre em tela cheia como aplicativo.
  appleWebApp: { capable: true, title: "Capivaras", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
