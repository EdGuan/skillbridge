/**
 * CRUD operations for skill files
 */

import fs from 'fs';
import path from 'path';
import * as config from './config.js';
import * as frontmatter from './frontmatter.js';

/**
 * Get the file path for a skill
 * @param {string} name - Skill name
 * @returns {string} Full path to skill file
 */
export function getSkillPath(name) {
  return path.join(config.getSkillsDir(), `${name}.md`);
}

/**
 * Check if a skill exists
 * @param {string} name - Skill name
 * @returns {boolean}
 */
export function exists(name) {
  return fs.existsSync(getSkillPath(name));
}

/**
 * Create a new skill
 * @param {string} name - Skill name
 * @param {string} content - Skill content (markdown body, no frontmatter)
 * @param {Object} [meta] - Additional frontmatter fields
 * @returns {string} Path to created skill file
 */
export function create(name, content, meta = {}) {
  const skillsDir = config.getSkillsDir();
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  const skillPath = getSkillPath(name);
  if (fs.existsSync(skillPath)) {
    throw new Error(`Skill "${name}" already exists. Use 'edit' to modify it.`);
  }

  const data = {
    name,
    description: meta.description || '',
    ...meta
  };

  const fileContent = frontmatter.stringify({ data, content: content.trim() });
  fs.writeFileSync(skillPath, fileContent);
  return skillPath;
}

/**
 * Read a skill
 * @param {string} name - Skill name
 * @returns {{data: Object, content: string}} Parsed skill
 */
export function read(name) {
  const skillPath = getSkillPath(name);
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill "${name}" not found.`);
  }

  const raw = fs.readFileSync(skillPath, 'utf-8');
  return frontmatter.parse(raw);
}

/**
 * Update a skill's content
 * @param {string} name - Skill name
 * @param {string} content - New content
 * @param {Object} [meta] - Updated frontmatter fields
 */
export function update(name, content, meta = {}) {
  const skillPath = getSkillPath(name);
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill "${name}" not found.`);
  }

  const existing = read(name);
  const data = { ...existing.data, ...meta };
  const fileContent = frontmatter.stringify({ data, content: content.trim() });
  fs.writeFileSync(skillPath, fileContent);
}

/**
 * Remove a skill
 * @param {string} name - Skill name
 */
export function remove(name) {
  const skillPath = getSkillPath(name);
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill "${name}" not found.`);
  }

  fs.unlinkSync(skillPath);
}

/**
 * List all skills with their metadata
 * @returns {Array<{name: string, data: Object, content: string}>} All skills
 */
export function list() {
  const skillsDir = config.getSkillsDir();
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md')).sort();
  return files.map(file => {
    const name = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(skillsDir, file), 'utf-8');
    const parsed = frontmatter.parse(raw);
    return { name, ...parsed };
  });
}
