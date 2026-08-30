# Product

## Register

product

## Users

**Balconista contratado.** Fica atrás do balcão das 17h à meia-noite (sábado a
partir das 15h), com notebook e leitor de código de barras. Rotativo e sem
treinamento formal: precisa conseguir registrar a primeira venda no primeiro
dia. Trabalha sob luz baixa, muitas vezes com fila esperando, e o custo de um
erro de digitação é dinheiro faltando na gaveta no fim da noite.

**Dono.** Usa o sistema fora do horário de balcão, para entender o que a loja
faturou, o que está acabando na prateleira e onde está a margem. Quer resposta,
não planilha.

## Product Purpose

Substituir o caderno e a calculadora na operação do Capivaras Beer — uma loja
de conveniência e bebidas em Lindolfo Collor/RS. O sistema registra vendas,
mantém o estoque fiel à prateleira, fecha o caixa do turno e transforma isso em
número diário e mensal que o dono usa para decidir o que comprar.

Sucesso é: o balconista prefere o sistema ao caderno porque é mais rápido, e o
dono confia no total do fim do mês sem conferir na mão.

## Brand Personality

Ferramenta séria. Sóbria, densa, rápida. A marca — a capivara, o dourado sobre
madeira escura, o neon azul da fachada — vive no logo e nos acentos; o resto da
interface desaparece dentro da tarefa. Voz direta em português do Brasil, sem
jargão de software: "Fechar caixa", não "Encerrar sessão operacional".

## Anti-references

- **ERP de conveniência tradicional** (menus cinza, dez abas, campo obrigatório
  que ninguém entende). O sistema não pode parecer software de 2008.
- **Dashboard de SaaS genérico**: número gigante em gradiente, cards idênticos
  em grade, métrica sem contexto.
- **Interface "temática" de cervejaria**: textura de madeira, tipografia de
  rótulo, ícone de caneca em tudo. Compete com a leitura dos números.

## Design Principles

1. **A gaveta é a fonte da verdade.** Todo número na tela precisa bater com o
   dinheiro contado no fim do turno. Nada de arredondamento silencioso.
2. **Errar deve ser difícil, corrigir deve ser fácil.** Confirmação onde o erro
   custa caro (cancelar venda, ajustar estoque), desfazer onde não custa.
3. **O teclado manda.** O balconista tem teclado e leitor de código de barras:
   busca com foco automático, atalhos, Enter conclui. O mouse é o caminho lento.
4. **Todo número explica de onde veio.** Nenhum total é caixa-preta: sempre há
   como abrir e ver as vendas que o compõem.
5. **A tela vazia ensina.** Estoque zerado, dia sem venda e caixa fechado dizem
   o que fazer em seguida, não apenas "nenhum registro".

## Accessibility & Inclusion

- WCAG 2.1 AA: texto corrido ≥ 4.5:1, texto grande ≥ 3:1, incluindo placeholders.
- Cor nunca é o único sinal: estoque baixo, venda cancelada e quebra de caixa
  carregam ícone e texto além da cor — a loja tem operadores diferentes a cada
  turno e daltonismo é comum demais para apostar.
- Todo fluxo de venda é completável só pelo teclado, com foco visível.
- `prefers-reduced-motion` respeitado em todas as transições.
