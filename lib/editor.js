/**
 * Open files in the user's preferred editor
 */

import { spawnSync } from 'child_process';
import * as config from './config.js';

/**
 * Open a file in the configured editor
 * @param {string} filePath - Path to file to open
 */
export function open(filePath) {
  const cfg = config.load();
  let editor = cfg.editor || '$EDITOR';

  // Resolve $EDITOR from environment
  if (editor === '$EDITOR') {
    editor = process.env.EDITOR;
  }

  if (!editor) {
    // Fallback chain for macOS
    editor = process.env.VISUAL || 'nano';
  }

  const result = spawnSync(editor, [filePath], {
    stdio: 'inherit',
    shell: true
  });

  if (result.error) {
    throw new Error(`Failed to open editor "${editor}": ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Editor exited with code ${result.status}`);
  }
}
