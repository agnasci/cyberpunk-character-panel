# Estado e passagem de contexto

Atualizado em: 2026-11-16.

## Situação

- E0 a E5 concluídas. Além do conteúdo da ficha (E1–E4), o painel tem cor de destaque por jogador
  com editor próprio, cor padrão do mundo definida pelo mestre e preferências de layout.
- Todas as decisões de docs/DECISIONS.md estão confirmadas (D26–D28 novas nesta etapa).
- Protótipo visual aprovado: `prototype/panel.html`, <https://claude.ai/artifact/UZxzG4ErvFhCc2L6mycLeY>.
- Repositório privado: <https://github.com/agnasci/cyberpunk-character-panel> (`main`); E4 em `2f31f4c`.

## Última entrega: E5 — personalização (2026-11-16)

Arquivos novos: `src/domain/{palette,style-view}.ts`, `tests/unit/{palette,style-view}.test.ts`.
Alterados: `settings.ts`, `constants.ts`, `panel-views.ts`, `ui/character-panel-app.ts`,
`templates/{dock,drawer}.hbs`, CSS, `lang/*.json`, `foundry.d.ts`, docs (DECISIONS, COMPATIBILITY, UI).

- E5-01: paleta derivada da cor de destaque (D26): tinta preta/branca pelo contraste WCAG, tom
  forte com ≥ 4,5:1 sobre o fundo, aviso e batimento verde quando a cor fica perto de uma cor de
  ferimento. Testado para as 8 predefinições, preto, branco e azul escuro.
- E5-02: botão de paleta no painel abre o editor (D27): 8 predefinições, seletor nativo, hex,
  prévia ao vivo, salvar, voltar ao padrão do mundo e, para o mestre, definir o padrão do mundo.
  Ajustes `accent` (cliente, `ColorField` anulável) e `defaultAccent` (mundo).
- E5-03: modo compacto, mostrar favoritas, mostrar BPM, animar biomonitor e posição, no editor e
  na configuração (D28).

Validação:
- `npm run check` exit 0 (80 testes).
- Manual real (Foundry 12.343, CPR v0.92.4):
  - Jogador: predefinição magenta em prévia (tinta escura, botão salvar marcado); vermelho neon
    mostrou o aviso "Mortally Wounded" e o batimento ficou verde; seletor nativo atualiza ao vivo
    sem fechar; fechar o editor descartou a prévia; salvar gravou `#ff2fd0` e mostrou "cor
    pessoal". Compacto, BPM e favoritas ligam/desligam. Tudo persistiu após recarregar; a tela de
    configurações mostra o seletor de cor com o valor salvo. Visual conferido em captura.
  - Mestre: botão "definir como padrão do mundo" (só para o mestre) com verde ácido; o painel do
    jogador, sem cor própria, mudou ao vivo. Posição em cima/embaixo pelo editor. Sem erros no console.
  - Restaurado: padrão do mundo ciano, jogador sem cor própria, preferências padrão, posição embaixo.
- Não testado: Firefox e Electron; leitor de tela no editor; pt-BR em execução.

Mundo de teste: como na E4 (itens e efeito com a flag `cyberpunk-character-panel.probe`). Último
login no navegador do app: Gamemaster.

## Aguardando o usuário

Nada bloqueia. Depende de outro projeto: atalho para o Netrunner HUD (expor abertura da sessão).

## Próximas tarefas

Estados: `TODO`. Uma tarefa por vez; detalhe em docs/PLAN.md.

| ID | Estado | Entrega | Condição |
|---|---|---|---|
| E6-01 | TODO | API v1 (D12): `getSubject`, slots, hooks, paleta | Pode começar |
| E6-02 | TODO | `docs/INTEGRATION.md` para o módulo de combate | Depois de E6-01 |

## Pendências abertas

- `npm audit`: 8 moderadas em dependências de dev.
- Conferir CSS (`zoom`, `mask`, `contain`, `color-mix`) no Electron do Foundry e no Firefox.
