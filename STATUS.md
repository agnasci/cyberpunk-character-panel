# Estado e passagem de contexto

Atualizado em: 2026-11-16.

## Situação

- E0 e E1 concluídas. O painel existe: aparece sozinho para o personagem do jogador, mostra
  identidade e HP/estado de ferimento, recolhe, e atualiza só a parte que mudou.
- Protótipo visual (E0-03) aprovado pelo usuário em 2026-11-16: `prototype/panel.html`,
  <https://claude.ai/artifact/UZxzG4ErvFhCc2L6mycLeY>.
- Repositório privado: <https://github.com/agnasci/cyberpunk-character-panel> (`main`).
- Estudo, provas de API e fatos verificados: docs/RESEARCH.md e docs/COMPATIBILITY.md.

## Última entrega: E1 — esqueleto do painel (2026-11-16)

Arquivos: `src/domain/{subject,vital-state,panel-parts,plain-text,character,view-model}.ts`,
`src/integrations/cpr/{character-adapter,subject-resolver}.ts`, `src/settings.ts`,
`src/ui/character-panel-app.ts`, `src/main.ts`, `templates/{identity,vitals,dock}.hbs`,
`styles/character-panel.css`, `lang/*.json`, testes em `tests/unit/` e `tests/fixtures/cpr-actor.ts`.

- E1-01: personagem exibido (D04) — atribuído primeiro; "seguir token selecionado" opcional;
  mestre usa a seleção. Só atores próprios `character`/`mook`.
- E1-02: ApplicationV2 sem moldura, inserido em `#ui-bottom` (acima da hotbar) ou `#ui-top`;
  oculto sem personagem; recolher por botão e Alt+C (D15, D16); retrato abre a ficha.
- E1-03: snapshot pelo adaptador → view model → partes `identity`, `vitals`, `dock`; hooks
  marcam só as partes afetadas (debounce de 40 ms).
- E1-04: ajustes de cliente: mostrar painel, seguir token, escala (0,7–1,4), posição
  (embaixo/em cima); recolhido salvo no cliente.

Validação:
- `npm run check` exit 0 (28 testes).
- Manual real (Foundry 12.343, CPR v0.92.4, mundo `cyberdeck-hud`, sem erros no console):
  GM sem seleção → oculto; selecionar mook/personagem troca; soltar → oculto. HP 15/0, status
  `dead` e volta a 40: estado, cor e barra corretos, só a parte vital trocada (identidade e dock
  são os mesmos nós); alias muda só a identidade; dados não exibidos não re-renderizam. Visual
  conferido em captura. Recolher por clique real e por Alt+C real; recolhido persiste após F5.
  Retrato abre a ficha. Posição em cima/embaixo, escala 1,2 e desligar/religar funcionam (uma
  instância só). Jogador (Runner Teste) com personagem atribuído: painel aparece sem selecionar;
  seguir token desligado ignora seleção; ligado mostra o mook e volta ao soltar; HP e nome do token
  não vinculado alterados pelo mestre aparecem no cliente do jogador; tirar a atribuição oculta o
  painel. pt-BR: rótulos do módulo e estado do sistema traduzidos ("Levemente Ferido").
- Corrigidos durante o teste: barra de HP sumia no modo recolhido; alias com `<b>` ganhava espaço.
- Não testado: Firefox e Electron do Foundry; tela estreita; ordem com outros módulos em `#ui-bottom`
  (ex.: cpr-combat-hud).

Mundo de teste: Runner Teste agora tem "CCP Teste — Personagem" atribuído (de propósito, para as
próximas etapas); cena "CCP Teste — Cena" com permissão de observador para todos; atores e cena
de teste com a flag `cyberpunk-character-panel.probe`. Último login no navegador do app: Runner
Teste (recarregar a aba do GM entra como Runner).

## Aguardando o usuário

1. Fronteira com combate (D03a): armadura com ablação/reparo, rolar lesão crítica, mods situacionais.
2. Confirmar D04, nome/título (D11), atalho Alt+C (D15) e o modo recolhido (D16).
3. Revisar as demais decisões **Propostas** em docs/DECISIONS.md.

## Próximas tarefas

Estados: `TODO`, `BLOCKED`. Uma tarefa por vez; detalhe em docs/PLAN.md.

| ID | Estado | Entrega | Condição |
|---|---|---|---|
| E2-01 | TODO | Identidade completa (já tem nome, alias, role/rank, retrato; falta anel de estado no retrato) | Pode começar |
| E2-02 | TODO | HP: botões ±1/±5 e valor direto | Pode começar |
| E2-03 | TODO | Biomonitor (D08) conforme o protótipo | Pode começar |
| E2-04 | TODO | Humanity, LUCK ±, Death Save | Pode começar |
| E2-05 | BLOCKED | Armadura | Decisão D03a |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`zoom`, `mask`, `color-mix`) no Electron do Foundry e no Firefox.
