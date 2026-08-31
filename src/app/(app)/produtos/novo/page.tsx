import { FormularioProduto } from "@/components/formulario-produto";
import { Painel } from "@/components/ui";
import { exigirDono } from "@/lib/autenticacao";
import { listarCategorias } from "@/lib/produtos";

export const metadata = { title: "Novo produto" };

export default async function PaginaNovoProduto() {
  await exigirDono();
  const categorias = await listarCategorias();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Novo produto</h1>
      </header>
      <Painel>
        <FormularioProduto categorias={categorias} />
      </Painel>
    </div>
  );
}
