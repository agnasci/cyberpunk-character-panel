# Arquitetura proposta

Status: desenho para implementação. Fatos de API em [COMPATIBILITY.md](COMPATIBILITY.md).
Bem mais simples que o Netrunner HUD: não há estado compartilhado nem autoridade do mestre.
Cada cliente lê o próprio ator e o dono grava nele (D05).

## Camadas

| Pasta | Responsabilidade | Restrições |
|---|---|---|
| `src/main.ts` | Hooks `init`/`ready`, ajustes, atalho, composição | Sem regra nem DOM do painel |
| `src/domain/` | Funções puras: snapshot → view model, estados vitais, filtros de perícia, paleta de cores, contraste | Sem `game`, `Hooks`, DOM, documentos |
| `src/integrations/cpr/` | Ler o ator em `CharacterSnapshot`; ações (rolar, ajustar HP/LUCK, ledger, favoritos) | Único lugar com `actor.system.*`, `CPR.*`, `sheet._onRoll` |
| `src/ui/` | `CharacterPanelApp` (ApplicationV2), gavetas, biomonitor, editor de cor | Não calcula regra; chama ações do adaptador |
| `src/api/` | API pública para outros módulos (módulo de combate) | Contrato versionado; sem expor documentos crus para escrita |
| `styles/`, `templates/`, `lang/` | CSS, Handlebars, traduções | Variáveis de cor só derivadas (docs/UI.md) |
| `tests/unit/`, `tests/fixtures/` | Vitest sem Foundry; atores sintéticos | Sem conteúdo comercial |

## Fluxo

1. `ready`: cria uma instância única do painel e resolve o ator (`subject-resolver`).
2. Hooks de documento (`updateActor`, itens do ator, `updateUser.character`,
   `controlToken`, efeitos) marcam partes sujas; um debounce curto renderiza só essas partes.
3. Render: adaptador → `CharacterSnapshot` → domínio → `PanelViewModel` → templates.
4. Clique: `actions` do ApplicationV2 → ação do adaptador → sistema (diálogo/card nativo
   ou `update`) → hook → render da parte afetada.

## Contratos internos

| Contrato | Conteúdo mínimo |
|---|---|
| `Subject` | `actor`, `token` opcional, motivo (`assigned`, `controlled`, `gm-selection`) |
| `CharacterSnapshot` | id/uuid, tipo (`character`/`mook`), identidade, HP, ferimento, humanity, LUCK, death save, armadura, STATs, perícias normalizadas, roles roláveis, interface disponível, ledgers (se existirem), lesões, drogas, efeitos/status |
| `PanelViewModel` | Seções já ordenadas e rotuladas, flags de visibilidade, estado vital, classes de cor |
| `PanelAction` | Nome + parâmetros mínimos (ids, chaves), nunca caminhos de dados |
| `PanelPrefs` | Cor de destaque, escala, posição, seções visíveis, animação, seguir token |

## Partes do ApplicationV2 (implementado até a E3)

Ordem no DOM: `drawer`, `identity`, `vitals`, `stats`, `dock`, `actions` (filhos diretos do
`<aside>`; a grade CSS posiciona por `grid-area`). Mapa de mudanças em `src/domain/panel-parts.ts`.
O nó `.ccp-monitor` é preservado em `_syncPartState` enquanto o estado vital não muda.
`drawer` e `actions` montam o contexto em `_preparePartContext` (perícias, roles e NET só são
lidos quando a parte é renderizada; a gaveta lê só o conteúdo aberto).

Largura: `width: min(1040px, 100%)` com `contain: inline-size`, para o painel não empurrar a
coluna central do Foundry; um `ResizeObserver` aplica `ccp-narrow` (< 880 px) e `ccp-tiny`
(< 560 px), que reorganizam a grade. Recolhido volta a `fit-content`. A região `slots` (módulo
de combate) entra na E6.

## API pública para o módulo de combate (E6)

Exposta em `game.modules.get("cyberpunk-character-panel").api` e anunciada por
`Hooks.callAll("ccpReady", api)` no `ready`, logo depois de criar o painel. Contrato v1
implementado na E6-01 (D46):

| Membro | Função |
|---|---|
| `version` | Versão do contrato (`1`) |
| `getSubject()` | Ator/token exibidos agora (somente leitura) |
| `registerSlot({id, region, order, render, onAction?})` | Injeta conteúdo numa região reservada (`bar-end`, `drawer`, `quick`) |
| `unregisterSlot(id)` | Remove |
| `requestRender(regions?)` | Pede render das partes do painel |
| `getPalette()` | Variáveis de cor atuais, para o outro módulo combinar com o tema |
| Hook `ccpSubjectChanged(subject)` | Avisa troca de personagem |
| Hook `ccpRendered(app, parts)` | Depois de cada render |

Regras: conteúdo injetado vive dentro de um contêiner com a classe do slot; o painel não
interpreta nem valida regras do outro módulo; erro num slot não derruba o painel.

Como ficou (código em `src/domain/slots.ts`, `src/ui/slot-host.ts`, `src/api/panel-api.ts`):

- `registerSlot` devolve `true`/`false` (aviso no console com o motivo). Campos: `id`
  (`[a-z0-9-]`, até 48), `region`, `order` (padrão 0; empate pelo id), `render(context)`,
  `onAction?(action, event, context)`, `label` (obrigatório na `drawer`, até 40) e `icon`
  (classes Font Awesome; padrão `fa-solid fa-puzzle-piece`). Registrar de novo o mesmo id
  substitui.
- `render` devolve um `Node` ou uma string HTML (ou nada). `context` = `{region, subject,
  palette, container}`. Roda a cada render da parte que contém a região; quem injeta pede
  `requestRender(["quick"])` quando os próprios dados mudam.
- Ações: qualquer elemento com `data-slot-action="nome"` dentro do slot chama `onAction` com o
  evento original (Shift/Ctrl disponíveis).
- Regiões: `bar-end` no fim da linha de abas (parte `actions`); `quick` no dock, visível também
  com o painel recolhido (parte `dock`); `drawer` vira uma aba na linha de abas que abre a
  gaveta com o título e o conteúdo do slot (partes `actions` e `drawer`). Remover o slot fecha
  a gaveta dele. Região sem slot fica escondida.
- `getSubject()` devolve `{actor, token, reason}` congelado ou `null`; o mesmo objeto vai no hook
  `ccpSubjectChanged`. `getPalette()` devolve `accent`, `accentStrong`, `accentSoft`,
  `accentLine`, `accentInk` e `variables` (as variáveis `--ccp-*`), já com a prévia do editor
  de cor se houver. `ccpRendered(app, parts)` vem depois de cada render.

## Persistência

Somente ajustes de cliente (`localStorage` do Foundry) e, opcionalmente, padrões de mundo
do mestre. Nada em flags do ator nesta versão; favoritos usam o campo nativo `favorite`.

## Erros

Ação sem permissão ou dado ausente: aviso localizado, sem exceção solta. Falha do
sistema durante rolagem: registrar no console com contexto e manter o painel utilizável.
