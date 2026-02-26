/**
 * Simple YAML frontmatter parser/serializer
 * No dependencies - just handles basic frontmatter for skills
 */

/**
 * Parse frontmatter from markdown content
 * @param {string} content - Markdown content with optional frontmatter
 * @returns {{data: Object, content: string}} Parsed frontmatter and content
 */
export function parse(content) {
  const lines = content.split('\n');
  
  // Check if content starts with frontmatter delimiter
  if (lines[0] !== '---') {
    return { data: {}, content };
  }
  
  // Find closing delimiter
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return { data: {}, content };
  }
  
  // Parse YAML frontmatter (simple key: value pairs)
  const data = {};
  for (let i = 1; i < endIndex; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Handle arrays (simple comma-separated lists in brackets)
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim()).filter(Boolean);
    }
    
    data[key] = value;
  }
  
  // Content is everything after the closing delimiter
  const contentLines = lines.slice(endIndex + 1);
  return { data, content: contentLines.join('\n').trim() };
}

/**
 * Serialize frontmatter and content to markdown
 * @param {{data: Object, content: string}} params - Frontmatter data and content
 * @returns {string} Markdown with frontmatter
 */
export function stringify({ data, content }) {
  if (!data || Object.keys(data).length === 0) {
    return content;
  }
  
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    
    if (Array.isArray(value)) {
      // Format arrays as comma-separated lists
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (typeof value === 'string' && value.includes(':')) {
      // Quote strings containing colons
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  
  lines.push('---');
  lines.push('');
  lines.push(content);
  
  return lines.join('\n');
}
