# Estado e passagem de contexto

Atualizado em: 2026-11-17.

## Situação

- E0 a E5 concluídas. Além do conteúdo da ficha (E1–E4), o painel tem cor de destaque por jogador
  com editor próprio, cor padrão do mundo definida pelo mestre e preferências de layout.
- Todas as decisões de docs/DECISIONS.md estão confirmadas (D26–D28 novas nesta etapa).
- Leiaute redesenhado em 2026-11-17 (D29–D31), aguardando validação do usuário; o protótipo E0-03
  (`prototype/panel.html`) ficou como referência histórica.
- Repositório privado: <https://github.com/agnasci/cyberpunk-character-panel> (`main`); E4 em `2f31f4c`.

## Última entrega: UI-R1 — redesenho da interface (2026-11-17)

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
| E6-01 | TODO | API v1 (D12): `getSubject`, slots, hooks, paleta | Pode começar |
| E6-02 | TODO | `docs/INTEGRATION.md` para o módulo de combate | Depois de E6-01 |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`zoom`, `mask`, `contain`, `color-mix`, `:has`, `display: contents`) no Electron do Foundry e no Firefox.
