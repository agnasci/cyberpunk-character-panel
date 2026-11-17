# Plano de etapas

Uma tarefa por vez, na ordem, salvo pedido do usuário. Cada tarefa termina com evidência
registrada no STATUS (testes, `npm run check`, teste manual no Foundry quando houver UI).
Requisitos R01–R10 em [SPEC.md](../SPEC.md). Apagar este arquivo quando o plano acabar.

## E0 — Fundação

| ID | Entrega | Arquivos | Aceite |
|---|---|---|---|
| E0-01 | Ferramentas e módulo vazio carregando | `package-lock.json`, `src/main.ts`, `src/constants.ts`, `src/types/foundry.d.ts`, `styles/character-panel.css`, junção em `Data/modules` | `npm ci && npm run check` exit 0; módulo ativo no mundo `cyberdeck-hud` sem erros no console |
| E0-02 | Provas de API em execução | `docs/COMPATIBILITY.md` | Cada "a verificar" da matriz vira testado ou alternativa decidida: `render({parts})`, janela sem moldura, `ColorField`, `color-mix`/`oklch`, `_onRoll` sintético para stat/skill/role/interface/deathsave/facedown (inclusive token não vinculado), `deltaLedgerProperty`, hooks |
| E0-03 | Protótipo visual estático para aprovação | `prototype/panel.html` (fora do build) ou artifact | Usuário aprova layout, tipografia, 3+ cores de destaque e o biomonitor nos 6 estados; ajustes registrados em docs/UI.md |

## E1 — Esqueleto do painel

| ID | Entrega | Arquivos | Aceite |
|---|---|---|---|
| E1-01 | Resolver o ator exibido (D04) | `src/domain/subject.ts`, `src/integrations/cpr/subject-resolver.ts`, testes | Testes: atribuído, token controlado com/sem opção, mestre, sem permissão, mook. Manual: troca de personagem atribuído reflete na hora |
| E1-02 | `CharacterPanelApp` persistente e recolhível | `src/ui/character-panel-app.ts`, `templates/panel.hbs`, CSS base | Aparece no `ready`, recolhe/expande por atalho e botão, sobrevive a troca de cena |
| E1-03 | Snapshot e render incremental | `src/integrations/cpr/character-adapter.ts`, `src/domain/view-model.ts`, testes com fixtures | Mudança de HP pela ficha atualiza só a parte vital (conferido em execução); testes do view model |
| E1-04 | Ajustes de cliente básicos | `src/settings.ts`, `lang/*.json` | Ligar/desligar, escala, posição, seguir token; persistem após F5 |

## E2 — Identidade e vital

| ID | Entrega | Aceite |
|---|---|---|
| E2-01 | Identidade: retrato, nome, alias sem HTML, role ativa/rank, ferimento | Valores iguais à ficha em personagem e mook |
| E2-02 | HP: barra segmentada, ±1/±5, valor direto com limites | Grava como a ficha; jogador sem posse não consegue alterar |
| E2-03 | Biomonitor (D08) | 6 estados conferidos na tela; pausa recolhido/aba oculta/reduced motion; sem rAF contínuo |
| E2-04 | Humanity, LUCK ±, Death Save (rolar, aumentar, zerar) | Card nativo igual ao da ficha; LUCK limitada a 0..máx |
| E2-05 | Armadura só leitura (D03a): SP atual/máx. de cabeça e corpo, HP do escudo | Mesmos valores rastreados pela ficha |

## E3 — Atributos e rolagens

| ID | Entrega | Aceite |
|---|---|---|
| E3-01 | Adaptador de rolagem por `sheet._onRoll` (D07) | Testes do evento sintético; Ctrl pula diálogo como na ficha |
| E3-02 | Grade de STATs roláveis e Facedown | Cards iguais aos da ficha |
| E3-03 | Gaveta de perícias: categorias, total, busca, favoritas | Total igual ao da ficha com efeitos ativos; favorito grava `system.favorite` |
| E3-04 | Faixa de favoritas | Ordem estável; some sem favoritas |
| E3-05 | Gaveta de roles (principal e sub-habilidades) | Rolagem igual à ficha |
| E3-06 | Gaveta NET (Interface); atalho para o Netrunner HUD depende de a API dele expor a abertura da sessão | Só aparece com deck equipado; sem role de NET escolhida, erro nativo (D22) |

## E4 — Ficha rápida e saúde (itens sujeitos à revisão do usuário)

| ID | Entrega | Aceite |
|---|---|---|
| E4-01 | Ledgers: Eurobucks, IP (character), Reputação, com motivo | Transação aparece no ledger nativo da ficha |
| E4-02 | Lesões críticas atuais (abrir item) | Lista igual à ficha |
| E4-03 | Status de token e efeitos ativos | Mostrar; alternar status do token próprio |
| E4-04 | Drogas carregadas: usar | Usa a confirmação e os efeitos nativos (`snort`) |

## E5 — Personalização

| ID | Entrega | Aceite |
|---|---|---|
| E5-01 | Paleta derivada e contraste (D09) | Testes: texto sobre destaque ≥ 4,5:1; aviso de conflito com cores de estado |
| E5-02 | Editor de cor com prévia e predefinições | Troca ao vivo; persiste; padrão de mundo do mestre |
| E5-03 | Seções visíveis, modo compacto, animações, posição | Cada opção persiste e é respeitada |

## E6 — Integração com o módulo de combate

| ID | Entrega | Aceite |
|---|---|---|
| E6-01 | API v1 (D12): `getSubject`, slots, hooks, paleta | Módulo de teste local injeta um bloco e recebe troca de personagem |
| E6-02 | Documento de integração | `docs/INTEGRATION.md` basta para escrever o módulo de combate |

## E7 — Qualidade e publicação

| ID | Entrega | Aceite |
|---|---|---|
| E7-01 | i18n completo pt-BR/en e acessibilidade | Teclado cobre todas as ações; sem texto fixo no template |
| E7-02 | Revisão de desempenho | Sem render em loop; hooks filtrados pelo ator exibido |
| E7-03 | Checklist legal (docs/LEGAL.md) e README | Checklist marcado com evidência |
| E7-04 | Release (quando o usuário pedir) | Mesmo fluxo do Netrunner HUD (`docs/DEVELOPMENT.md`) |
