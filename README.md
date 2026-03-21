# skillbridge

A zero-dependency Node.js CLI that lets you maintain **one set of custom skill/instruction files** and sync them to all your AI coding agents on macOS.

## Why?

AI coding agents all read markdown instruction files, but from different locations:

| Agent | Global Path | Per-Project |
|-------|-------------|-------------|
| **Claude Code** | `~/.claude/CLAUDE.md` | `CLAUDE.md` |
| **Codex CLI** | `~/.codex/instructions.md` | `AGENTS.md` |
| **Cursor** | `~/.cursor/rules/skillbridge.mdc` | `.cursor/rules/skillbridge.mdc` |
| **GitHub Copilot** | `~/.github/copilot-instructions.md` | `.github/copilot-instructions.md` |
| **Windsurf** | `~/.codeium/windsurf/memories/skillbridge.md` | `.windsurf/rules/skillbridge.md` |
| **OpenClaw** | `~/.openclaw/workspace/AGENTS.md` | `AGENTS.md` |

Writing the same instructions for each is tedious and error-prone. **skillbridge** gives you a single source of truth — write your skills once, sync everywhere.

## Install

```bash
# Clone and link globally
git clone https://github.com/EdGuan/skillbridge.git
cd skillbridge
npm link

# Or just run directly
node bin/skillbridge.js --help
```

## Quick Start

```bash
# Already have instruction files? Import them automatically
skillbridge init

# Or start fresh — add a skill
skillbridge add code-style --from my-style-guide.md

# Create interactively (opens $EDITOR)
skillbridge add testing-patterns

# List your skills
skillbridge list

# Sync to all enabled targets
skillbridge sync

# Preview what would be written
skillbridge sync --dry-run

# Sync only to a specific target
skillbridge sync --target cursor

# Sync to a specific project too
skillbridge sync --project /path/to/my/project
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Detect existing instruction files and import as skills |
| `add <name>` | Create a new skill (opens `$EDITOR`, or `--from <file>`) |
| `list` | List all skills with descriptions |
| `show <name>` | Print a skill's content |
| `edit <name>` | Open a skill in `$EDITOR` |
| `remove <name>` | Delete a skill |
| `sync` | Sync all skills to enabled targets |
| `import <path>` | Import an existing `.md` file as a skill |
| `export <name> [path]` | Export a skill to a file |
| `config` | Show current configuration |
| `config set <key> <val>` | Set a config value (dot notation) |

### Init Options

```bash
# Scan and import all found instruction files
skillbridge init

# Preview without importing
skillbridge init --dry-run

# Skip specific sources
skillbridge init --skip codex
```

`init` scans for existing instruction files (CLAUDE.md, instructions.md, .cursorrules, copilot-instructions.md, etc.), imports their content as skills, and auto-enables the relevant targets.

### Sync Options

- `--target <name>` — sync to a specific target only (claude, codex, cursor, copilot, windsurf, openclaw)
- `--project <dir>` — also write per-project files in the given directory
- `--dry-run` — preview output without writing any files

## How Skills Are Stored

Skills live in `~/.skillbridge/skills/` as individual markdown files with YAML frontmatter:

```markdown
---
name: code-style
description: My preferred coding conventions
tags: [style, conventions]
---

# Code Style

- Use 2-space indentation
- Prefer const over let
- Always use explicit return types in TypeScript
```

## How Sync Works

When you run `skillbridge sync`, it builds a section from all your skills and injects it into target files using markers:

```markdown
<!-- skillbridge:start -->
# Shared Skills

## Skill: code-style
> My preferred coding conventions

# Code Style
...

## Skill: testing-patterns
> How I write tests

# Testing Patterns
...
<!-- skillbridge:end -->
```

- If the target file doesn't exist, it's created
- If it exists with other content, the section is **appended**
- If markers already exist, only the section between them is **replaced**
- Your existing content outside the markers is never touched

## Configuration

Config lives at `~/.skillbridge/config.json`:

```json
{
  "targets": {
    "claude":   { "enabled": true,  "globalPath": "~/.claude/CLAUDE.md" },
    "codex":    { "enabled": true,  "globalPath": "~/.codex/instructions.md" },
    "cursor":   { "enabled": false, "globalPath": "~/.cursor/rules/skillbridge.mdc" },
    "copilot":  { "enabled": false, "globalPath": "~/.github/copilot-instructions.md" },
    "windsurf": { "enabled": false, "globalPath": "~/.codeium/windsurf/memories/skillbridge.md" },
    "openclaw": { "enabled": false, "globalPath": "~/.openclaw/workspace/AGENTS.md" }
  },
  "editor": "$EDITOR"
}
```

```bash
# View config
skillbridge config

# Enable Cursor sync
skillbridge config set targets.cursor.enabled true

# Disable codex sync
skillbridge config set targets.codex.enabled false

# Change a target's global path
skillbridge config set targets.claude.globalPath ~/my-custom-path/CLAUDE.md
```

## Requirements

- Node.js 18+
- macOS (may work on Linux, untested)
- Zero npm dependencies

## License

MIT
