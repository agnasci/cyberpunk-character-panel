# Estado e passagem de contexto

Atualizado em: 2026-11-16.

## Situação

- E0, E1, E2 e E3 concluídas. O painel tem identidade, biomonitor, HP/LUCK/Death Save,
  Humanity, armadura (só leitura), grade de STATs, Facedown, gavetas de perícias, roles e NET, e
  faixa de favoritas. Tudo rola pela ficha nativa.
- Decisões pendentes resolvidas por delegação do usuário (2026-11-16): todas as linhas de
  docs/DECISIONS.md estão confirmadas; D03a definiu a fronteira com o combate; D20–D23 novas.
- Protótipo visual aprovado: `prototype/panel.html`, <https://claude.ai/artifact/UZxzG4ErvFhCc2L6mycLeY>.
- Repositório privado: <https://github.com/agnasci/cyberpunk-character-panel> (`main`).

## Última entrega: D03a + E2-05 + E3 (2026-11-16)

Arquivos novos: `src/domain/{sheet-lists,panel-views}.ts`, `src/integrations/cpr/sheet-adapter.ts`,
`templates/{stats,actions,drawer}.hbs`, `tests/unit/{sheet-lists,panel-views,sheet-adapter}.test.ts`.
Alterados: snapshot/adaptador (armadura, STATs), `character-actions.ts` (rolagens),
`panel-parts.ts`, `view-model.ts`, `ui/character-panel-app.ts`, `vitals.hbs`, CSS, `lang/*.json`,
docs (DECISIONS, COMPATIBILITY, ARCHITECTURE, PLAN).

- D03a: armadura só leitura no painel; ablação/dano e rolar lesão crítica no módulo de combate;
  reparo na ficha; mods situacionais ficam no diálogo nativo de rolagem.
- E2-05: chip de SP (cabeça, corpo, escudo) com os valores rastreados pela ficha.
- E3-01: rolagens por `sheet._onRoll` com evento sintético (`buildRollEvent`); Ctrl pula o diálogo.
- E3-02: grade 5×2 de STATs roláveis (ordem da ficha, LUCK/EMP com máx.) e botão Facedown.
- E3-03: gaveta de perícias por categoria, total igual ao da ficha (D20), busca sem acento,
  estrela que grava `system.favorite`, `*` quando há mod situacional.
- E3-04: faixa de favoritas (só perícias, D21), some sem favoritas.
- E3-05: gaveta de roles com habilidades roláveis (principal + sub, rank).
- E3-06: gaveta NET com deck equipado (D22). Atalho para o Netrunner HUD **não feito**: a API
  dele não expõe abrir a sessão (só `openPrototype`).
- Layout responsivo (D23): o painel não alarga mais a coluna central; em largura menor os STATs
  vão para uma linha própria.

Validação:
- `npm run check` exit 0 (60 testes).
- Manual real (Foundry 12.343, CPR v0.92.4, mundo `cyberdeck-hud`):
  - Mestre: com efeito ativo (+2 Perception) e mod situacional (+1 Stealth), os 63 totais do
    painel = coluna base da ficha. Busca real "perc" → 2 perícias em 2 grupos; "zzz" → aviso;
    Esc limpa. Estrela grava `favorite`, a faixa atualiza e a busca continua aplicada. Cards
    nativos de perícia (gaveta e faixa), STAT, Facedown, habilidade de role e Interface. Sem role
    de NET: aviso nativo, sem card; com role: card de Interface. Chip de armadura "HEAD 11/11
    BODY 9/11" igual a `externalData`. Alt+C real recolhe/expande sem abrir a ficha (C do núcleo).
    Largura 796 px: classe `ccp-narrow`, STATs em linha própria, coluna central não alarga.
  - Jogador (Runner Teste): cards de STAT, Interface e perícia com autor = jogador; sem Ctrl o
    diálogo nativo mostra o mod situacional "CCP Teste efeito".
  - Console: só os avisos nativos esperados e erros de render da ficha causados por um efeito de
    teste mal formado criado por mim (apagado; ver COMPATIBILITY).
- Não testado: Firefox e Electron; `ccp-tiny` (< 560 px) só por CSS; pt-BR em execução; escudo
  rastreado (sem item de escudo no mundo de teste); posição "em cima" com gaveta aberta.

Mundo de teste: "CCP Teste — Personagem" ganhou itens com a flag `cyberpunk-character-panel.probe`
(armadura equipada SP 11 com ablação 2 no corpo, deck equipado, role Netrunner 4 como role de
NET) e o efeito "CCP Teste efeito"; INT 8, Perception nível 4, Perception e Stealth favoritas.
Último login no navegador do app: Runner Teste. Pode ter ficado um diálogo de rolagem do CPR preso
na aba do jogador (fechada).

## Aguardando o usuário

Nada bloqueia. Itens que dependem de outro projeto: atalho para o Netrunner HUD (expor abertura da
sessão na API dele).

## Próximas tarefas

Estados: `TODO`. Uma tarefa por vez; detalhe em docs/PLAN.md.

| ID | Estado | Entrega | Condição |
|---|---|---|---|
| E4-01 | TODO | Ledgers: Eurobucks, IP, Reputação, com motivo | Pode começar |
| E4-02 | TODO | Lesões críticas atuais (abrir item) | Pode começar |
| E4-03 | TODO | Status de token e efeitos ativos | Pode começar |
| E4-04 | TODO | Drogas carregadas: usar | Pode começar |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`zoom`, `mask`, `contain`, `color-mix`) no Electron do Foundry e no Firefox.
