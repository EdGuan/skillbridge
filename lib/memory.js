/**
 * Shared memory management for skillbridge
 * 
 * Follows OpenClaw's memory structure:
 *   ~/.skillbridge/MEMORY.md          — curated long-term memory
 *   ~/.skillbridge/memory/YYYY-MM-DD.md — daily raw logs
 *   ~/.skillbridge/state.json         — post-sync snapshots for diff
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as config from './config.js';

const MEMORY_START = '<!-- skillbridge:memory:start -->';
const MEMORY_END = '<!-- skillbridge:memory:end -->';
const SKILLS_START = '<!-- skillbridge:start -->';
const SKILLS_END = '<!-- skillbridge:end -->';

/**
 * Get the path to the shared MEMORY.md
 * @returns {string}
 */
export function getMemoryPath() {
  return path.join(config.getConfigDir(), 'MEMORY.md');
}

/**
 * Get the memory directory path
 * @returns {string}
 */
export function getMemoryDir() {
  return path.join(config.getConfigDir(), 'memory');
}

/**
 * Get the state file path (tracks post-sync snapshots)
 * @returns {string}
 */
function getStatePath() {
  return path.join(config.getConfigDir(), 'state.json');
}

/**
 * Ensure memory directories exist
 */
export function ensureMemoryDirs() {
  const memDir = getMemoryDir();
  if (!fs.existsSync(memDir)) {
    fs.mkdirSync(memDir, { recursive: true });
  }
}

/**
 * Read the shared MEMORY.md content
 * @returns {string} Memory content or empty string
 */
