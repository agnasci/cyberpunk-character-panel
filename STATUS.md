# Estado e passagem de contexto

Atualizado em: 2026-11-20.

## Situação

- E0 a E5 concluídas. Além do conteúdo da ficha (E1–E4), o painel tem cor de destaque por jogador
  com editor próprio, cor padrão do mundo definida pelo mestre e preferências de layout.
- Leiaute redesenhado em 2026-11-17 (D29–D43), validado pelo usuário em iterações no Foundry; o
  protótipo E0-03 (`prototype/panel.html`) ficou como referência histórica.
- **v0.1.0 (beta) publicada em 2026-11-17** no GitHub, repositório tornado público; **v0.1.1** (FIX-01) no mesmo dia; **v0.2.0** em 2026-11-19 com a API v1 (E6-01), exigida pela aba "Combate" do Combat Kit 0.1.0; **v0.2.1** em 2026-11-20 com `setAttention` (D47). Manifesto:
  <https://github.com/agnasci/cyberpunk-character-panel/releases/latest/download/module.json>.
  Sem página no site do Foundry ainda.
- Repositório público: <https://github.com/agnasci/cyberpunk-character-panel> (`main`).

## Última entrega: destaque pedido por outro módulo — `setAttention` (2026-11-20)

- Pedido do usuário: aviso de turno no painel (Combat Kit, D44 de lá). D47: `api.setAttention(source,
  active)` liga a classe `ccp-attention` (borda e brilho pulsando na cor de destaque; parado com
  animação desligada ou aba oculta, e com movimento reduzido). O painel não conhece turno (D03).
- Arquivos: `src/domain/slots.ts` (`isAttentionSource`), `src/api/panel-api.ts`,
  `src/ui/character-panel-app.ts`, `styles/character-panel.css`, `tests/unit/slots.test.ts`,
  docs/ARCHITECTURE.md, docs/DECISIONS.md.
- Validação: `npm run check` exit 0 (98 testes). Manual real (Foundry 12.343, mundo
  `cyberdeck-hud`, Gamemaster, com o Combat Kit): o destaque ligou no turno do token exibido,
  desligou no seguinte e acompanhou a troca de token; borda acesa conferida em captura.
- Não testado: jogador; recolhido; encaixe em cima; movimento reduzido real.
- Publicado na release v0.2.1 (2026-11-20).

## Entrega anterior: E6-01 — API v1 para o módulo de combate (2026-11-18)

Objetivo: `getSubject`, slots (`bar-end`, `quick`, `drawer`), `requestRender`, `getPalette` e
hooks `ccpReady`, `ccpSubjectChanged`, `ccpRendered` (D12, D46). Aceite: um módulo de teste injeta
um bloco e recebe a troca de personagem.

Arquivos: `src/domain/slots.ts`, `src/ui/slot-host.ts`, `src/api/panel-api.ts` (novos);
`src/ui/character-panel-app.ts`, `src/main.ts`, `templates/actions.hbs`, `dock.hbs`,
`drawer.hbs`, `styles/character-panel.css`, tipos, `tests/unit/slots.test.ts`, docs.

Validação:
- `npm run check` exit 0 (97 testes; 5 novos de slots).
- Manual real (Foundry 12.343, mundo `cyberdeck-hud`, Gamemaster, pelo console do navegador
  do app): `api.version` 1 e paleta com as variáveis; slots de teste nas três regiões
  mostraram o nome do ator; trocar o token controlado mudou o conteúdo e disparou
  `ccpSubjectChanged` duas vezes (Atirador, PdM); id inválido recusado (`false`); slot que lança
  erro ficou vazio sem quebrar o painel; clique real na aba do slot abriu a gaveta com título e
  conteúdo; Shift + clique no botão do slot chamou `onAction("ping")` com `shiftKey`;
  `unregisterSlot` tirou a aba e fechou a gaveta; recolhido, a região `quick` continuou visível.
- Não testado: jogador, encaixe em cima, largura estreita com slots, leitor de tela.

## Entrega anterior: UI-R1 — redesenho da interface (2026-11-17)

Objetivo: menos espaço vazio e menos informação fixa, visual mais detalhado e distante da barra
do cpr-combat-hud, mantendo todas as funções da E1–E5. Aceite: todas as ações continuam
acessíveis; `npm run check` passa; conferência visual no Foundry em largura cheia, estreita,
recolhido, compacto e encaixe em cima.

