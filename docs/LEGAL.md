# Licenças e conteúdo publicável

Objetivo: publicar oficialmente no Foundry (página de pacote) sem pirataria nem violação de
licença. Não é aconselhamento jurídico; é a regra de trabalho do projeto (D06).

## Nosso código

MIT (`LICENSE`), mesmo autor do Netrunner HUD. Código do Netrunner HUD pode ser reaproveitado.

## Aviso obrigatório (README, module.json, página do Foundry)

"Character Panel is unofficial content provided under the Homebrew Content Policy of
R. Talsorian Games and is not approved or endorsed by RTG. This content references
materials that are the property of R. Talsorian Games and its licensees."

## O que é permitido

- Ler e escrever dados da ficha pelo sistema em execução (APIs, métodos, rótulos `CPR.*`).
- Mostrar nomes de perícias, roles, itens e lesões que **já estão na ficha** do usuário.
- Usar as fontes que o sistema carrega, referindo-se a elas por nome no CSS.
- Font Awesome Free que o Foundry já fornece; ícones e SVGs desenhados por nós.
- Ideias e fluxos de outros módulos (ideias não têm direito autoral), reescritas do zero.

## O que é proibido

- Texto de regras, descrições, tabelas (lesões críticas, DVs, preços), arte ou logotipos dos
  livros da RTG ou do Cyberpunk 2077/Edgerunners (CD PROJEKT/Netflix).
- Copiar arquivos, templates, CSS ou imagens do sistema CPR (GPL v3) para dentro do módulo.
  Chamar o sistema em execução é permitido; empacotar código dele não.
- Copiar código do **PneumaCombatTools** (sem licença = todos os direitos reservados).
- Copiar código do cpr-combat-hud ou do PneumaQuickHack sem manter o aviso MIT deles. Regra
  do projeto: não copiar; se algum trecho for adaptado, registrar em `THIRD_PARTY_NOTICES.md`
  com o aviso de copyright e a decisão em DECISIONS.md.
- Nome do pacote com "Cyberpunk RED" como marca principal ou logotipo da RTG; usar a forma
  "… — for Cyberpunk RED" como no Netrunner HUD.

## Checklist antes de publicar

- [ ] Busca no repositório por texto de livro (tabelas, descrições longas) sem resultados.
- [ ] Nenhum arquivo de terceiros sem licença compatível; `THIRD_PARTY_NOTICES.md` se houver.
- [ ] Aviso da Homebrew Content Policy no README, `module.json` e página do pacote.
- [ ] Ícones e imagens próprios ou Font Awesome Free.
