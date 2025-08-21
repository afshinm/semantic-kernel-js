/**
 * Escapes a string for safe use in HTML contexts.
 * @param str The string to escape for HTML.
 * @returns The escaped string.
 */
export const htmlEscape = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};
