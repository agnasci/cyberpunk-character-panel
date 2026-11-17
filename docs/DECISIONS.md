#. Foundry (`ChatMessage.getSpeaker`) prefere o token controlado; o painel fixa o atribuído para não pular de ficha quando o jogador mexe em outros tokens, e o ajuste "seguir token" cobre o outro caso. Na V12 o núcleo usa C (ficha), Shift+C (chat) e Ctrl+C (copiar); o CPR não registra atalhos; Alt+C fica livre. Mostra o mínimo que se consulta em jogo (nome e HP); o restante está a um clique |
|
|
Decisões

Estados: **Confirmada** (pelo usuário), **Confirmada por delegação** (o usuário pediu em 2026-11-16 que o
agente decidisse pelas regras oficiais e pelo funcionamento do sistema; motivo registrado), **Proposta**,
**Substituída**.

| ID | Estado | Decisão | Motivo |
|---|---|---|---|
| D01 | Confirmada por delegação (2026-11-16) | TypeScript + Vite + Vitest, Node 24, dependências fixadas, mesma base de configuração do Netrunner HUD | Base já testada e publicada pelo mesmo autor |
| D02 | Confirmada por delegação (2026-11-16) | Alvo Foundry 12.343 + CPR v0.92.4 | Versões instaladas e as do Netrunner HUD; o CPR ainda não suporta V13 |
| D03 | Confirmada (2026-11-16) | Sem combate: fora ataque, dano de arma, modos de fogo, munição, iniciativa, turno | Pedido do usuário; módulo de combate futuro somará ao painel |
| D03a | Confirmada por delegação (2026-11-16) | Armadura: o painel mostra SP atual/máx. de cabeça e corpo e HP do escudo (os rastreados em `externalData`), só leitura. Ablação manual e aplicação de dano ficam no módulo de combate; reparo fica na ficha. Rolar lesão crítica fica no módulo de combate (a lista de lesões continua na E4-02). Mods situacionais não entram no painel: o diálogo nativo de rolagem já os oferece e todas as rolagens do painel passam por ele | Regra: ablação ocorre quando dano atravessa a armadura e lesão crítica vem de dano (dois 6), ambos do fluxo de combate; o sistema aplica ablação pelo card de dano. Reparo é ação de downtime e só existe como código da ficha de personagem (chamá-lo exigiria copiar regra). O sistema mostra os mods situacionais no `cpr-roll-dialog` |
| D04 | Confirmada por delegação (2026-11-16) | Ator exibido: personagem atribuído ao usuário; opção de seguir token próprio controlado; mestre usa seleção e, sem ela, o próprio personagem atribuído | Pedido "personagem ativo daquele jogador"; a referência fazia o contrário. Foundry (`ChatMessage.getSpeaker`) prefere o token controlado; o painel fixa o atribuído para não pular de ficha quando o jogador mexe em outros tokens, e o ajuste "seguir token" cobre o outro caso |
| D05 | Confirmada por delegação (2026-11-16) | Sem socket nem autoridade do mestre: só atores que o usuário possui; dono grava com `update`/métodos do sistema | Nada é compartilhado; o Foundry já valida permissão do documento |
| D06 | Confirmada (2026-11-16) | Conteúdo publicável: nada de livro, nada de código sem licença compatível (docs/LEGAL.md) | Pedido do usuário para publicar oficialmente |
| D07 | Confirmada por delegação (2026-11-16) | Rolagens delegadas a `actor.sheet._onRoll` com evento sintético, sem importar arquivos internos do sistema | Uma fonte do pipeline; técnica testada no Netrunner HUD; a cópia do cpr-combat-hud já diverge |
| D08 | Confirmada por delegação (2026-11-16) | Biomonitor de desenho próprio, estado vindo de `currentWoundState` do sistema e "morto" do status `dead` | PneumaCombatTools não tem licença; limiares próprios inventariam regra; o sistema nunca calcula `dead` (E0-02) |
| D09 | Confirmada por delegação (2026-11-16) | Uma cor de destaque por usuário (ajuste de cliente) gera toda a paleta no domínio; cores de estado fixas | Pedido de color picker com UI coerente e legível |
| D10 | Confirmada por delegação (2026-11-16) | `ApplicationV2` sem moldura, encaixado na borda inferior, render por partes | Painel persistente sem janela; não reiniciar animação a cada mudança |
| D11 | Confirmada por delegação (2026-11-16) | Id `cyberpunk-character-panel`, título "Character Panel — for Cyberpunk RED", prefixos `ccp-`/`CCP.` | Nome da pasta; padrão do Netrunner HUD e da política da RTG |
| D13 | Confirmada por delegação (2026-11-16) | Cor de destaque como ajuste de cliente `ColorField` (aparece nas configurações) + editor rápido no painel | `ColorField` testado na V12 (E0-02) |
| D14 | Confirmada por delegação (2026-11-16) | Painel inserido em `#ui-bottom` por `_insertElement`, sem moldura | Testado que o elemento sai no `body` e o método existe; posição final na E1-02 |
| D15 | Confirmada por delegação (2026-11-16) | Atalho padrão Alt+C (C de character) para recolher, reconfigurável | Não colide com o `H` do cpr-combat-hud; testado na E1. Na V12 o núcleo usa C (ficha), Shift+C (chat) e Ctrl+C (copiar); o CPR não registra atalhos; Alt+C fica livre |
| D16 | Confirmada por delegação (2026-11-16) | Recolhido = barra fina com nome e HP (sem retrato, alias, role, estado); estado salvo no cliente | Implementado na E1; ajustar com o usuário. Mostra o mínimo consultado em jogo (nome e HP); o resto está a um clique |
| D12 | Confirmada por delegação (2026-11-16) | API pública versionada (`api.version = 1`) com slots e hooks para o módulo de combate | Pedido de integração futura sem acoplamento |
| D17 | Confirmada por delegação (2026-11-16) | HP: botões ±1/±5 e campo direto que aceita valor (12) ou variação (-5, +3), sempre limitado a 0..máx; LUCK com botões −/+ limitados a 0..máx (no lugar do clique direito do protótipo); Death Save rola pela ficha e aumenta/zera pelos métodos do sistema | O sistema já corta HP acima do máx. ao preparar os dados; botões visíveis são acessíveis por teclado |
| D18 | Confirmada por delegação (2026-11-16) | Humanity aparece só para `character`, igual às fichas nativas (a ficha de mook não mostra) e só leitura | Perda de Humanity por cyberware é fluxo da ficha |
| D19 | Confirmada por delegação (2026-11-16) | Ajuste de cliente "Animar biomonitor" (padrão ligado); aba oculta e `prefers-reduced-motion` também param o traço | Critério E2-03 e acessibilidade |
| D20 | Confirmada por delegação (2026-11-16) | Totais de perícia e nomes traduzidos vêm dos helpers Handlebars que o próprio sistema registra (`cprGetSkillModInfo`, `cprGetLocalizedlNameKey`), chamados em tempo de execução pelo adaptador, com volta ao nome do item se faltarem | A ficha usa esses helpers; reusá-los mantém o total igual ao da ficha (testado: 63/63 iguais com efeito ativo) sem importar arquivos internos (D07) |
| D21 | Confirmada por delegação (2026-11-16) | Faixa de favoritas mostra só perícias favoritas (`system.favorite`), em ordem alfabética do nome traduzido | Armas favoritas são ataque (D03); a ficha marca favoritas com o mesmo campo |
| D22 | Confirmada por delegação (2026-11-16) | Gaveta NET aparece só com cyberdeck equipado; mostra as 9 habilidades de Interface mais Defesa e Velocidade, como a aba de combate da ficha; sem role de NET, a rolagem mostra o erro nativo | Igual à ficha; a escolha da role de NET continua na ficha |
| D23 | Confirmada por delegação (2026-11-16) | Painel ocupa `min(1040px, 100%)` com `contain: inline-size` e reorganiza a grade por largura (classes `ccp-narrow`/`ccp-tiny`) | Com `max-content` o painel alargava a coluna central do Foundry e empurrava a barra lateral (visto em teste) |

## Formato de nova decisão

Acrescente uma linha com ID sequencial, estado, decisão em uma frase e motivo. Se
substituir outra, marque a antiga como **Substituída por Dnn**.
