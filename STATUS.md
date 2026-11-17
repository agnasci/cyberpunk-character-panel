# Estado e passagem de contexto

Atualizado em: 2026-11-16.

## Situação

- E0, E1 e E2 (exceto E2-05, bloqueada) concluídas. O painel mostra identidade com anel de estado,
  biomonitor, HP editável, Humanity, LUCK e Death Save, e atualiza só a parte que mudou.
- Protótipo visual (E0-03) aprovado pelo usuário em 2026-11-16: `prototype/panel.html`,
  <https://claude.ai/artifact/UZxzG4ErvFhCc2L6mycLeY>.
- Repositório privado: <https://github.com/agnasci/cyberpunk-character-panel> (`main`).
- Estudo, provas de API e fatos verificados: docs/RESEARCH.md e docs/COMPATIBILITY.md.

## Última entrega: E2 — identidade e vital (2026-11-16)

Arquivos novos: `src/domain/{biomonitor,vital-limits}.ts`,
`src/integrations/cpr/character-actions.ts`, `tests/unit/{biomonitor,vital-limits}.test.ts`.
Alterados: snapshot/adaptador/view model, `panel-parts.ts`, `settings.ts`, `main.ts`,
`ui/character-panel-app.ts`, `templates/{identity,vitals}.hbs`, CSS, `lang/*.json`.

- E2-01: anel de estado no retrato (cor do estado vital; pisca em mortalmente ferido).
- E2-02: HP ±1/±5 (aparecem no hover/foco) e campo direto: clicar no número aceita valor (12) ou
  variação (-5, +3), limitado a 0..máx (D17). Cliques rápidos acumulam sem perder passos.
- E2-03: biomonitor (D08, D19) com os 6 estados; nó mantido entre renders do mesmo estado; para
  com aba oculta, ajuste "Animar biomonitor" desligado, `prefers-reduced-motion` e recolhido.
- E2-04: Humanity (só leitura, só `character`, D18); LUCK −/+ limitada a 0..máx; Death Save rola
  pela ficha (diálogo nativo, Ctrl pula), aumenta e zera pelos métodos do sistema.
- Extra: painel reavalia o personagem quando muda a posse (`ownership`) do ator.

Validação:
- `npm run check` exit 0 (41 testes). Chaves i18n usadas existem no módulo ou no sistema; en e
  pt-BR com as mesmas chaves.
- Manual real (Foundry 12.343, CPR v0.92.4, mundo `cyberdeck-hud`, sem erros no console além do
  aviso de resolução do navegador do app):
  - Jogador (Runner Teste) no próprio personagem: −1 mantém identidade e monitor (mesmos nós);
    −1,−1,+5 rápidos = soma correta; −5 até grave troca monitor, BPM, anel e barra. Campo direto
    `-4`, `abc` (ignora), Esc, `99` (vira 40), `0`, `+40` por blur; clique e digitação reais com
    Enter e Esc devolvem o foco ao número. LUCK até 0 e até o máx. com botões desabilitando nos
    limites. Death Save: aumentar/zerar; rolar com Ctrl gerou card nativo (autor = jogador); sem
    Ctrl abriu o diálogo nativo. Ajuste "Animar biomonitor" desligado para o traço; aba oculta
    (simulada) pausa; recolhido esconde monitor, botões e chips.
  - Mestre no mook (token não vinculado): HP, LUCK e penalidade gravam no ator sintético, o base
    não muda; Humanity não aparece (como na ficha do mook); valores iguais à ficha.
  - Mestre tirou a posse do jogador: painel do jogador sumiu; devolveu: voltou com os botões.
    HP alterado pelo mestre aparece no cliente do jogador.
  - Capturas conferidas: sem ferimentos, ferido, grave, mortal, morto e HP indisponível (este
    simulado em memória, sem gravar), hover com botões ±.
- Não testado: Firefox e Electron do Foundry; tela estreita (o painel passa da largura abaixo de
  ~800 px, abaixo do mínimo do Foundry); jogador sem posse vendo o painel (o resolvedor nunca
  mostra ator alheio, então o ramo só leitura do template não aparece hoje); idioma pt-BR em
  execução nesta etapa (só conferência das chaves).

Mundo de teste: Runner Teste tem "CCP Teste — Personagem" atribuído; HP, LUCK e penalidade
restaurados; cena "CCP Teste — Cena" com permissão de observador para todos; atores e cena com a
flag `cyberpunk-character-panel.probe`. Último login no navegador do app: Gamemaster.

## Aguardando o usuário

1. Fronteira com combate (D03a): armadura com ablação/reparo, rolar lesão crítica, mods situacionais.
2. Confirmar D04, nome/título (D11), atalho Alt+C (D15), modo recolhido (D16) e as novas D17–D19.
3. Revisar as demais decisões **Propostas** em docs/DECISIONS.md.

## Próximas tarefas

Estados: `TODO`, `BLOCKED`. Uma tarefa por vez; detalhe em docs/PLAN.md.

| ID | Estado | Entrega | Condição |
|---|---|---|---|
| E2-05 | BLOCKED | Armadura | Decisão D03a |
| E3-01 | TODO | Adaptador de rolagem (já existe `rollFromSheet` em `character-actions.ts`, usado pelo Death Save; generalizar e testar) | Pode começar |
| E3-02 | TODO | Grade de STATs roláveis e Facedown | Depois de E3-01 |
| E3-03 | TODO | Gaveta de perícias | Depois de E3-01 |
| E3-04 | TODO | Faixa de favoritas | Depois de E3-03 |
| E3-05 | TODO | Gaveta de roles | Depois de E3-01 |
| E3-06 | TODO | Gaveta NET | Depois de E3-01 |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`zoom`, `mask`, `color-mix`) no Electron do Foundry e no Firefox.
- Largura estreita: container queries previstas em docs/UI.md ainda não feitas.
