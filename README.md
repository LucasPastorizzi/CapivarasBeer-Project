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

## Rodando localmente

```bash
npm install
npm run dev
```

A aplicação sobe em http://localhost:3000

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npm run lint` | Verificação de lint |
