import { describe, expect, it } from 'vitest';
import { guessCategory } from './categories.js';

describe('guessCategory', () => {
  it.each([
    ['flour', 'baking'],
    ['Weizenmehl', 'baking'],
    ['Vanillezucker', 'baking'],
    ['Puderzucker', 'baking'],
    ['gemahlene Mandeln', 'baking'],
    ['Butterkekse', 'baking'],
    ['Orangeat', 'baking'],
    ['butter', 'dairy'],
    ['Butter', 'dairy'],
    ['Eier', 'dairy'],
    ['Ei', 'dairy'],
    ['Eigelb', 'dairy'],
    ['Frischkäse', 'dairy'],
    ['Schmand', 'dairy'],
    ['Zitrone', 'produce'],
    ['Himbeeren', 'produce'],
    ['Äpfel', 'produce'],
    ['Zimtstangen', 'spices'],
    ['Gewürznelken', 'spices'],
    ['Sternanis', 'spices'],
    ['Muskatnuss', 'spices'],
    ['nutmeg', 'spices'],
    ['Salz', 'spices'],
    ['Rotwein', 'other'],
  ])('%s -> %s', (name, category) => {
    expect(guessCategory(name)).toBe(category);
  });
});
