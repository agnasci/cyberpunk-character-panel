# Compatibilidade e APIs do sistema

Alvo: **Foundry VTT 12.343 + Cyberpunk RED – CORE v0.92.4** (D02), os mesmos do Netrunner HUD.
Inspeção do código instalado em 2026-11-16
(`%LOCALAPPDATA%\FoundryVTT\Data\systems\cyberpunk-red-core`, `modules/...`).
"Verificado no código" ≠ "testado em execução"; os testes em execução da E0-02 estão marcados.
Fatos já testados em execução no Netrunner HUD estão marcados como tal.

## Ambiente

| Item | Estado | Evidência |
|---|---|---|
| Foundry instalado | Verificado | `D:\Foundry Virtual Tabletop\resources\app\package.json`: 12.343.0 |
| Sistema instalado | Verificado | `systems/cyberpunk-red-core/system.json`: v0.92.4 (V12 apenas; V13 em 0.93.0) |
| Mundos locais | Verificado | `cyberdeck-hud` (descartável, usado no Netrunner HUD), `cnh-instalacao-limpa` |
| Fontes carregadas pelo sistema | Verificado | `fonts/`: Jost (100–900), Rubik, Tektur. Usar pelo nome da família, sem redistribuir |
| Traduções do sistema | Verificado | `lang/pt-BR.json` existe: rótulos `CPR.*` saem em português |

## Dados do personagem (verificado no código)

Ator `character` = `CommonSchema + ContainerSchema + WealthSchema` + `improvementPoints`,
`lifepath`, `lifestyle`. Ator `mook` = `CommonSchema + ContainerSchema` (sem wealth, IP, lifepath).

| Dado | Caminho | Observação |
|---|---|---|
| STATs | `system.stats.{int,ref,dex,tech,cool,will,luck,move,body,emp}.value` | `luck.max` e `emp.max` existem; ordem de exibição em `CPR.statList` |
| HP | `system.derivedStats.hp.{value,max}` | `HpSchema`, mínimo 0 |
| Estado de ferimento | `system.derivedStats.currentWoundState` | `notWounded`, `lightlyWounded`, `seriouslyWounded`, `mortallyWounded`, `dead`; rótulos `CPR.woundState`; `actor.getWoundState()` |
| Limiar de grave | `system.derivedStats.seriouslyWounded` | Calculado pelo sistema |
| Humanity | `system.derivedStats.humanity.{value,max}` | value pode ser negativo (mín. −100) |
| Death Save | `system.derivedStats.deathSave.{value,penalty,basePenalty}` | `actor.increaseDeathPenalty()`, `resetDeathPenalty()`, `processDeathSave(roll)` |
| Movimento | `system.derivedStats.{walk,run}.value`, `stats.move.value` | |
| Armadura rastreada | `system.externalData.currentArmor{Head,Body,Shield}.{value,max,id}` | `getEquippedArmors(loc)`, `updateTrackedArmor(loc, id)` |
| Alias e notas | `system.information.{alias,description,history,notes}` | `HTMLField`: tratar como HTML |
| Roles | `itemTypes.role`; `system.roleInfo.{activeRole,activeNetRole}` | `role.system.{rank,hasRoll,mainRoleAbility,abilities[]}`; `actor.getRoles()` |
| Perícias | `itemTypes.skill`; getter `system.skills[slug]` = `{level, stat, mods}` | mods = efeitos ativos não situacionais (ou situacionais ligados por padrão); categoria em `skill.system.category`, rótulos `CPR.skillCategories` |
| Favorito | `item.system.favorite` (todo item, `common-schema` de item) | `item.toggleFavorite()` |
| Cyberdeck equipado | `actor.getEquippedCyberdeck()` | Primeiro `cyberdeck` com `system.equipped === "equipped"` (testado no Netrunner HUD) |
| Habilidades de Interface | `CPR.interfaceAbilities` | scanner, backdoor, cloak, control, eyedee, pathfinder, slide, virus, zap |
| Ledgers | `system.wealth`, `system.improvementPoints` (só character), `system.reputation` (todos) | `{value, transactions[[frase, motivo]]}`; `actor.deltaLedgerProperty(prop, delta, motivo)`, `setLedgerProperty`, `listRecords` |
| Lesões críticas | itens `criticalInjury` | Ficha rola por tabela de compêndio configurada (`criticalInjuryRollTableCompendium`) |
| Drogas | itens `drug` | `item.snort()` com confirmação nativa e efeitos de uso "snorted" |
| Efeitos ativos | `actor.allApplicableEffects()`, `actor.effects` | Mods com `isSituational`/`onByDefault` (`cpr-modifiers.js`) |
| Status de token | `CONFIG.statusEffects` padrão do Foundry | O sistema não registra status próprios (busca por `statusEffects` vazia) |

