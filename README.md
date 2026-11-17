# Character Panel — for Cyberpunk RED

An always-on character panel for Foundry VTT, for use with the **Cyberpunk RED – CORE**
system: your character's identity, vitals (with an animated biomonitor), stats, skills,
role abilities and everyday sheet actions one click away, in a cyberpunk look you can
recolor with a color picker. The native character sheet remains the source of truth.

> **Beta (0.1.0).** Tested with Foundry V12 (12.343) and the Cyberpunk RED – CORE system
> v0.92.4. Combat (attacks, weapon damage, initiative) is intentionally out of scope and will
> come from a separate module that plugs into this panel.

## Installation

In Foundry, go to **Add-on Modules → Install Module** and paste this manifest URL:

```
https://github.com/agnasci/cyberpunk-character-panel/releases/latest/download/module.json
```

Then enable **Character Panel — for Cyberpunk RED** in your world. Each player sees the panel
for their assigned character; panel preferences (color, compact mode, position...) are saved
per player.

## Development

TypeScript code, tests with Vitest. Commands are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
(project documentation is in Portuguese).

```
npm ci
npm run check
```

## License and notice

The code is released under the [MIT License](LICENSE).

Character Panel is unofficial content provided under the Homebrew Content Policy of
R. Talsorian Games and is not approved or endorsed by RTG. This content references materials
that are the property of R. Talsorian Games and its licensees.
