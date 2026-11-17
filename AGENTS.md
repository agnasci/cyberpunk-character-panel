# Cyberpunk Character Panel — instruções para agentes

## Comece aqui

1. Leia este arquivo e [STATUS.md](STATUS.md) em toda sessão.
2. Leia [SPEC.md](SPEC.md) antes de alterar comportamento.
3. Escolha a próxima tarefa disponível em "Próximas tarefas" do [STATUS.md](STATUS.md);
   o detalhe de cada uma (objetivo, arquivos, aceite) está em [docs/PLAN.md](docs/PLAN.md).
4. Abra somente os documentos e arquivos necessários à tarefa. Consulte o mapa abaixo.
5. Verifique o estado do diretório/Git antes de editar; preserve alterações alheias.

O projeto é um módulo de Foundry VTT para Cyberpunk RED – CORE: um painel de
personagem sempre visível, com atalhos para tudo que importa fora do combate. A
ficha nativa é a fonte de verdade; o painel só lê e pede alterações ao sistema.
Um módulo de combate futuro vai se encaixar no painel pela API pública (docs/ARCHITECTURE.md).

## Regras de trabalho

- Esta base contém documentação e estrutura de preparação, não um módulo funcional.
- Separe requisito do usuário, proposta técnica e fato verificado. Não invente
  APIs, campos de ficha, fórmulas, compatibilidade, testes ou resultados.
- Execute uma tarefa pequena por vez; não implemente etapas futuras por antecipação.
- Antes de programar, registre objetivo, arquivos afetados e critérios de aceite.
- Reuse o sistema nativo: rolagens, diálogos, ledger, cards e regras são do CPR.
  Isole acesso ao Foundry/sistema em `src/integrations/cpr/`.
- O domínio (`src/domain/`) não acessa `game`, `Hooks`, DOM ou documentos Foundry.
- UI não calcula regra: mostra o que o adaptador entrega e chama ações do adaptador.
- Sem combate neste módulo: ataque, dano de arma, iniciativa, turno e munição ficam
  para o módulo de combate (D03). Na dúvida sobre a fronteira, pergunte.
- Conteúdo publicável (D06, docs/LEGAL.md): nenhum texto, tabela, arte ou logo de
  livro da RTG; nenhum código copiado de projeto sem licença compatível.
- Não modifique o código do Foundry ou do sistema instalado. Não versione mundos,
  livros, compêndios comerciais, credenciais ou dados pessoais da mesa.
- Use português nos documentos e comunicação; identificadores de código em inglês.
- Evite dependências, abstrações genéricas, arquivos enormes e duplicação de estado.
- Não escreva comentários no código; explique nos documentos.
- Não exija um plugin de IA específico: estes documentos devem bastar a qualquer IA.
- Registre decisões duráveis em `docs/DECISIONS.md`; progresso somente em `STATUS.md`.
- Só marque concluído com evidência. Diferencie testes automatizados, inspeção
  documental e teste manual real no Foundry. Bloqueio não significa conclusão.

## Leitura sob demanda

| Necessidade | Fonte canônica |
|---|---|
| Objetivo e comportamento | [SPEC.md](SPEC.md) |
| Tarefas abertas e pendências | [STATUS.md](STATUS.md) |
| Etapas, arquivos e critérios de aceite | [docs/PLAN.md](docs/PLAN.md) |
| Camadas, contratos, API para o módulo de combate | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Visual, cores, color picker, biomonitor | [docs/UI.md](docs/UI.md) |
| Campos da ficha e APIs reais do sistema | [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) |
| Estudo dos módulos de referência | [docs/RESEARCH.md](docs/RESEARCH.md) |
| Licenças e conteúdo publicável | [docs/LEGAL.md](docs/LEGAL.md) |
| Ambiente e comandos | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| Validação automatizada e manual | [docs/TESTING.md](docs/TESTING.md) |
| Decisões e propostas | [docs/DECISIONS.md](docs/DECISIONS.md) |

## Convenções do código

- Prefixo CSS `ccp-`; raiz `.ccp-panel`. Chaves i18n `CCP.*`. Id do módulo
  `cyberpunk-character-panel`. Tudo que vem do sistema usa as chaves i18n `CPR.*` dele.
- Cores só por variáveis CSS derivadas da cor de destaque (docs/UI.md); cores de
  estado (ferimento, alerta) são semânticas e não seguem o destaque.

## Economia de contexto

Mantenha este arquivo curto (meta: até 100 linhas). Não copie o histórico em
prompts, comentários ou novos arquivos de instruções. Use IDs de requisito e
tarefa. Pesquise por símbolo/caminho antes de ler diretórios inteiros. Não leia
dependências ou arquivos gerados salvo investigação direcionada.

## Encerramento de sessão

Atualize `STATUS.md` com tarefa, arquivos relevantes, validação executada, pendências
e próximo passo concreto; tire do STATUS o que foi concluído (o histórico fica no git).
Se houver código, execute os checks pertinentes e registre falhas sem mascará-las.
Não faça push, publicação ou alteração na mesa real sem solicitação correspondente.
