# Decisões

Estados: **Confirmada** (pelo usuário), **Proposta** (aguarda revisão), **Substituída**.

| ID | Estado | Decisão | Motivo |
|---|---|---|---|
| D01 | Proposta | TypeScript + Vite + Vitest, Node 24, dependências fixadas, mesma base de configuração do Netrunner HUD | Base já testada e publicada pelo mesmo autor |
| D02 | Proposta | Alvo Foundry 12.343 + CPR v0.92.4 | Versões instaladas e as do Netrunner HUD; o CPR ainda não suporta V13 |
| D03 | Confirmada (2026-11-16) | Sem combate: fora ataque, dano de arma, modos de fogo, munição, iniciativa, turno | Pedido do usuário; módulo de combate futuro somará ao painel |
| D03a | Proposta | Fronteira a confirmar: ablação/reparo de armadura, rolar lesão crítica, toggles de mods situacionais | São estado da ficha mas usados em combate |
| D04 | Proposta (implementada na E1) | Ator exibido: personagem atribuído ao usuário; opção de seguir token próprio controlado; mestre usa seleção e, sem ela, o próprio personagem atribuído | Pedido "personagem ativo daquele jogador"; a referência fazia o contrário |
| D05 | Proposta | Sem socket nem autoridade do mestre: só atores que o usuário possui; dono grava com `update`/métodos do sistema | Nada é compartilhado; o Foundry já valida permissão do documento |
| D06 | Confirmada (2026-11-16) | Conteúdo publicável: nada de livro, nada de código sem licença compatível (docs/LEGAL.md) | Pedido do usuário para publicar oficialmente |
| D07 | Proposta | Rolagens delegadas a `actor.sheet._onRoll` com evento sintético, sem importar arquivos internos do sistema | Uma fonte do pipeline; técnica testada no Netrunner HUD; a cópia do cpr-combat-hud já diverge |
| D08 | Proposta | Biomonitor de desenho próprio, estado vindo de `currentWoundState` do sistema e "morto" do status `dead` | PneumaCombatTools não tem licença; limiares próprios inventariam regra; o sistema nunca calcula `dead` (E0-02) |
| D09 | Proposta | Uma cor de destaque por usuário (ajuste de cliente) gera toda a paleta no domínio; cores de estado fixas | Pedido de color picker com UI coerente e legível |
| D10 | Proposta | `ApplicationV2` sem moldura, encaixado na borda inferior, render por partes | Painel persistente sem janela; não reiniciar animação a cada mudança |
| D11 | Proposta | Id `cyberpunk-character-panel`, título "Character Panel — for Cyberpunk RED", prefixos `ccp-`/`CCP.` | Nome da pasta; padrão do Netrunner HUD e da política da RTG |
| D13 | Proposta | Cor de destaque como ajuste de cliente `ColorField` (aparece nas configurações) + editor rápido no painel | `ColorField` testado na V12 (E0-02) |
| D14 | Proposta | Painel inserido em `#ui-bottom` por `_insertElement`, sem moldura | Testado que o elemento sai no `body` e o método existe; posição final na E1-02 |
| D15 | Proposta | Atalho padrão Alt+C (C de character) para recolher, reconfigurável | Não colide com o `H` do cpr-combat-hud; testado na E1 |
| D16 | Proposta | Recolhido = barra fina com nome e HP (sem retrato, alias, role, estado); estado salvo no cliente | Implementado na E1; ajustar com o usuário |
| D12 | Proposta | API pública versionada (`api.version = 1`) com slots e hooks para o módulo de combate | Pedido de integração futura sem acoplamento |

## Formato de nova decisão

Acrescente uma linha com ID sequencial, estado, decisão em uma frase e motivo. Se
substituir outra, marque a antiga como **Substituída por Dnn**.
