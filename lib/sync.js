/**
 * Sync skills to Claude Code and Codex CLI instruction files
 */

import fs from 'fs';
import path from 'path';
import * as config from './config.js';
import * as skills from './skills.js';
import * as memory from './memory.js';

const START_MARKER = '<!-- skillbridge:start -->';
const END_MARKER = '<!-- skillbridge:end -->';

/**
 * Build the skillbridge section content from all skills
 * @returns {string} Formatted skill section
 */
function buildSection() {
  const allSkills = skills.list();

  if (allSkills.length === 0) {
    return [START_MARKER, '', '# Shared Skills', '', '_No skills configured._', '', END_MARKER].join('\n');
  }

  const lines = [START_MARKER, '', '# Shared Skills'];

  for (const skill of allSkills) {
    lines.push('');
    lines.push(`## Skill: ${skill.name}`);
    if (skill.data.description) {
      lines.push(`> ${skill.data.description}`);
    }
    lines.push('');
    lines.push(skill.content);
  }

  lines.push('');
  lines.push(END_MARKER);
  return lines.join('\n');
}

/**
 * Inject the skillbridge section into a file's content
 * Preserves existing content outside markers. If markers exist, replaces between them.
 * If no markers, appends section.
 * @param {string} existing - Existing file content (empty string if file doesn't exist)
 * @param {string} section - The skillbridge section to inject
 * @returns {string} Updated file content
 */
function injectSection(existing, section) {
  if (!existing.trim()) {
    return section + '\n';
  }

  const startIdx = existing.indexOf(START_MARKER);
  const endIdx = existing.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace existing section
    const before = existing.substring(0, startIdx);
    const after = existing.substring(endIdx + END_MARKER.length);
    return before + section + after;
  }

  // Append section
  return existing.trimEnd() + '\n\n' + section + '\n';
}

/**
 * Write content to a file, creating parent dirs if needed
 * @param {string} filePath - Target file path
 * @param {string} content - Content to write
 */
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

/**
 * Read a file, returning empty string if not found
 * @param {string} filePath - File path
 * @returns {string} File content or empty string
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Sync skills (and optionally memory) to a single target file
 * @param {string} filePath - Target file path
 * @param {boolean} dryRun - If true, only preview
 * @param {string} [memorySection] - Memory section to inject
 * @returns {string} The content that would be written
 */
function syncToFile(filePath, dryRun, memorySection) {
  const section = buildSection();
  const existing = readFile(filePath);
  let updated = injectSection(existing, section);

  // Inject memory section if available
  if (memorySection) {
    updated = memory.injectMemorySection(updated, memorySection);
  }

  if (!dryRun) {
    writeFile(filePath, updated);
  }

  return updated;
}

/**
 * Sync skills to all enabled targets
 * @param {Object} options - Sync options
 * @param {string} [options.target] - Specific target ('claude' or 'codex')
 * @param {string} [options.project] - Project directory for per-project sync
 * @param {boolean} [options.dryRun] - Preview without writing
 * @returns {Array<{target: string, path: string, content: string}>} Results
 */
export function sync({ target, project, dryRun = false } = {}) {
  const cfg = config.load();
  const results = [];

  const targets = cfg.targets || {};

  // Build memory section once (shared across all targets)
  const memoryEnabled = cfg.memory?.enabled !== false; // enabled by default
  const memorySection = memoryEnabled ? memory.buildMemorySection() : null;

  // Global sync
  const targetNames = target ? [target] : Object.keys(targets);

  for (const name of targetNames) {
    const tgt = targets[name];
    if (!tgt) {
      throw new Error(`Unknown target: "${name}". Available: ${Object.keys(targets).join(', ')}`);
    }
    if (!tgt.enabled && !target) continue; // Skip disabled unless explicitly requested

    const filePath = config.expandPath(tgt.globalPath);
    const content = syncToFile(filePath, dryRun, memorySection);

    // Save snapshot for pull diffing (unless dry run)
    if (!dryRun) {
      memory.saveSnapshot(name, filePath, content);
    }

    results.push({ target: name, path: filePath, content });
  }

  // Per-project sync
  if (project) {
    const projectDir = path.resolve(project);

    if (!fs.existsSync(projectDir)) {
      throw new Error(`Project directory not found: ${projectDir}`);
    }

    // Track written paths to avoid duplicates (e.g., codex and openclaw both use AGENTS.md)
    const writtenPaths = new Set();

    for (const name of targetNames) {
      const tgt = targets[name];
      if (!tgt || (!tgt.enabled && !target)) continue;

      const projectFile = tgt.projectFile;
      if (!projectFile) continue;

      const projectPath = path.join(projectDir, projectFile);
      if (writtenPaths.has(projectPath)) continue;
      writtenPaths.add(projectPath);

      const content = syncToFile(projectPath, dryRun, memorySection);
      results.push({ target: `${name} (project)`, path: projectPath, content });
    }
  }

  return results;
}
