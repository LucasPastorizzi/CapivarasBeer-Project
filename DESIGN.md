# Design

Sistema visual do Capivaras Beer — **um produto Flypi Enterprise**
(flypi.com.br) entregue à loja.

Duas marcas convivem, e a hierarquia entre elas é a decisão que organiza todo
o resto: **a linguagem visual é da Flypi, o conteúdo é da loja.** A Flypi dá o
preto, o amarelo, a serifada e a pílula; o Capivaras Beer dá o nome, a
capivara e os dados. Quem fez assina no rodapé; quem usa ocupa o topo.

Isso resolve um conflito concreto: as duas marcas são amarelas. Se a capivara
aparecesse dourada ao lado de um botão amarelo, o olho procuraria ação onde só
há identidade. Por isso a marca da loja é branca, e o amarelo ficou reservado
a uma coisa só — o que se clica.

## Theme

**Escuro, e por dois motivos que coincidem.** A loja abre às 17h e fecha à
meia-noite: o balconista encara a tela por sete horas sob luz baixa, e uma
interface branca nesse ambiente é uma lanterna na cara de quem trabalha. E o
preto é a base da identidade da Flypi. A condição de uso e a marca pedem a
mesma coisa.

Os neutros são **sem tinta** — cinzas puros, do preto absoluto da Flypi para
cima. A versão anterior puxava para o marrom da madeira do logo da loja; com o
amarelo da Flypi no comando, o neutro quente sujava o acento. Cor agora só
aparece onde carrega significado.

## Color

Estratégia: **Restrained**. Um acento dourado carrega ações primárias e seleção;
todo o resto é neutro. A cor nunca é o único sinal de estado — sempre acompanha
ícone e texto.

### Superfícies

| Token | Hex | Uso |
|---|---|---|
| `--color-sidebar` | `#000000` | Barra lateral: o preto da Flypi, mais fundo que o conteúdo |
| `--color-bg` | `#0d0d0e` | Fundo da área de conteúdo |
| `--color-surface` | `#18181b` | Painéis, tabelas, formulários |
| `--color-surface-alto` | `#27272a` | Linha em hover, campo de entrada, elemento elevado |
| `--color-borda` | `#2e2e2e` | Bordas — o mesmo cinza que a Flypi usa no site |

A distância entre a barra lateral e o conteúdo foi aberta de 0.02 para 0.06 de
luminosidade depois que os dois planos se mostraram indistinguíveis na tela —
a lateral não se lia como uma camada separada.

### Texto

| Token | Contraste mínimo | Uso |
|---|---|---|
| `--color-ink` `#ffffff` | 14.89:1 | Texto principal, números |
| `--color-ink-medio` `#a3a3a3` | 5.90:1 | Rótulos, texto de apoio, placeholder |
| `--color-ink-fraco` `#919195` | 4.74:1 | Metadados, cabeçalho de tabela |

O `ink-fraco` nasceu em `#8b8b8f` e reprovou: 4.39:1 sobre o painel elevado.
Foi clareado até passar.

Nenhum token de texto fica abaixo de 4.5:1 em nenhuma das quatro superfícies —
inclusive placeholders, que é onde interface escura costuma falhar.

### Acentos e estados

| Token | Hex | Papel |
|---|---|---|
| `--color-marca` | `#fde047` | O amarelo da Flypi: ação primária e item de menu ativo |
| `--color-neon` | `#30aff8` | Anel de foco e links |
| `--color-ok` | `#5bcc80` | Venda concluída, caixa conferido |
| `--color-alerta` | `#ff9845` | Estoque abaixo do mínimo |
| `--color-perigo` | `#f75d59` | Venda cancelada, quebra de caixa, exclusão |

O amarelo é reservado a ação e seleção — nunca decoração, nunca identidade. O
azul é o anel de foco: separa "onde estou navegando" de "qual o estado do
dado", que é justamente onde interfaces de PDV confundem o operador.

## Typography

Duas famílias, com fronteira rígida.

**Instrument Serif** — a serifada da Flypi — aparece em exatamente dois
lugares: título de página e logotipo. Um peso só, porque não há hierarquia
dentro dela para justificar mais.

**Geist Sans** carrega todo o resto: rótulo, tabela, número, botão, corpo.
Nenhum dado usa a serifada, e a razão é prática: coluna de valor precisa de
dígito de largura fixa para ser conferida, e é o Geist que entrega isso.

Essa fronteira é o que separa "sistema com voz" de "sistema enfeitado". A
serifada dá identidade ao topo da página; abaixo dela, tudo desaparece dentro
da tarefa.

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


## Forma

**Ação é pílula, campo é reto.** A regra vem da Flypi, que usa botões
totalmente arredondados no site, e vale sem exceção no sistema: onde se clica
tem `--radius-acao` (9999px), onde se digita tem `--radius-campo` (0.5rem).

Isso não é decoração — é uma pista de affordance consistente. Num sistema com
seletores segmentados (período do relatório, forma de pagamento, tipo de
movimento), a pílula diz "isto responde ao clique" antes de qualquer cor.

Painéis usam `--radius-painel` (0.875rem): mais brando que a pílula, mais
presente que o campo, para a moldura não competir com o que ela contém.

## Assinatura

A Flypi assina em dois lugares, ambos discretos e ambos fora do caminho da
tarefa: no rodapé da barra lateral, abaixo da conta do usuário, e na tela de
entrada, depois de uma linha separadora. Os dois levam a flypi.com.br.

O símbolo é uma redução do logotipo a dois traços — a diagonal ascendente e a
curva da asa. É provisório: o logotipo original é um PNG hospedado no site da
Flypi, e o arquivo vetorial deve substituir esta redução quando estiver
disponível.
