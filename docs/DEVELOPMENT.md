# Desenvolvimento e padrões

## Ambiente

Node 24 LTS (`.nvmrc`), npm com `package-lock.json` e dependências fixadas (D01).
Foundry local: `D:\Foundry Virtual Tabletop` (12.343), dados em
`%LOCALAPPDATA%\FoundryVTT\Data`. Mundo de teste descartável: `cyberdeck-hud`
(confirmar com o usuário antes de usar outro).

| Comando | Responsabilidade |
|---|---|
| `npm ci` | Instalar exatamente o lockfile (o lockfile nasce na E0-01 com `npm install`) |
| `npm run typecheck` | Tipos do código e do `vite.config.ts` |
| `npm run lint` | ESLint + Prettier (verificação) |
| `npm run format` | Aplicar formatação |
| `npm test` | Vitest em `tests/**/*.test.ts`, sem Foundry |
| `npm run build` | Módulo instalável em `dist/` |
| `npm run check` | Tudo acima, em sequência |

## Instalação local para teste (E0-01)

Ligar `dist/` ao Foundry por junção:

```powershell
New-Item -ItemType Junction -Path "$env:LOCALAPPDATA\FoundryVTT\Data\modules\cyberpunk-character-panel" -Target "D:\Desenvolvimento\cyberpunk-character-panel\dist"
```

Depois do build, F5 no navegador. `module.json` novo ou alterado exige voltar ao setup e
relançar o mundo. Ativar o módulo só no mundo de teste.

## CSS

Escopar tudo sob `.ccp-panel`. Seletores do núcleo (`.application ...`) e do CPR
(`.application .window-content button`) vencem seletores de uma classe; o Foundry põe
`margin-right: 3px` em `button > i` (zerar). Lições do Netrunner HUD em
`D:\Desenvolvimento\cyberpunk-netrunner-hud\docs\DEVELOPMENT.md`.

## Implementação

- Um propósito por arquivo; sem `utils` gigante; sem comentários no código.
- Não ler `actor.system.*` fora de `src/integrations/cpr/`.
- Tipos mínimos do Foundry em `src/types/foundry.d.ts`, só o que foi verificado.
- Textos de interface em `lang/`; rótulos do sistema pelas chaves `CPR.*`.
- Funções do domínio determinísticas e testadas.

## Git e entrega

Repositório local criado em 2026-11-16, ainda sem commit. Commits pequenos (`docs:`,
`feat:`, `fix:`, `test:`), só quando o usuário pedir. Sem remoto nem publicação por
inferência. Publicação seguirá o processo do Netrunner HUD (release no GitHub + API de
release do Foundry com token fornecido na hora, nunca gravado).
