/** Same rules as the server: "#" + letters/digits/-/_, with at least one letter. */
export const TAG_IN_TEXT = /(^|[^\p{L}\p{N}_&#/])#([\p{L}\p{N}_-]*\p{L}[\p{L}\p{N}_-]*)/gu;

export function normalizeTag(raw: string) {
  return raw.trim().replace(/^#+/, '').toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, '');
}

/** Turns #tags in Markdown into links to the filtered recipe list. */
export function linkifyTags(markdown: string) {
  return markdown.replace(TAG_IN_TEXT, (_m, before: string, tag: string) => {
    return `${before}[#${tag}](/?tags=${encodeURIComponent(tag.toLowerCase())})`;
  });
}
