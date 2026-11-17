# Estado e passagem de contexto

Atualizado em: 2026-11-16.

## Situação

- E0 a E4 concluídas. O painel tem identidade, biomonitor, HP/LUCK/Death Save, Humanity, armadura
  (só leitura), STATs, Facedown, perícias, roles, NET, favoritas, ledgers e saúde (lesões, drogas,
  efeitos, status do token). Tudo pela ficha nativa.
- Todas as decisões de docs/DECISIONS.md estão confirmadas (D03a define a fronteira com o combate).
- Protótipo visual aprovado: `prototype/panel.html`, <https://claude.ai/artifact/UZxzG4ErvFhCc2L6mycLeY>.
- Repositório privado: <https://github.com/agnasci/cyberpunk-character-panel> (`main`); E3 em `d50bf4b`.

## Última entrega: E4 — ficha rápida e saúde (2026-11-16)

Arquivos novos: `src/domain/quick-sheet.ts`, `src/integrations/cpr/quick-sheet-adapter.ts`,
`tests/unit/quick-sheet.test.ts`. Alterados: `panel-views.ts`, `panel-parts.ts`,
`ui/character-panel-app.ts`, `templates/{actions,drawer}.hbs`, CSS, `lang/*.json`, `foundry.d.ts`,
docs (DECISIONS D24–D25, COMPATIBILITY).

- E4-01: gaveta "Ficha rápida" com Eurobucks, IP (só `character`) e Reputação: quantia + motivo,
  somar/subtrair/definir, botão do diálogo nativo do ledger (D24).
- E4-02: lesões críticas com local e marca de Death Save +1; clique abre o item.
- E4-03: efeitos ativos (próprios e de itens) com liga/desliga e abrir; grade dos 34 status do token.
- E4-04: drogas com quantidade e "Consumir" pela confirmação nativa (`snort`), desabilitado em 0.

Validação:
- `npm run check` exit 0 (71 testes).
- Manual real como jogador (Runner Teste, Foundry 12.343, CPR v0.92.4):
  - Ledger com digitação real: −50 eb com motivo → 350 e transação "Teste painel - Runner Teste";
    IP definido 25; Reputação +1 sem motivo; quantia "abc" → aviso e foco no campo; −500 eb → aviso
    nativo "You lost more Eurobucks than you have!" e saldo −150 (igual à ficha); diálogo nativo
    "Eurobucks Ledger" abriu. Valores restaurados (400 eb, IP 10, Rep 1) pelo próprio ledger.
  - Saúde: lesão criada com Death Save +1 subiu o Death Save do painel na hora; clique abriu o
    item. Efeito desligado/religado (linha esmaecida). Status "prone" ligado/desligado pela grade.
    Droga: confirmação nativa, quantidade 2 → 1, notificação do sistema.
  - Visual das duas gavetas conferido em captura. Console sem erros além do aviso de quantia inválida.
- Não testado: ledgers de mook (só Reputação; coberto por teste unitário); mestre na gaveta Saúde;
  Firefox e Electron; pt-BR em execução.

Mundo de teste: o personagem de teste tem também "CCP Teste Lesão" (cabeça, Death Save +1) e
"CCP Teste Droga" (×1), com a flag `cyberpunk-character-panel.probe`; ledgers com transações de
teste. Último login no navegador do app: Runner Teste.

## Aguardando o usuário

Nada bloqueia. Depende de outro projeto: atalho para o Netrunner HUD (expor abertura da sessão).

## Próximas tarefas

Estados: `TODO`. Uma tarefa por vez; detalhe em docs/PLAN.md.

| ID | Estado | Entrega | Condição |
|---|---|---|---|
| E5-01 | TODO | Paleta derivada e contraste (D09) | Pode começar |
| E5-02 | TODO | Editor de cor com prévia e predefinições | Depois de E5-01 |
| E5-03 | TODO | Seções visíveis, modo compacto, animações, posição | Pode começar |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`zoom`, `mask`, `contain`, `color-mix`) no Electron do Foundry e no Firefox.
