# Design da interface

Status: leiaute redesenhado em 2026-11-17 (D29–D31), aguardando validação do usuário. O protótipo
da E0-03 (2026-11-16) fica como referência histórica do biomonitor.

## Princípios

- Hierarquia antes de densidade: quem sou → como estou → o que sei fazer → atalhos.
- Uma cor de destaque escolhida pelo jogador; todo o resto deriva dela.
- Cores de estado (ferimento, alerta, sucesso) são semânticas e fixas: o jogador que
  escolhe verde não pode confundir "ferido" com "destaque".
- Tipografia do próprio sistema: Tektur para números e títulos, Jost para texto
  (carregadas pelo CPR; não redistribuir).
- Nada de rótulo truncado no nível principal: menos itens, maiores, com dica no hover.
- Movimento tem propósito (ECG, foco, abrir gaveta) e desliga com redução de movimento.

## Leiaute (D29, redesenho de 2026-11-17; borda inferior, `min(900px, 100%)`)

```
                ★ Perception 14  Stealth 8        [☰][▣][⌁][€][✚][🎲]  [🎨][⌄]   ← faixa de abas
┌──────────┬──────────────────────────────────────────────┬────────────────────┐
│  ╭────╮  │ SEORIN KWON  “alias”            [NETRUNNER 4] │ INT REF DEX TEC COOL│
│ ( ⬡  ) │ ∿∿∿╱╲∿∿∿∿∿∿╱╲∿∿∿∿∿∿∿∿╱╲∿∿∿∿∿∿∿  ◆ NÃO FERIDO│  8   6   6   6   6  │
│  ╰35/35╯ │ ⛨ HEAD 11 BODY 9 │ HUM 32/42 ▔ │ LUCK ◆◆◆◇ │ ☠ │ WILL MOVE BODY LUCK │
└──────────┴──────────────────────────────────────────────┴────────────────────┘
```

- Grade única no `.ccp-panel`; as partes `identity` e `vitals` usam `display: contents` e
  seus filhos ocupam áreas próprias (`portrait`, `name`, `monitor`, `chips`). O fundo do
  corpo é o `::before` da grade (área de `name` até `chips`), então a faixa de abas e a gaveta
  ficam fora do corpo, como abas de pasta. As áreas vêm de variáveis (`--ccp-head`,
  `--ccp-body`), e o encaixe em cima só inverte a ordem.
- Retrato octogonal dentro do anel de HP: SVG com `pathLength=100`, arco de 270° (`hp.arc` do
  domínio), segmentado por máscara, na cor do estado vital; brilho radial do estado atrás do
  retrato. O valor de HP fica no vão inferior do anel (clique edita); −5/−1 e +1/+5 aparecem
  nas laterais ao passar o mouse no retrato ou com foco (sempre visíveis sem hover).
- ECG estreito (130–170 px × 40 px) sem moldura, com grade que se apaga nas bordas e BPM com
  coração pulsando no canto; fica ao lado dos chips (D34) e nasce sob a borda do anel, com grade em
  elipse e linha base na cor do estado (D35). O estado de ferimento é o primeiro chip.
- Painel de instrumentos (D41): células SP, HUM (com barra), LUCK (losangos clicáveis, menores de 9 a 12;
  número com −/+ acima de 12 ou acima do máximo, D42) e Death Save só quando importa (D30), como célula-botão de rolar; a penalidade
  se ajusta na gaveta Saúde. O estado de ferimento é a legenda do ECG.
- STATs: teclado 5×2 com barra de nível (valor/10) na base de cada tecla.
- Abas: só ícone (dica no hover); a aberta fica com o ícone destacado na cor de destaque (D43). Facedown é aba de ação
  (hachurada). Favoritas ocupam o resto da faixa à esquerda; com muitas, a roda do mouse rola na
  horizontal e as bordas esmaecem do lado em que há mais (D36).
- Gaveta acima da faixa (abaixo no encaixe em cima), com animação curta de abertura.
- `ccp-narrow` (< 760 px): STATs viram uma linha de 10 abaixo do corpo. `ccp-tiny` (< 520 px):
  chips em linha própria, anel menor, sem alias. Compacto: retrato/anel, nome e chips, sem ECG (D34).
- Recolhido (D37): retrato circular no anel de HP, nome pequeno sobre o mini ECG e expandir.
- Borda esquerda alinhada à hotbar (D33), dentro dos limites da coluna central do Foundry.

## Linguagem visual

- Painéis escuros translúcidos (`rgb(10 12 18 / .92)`) com borda de 1 px em destaque a
  ~40%, cantos chanfrados, linha de varredura sutil e ruído leve opcional.
