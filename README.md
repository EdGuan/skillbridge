# skillbridge

A zero-dependency Node.js CLI that lets you maintain **one set of custom skill/instruction files** and sync them to both [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [Codex CLI](https://github.com/openai/codex) on macOS.

## Why?

Both Claude Code and Codex CLI read markdown instruction files, but from different locations:

- **Claude Code** → `~/.claude/CLAUDE.md` (global) or `CLAUDE.md` (per-project)
- **Codex CLI** → `~/.codex/instructions.md` (global) or `AGENTS.md` (per-project)

Writing the same instructions twice is tedious and error-prone. **skillbridge** gives you a single source of truth — write your skills once, sync everywhere.

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
# Add a skill
skillbridge add code-style --from my-style-guide.md

# Or create interactively (opens $EDITOR)
skillbridge add testing-patterns

# List your skills
skillbridge list

# Sync to Claude Code and Codex
skillbridge sync

# Preview what would be written
skillbridge sync --dry-run

# Sync only to Claude Code
skillbridge sync --target claude

# Sync to a specific project too
skillbridge sync --project /path/to/my/project
```

## Commands

| Command | Description |
|---------|-------------|
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

### Sync Options

- `--target claude` or `--target codex` — sync to a specific target only
- `--project <dir>` — also write to `CLAUDE.md` and `AGENTS.md` in the given directory
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
    "claude": {
      "enabled": true,
      "globalPath": "~/.claude/CLAUDE.md"
    },
    "codex": {
      "enabled": true,
      "globalPath": "~/.codex/instructions.md"
    }
  },
  "editor": "$EDITOR"
}
```

```bash
# View config
skillbridge config

# Disable codex sync
skillbridge config set targets.codex.enabled false

# Change Claude's global path
skillbridge config set targets.claude.globalPath ~/my-custom-path/CLAUDE.md
```

## Requirements

- Node.js 18+
- macOS (may work on Linux, untested)
- Zero npm dependencies

## License

MIT
