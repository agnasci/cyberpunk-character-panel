# Estudo dos módulos de referência

Feito em 2026-11-16 com clones locais (fora do projeto). Nada foi copiado; este
documento registra ideias, contratos e armadilhas. Licenças em [LEGAL.md](LEGAL.md).

## cpr-combat-hud (Vec97) — <https://github.com/Vec97/cpr-combat-hud>

- Versão estudada: 1.1.3 (commit 91df778, 2026-07-08). Licença **MIT**. JavaScript puro,
  ~2.500 linhas: `main.js` (settings, keybinding, hooks), `hud.js` (Application V1 com
  `popOut: false`, `getData`, listeners), `actions.js` (rolagens e ajustes),
  `targeting.js` (modo "Choose Target"), `hud.hbs`, `combat-hud.css`, `en.json`.
- Alvo: Foundry V12, CPR 0.92.x, atores `character` e `mook`. Sem testes, sem i18n pt-BR.

### O que ele faz (e o que vamos aproveitar como ideia)

| Função dele | Fonte na ficha / sistema | Para nós |
|---|---|---|
| Ator exibido: último token controlado próprio, senão personagem atribuído | `canvas.tokens.controlled`, `game.user.character` | Inverter a prioridade: personagem do jogador primeiro (R01, D04) |
| Retrato, nome, alias, roles, estado de ferimento | `actor.img`/token, `system.information.alias`, `itemTypes.role`, `derivedStats.currentWoundState` + `CPR.woundState` | Sim. Alias é `HTMLField`: tirar marcação antes de mostrar |
| HP com −5/−1/+1/+5 e campo direto | `system.derivedStats.hp.{value,max}` via `actor.update` | Sim, com o biomonitor |
| SP cabeça/corpo, HP do escudo com ablação/reparo | `system.externalData.currentArmor*`, `getEquippedArmors`, `updateTrackedArmor` | Fronteira com combate (D03, confirmar) |
| Humanity, LUCK ±, Death Save (clique rola, botão direito zera) | `derivedStats.humanity`, `stats.luck`, `derivedStats.deathSave`, `resetDeathPenalty` | Sim; acrescentar "aumentar penalidade" (`increaseDeathPenalty`) |
| 10 STATs roláveis | `CPR.statList`, `actor.createRoll("stat", key)` | Sim |
| Perícias por categoria, busca, total, favoritas com estrela | `itemTypes.skill`, getter `system.skills` (nível, STAT, mods), `skill.system.favorite` | Sim; favoritas numa faixa própria |
| Habilidades de role (principal e sub) | `role.system.{hasRoll,mainRoleAbility,abilities[]}` | Sim |
| Painel NET com as 9 habilidades de Interface | `CPR.interfaceAbilities`, deck equipado, `roleInfo.activeNetRole` | Sim; link para o Netrunner HUD quando ativo |
| Facedown | `createRoll("facedown")` | Sim |
| Armas, ATK/DMG, recarga, munição, modos de fogo, mira | flags `firetype-<id>`, `aimedLocation` | **Não** (combate) |
| Iniciativa, fim de turno | `game.combat` | **Não** (combate) |
| Gerenciar equipado de armas/decks | `system.equipped` ciclo owned/carried/equipped | Não agora |
| Settings por cliente (ligar, fallback, escala, distância do fundo, chips visíveis) e tecla `H` | `game.settings` client, `game.keybindings` | Sim, ampliado com cor e posição |

### Como ele rola

Importa arquivos do sistema por caminho relativo
(`../../../systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js`, `cpr-chat.js`,
`config.js`, `cpr-systemUtils.js`) e **reimplementa** a cauda de `CPRActorSheet._onRoll`:
`createRoll → handleRollDialog → item.confirmRoll → roll → processDeathSave → consumo de LUCK
→ entityData → CPRChat.RenderRollCard`. Comparado com o `_onRoll` do v0.92.4, a cópia dele
já diverge (não grava `aimedLocation` após tiro mirado). Risco: qualquer mudança no
pipeline do sistema quebra em silêncio.

Nossa escolha (D07): delegar a `actor.sheet._onRoll` com um evento sintético, técnica já
testada em execução no Netrunner HUD (interface, programa, stat de Black ICE). Uma única
fonte do pipeline, sem importar arquivos internos por caminho.

### Fraquezas que motivam a versão aprimorada

- Barra única muito densa (identidade, vital, stats, armas, botões) com fontes pequenas;
  rótulos truncados ("Heavy P…"); sem agrupamento visual claro.
- Cor fixa (vermelho/ciano), sem tema; HP em fundo verde-água pouco cyberpunk.
- Re-render completo a cada mudança (`render(true)` com debounce de 80 ms): perde estado
  de foco/rolagem e reiniciaria qualquer animação.
- Application V1 (`Application`), sem tipos, sem testes, só inglês.
- Mistura combate e personagem; não oferece ponto de extensão para outro módulo.

## PneumaQuickHack (GMPneuma) — <https://github.com/GMPneuma/PneumaQuickHack>

- Versão 0.9.2, licença MIT. Automação de Quickhacks (CEMK): Jack In, Quickhack, Force Out,
  roteamento de mensagens por cenário, ícones próprios. **Não tem indicador vital**: busca
  por heart/pulse/ecg/vital no código e no histórico inteiro não achou nada.
- Ideias úteis: rolagens de Interface pelo diálogo nativo do CPR; `relationships.systems`.

## PneumaCombatTools (GMPneuma) — onde está o biomonitor

<https://github.com/GMPneuma/PneumaCombatTools>, 0.9.42, V12.343, exige lib-wrapper.
O "Biomonitor" com ECG animado que o usuário viu é deste módulo, não do QuickHack.
**Não há arquivo de licença** no repositório: todos os direitos reservados. Só estudamos
o conceito; nenhum trecho, caminho SVG, CSS ou constante pode ser reaproveitado.

Conceito observado (técnica genérica de SVG):
- Estados vitais derivados do HP: normal, ferido, grave, crítico, sem pulso; HP
  indisponível vira linha reta.
- Traço SVG desenhado com `stroke-dasharray`/`stroke-dashoffset` e `pathLength`, em três
  camadas (rastro, brilho e ponto) sobre uma linha base apagada e grade de fundo.
- Ritmo mais rápido no estado crítico; cor por estado; opção de pausar; respeita redução
  de movimento; minimizar para só ECG + nome; ocultar números de HP até passar o mouse.
- Indicadores ("lamps") por efeitos ativos reconhecidos por nome (veneno, fogo, jacked in...).

Nosso desenho próprio está em [UI.md](UI.md) (D08): estados vindos de
`currentWoundState` do sistema (não de limiares inventados), forma de onda desenhada por nós,
ritmo e cor por estado, pausa quando o painel está oculto.

## Outros pontos de partida

- Netrunner HUD (nosso, `D:\Desenvolvimento\cyberpunk-netrunner-hud`): padrões de
  ApplicationV2, adaptador CPR, evento sintético para `_onRoll`, ajustes de cliente,
  container queries, build/publicação. Reaproveitar código nosso é permitido (mesmo autor, MIT).
- Sistema CPR v0.92.4 instalado: fonte de verdade dos campos (docs/COMPATIBILITY.md).
