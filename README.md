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

Todos os módulos acima estão implementados.

## Rodando localmente

```bash
npm install
npm run dev
```

A aplicação sobe em http://localhost:3000

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
