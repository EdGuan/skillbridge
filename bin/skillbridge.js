#!/usr/bin/env node

/**
 * skillbridge — Sync custom skills to Claude Code & Codex CLI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libDir = path.join(__dirname, '..', 'lib');

// Lazy imports to keep startup fast
async function loadModule(name) {
  return import(path.join(libDir, `${name}.js`));
}

const VERSION = '0.1.0';

const HELP = `
skillbridge v${VERSION} — Sync skills to Claude Code & Codex CLI

Usage:
  skillbridge <command> [options]

Commands:
  add <name>              Create a new skill (opens $EDITOR)
    --from <file>           Import content from file instead of editor
    --description <text>    Set skill description
  list                    List all skills
  show <name>             Print a skill's content
  edit <name>             Edit a skill in $EDITOR
  remove <name>           Remove a skill
  sync                    Sync skills to all enabled targets
    --target <name>         Sync only to specific target (claude/codex)
    --project <dir>         Also sync to project directory
    --dry-run               Preview without writing files
  import <path>           Import a .md file as a skill
  export <name> [path]    Export a skill to a file
  config                  Show current configuration
  config set <key> <val>  Set a config value (dot notation)

Options:
  --help, -h              Show this help
  --version, -v           Show version
`.trim();

// Simple arg parser
function parseArgs(argv) {
  const args = { _: [], flags: {} };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--' ) {
      args._.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args.flags[key] = next;
        i += 2;
      } else {
        args.flags[key] = true;
        i++;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        args.flags[key] = next;
        i += 2;
      } else {
        args.flags[key] = true;
        i++;
      }
    } else {
      args._.push(arg);
      i++;
    }
  }
  return args;
}

// Commands
async function cmdAdd(args) {
  const name = args._[0];
  if (!name) {
    console.error('Error: Skill name required.\nUsage: skillbridge add <name> [--from <file>]');
    process.exit(1);
  }

  const skills = await loadModule('skills');
  const fromFile = args.flags.from;

  let content;
  if (fromFile) {
    // Read from file (supports stdin via /dev/stdin)
    try {
      content = fs.readFileSync(fromFile, 'utf-8');
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);
      process.exit(1);
    }
  } else {
    // Create temp file and open in editor
    const editor = await loadModule('editor');
    const tempPath = skills.getSkillPath(name);
    const frontmatter = await loadModule('frontmatter');

    const template = frontmatter.stringify({
      data: { name, description: args.flags.description || '' },
      content: `# ${name}\n\nWrite your skill instructions here.\n`
    });

    // Ensure dir exists
    const dir = path.dirname(tempPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(tempPath, template);

    try {
      editor.open(tempPath);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }

    console.log(`✓ Skill "${name}" created at ${tempPath}`);
    return;
  }

  const meta = {};
  if (args.flags.description) meta.description = args.flags.description;

  try {
    const skillPath = skills.create(name, content, meta);
    console.log(`✓ Skill "${name}" created at ${skillPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdList() {
  const skills = await loadModule('skills');
  const allSkills = skills.list();

  if (allSkills.length === 0) {
    console.log('No skills found. Use "skillbridge add <name>" to create one.');
    return;
  }

  const nameWidth = Math.max(...allSkills.map(s => s.name.length), 4);

  console.log(`${'NAME'.padEnd(nameWidth)}  DESCRIPTION`);
  console.log(`${'─'.repeat(nameWidth)}  ${'─'.repeat(40)}`);

  for (const skill of allSkills) {
    const desc = skill.data.description || '(no description)';
    console.log(`${skill.name.padEnd(nameWidth)}  ${desc}`);
  }

  console.log(`\n${allSkills.length} skill(s)`);
}

async function cmdShow(args) {
  const name = args._[0];
  if (!name) {
    console.error('Error: Skill name required.\nUsage: skillbridge show <name>');
    process.exit(1);
  }

  const skills = await loadModule('skills');

  try {
    const skill = skills.read(name);
    console.log(skill.content);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdEdit(args) {
  const name = args._[0];
  if (!name) {
    console.error('Error: Skill name required.\nUsage: skillbridge edit <name>');
    process.exit(1);
  }

  const skills = await loadModule('skills');
  const editor = await loadModule('editor');

  const skillPath = skills.getSkillPath(name);
  if (!fs.existsSync(skillPath)) {
    console.error(`Error: Skill "${name}" not found.`);
    process.exit(1);
  }

  try {
    editor.open(skillPath);
    console.log(`✓ Skill "${name}" updated.`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdRemove(args) {
  const name = args._[0];
  if (!name) {
    console.error('Error: Skill name required.\nUsage: skillbridge remove <name>');
    process.exit(1);
  }

  const skills = await loadModule('skills');

  try {
    skills.remove(name);
    console.log(`✓ Skill "${name}" removed.`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdSync(args) {
  const syncMod = await loadModule('sync');

  const options = {
    target: args.flags.target,
    project: args.flags.project,
    dryRun: args.flags['dry-run'] === true
  };

  try {
    const results = syncMod.sync(options);

    if (results.length === 0) {
      console.log('No targets enabled. Use "skillbridge config set targets.<name>.enabled true"');
      return;
    }

    for (const result of results) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would write to ${result.path} (target: ${result.target}):`);
        console.log('─'.repeat(60));
        console.log(result.content);
        console.log('─'.repeat(60));
        console.log();
      } else {
        console.log(`✓ Synced to ${result.path} (${result.target})`);
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdImport(args) {
  const filePath = args._[0];
  if (!filePath) {
    console.error('Error: File path required.\nUsage: skillbridge import <path>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const skills = await loadModule('skills');
  const frontmatter = await loadModule('frontmatter');

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = frontmatter.parse(raw);

  // Derive name from frontmatter or filename
  const name = parsed.data.name || path.basename(filePath, '.md');

  try {
    const skillPath = skills.create(name, parsed.content, parsed.data);
    console.log(`✓ Imported "${name}" from ${filePath} → ${skillPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdExport(args) {
  const name = args._[0];
  if (!name) {
    console.error('Error: Skill name required.\nUsage: skillbridge export <name> [path]');
    process.exit(1);
  }

  const skills = await loadModule('skills');
  const frontmatter = await loadModule('frontmatter');

  try {
    const skill = skills.read(name);
    const output = frontmatter.stringify({ data: skill.data, content: skill.content });
    const outPath = args._[1] || `${name}.md`;

    fs.writeFileSync(outPath, output);
    console.log(`✓ Exported "${name}" to ${outPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdConfig(args) {
  const configMod = await loadModule('config');

  if (args._[0] === 'set') {
    const key = args._[1];
    const value = args._[2];
    if (!key || value === undefined) {
      console.error('Usage: skillbridge config set <key> <value>');
      process.exit(1);
    }
    configMod.set(key, value);
    console.log(`✓ Set ${key} = ${value}`);
  } else {
    const cfg = configMod.load();
    console.log(JSON.stringify(cfg, null, 2));
  }
}

// Main
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.help || args.flags.h) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.flags.version || args.flags.v) {
    console.log(`skillbridge v${VERSION}`);
    process.exit(0);
  }

  const command = args._.shift();

  if (!command) {
    console.log(HELP);
    process.exit(0);
  }

  const commands = {
    add: cmdAdd,
    list: cmdList,
    ls: cmdList,
    show: cmdShow,
    edit: cmdEdit,
    remove: cmdRemove,
    rm: cmdRemove,
    sync: cmdSync,
    import: cmdImport,
    export: cmdExport,
    config: cmdConfig
  };

  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command: "${command}"\n`);
    console.log(HELP);
    process.exit(1);
  }

  await handler(args);
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