## Rolagens (verificado no código)

`modules/rolls/cpr-rolls.js` exporta `rollTypes`: `stat`, `skill`, `roleAbility`,
`interfaceAbility`, `cyberdeckProgram`, `deathsave`, `facedown`, `humanity`, `damage`,
`attack`, `aimed`, `autofire`, `suppressive`.

`CPRActorSheet._onRoll(event)` (`actor/sheet/cpr-actor-sheet.js`, linha ~508) lê atributos do
`event.currentTarget` por `SystemUtils.GetEventDatum`:

| Rolagem | Atributos lidos | Caminho interno |
|---|---|---|
| STAT / Death Save / Facedown | `data-roll-type`, `data-roll-title` (nome do STAT) | `actor.createRoll(type, nome)` |
| Perícia | `data-roll-type="skill"`, id do item (`_getItemId`) | `skill.createRoll` |
| Role | `data-roll-type="roleAbility"`, `data-roll-subtype` (`mainRoleAbility`/`subRoleAbility`), `data-roll-title`, id da role | `role.createRoll` |
| Interface | `data-roll-type="interfaceAbility"`, `data-interface-ability`, `data-cyberdeck-id` | `cyberdeck.createRoll`; erro nativo se não há role de Netrunning |

Depois: `handleRollDialog(event)` (Ctrl/Meta pula o diálogo; o ajuste
`invertRollCtrlFunction` inverte só quando `event.type === "click"`), `item.confirmRoll`,
`roll()`, Death Save processado, LUCK consumida, `CPRChat.RenderRollCard` com o token da ficha.
Testado em execução no Netrunner HUD: evento sintético com `currentTarget` contendo esses
atributos e `type: "click"` abre o diálogo nativo e gera o card.

Testado em execução (E0-02, 2026-11-16, Foundry 12.343, CPR v0.92.4, GM e jogador dono):
evento sintético (`<a>` com `dataset`, `type: "auto"`, `ctrlKey: true`) gerou um card por chamada
para STAT (`rollTitle: "ref"`), Death Save, Facedown, perícia (`itemId`), sub-habilidade de role
(`rollSubtype: "subRoleAbility"`, `rollTitle` = nome) e Interface (`interfaceAbility`,
`cyberdeckId`), sem erro e sem a ficha renderizada. Como jogador dono, o card sai com `author` =
jogador. Token não vinculado: `token.actor.sheet.token` é o token; o `speaker` do card nunca leva
token (o próprio `RenderRollCard` monta `{actor, alias}`), igual à ficha nativa. Death Save rolado
soma 1 à `penalty` (efeito nativo de `processDeathSave`). A habilidade principal do Medtech tem
`hasRoll: false`: só entram na lista as habilidades com `hasRoll`. O diálogo nativo (sem Ctrl)
foi testado em execução no Netrunner HUD, não nesta etapa.

## Foundry V12 e navegador (testado em execução na E0-02, 2026-11-16)