export function readMemory() {
  const memPath = getMemoryPath();
  try {
    return fs.readFileSync(memPath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Write to the shared MEMORY.md
 * @param {string} content
 */
export function writeMemory(content) {
  fs.writeFileSync(getMemoryPath(), content);
}

/**
 * Get today's date string in YYYY-MM-DD format
 * @returns {string}
 */
function todayStr() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Append an entry to today's daily memory log
 * @param {string} agent - Agent name (e.g., 'claude', 'codex')
 * @param {string} content - Content to log
 */
export function appendDailyLog(agent, content) {
  ensureMemoryDirs();
  const today = todayStr();
  const logPath = path.join(getMemoryDir(), `${today}.md`);

  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  const entry = `\n## [${agent} @ ${timestamp}]\n\n${content.trim()}\n`;

  let existing = '';
  try {
    existing = fs.readFileSync(logPath, 'utf-8');
  } catch {
    // New file — add header
    existing = `# Memory Log — ${today}\n`;
  }

  fs.writeFileSync(logPath, existing + entry);
  return logPath;
}

/**
 * Build the memory section for injection into target files
 * @returns {string} Formatted memory section with markers
 */
export function buildMemorySection() {
  const memory = readMemory();
  if (!memory.trim()) {
    return '';
  }

  return [
    MEMORY_START,
    '',
    '# Shared Memory',
    '',
    memory.trim(),
    '',
    MEMORY_END
  ].join('\n');
}

/**
 * Inject the memory section into file content
 * @param {string} existing - Existing file content
 * @param {string} section - Memory section to inject
 * @returns {string} Updated content
 */
export function injectMemorySection(existing, section) {
  if (!section) return existing;

  const startIdx = existing.indexOf(MEMORY_START);
  const endIdx = existing.indexOf(MEMORY_END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace existing memory section
    const before = existing.substring(0, startIdx);
    const after = existing.substring(endIdx + MEMORY_END.length);
    return before + section + after;
  }

  // Append after skills section if it exists, otherwise at end
  const skillsEndIdx = existing.indexOf(SKILLS_END);
  if (skillsEndIdx !== -1) {
    const insertPoint = skillsEndIdx + SKILLS_END.length;
    const before = existing.substring(0, insertPoint);
    const after = existing.substring(insertPoint);
    return before + '\n\n' + section + after;
  }

  return existing.trimEnd() + '\n\n' + section + '\n';
}

/**
 * Hash file content for change detection
 * @param {string} content
 * @returns {string} SHA-256 hash
 */
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Load the state file (post-sync snapshots)
 * @returns {Object} State object
 */
export function loadState() {
  const statePath = getStatePath();
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  } catch {
    return { snapshots: {} };
  }
}

/**
 * Save the state file
 * @param {Object} state
 */
export function saveState(state) {
  fs.writeFileSync(getStatePath(), JSON.stringify(state, null, 2));
}

/**
 * Save a snapshot of a target file's content after sync
 * @param {string} targetName - Target name (e.g., 'claude')
 * @param {string} filePath - Full path to the target file
 * @param {string} content - File content at time of sync
 */
export function saveSnapshot(targetName, filePath, content) {
  const state = loadState();
  state.snapshots[targetName] = {
    path: filePath,
    hash: hashContent(content),
    timestamp: new Date().toISOString()
  };
  saveState(state);
}

/**
 * Extract user-added content from a target file (content outside skillbridge markers)
 * @param {string} content - Full file content
 * @returns {string} Content outside skillbridge markers
 */
function extractUserContent(content) {
  let result = content;

  // Remove skills section
  const skillsStart = result.indexOf(SKILLS_START);
  const skillsEnd = result.indexOf(SKILLS_END);
  if (skillsStart !== -1 && skillsEnd !== -1) {
    result = result.substring(0, skillsStart) + result.substring(skillsEnd + SKILLS_END.length);
  }

  // Remove memory section
  const memStart = result.indexOf(MEMORY_START);
  const memEnd = result.indexOf(MEMORY_END);
  if (memStart !== -1 && memEnd !== -1) {
    result = result.substring(0, memStart) + result.substring(memEnd + MEMORY_END.length);
  }

  return result.trim();
}

/**
 * Pull new content from agent files into daily memory logs
 * Compares current file content against post-sync snapshots to detect changes.
 * 
 * @returns {Array<{target: string, path: string, newContent: string, logPath: string}>} Pull results
 */
export function pull() {
  const cfg = config.load();
  const state = loadState();
  const results = [];

  const targets = cfg.targets || {};

  for (const [name, tgt] of Object.entries(targets)) {
    if (!tgt.enabled) continue;

    const filePath = config.expandPath(tgt.globalPath);
    
    let currentContent;
    try {
      currentContent = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue; // File doesn't exist, skip
    }

    const currentHash = hashContent(currentContent);
    const snapshot = state.snapshots[name];

    // If no snapshot exists, save current state as baseline (first run)
    if (!snapshot) {
      saveSnapshot(name, filePath, currentContent);
      continue;
    }

    // No changes since last sync/pull
    if (snapshot.hash === currentHash) {
      continue;
    }

    // Extract content outside skillbridge markers (user/agent additions)
    const currentUserContent = extractUserContent(currentContent);

    // Read the snapshot's user content for comparison
    // We need to reconstruct what user content looked like at sync time
    // Since we only stored a hash, we compare the full extracted user content
    // If it changed, the diff is new agent-written content
    
    if (!currentUserContent.trim()) {
      // No user content outside markers, update snapshot and skip
      saveSnapshot(name, filePath, currentContent);
      continue;
    }

    // Log the new/changed content
    const logPath = appendDailyLog(name, currentUserContent);
    results.push({
      target: name,
      path: filePath,
      newContent: currentUserContent,
      logPath
    });

    // Update snapshot
    saveSnapshot(name, filePath, currentContent);
  }

  return results;
}

/**
 * List daily memory log files
 * @param {number} [limit=10] - Max files to return
 * @returns {Array<{date: string, path: string, size: number}>}
 */
export function listLogs(limit = 10) {
  const memDir = getMemoryDir();
  if (!fs.existsSync(memDir)) return [];

  return fs.readdirSync(memDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, limit)
    .map(f => ({
      date: f.replace('.md', ''),
      path: path.join(memDir, f),
      size: fs.statSync(path.join(memDir, f)).size
    }));
}
