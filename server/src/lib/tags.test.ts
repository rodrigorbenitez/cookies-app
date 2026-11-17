import { describe, expect, it } from 'vitest';
import { extractTags, normalizeTags } from './tags.js';

describe('tags', () => {
  it('normalizes typed tags', () => {
    expect(normalizeTags(['#Christmas', 'cookies', '##Cookies', ' #drinks ', '#', '#1'])).toEqual([
      'christmas',
      'cookies',
      'drinks',
    ]);
  });

  it('finds #tags in instructions but ignores Markdown headings and numbers', () => {
    const text = '# Steps\n## Dough\n1. Mix it #easy, then bake (#christmas).\nStep #2 of a#b and #Glühwein';
    expect(extractTags(text)).toEqual(['easy', 'christmas', 'glühwein']);
  });
});
