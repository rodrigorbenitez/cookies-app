/** A tag is "#" followed by letters/digits/-/_ and must contain at least one letter (so "#1" is not a tag). */
const TAG_IN_TEXT = /(^|[^\p{L}\p{N}_&#/])#([\p{L}\p{N}_-]*\p{L}[\p{L}\p{N}_-]*)/gu;

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, '');
}

export function normalizeTags(raw: string[]): string[] {
  const out = new Set<string>();
  for (const t of raw) {
    const n = normalizeTag(t);
    if (n && /\p{L}/u.test(n)) out.add(n);
  }
  return [...out];
}

/** Finds #tags in free text such as the instructions. Markdown headings ("# Title") are not tags. */
export function extractTags(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(TAG_IN_TEXT)) found.push(m[2]);
  return normalizeTags(found);
}