Arquivos: `templates/*.hbs` (todos), `styles/character-panel.css` (reescrito),
`src/domain/view-model.ts` (`hp.arc`, `luck.pips`, `deathSaveShown`),
`src/ui/character-panel-app.ts` (contexto do dock, gaveta Saúde atualiza com o vital, faixas
760/520 px), `lang/*.json`, `tests/unit/view-model.test.ts`, docs (UI, DECISIONS).

Validação:
- `npm run check` exit 0 (86 testes).
- Manual real (Foundry 12.343, CPR v0.92.4, jogador Runner Teste), por capturas no navegador do
  app: largura cheia (830 px) e estreita (570 px); gavetas Perícias (rolagem vertical, sem
  estouro lateral), Funções, NET, Ficha rápida, Saúde (Death Save no cabeçalho) e Aparência;
  recolhido; compacto + encaixe em cima; HP 9/40 deixou anel, brilho e etiqueta laranja; ±HP
  aparecem ao passar o mouse no retrato. Estado restaurado (HP 40, sem compacto, embaixo).
- Alinhamento à hotbar (D33, `src/domain/placement.ts` + teste): borda esquerda do painel = borda
  esquerda da hotbar (220 px) com barra lateral aberta e fechada, normal e compacto.
- ECG estreito ao lado dos chips (D34): monitor 170 × 40 px, chips em 2 linhas, altura do painel
  inalterada (154 px). Compacto mostra chips (estado, SP, HUM, LUCK, Death Save) sem ECG.
- D35/D36: nome no topo e ECG/chips centrados no espaço restante (chips a 703–756 px num espaço
  de 682–777 px); chips sem quebra de linha (HUM 60/60 numa linha só);
- D37/D38: hover em LUCK não muda posição nem largura do chip (146,6 px antes e depois); recolhido
  = retrato circular no anel + nome pequeno + mini ECG + expandir; nome cabe inteiro (143 px).
- D39: clique nos losangos de LUCK no Foundry: 6 → 4 (4º) → 3 (4º de novo, o último aceso) → 6
  (6º), foco mantido; Death Save é um chip-botão vermelho; HP e HUM com espaço fixo antes do máximo.
- D40: flag `prefs` semeada no Runner Teste com os 10 ajustes; jogador grava a própria flag.
  Não testado: entrar por outro navegador e ver as preferências chegarem.
- D41: células SP/HUM/LUCK/Death Save numa linha (65/64/90/94 px) ao lado do ECG de 150 px; hover
  no último losango aceso o mantém aceso.
- D42: LUCK testada no Foundry em 0/0, 1/1, 2/3, 8/8, 7/10, 12/12, 9/15 e 8/6: sempre numa linha;
  0/0 com −/+ desabilitados; 9/15 e 8/6 viram número; gastar em 8/6 deu 7. Restaurado 6/6.
- D43: aba aberta mantém 35 × 26 px e só destaca o ícone.
- HP acima do máximo: `stepHp`, `parseHpEntry` e `setHp` usam o mesmo teto da LUCK (testes); no
  Foundry o CPR grava 40 ao pedir 45/40, então o caso só surge se o máximo cair com HP alto. 20 favoritas simuladas no DOM: abas
  intactas, borda direita esmaecida, roda do mouse rolou 300 px na horizontal e esmaeceu as duas bordas.
- Não testado: clique real em cada rolagem após o redesenho (as ações e `data-action` não
  mudaram), mestre, leitor de tela, Firefox/Electron, pt-BR em execução, `:has()` fora do Chromium.

## Aguardando o usuário

Validar o redesenho (D29–D31) no Foundry. Depende de outro projeto: atalho para o Netrunner HUD (expor abertura da sessão).

## Próximas tarefas

Estados: `TODO`. Uma tarefa por vez; detalhe em docs/PLAN.md.

| ID | Estado | Entrega | Condição |
|---|---|---|---|
| E6-02 | TODO | `docs/INTEGRATION.md` para o módulo de combate | Pode começar; consumidor em `D:\Desenvolvimento\cyberpunk-combat-kit` (E7 de lá) |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`zoom`, `mask`, `contain`, `color-mix`, `:has`, `display: contents`) no Electron do Foundry e no Firefox.