- Brilho (`box-shadow`/`drop-shadow`) só em elementos ativos ou em foco.
- Ícones: Font Awesome Free que o Foundry já carrega; SVGs próprios se precisar.
- Microinterações: hover eleva o brilho; clique dá um "glitch" curto de 120 ms (desligável).

## Sistema de cores

Entrada: uma cor de destaque (hex) por usuário. Domínio puro (`src/domain/palette.ts`)
gera as variáveis e calcula o contraste; testado sem Foundry.

| Variável | Origem |
|---|---|
| `--ccp-accent` | Escolha do usuário |
| `--ccp-accent-strong` / `--ccp-accent-soft` | Mais clara / mais transparente (OKLCH ou HSL calculado no TS) |
| `--ccp-accent-ink` | Texto sobre o destaque: preto ou branco pelo maior contraste WCAG |
| `--ccp-border`, `--ccp-glow` | Destaque com alfa |
| `--ccp-bg`, `--ccp-surface`, `--ccp-text`, `--ccp-text-dim` | Fixas (tema escuro) |
| `--ccp-ok`, `--ccp-warn`, `--ccp-serious`, `--ccp-critical`, `--ccp-dead` | Fixas, semânticas |

Se o destaque escolhido ficar perto demais de uma cor de ferimento, o domínio sinaliza, o
batimento saudável passa a `--ccp-ok` e o editor avisa (D26). Implementado na E5.

### Color picker

- Editor no próprio painel (engrenagem): `<input type="color">` nativo, campo hex,
  8 predefinições (ex.: vermelho neon, ciano, amarelo, magenta, verde ácido, laranja,
  violeta, branco gelo) e prévia ao vivo antes de salvar.
- Também na tela de configurações do Foundry: `ColorField` funciona na V12 e vira `<color-picker>` (E0-02).
- Guardado em ajuste de cliente; o mestre pode definir uma cor padrão do mundo.

## Biomonitor (indicador vital)

Desenho próprio (D08); o PneumaCombatTools serviu só de inspiração conceitual.

- SVG com `viewBox` largo e baixo; grade fina de fundo; linha base apagada; traço animado
  por `stroke-dasharray`/`stroke-dashoffset` com `pathLength="100"`, em camadas
  (rastro esmaecido + cabeça brilhante).
- Estado vem de `currentWoundState` do sistema, e "morto" do status `dead` do token/ator
  (o sistema nunca calcula `dead`; HP 0 é `mortallyWounded`, E0-02):

| Origem | Onda | Ritmo | Cor |
|---|---|---|---|
| `notWounded` (e `invalidState`, HP acima do máx.) | Sinusal regular | ~72 BPM | Destaque |
| `lightlyWounded` | Regular, amplitude menor | ~96 BPM | `--ccp-warn` |
| `seriouslyWounded` | Irregular | ~128 BPM | `--ccp-serious` |
| `mortallyWounded` (HP 0) | Fibrilação | ~164 BPM, piscando | `--ccp-critical` |
| status `dead` | Linha reta, "sem pulso" | Parado | `--ccp-dead` |
| HP indisponível | Linha reta tracejada | Parado | `--ccp-text-dim` |

Referência visual: protótipo E0-03 em `prototype/panel.html`
(publicado em <https://claude.ai/artifact/UZxzG4ErvFhCc2L6mycLeY>, privado).

- BPM exibido é decorativo e derivado do estado (não é regra do jogo); pode ser ocultado.
- Mudar de estado troca a forma da onda com transição curta, sem reiniciar o ciclo à toa.
- Pausa quando o painel está recolhido/oculto, a aba está em segundo plano, o usuário
  desligou animações ou o sistema pede `prefers-reduced-motion` (fica a onda estática).
- Só CSS animando atributos do SVG: sem `requestAnimationFrame` contínuo.
- Implementado (E2-03): forma da onda gerada no domínio (`src/domain/biomonitor.ts`); o nó do
  monitor é mantido entre renders enquanto o estado não muda, então mudar HP dentro do mesmo
  estado não reinicia o traço. Ajuste de cliente "Animar biomonitor" deixa o traço parado.
  Recolhido esconde o monitor (D16).

## Acessibilidade

Todos os botões com `aria-label` localizado; foco visível na cor de destaque; ordem de
tabulação lógica; nada só por cor (ícone + texto no estado de ferimento); contraste mínimo
4,5:1 para texto; atalho de teclado para recolher (padrão a definir, sem conflitar com
o `H` do cpr-combat-hud caso ambos estejam instalados).
