# Estado e passagem de contexto

Atualizado em: 2026-11-16.

## Situação

- E0 concluída (fundação). Nenhuma função do painel implementada ainda.
- Git: repositório local iniciado, sem commit.

## E0-01 — ferramentas e módulo vazio (feito)

- `npm install` gerou `package-lock.json` (8 vulnerabilidades moderadas em dependências de dev,
  como no Netrunner HUD). `src/main.ts` (aviso de compatibilidade no `ready`),
  `src/constants.ts`, `src/compatibility.ts` (vindo do Netrunner HUD), `src/types/foundry.d.ts`
  mínimo, `styles/character-panel.css`, `lang/*.json`, `tests/unit/compatibility.test.ts`.
- `npm run check` exit 0 (3 testes). Junção criada:
  `%LOCALAPPDATA%\FoundryVTT\Data\modules\cyberpunk-character-panel` → `dist/`.
- Manual real (Foundry 12.343, CPR v0.92.4, mundo `cyberdeck-hud`, GM): módulo ativado em
  `core.moduleConfiguration` (o Netrunner HUD continua ativo), `lang/en.json` carregado,
  `cyberpunk-character-panel | ready` no console, nenhum erro.

## E0-02 — provas de API (feito)

Resultados em docs/COMPATIBILITY.md. Resumo: rolagens por `sheet._onRoll` sintético funcionam
para tudo que o painel precisa (GM e jogador dono); `render({parts})` preserva as outras partes;
janela sem moldura funciona; `ColorField` vira `<color-picker>` nas configurações; ledger,
favorito, death save e status `dead` testados; hooks `updateActor`/`updateItem`/`updateUser`
conferidos. Achado: o sistema nunca calcula `dead` (HP 0 = `mortallyWounded`); biomonitor ajustado (D08).
Não testado: `controlToken`, `canvasReady`, keybinding (só no `init`), diálogo nativo sem Ctrl
nesta etapa, CSS no Electron do Foundry e no Firefox.

Dados deixados no mundo de teste para as próximas etapas (flag `cyberpunk-character-panel.probe`):
atores "CCP Teste — Personagem" (character, role Medtech, Speedheal, ledgers 400 eb / 10 IP /
Rep 1, LUCK 5/6, Perception favorita) e "CCP Teste — Mook" (Medtech), ambos do Runner Teste;
cena "CCP Teste — Cena" com token vinculado do personagem e não vinculado do mook. Mensagens de
chat das provas apagadas; ajuste temporário de cor removido do `localStorage`.
Atenção: o último login no navegador do app foi "Runner Teste"; recarregar a aba do GM a
reconecta como Runner (docs/TESTING.md do Netrunner HUD).

## E0-03 — protótipo visual (feito, aguardando aprovação)

`prototype/panel.html` (fora do build e do Prettier), publicado em
<https://claude.ai/artifact/UZxzG4ErvFhCc2L6mycLeY> (privado). Tem cor de destaque com 8
predefinições e color picker, contraste e aviso de conflito com cores de estado, biomonitor nos
6 estados, HP com ±, modos completo/compacto/recolhido, gavetas (perícias com busca e favoritas,
roles, NET, ficha rápida, saúde) e redução de movimento. Não conferido na tela por mim.

## Aguardando o usuário

1. Aprovar ou pedir ajustes no protótipo (layout, cores, biomonitor).
2. Fronteira com combate (D03a): armadura com ablação/reparo, rolar lesão crítica, mods situacionais.
3. Confirmar D04 (personagem atribuído primeiro), nome/título (D11) e atalho de recolher (o
   cpr-combat-hud usa `H`).
4. Revisar as demais decisões **Propostas** em docs/DECISIONS.md.

## Próximas tarefas

Estados: `TODO`, `BLOCKED`. Uma tarefa por vez; detalhe em docs/PLAN.md.

| ID | Estado | Entrega | Condição |
|---|---|---|---|
| E1-01 | BLOCKED | Resolver o ator exibido | Confirmação de D04 |
| E1-02 | BLOCKED | `CharacterPanelApp` persistente e recolhível | Aprovação do protótipo |
| E1-03 | TODO | Snapshot e render incremental | Depois da E1-02 |
| E1-04 | TODO | Ajustes de cliente básicos | Depois da E1-02 |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`color-mix`, `oklch`) no Electron do Foundry e no Firefox.
