# Capivaras Beer — Sistema de Gestão

Sistema de gestão para a conveniência **Capivaras Beer**: controle de produtos,
estoque, vendas (PDV), caixa e relatórios de faturamento.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** para a interface
- **Prisma** + **SQLite** em desenvolvimento (migração para PostgreSQL em produção)

## Funcionalidades planejadas

| Módulo | Descrição |
|---|---|
| Produtos | Cadastro, categorias, preço de custo e venda, código de barras |
| Estoque | Entrada de mercadoria, baixa automática na venda, alerta de estoque baixo |
| PDV | Tela de venda rápida otimizada para celular, com formas de pagamento |
| Caixa | Abertura, fechamento, sangria e conferência |
| Relatórios | Total diário, total mensal, produtos mais vendidos, margem de lucro |
| Usuários | Perfis de dono (acesso total) e balconista (somente PDV) |
| Assistente | Perguntas em português sobre a loja, respondidas a partir dos dados reais |

Todos os módulos acima estão implementados.

## Rodando localmente

```bash
npm install
npm run dev
```

A aplicação sobe em http://localhost:3000

## Assistente

A aba **Assistente** responde perguntas em português consultando os dados
reais: "como foi o movimento este mês", "qual produto me dá mais lucro", "o
que precisa repor". Ele **só lê** — não registra venda, não muda preço, não
mexe no estoque.

Para ligá-lo, coloque uma chave da API da Anthropic no `.env`:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

Sem a chave, a aba avisa que não foi configurada e o resto do sistema segue
funcionando normalmente. Cada pergunta consome créditos da sua conta.

## Instalar como aplicativo

O sistema é um PWA: no navegador, use "Instalar" (Chrome/Edge) ou
"Adicionar à Tela de Início" (celular). Instalado, abre em janela própria, sem
barra de endereço nem abas — o `Ctrl+W` deixa de ser risco no meio de uma
venda.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npm run lint` | Verificação de lint |
| `npm run db:migrate` | Aplica migrações do banco |
| `npm run db:seed` | Cria o catálogo inicial e os usuários |
| `npm run db:demo` | Gera três semanas de movimento fictício para explorar |
| `npm run db:reset` | Recria o banco do zero e roda o seed |
