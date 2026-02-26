/**
 * Configuration management for skillbridge
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.skillbridge');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  targets: {
    claude: {
      enabled: true,
      globalPath: '~/.claude/CLAUDE.md'
    },
    codex: {
      enabled: true,
      globalPath: '~/.codex/instructions.md'
    }
  },
  editor: '$EDITOR'
};

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  const skillsDir = path.join(CONFIG_DIR, 'skills');
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
}

/**
 * Load configuration, creating default if not exists
 * @returns {Object} Configuration object
 */
export function load() {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }
  
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to load config: ${err.message}`);
  }
}

/**
 * Save configuration
 * @param {Object} config - Configuration object to save
 */
export function save(config) {
  ensureConfigDir();
  
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    throw new Error(`Failed to save config: ${err.message}`);
  }
}

/**
 * Get a config value by dot-notation path
 * @param {string} keyPath - Dot-notation path (e.g., "targets.claude.enabled")
 * @returns {*} Config value
 */
export function get(keyPath) {
  const config = load();
  const keys = keyPath.split('.');
  
  let value = config;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Set a config value by dot-notation path
 * @param {string} keyPath - Dot-notation path (e.g., "targets.claude.enabled")
 * @param {*} value - Value to set
 */
export function set(keyPath, value) {
  const config = load();
  const keys = keyPath.split('.');
  const lastKey = keys.pop();
  
  let target = config;
  for (const key of keys) {
    if (!(key in target) || typeof target[key] !== 'object') {
      target[key] = {};
    }
    target = target[key];
  }
  
  // Parse boolean strings
  if (value === 'true') value = true;
  if (value === 'false') value = false;
  
  target[lastKey] = value;
  save(config);
}

/**
 * Get the skills directory path
 * @returns {string} Skills directory path
 */
export function getSkillsDir() {
  return path.join(CONFIG_DIR, 'skills');
}

/**
 * Get the config directory path
 * @returns {string} Config directory path
 */
export function getConfigDir() {
  return CONFIG_DIR;
}

/**
 * Expand ~ in paths
 * @param {string} filepath - Path possibly containing ~
 * @returns {string} Expanded path
 */
export function expandPath(filepath) {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}
