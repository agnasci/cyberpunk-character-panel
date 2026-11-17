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

## Partes do ApplicationV2 (proposta)

`identity`, `vitals` (biomonitor separado para não reiniciar a animação), `stats`,
`quick` (botões), `favorites`, `drawer` (gaveta aberta), `slots` (conteúdo de outros
módulos). Verificar `render({parts})` na E0-02; se não servir, separar o biomonitor
em elemento próprio atualizado por atributos (`data-state`, variáveis CSS).

## API pública para o módulo de combate (E6)

Exposta em `game.modules.get("cyberpunk-character-panel").api` e anunciada por
`Hooks.callAll("ccpReady", api)`. Proposta de contrato v1:

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

## Persistência

Somente ajustes de cliente (`localStorage` do Foundry) e, opcionalmente, padrões de mundo
do mestre. Nada em flags do ator nesta versão; favoritos usam o campo nativo `favorite`.

## Erros

Ação sem permissão ou dado ausente: aviso localizado, sem exceção solta. Falha do
sistema durante rolagem: registrar no console com contexto e manter o painel utilizável.
