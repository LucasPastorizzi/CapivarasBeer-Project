import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Capivaras Beer",
    template: "%s · Capivaras Beer",
  },
  description:
    "Sistema de gestão do Capivaras Beer: vendas, estoque, caixa e relatórios.",
  applicationName: "Capivaras Beer",
  icons: { icon: "/icone.svg", apple: "/icone.svg" },
  // Instalado no celular, abre em tela cheia como aplicativo.
  appleWebApp: { capable: true, title: "Capivaras", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0806",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
