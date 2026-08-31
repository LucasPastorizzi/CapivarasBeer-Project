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
| `--color-sidebar` | `0.125 0.007 75` | `#080604` | Barra lateral: segunda camada neutra, mais funda que o conteúdo |
| `--color-bg` | `0.185 0.009 75` | `#15120e` | Fundo da área de conteúdo |
| `--color-surface` | `0.225 0.011 75` | `#1f1b16` | Painéis, tabelas, formulários |
| `--color-surface-alto` | `0.275 0.013 75` | `#2b2721` | Linha em hover, campo de entrada, elemento elevado |

A distância entre a barra lateral e o conteúdo foi aberta de 0.02 para 0.06 de
luminosidade depois que os dois planos se mostraram indistinguíveis na tela —
a lateral não se lia como uma camada separada.

### Texto

| Token | Contraste mínimo | Uso |
|---|---|---|
| `--color-ink` | 13.41:1 | Texto principal, números |
| `--color-ink-medio` | 6.91:1 | Rótulos, texto de apoio, placeholder |
| `--color-ink-fraco` | 4.68:1 | Metadados, cabeçalho de tabela |

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


## Cores dos gráficos

A paleta categórica dos gráficos é **validada por script**, não escolhida a
olho: banda de luminosidade para fundo escuro (L 0.48–0.67), piso de croma,
separação sob protanopia e deuteranopia (ΔE OKLab) e contraste contra a
superfície.

| Slot | Hex | Uso |
|---|---|---|
| `--color-serie-1` | `#2f8adc` | Dinheiro; também a série única de gráficos sem categoria |
| `--color-serie-2` | `#c1297e` | Pix |
| `--color-serie-3` | `#00a8a9` | Débito |
| `--color-serie-4` | `#8254c4` | Crédito |

Três regras que a paleta obedece:

1. **A ordem é fixa e a cor segue a entidade, nunca a posição no ranking.** Se
   o Pix passar o dinheiro no mês seguinte, cada forma mantém a própria cor.
2. **A paleta fica inteira no lado frio.** O quente está reservado à marca
   (ouro) e aos estados (alerta, perigo, ok) — nenhuma série pode ser
   confundida com "estoque baixo".
3. **Cor nunca é a única identidade.** Toda série aparece com o nome escrito ao
   lado do ponto colorido.

A primeira tentativa reprovou: teal e magenta ficaram com ΔE 3.5 sob
deuteranopia. A segunda passou em tudo menos contraste, com o violeta em
2.73:1. A versão final clareia o violeta para L 0.55 e passa nas cinco
verificações.

## Gráficos

| Dado | Forma | Por quê |
|---|---|---|
| Faturamento por dia (14 dias) | Barras verticais | Magnitude ao longo do tempo, série única — o título nomeia, não há legenda |
| Formas de pagamento | Barra de composição + linhas rotuladas | Parte de um todo com 4 categorias; a lista dá o valor exato que a barra só sugere |
| Mais vendidos | Barras horizontais com rótulo direto | Ranking; nome longo cabe na horizontal |

Dias sem venda entram na série com zero em vez de sumir: um buraco é
informação — a loja não abre domingo e segunda — e uma barra ausente mentiria
sobre o ritmo da semana. O dia de hoje aparece em ouro, para separar "o que já
acontece" de "o que já aconteceu".
