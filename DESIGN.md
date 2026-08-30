# Design

Sistema visual do Capivaras Beer. Derivado da identidade real da loja: logo
dourado sobre madeira escura, fachada em neon azul, operação noturna.

## Theme

**Escuro, e por um motivo concreto.** A loja abre às 17h e fecha à meia-noite.
O balconista encara a tela por sete horas sob luz baixa, com o neon azul da
fachada às costas. Uma interface branca nesse ambiente é uma lanterna na cara
de quem trabalha. O tema escuro aqui não é estética de ferramenta — é a
condição física de uso.

Os neutros são levemente quentes (chroma 0.007–0.012 no matiz 75, o mesmo da
madeira do logo). Não são cinza puro nem bege: puxam para o marrom da marca o
suficiente para o dourado assentar sem vibrar.

## Color

Estratégia: **Restrained**. Um acento dourado carrega ações primárias e seleção;
todo o resto é neutro. A cor nunca é o único sinal de estado — sempre acompanha
ícone e texto.

### Superfícies

| Token | OKLCH | Hex | Uso |
|---|---|---|---|
| `--color-sidebar` | `0.135 0.007 75` | `#0a0806` | Barra lateral: segunda camada neutra, mais funda que o conteúdo |
| `--color-bg` | `0.155 0.008 75` | `#0e0c09` | Fundo da área de conteúdo |
| `--color-surface` | `0.205 0.010 75` | `#1a1712` | Painéis, tabelas, formulários |
| `--color-surface-alto` | `0.255 0.012 75` | `#26221c` | Linha em hover, campo de entrada, elemento elevado |

### Texto

| Token | Contraste mínimo | Uso |
|---|---|---|
| `--color-ink` | 14.26:1 | Texto principal, números |
| `--color-ink-medio` | 7.35:1 | Rótulos, texto de apoio, placeholder |
| `--color-ink-fraco` | 4.69:1 | Metadados, cabeçalho de tabela |

Nenhum token de texto fica abaixo de 4.5:1 em nenhuma das quatro superfícies —
inclusive placeholders, que é onde interface escura costuma falhar.

### Acentos e estados

| Token | OKLCH | Hex | Papel |
|---|---|---|---|
| `--color-ouro` | `0.800 0.130 82` | `#e7b551` | Marca, ação primária, item de menu ativo |
| `--color-neon` | `0.720 0.150 240` | `#30aff8` | Anel de foco e links — o azul da fachada |
| `--color-ok` | `0.760 0.150 152` | `#5bcc80` | Venda concluída, caixa conferido |
| `--color-alerta` | `0.780 0.160 55` | `#ff9845` | Estoque abaixo do mínimo |
| `--color-perigo` | `0.680 0.190 25` | `#f75d59` | Venda cancelada, quebra de caixa, exclusão |

O dourado fica reservado a ação primária e seleção. O azul do neon é o anel de
foco: separa "onde estou navegando" de "qual o estado do dado", que é
justamente onde interfaces de PDV confundem o operador.

## Typography

Uma família só: **Geist Sans**, em pesos 400/500/600. Produto não precisa de
par display/corpo, e um segundo tipo aqui só criaria ruído entre rótulo e
número.

Escala fixa em rem (razão ~1.2), não fluida — o operador usa sempre o mesmo
notebook, e título que encolhe dentro de painel piora a leitura.

| Passo | Tamanho | Uso |
|---|---|---|
| `--text-xs` | 0.75rem | Metadado, unidade |
| `--text-sm` | 0.875rem | Rótulo, célula de tabela |
| `--text-base` | 1rem | Corpo |
| `--text-lg` | 1.25rem | Título de painel |
| `--text-xl` | 1.5rem | Título de página |
| `--text-2xl` | 1.875rem | Total em destaque |

**Todo número monetário usa `font-variant-numeric: tabular-nums`.** Sem isso as
colunas de valor dançam entre as linhas e conferir a coluna vira trabalho.

## Layout

Barra lateral fixa de 15rem no desktop, que vira barra inferior no celular.
Responsividade é estrutural — a lateral colapsa, a tabela troca de forma — nunca
tipografia fluida.

Área de conteúdo com largura máxima de 80rem, respirando 2rem nas laterais.

## Motion

150–250ms, `ease-out`. Movimento comunica estado (item entrou no carrinho,
linha salvou, painel abriu) e nada mais. Sem sequência de entrada na carga da
página: o operador abre o sistema para vender, não para assistir.

`prefers-reduced-motion: reduce` zera toda duração.

## Components

Todo componente interativo entrega os sete estados: padrão, hover, foco, ativo,
desabilitado, carregando e erro. Skeleton na carga, nunca spinner no meio do
conteúdo.

Raio de canto: 0.5rem em campos e botões, 0.75rem em painéis. Bordas de 1px em
`oklch(0.30 0.012 75)`.
