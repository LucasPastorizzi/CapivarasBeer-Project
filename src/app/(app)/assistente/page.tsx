import { AssistenteConversa } from "@/components/assistente-conversa";
import { exigirDono } from "@/lib/autenticacao";

export const metadata = { title: "Assistente" };

export default async function PaginaAssistente() {
  // O assistente lê faturamento, custo e margem: informação do dono.
  await exigirDono();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[2.125rem] leading-none font-normal">Assistente</h1>
        <p className="mt-1 max-w-prose text-sm text-ink-medio">
          Pergunte em português sobre o que está acontecendo na loja. Ele
          consulta vendas, estoque, caixa e margem antes de responder — e só
          lê, nunca altera nada.
        </p>
      </header>

      <AssistenteConversa />
    </div>
  );
}
