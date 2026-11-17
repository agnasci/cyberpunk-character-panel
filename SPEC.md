# Especificação do produto

## Intenção

Dar a cada jogador um painel do seu personagem sempre à vista, bonito e organizado,
com um clique para tudo que importa no Cyberpunk RED – CORE fora do combate. A ficha
nativa continua sendo a fonte de verdade: o painel lê dela e pede ao sistema as
mesmas ações que a ficha faz. Inspiração funcional: cpr-combat-hud (docs/RESEARCH.md),
com UI melhor, cor personalizável e sem a parte de combate.

## Requisitos do usuário (pedido de 2026-11-16)

| ID | Requisito | Resultado observável |
|---|---|---|
| R01 | Painel sempre ativo para o personagem do jogador | Ao entrar no mundo o painel aparece com o personagem do usuário, sem abrir nada |
| R02 | Botões rápidos para o que importa no sistema core | Rolagens e ajustes frequentes a um clique, pelo pipeline nativo do CPR |
| R03 | Estética melhor que a referência, combinando com cyberpunk | Protótipo aprovado pelo usuário antes da implementação visual (E0-03) |
| R04 | UI organizada | Hierarquia clara: identidade → vital → atributos → ações; painéis secundários sob demanda |
| R05 | Cor personalizável por color picker | Cada usuário escolhe a cor de destaque; o painel inteiro se adapta com contraste legível |
| R06 | Sem combate agora | Nada de ataque, dano de arma, iniciativa, turno ou munição (D03) |
| R07 | Preparado para o módulo de combate futuro | API pública e áreas reservadas onde outro módulo injeta conteúdo (docs/ARCHITECTURE.md) |
| R08 | Ligado à ficha de forma legítima e publicável | Só dados e ações do sistema; nenhum conteúdo de livro ou código sem licença (docs/LEGAL.md) |
| R09 | Indicador de batimentos/vital visualmente bonito | Biomonitor com traço de ECG animado que reflete o estado de ferimento (docs/UI.md) |
| R10 | Continuidade entre IAs | AGENTS, STATUS, PLAN e docs bastam para retomar sem o chat |

## Catálogo de funções propostas

Fontes de dados verificadas no código do sistema em docs/COMPATIBILITY.md. Itens com
"(confirmar)" estão na fronteira com combate e aguardam o usuário (D03).

| Bloco | Conteúdo | Ações |
|---|---|---|
| Identidade | Retrato, nome, alias, role ativa e rank, estado de ferimento | Clique abre a ficha |
| Vital | Biomonitor (ECG), HP atual/máx., Humanity, LUCK, Death Save | HP ±1/±5 e valor direto; LUCK gastar/recuperar; rolar Death Save; aumentar/zerar penalidade |
| Armadura (confirmar) | SP de cabeça/corpo e HP do escudo rastreados na ficha | Mostrar; ablação/reparo ±1 pela lógica do sistema |
| Atributos | Os 10 STATs | Clique rola pelo diálogo nativo (Ctrl pula o diálogo, como na ficha) |
| Perícias | Lista por categoria com total (STAT + nível + mods), busca, favoritas | Rolar; marcar favorita (campo `favorite` do sistema); abrir o item |
| Habilidades de role | Habilidade principal e sub-habilidades roláveis | Rolar; abrir a role |
| NET | Habilidades de Interface se houver cyberdeck equipado e role de Netrunning | Rolar; abrir o cyberdeck do Netrunner HUD se ele estiver ativo |
| Facedown | — | Rolar Facedown |
| Ficha rápida | Eurobucks, IP, Reputação (ledger do sistema) | Somar/subtrair com motivo, registrado no ledger nativo |
| Saúde | Lesões críticas atuais, condições/status do token, efeitos ativos, busca por texto | Abrir item; alternar status; ligar/desligar mods situacionais (confirmar) |
| Consumíveis | Drogas carregadas | Usar (ação `snort` do sistema, com a confirmação dele) |
| Personalização | Cor de destaque, escala, posição, seções visíveis, animações | Tudo por usuário; padrão de mundo opcional do mestre |

Mooks não têm wealth, IP nem lifepath no modelo do sistema: esses blocos somem para eles.

## Comportamento proposto

- Personagem exibido: o personagem atribuído ao usuário; opção "seguir token
  selecionado" (token próprio controlado tem prioridade quando ligada). Mestre vê o
  token selecionado; sem seleção, o painel recolhe (D04).
- Só atores que o usuário possui (`isOwner`); mutações são `update` do próprio dono,
  sem socket e sem autoridade do mestre (D05).
- Painel encaixado na borda inferior, recolhível por atalho de teclado; painéis
  secundários abrem como gavetas acima dele, um por vez.
- Renderização incremental: mudar HP não reinicia a animação do ECG nem fecha gavetas.
- Utilizável sem animações (preferência do usuário e `prefers-reduced-motion`), por
  teclado, com foco visível e rótulos acessíveis.
- Textos em pt-BR e en; nomes de perícias, roles e itens vêm da ficha/sistema.

## Fora de escopo nesta versão

Ataques, dano de armas, modos de fogo, munição, iniciativa e turno (módulo de combate);
editar lifepath, inventário completo ou instalar cyberware (a ficha faz); NET Architecture
e sessões de Netrunning (Netrunner HUD); qualquer texto de regra do livro.

## Qualidade e sucesso

- Toda rolagem gera o mesmo card que a ficha geraria (mesmos mods, LUCK, penalidades).
- Mudanças feitas na ficha, por outro usuário ou por outro módulo aparecem no painel em
  até um quadro de debounce, sem recarregar.
- Painel oculto/recolhido não mantém animação nem render em loop.
- Primeira demonstração: jogador real usa o painel uma sessão sem abrir a ficha para
  rolagens comuns, HP, LUCK e ledger.
