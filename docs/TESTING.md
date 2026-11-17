# Validação

## Automatizada (Vitest, sem Foundry)

- Domínio: resolução do ator, view model, estados do biomonitor, filtro de perícias,
  ordenação de favoritas, paleta e contraste.
- Adaptador: com atores sintéticos em `tests/fixtures/` (sem dados de livro), conferir
  leitura de campos e os eventos sintéticos de rolagem.

## Manual no Foundry (mundo descartável)

Registrar data, versão, usuário (GM/jogador) e o que foi conferido. Roteiro mínimo
por entrega com UI:

1. Jogador dono com personagem atribuído: painel aparece no `ready`.
2. Alterar HP/LUCK/ledger pela ficha: painel acompanha sem F5.
3. Alterar pelo painel: ficha acompanha; card de rolagem idêntico ao da ficha.
4. Token não vinculado (mook): rolagem leva o token certo ao card.
5. Jogador sem posse do ator: nenhuma ação de escrita disponível.
6. Recolher, F5, trocar de cena: estado de ajustes preservado.
7. Redução de movimento ligada: biomonitor estático.
8. Largura estreita (≤ 1280 px) e escala mínima/máxima: nada cortado.

## Critério de "concluído"

Teste automatizado ≠ inspeção de código ≠ teste manual real. O STATUS diz qual foi feito.
