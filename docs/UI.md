# Design da interface

Status: protótipo da E0-03 aprovado pelo usuário em 2026-11-16. Identidade, vital e biomonitor implementados na E1/E2;
o restante é proposta até a etapa correspondente.

## Princípios

- Hierarquia antes de densidade: quem sou → como estou → o que sei fazer → atalhos.
- Uma cor de destaque escolhida pelo jogador; todo o resto deriva dela.
- Cores de estado (ferimento, alerta, sucesso) são semânticas e fixas: o jogador que
  escolhe verde não pode confundir "ferido" com "destaque".
- Tipografia do próprio sistema: Tektur para números e títulos, Jost para texto
  (carregadas pelo CPR; não redistribuir).
- Nada de rótulo truncado no nível principal: menos itens, maiores, com dica no hover.
- Movimento tem propósito (ECG, foco, abrir gaveta) e desliga com redução de movimento.

## Layout proposto (borda inferior, largura máx. ~1100 px, encaixe central)

```
        ┌───────────── gaveta (Perícias / Roles / NET / Ficha rápida / Saúde) ─────────────┐
        └──────────────────────────────────────────────────────────────────────────────────┘
╱‾‾‾‾‾‾‾‾╲┌──────────────────────┬─────────────────────────────┬──────────────────┬────────┐
│ retrato ││ SEORIN KWON          │ ∿∿∿╱╲∿∿∿ biomonitor (ECG)   │ INT REF DEX TECH │ [slot] │
│ chanfro ││ "alias"              │ HP ▰▰▰▰▰▰▰▰▱▱ 35/35  − +    │ COOL WILL MOVE … │ módulo │
╲________╱│ NETRUNNER ▸ 4        │ HUM 32/42 · LUCK 4/4 · DS 0 │                  │ combate│
          │ ● SEM FERIMENTOS     │ SP 11 · 10  (confirmar)     │                  │        │
          └──────────────────────┴─────────────────────────────┴──────────────────┴────────┘
          [Perícias] [Roles] [NET] [Facedown] [Ficha rápida] [Saúde]  ★ favoritas: …  ⚙
```

- Retrato com chanfro (`clip-path`), moldura na cor de destaque, anel de estado de
  ferimento. Clique abre a ficha.
- Bloco vital é o centro visual: biomonitor em cima, barra de HP segmentada abaixo,
  chips de Humanity/LUCK/Death Save; botões ± aparecem no hover/foco para limpar a tela.
- STATs em grade 5×2 de "teclas" com rótulo pequeno em cima e número grande.
- Linha de atalhos abaixo; favoritas como chips roláveis; engrenagem abre personalização.
- Região `slot` à direita fica vazia sem o módulo de combate (não ocupa espaço).
- Modo compacto: só retrato, ECG, HP e atalhos. Recolhido: aba fina com nome + ECG.
- Container queries para larguras estreitas (empilhar STATs, esconder rótulos longos).

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