| Ponto | Resultado |
|---|---|
| `ApplicationV2` + `HandlebarsApplicationMixin`, `PARTS`, `actions` | Testado: `actions` estáticas disparam no clique |
| Janela sem moldura | Testado: `window: {frame: false, positioned: false}` gera `<div id>` sem `.window-header` nem `style`, anexado ao `body`. `_insertElement` existe para mover o elemento (ex.: `#ui-bottom`, dentro de `#ui-middle`) |
| Render por partes | Testado: `render({parts: ["b"]})` troca só o nó da parte `b`; o nó da parte `a` continua o mesmo objeto (marca em `dataset` preservada), então animação CSS dele não reinicia |
| Ajuste com cor | Testado: `register(..., {type: new foundry.data.fields.ColorField({required: true, blank: false})})` aparece na tela de configurações como `<color-picker>` (texto + `<input type="color">`); salvar grava no `localStorage` |
| `color-mix()`, `oklch()`, container queries | `CSS.supports` verdadeiro no navegador do teste (Chrome 156, painel do app). Não testado no Electron do Foundry nem no Firefox |
| Ajuste de cliente em `localStorage` | Testado (acima) |
| `game.keybindings.register` | Existe; registro só vale no `init` (testar na E1-02) |
| Hooks | Testado: `updateActor` chega com as chaves alteradas (ledger, HP, death save); `updateItem` ao favoritar; `updateUser` chega ao jogador com `character` nas chaves e `game.user.character` já atualizado. `controlToken` e `canvasReady` não testados |
| Permissão | Testado: jogador dono grava HP/LUCK/ledger e rola; `update` em ator alheio lança "lacks permission" |

## Fatos confirmados na E1 (testado em execução em 2026-11-16)

- Ator sintético de token não vinculado: `actor.update` dispara `updateActor` com o ator
  sintético (`isToken: true`, uuid `Scene.x.Token.y.Actor.z`); comparar por uuid. Nome do token
  muda por `updateToken` (`name`).
- `#ui-bottom` (`<footer>`) contém um `<div>` com `#hotbar`; inserir o painel como primeiro filho
  o põe acima da hotbar. `#ui-top` serve para a posição "em cima".
- `close()` de ApplicationV2 sem moldura anima (classe `minimizing`, ~0,5 s) antes de tirar o
  elemento; `close({animate: false})` remove na hora.
- `game.keybindings.register` no `init` com `{key: "KeyC", modifiers: ["Alt"]}` funciona (tecla real).
- Ajustes de cliente com `name`/`hint` localizados aparecem na configuração em pt-BR.
- `scene.view()` de cena criada por API só funciona para jogador com permissão na cena.

## Fatos de dados confirmados em execução (E0-02)

- Ator criado por `CONFIG.Actor.documentClass.create` (character ou mook) recebe 63 perícias
  automaticamente; mook também aceita roles.
- `currentWoundState`: HP máx. → `notWounded`; abaixo → `lightlyWounded`; abaixo de
  `seriouslyWounded` → `seriouslyWounded`; HP 0 → `mortallyWounded`. O sistema **nunca** calcula
  `dead` (`_setWoundState`); HP acima do máximo dá `invalidState`. Morte é o status `dead` do
  Foundry (`actor.statuses.has("dead")`; `actor.toggleStatusEffect("dead")` testado).
- `deltaLedgerProperty("wealth" | "improvementPoints" | "reputation", delta, motivo)` grava valor e
  transação `[frase, motivo]` (frase em inglês gerada pelo sistema). Mook só tem `reputation`.
- `item.toggleFavorite()` alterna `system.favorite`; getter `system.skills[slug]` dá `{level, stat, mods}`.
- `increaseDeathPenalty()` / `resetDeathPenalty()` alteram `deathSave.penalty`.
- `CONFIG.statusEffects` são os padrões do Foundry (dead, unconscious, stun, prone, poison...).

## Futuro

O sistema prepara suporte a V13 (0.93.0) e V14 (0.94.0); a V13 muda
`getSceneControlButtons` e outras APIs. Manter acesso ao Foundry no adaptador para migrar
num lugar só. Atualizar esta matriz antes de mudar versões suportadas.
