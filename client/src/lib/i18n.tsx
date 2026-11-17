import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Category } from './types';

export type Lang = 'de' | 'en';
export const DEFAULT_LANG: Lang = 'de';

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const en = {
  appName: 'Cookbook',
  nav: { recipes: 'Recipes', shopping: 'Shopping', settings: 'Settings' },
  offline: 'Offline',
  langSwitch: { label: 'EN', title: 'Switch to German', target: 'Deutsch' },
  notFound: 'This page does not exist.',
  common: {
    loading: 'Loading…',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: (name: string) => `Remove ${name}`,
  },
  categories: {
    baking: 'Baking',
    dairy: 'Dairy & eggs',
    produce: 'Fruit & vegetables',
    spices: 'Spices',
    other: 'Other',
  } satisfies Record<Category, string>,
  stars: {
    notRated: 'Not rated',
    value: (n: number) => `${n} of 5 stars`,
    option: (n: number) => `${n} ${plural(n, 'star', 'stars')}`,
  },
  servings: {
    label: 'Servings',
    fewer: 'Fewer servings',
    more: 'More servings',
    count: (n: number) => `${n} ${plural(n, 'serving', 'servings')}`,
    short: 'serv.',
  },
  list: {
    searchPlaceholder: 'Search recipes, ingredients, tags…',
    filters: 'Filters',
    filtersAria: 'Filters and sorting',
    select: 'Select',
    selectTitle: 'Select recipes for a shopping list',
    newRecipe: 'New recipe',
    tagsAll: 'Tags (all must match)',
    noTags: 'No tags yet.',
    minRating: 'Minimum rating',
    containsIngredient: 'Contains ingredient',
    ingredientPlaceholder: 'e.g. butter',
    sortBy: 'Sort by',
    sortRecent: 'Recently added',
    sortName: 'Name',
    sortRating: 'Rating',
    withIngredient: (name: string) => `with ${name}`,
    clearAll: 'Clear all',
    loadError: 'Could not load recipes.',
    emptyFilteredTitle: 'No recipes match.',
    emptyTitle: 'Your cookbook is empty.',
    emptyFilteredHint: 'Try fewer filters.',
    emptyHint: 'Add your first recipe to get started.',
    selectRecipe: (title: string) => `Select ${title}`,
  },
  selection: {
    count: (n: number) => `${n} ${plural(n, 'recipe', 'recipes')} selected`,
    hint: 'Tap recipes to select them',
    shoppingList: 'Shopping list',
    list: 'List',
  },
  detail: {
    backToRecipes: 'Back to recipes',
    addToList: 'Add to shopping list selection',
    edit: 'Edit',
    editAria: 'Edit recipe',
    delete: 'Delete',
    deleteAria: 'Delete recipe',
    confirmDelete: (title: string) => `Delete “${title}”? This cannot be undone.`,
    deleted: 'Recipe deleted',
    startCooking: 'Start cooking mode',
    ingredients: 'Ingredients',
    noIngredients: 'No ingredients yet.',
    instructions: 'Instructions',
    noInstructions: 'No instructions yet.',
  },
  cook: {
    notOffline: 'Recipe not available offline.',
    unsupportedTitle: 'This browser cannot keep the screen on',
    awake: 'Screen stays on',
    mayTurnOff: 'Screen may turn off',
    unsupported: 'Keep-awake unsupported',
    exit: 'Exit',
    uncheckAll: 'Uncheck all',
  },
  form: {
    editTitle: 'Edit recipe',
    newTitle: 'New recipe',
    title: 'Title',
    titlePlaceholder: 'e.g. Vanilla crescent cookies',
    time: 'Time (minutes)',
    timePlaceholder: 'e.g. 45',
    rating: 'Rating',
    tags: 'Tags',
    tagPlaceholder: '#christmas #cookies',
    removeTag: (tag: string) => `Remove tag ${tag}`,
    groupPlaceholderMulti: 'Group name, e.g. Filling',
    groupPlaceholder: 'Group name (optional), e.g. Dough',
    groupName: 'Group name',
    moveGroupUp: 'Move group up',
    moveGroupDown: 'Move group down',
    deleteGroup: 'Delete group',
    confirmDeleteGroup: (name: string) => `Delete the group “${name}” and its ingredients?`,
    addIngredient: 'Add ingredient',
    addGroup: 'Add ingredient group',
    saveRecipe: 'Save recipe',
    amountPlaceholder: 'Amt.',
    amount: 'Amount',
    unit: 'Unit',
    ingredient: 'Ingredient',
    notePlaceholder: 'Note, e.g. room temperature',
    note: 'Note',
    addNote: '+ Note',
    removeIngredient: 'Remove ingredient',
    heading: 'Heading',
    step: 'Numbered step',
    bold: 'Bold',
    boldPlaceholder: 'bold',
    preview: 'Preview',
    nothingToPreview: 'Nothing to preview.',
    instructionsPlaceholder: '## Dough\n1. Mix flour and **cold** butter.\n2. Chill for 30 minutes.\n\n#christmas',
    mdHeading: '## Heading',
    mdStep: '1. Step',
    mdBold: '**bold**',
    mdTagBefore: 'Write',
    mdTagAfter: 'to add a tag.',
    titleRequired: 'Please enter a title',
    saved: 'Recipe saved',
    created: 'Recipe created',
    camera: 'Camera',
    gallery: 'Gallery',
    removeImage: 'Remove image',
  },
  shop: {
    title: 'Shopping list',
    share: 'Share',
    copy: 'Copy',
    clearChecked: 'Remove checked items',
    clearAll: 'Clear the whole list',
    confirmClear: 'Clear the whole shopping list?',
    addPlaceholder: 'Add item, e.g. 2 kg apples',
    addItem: 'Add item',
    fromRecipes: 'From recipes',
    changeRecipes: 'Change recipes',
    empty: 'Your list is empty',
    emptyHint: 'Select recipes in the recipe list or add items above.',
    chooseRecipes: 'Choose recipes',
    copied: 'Copied to clipboard',
    copyFailed: 'Could not copy the list',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    backup: 'Backup',
    backupHint: 'Export all recipes (including images) as one JSON file, or import a file exported before.',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    keepDuplicates: 'Also import recipes whose title already exists',
    imported: (imported: number, skipped: number) =>
      `Imported ${imported} ${plural(imported, 'recipe', 'recipes')}${skipped ? `, skipped ${skipped} existing` : ''}`,
    ingredients: 'Ingredients',
    ingredientsHint:
      'Every ingredient is spelled the same across recipes so the shopping list can combine them. The category decides where it appears on the shopping list.',
    filterIngredients: 'Filter ingredients',
    nameOf: (name: string) => `Name of ${name}`,
    categoryOf: (name: string) => `Category of ${name}`,
    usedIn: 'Used in recipes',
    stillUsed: 'Still used in recipes',
    deleteItem: (name: string) => `Delete ${name}`,
    noIngredients: 'No ingredients.',
  },
  /** Server and network error messages, keyed by the English text the API returns. */
  errors: {} as Record<string, string>,
};

export type Dict = typeof en;

const de: Dict = {
  appName: 'Kochbuch',
  nav: { recipes: 'Rezepte', shopping: 'Einkauf', settings: 'Einstellungen' },
  offline: 'Offline',
  langSwitch: { label: 'DE', title: 'Auf Englisch umschalten', target: 'English' },
  notFound: 'Diese Seite gibt es nicht.',
  common: {
    loading: 'Lädt…',
    back: 'Zurück',
    cancel: 'Abbrechen',
    save: 'Speichern',
    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    remove: (name) => `${name} entfernen`,
  },
  categories: {
    baking: 'Backzutaten',
    dairy: 'Milchprodukte & Eier',
    produce: 'Obst & Gemüse',
    spices: 'Gewürze',
    other: 'Sonstiges',
  },
  stars: {
    notRated: 'Nicht bewertet',
    value: (n) => `${n} von 5 Sternen`,
    option: (n) => `${n} ${plural(n, 'Stern', 'Sterne')}`,
  },
  servings: {
    label: 'Portionen',
    fewer: 'Weniger Portionen',
    more: 'Mehr Portionen',
    count: (n) => `${n} ${plural(n, 'Portion', 'Portionen')}`,
    short: 'Port.',
  },
  list: {
    searchPlaceholder: 'Rezepte, Zutaten, Tags suchen…',
    filters: 'Filter',
    filtersAria: 'Filter und Sortierung',
    select: 'Auswählen',
    selectTitle: 'Rezepte für die Einkaufsliste auswählen',
    newRecipe: 'Neues Rezept',
    tagsAll: 'Tags (alle müssen passen)',
    noTags: 'Noch keine Tags.',
    minRating: 'Mindestbewertung',
    containsIngredient: 'Enthält Zutat',
    ingredientPlaceholder: 'z. B. Butter',
    sortBy: 'Sortieren nach',
    sortRecent: 'Zuletzt hinzugefügt',
    sortName: 'Name',
    sortRating: 'Bewertung',
    withIngredient: (name) => `mit ${name}`,
    clearAll: 'Alle entfernen',
    loadError: 'Rezepte konnten nicht geladen werden.',
    emptyFilteredTitle: 'Keine passenden Rezepte.',
    emptyTitle: 'Dein Kochbuch ist noch leer.',
    emptyFilteredHint: 'Versuche es mit weniger Filtern.',
    emptyHint: 'Füge dein erstes Rezept hinzu.',
    selectRecipe: (title) => `${title} auswählen`,
  },
  selection: {
    count: (n) => `${n} ${plural(n, 'Rezept', 'Rezepte')} ausgewählt`,
    hint: 'Tippe Rezepte an, um sie auszuwählen',
    shoppingList: 'Einkaufsliste',
    list: 'Liste',
  },
  detail: {
    backToRecipes: 'Zurück zu den Rezepten',
    addToList: 'Zur Auswahl für die Einkaufsliste hinzufügen',
    edit: 'Bearbeiten',
    editAria: 'Rezept bearbeiten',
    delete: 'Löschen',
    deleteAria: 'Rezept löschen',
    confirmDelete: (title) => `„${title}“ löschen? Das kann nicht rückgängig gemacht werden.`,
    deleted: 'Rezept gelöscht',
    startCooking: 'Kochmodus starten',
    ingredients: 'Zutaten',
    noIngredients: 'Noch keine Zutaten.',
    instructions: 'Zubereitung',
    noInstructions: 'Noch keine Zubereitung.',
  },
  cook: {
    notOffline: 'Rezept ist offline nicht verfügbar.',
    unsupportedTitle: 'Dieser Browser kann den Bildschirm nicht wach halten',
    awake: 'Bildschirm bleibt an',
    mayTurnOff: 'Bildschirm kann ausgehen',
    unsupported: 'Wachhalten nicht unterstützt',
    exit: 'Beenden',
    uncheckAll: 'Alle Haken entfernen',
  },
  form: {
    editTitle: 'Rezept bearbeiten',
    newTitle: 'Neues Rezept',
    title: 'Titel',
    titlePlaceholder: 'z. B. Vanillekipferl',
    time: 'Zeit (Minuten)',
    timePlaceholder: 'z. B. 45',
    rating: 'Bewertung',
    tags: 'Tags',
    tagPlaceholder: '#weihnachten #plätzchen',
    removeTag: (tag) => `Tag ${tag} entfernen`,
    groupPlaceholderMulti: 'Gruppenname, z. B. Füllung',
    groupPlaceholder: 'Gruppenname (optional), z. B. Teig',
    groupName: 'Gruppenname',
    moveGroupUp: 'Gruppe nach oben',
    moveGroupDown: 'Gruppe nach unten',
    deleteGroup: 'Gruppe löschen',
    confirmDeleteGroup: (name) => `Gruppe „${name}“ mit allen Zutaten löschen?`,
    addIngredient: 'Zutat hinzufügen',
    addGroup: 'Zutatengruppe hinzufügen',
    saveRecipe: 'Rezept speichern',
    amountPlaceholder: 'Menge',
    amount: 'Menge',
    unit: 'Einheit',
    ingredient: 'Zutat',
    notePlaceholder: 'Hinweis, z. B. zimmerwarm',
    note: 'Hinweis',
    addNote: '+ Hinweis',
    removeIngredient: 'Zutat entfernen',
    heading: 'Überschrift',
    step: 'Nummerierter Schritt',
    bold: 'Fett',
    boldPlaceholder: 'fett',
    preview: 'Vorschau',
    nothingToPreview: 'Nichts für die Vorschau.',
    instructionsPlaceholder: '## Teig\n1. Mehl und **kalte** Butter verkneten.\n2. 30 Minuten kühlen.\n\n#weihnachten',
    mdHeading: '## Überschrift',
    mdStep: '1. Schritt',
    mdBold: '**fett**',
    mdTagBefore: 'Schreibe',
    mdTagAfter: ', um einen Tag hinzuzufügen.',
    titleRequired: 'Bitte gib einen Titel ein',
    saved: 'Rezept gespeichert',
    created: 'Rezept erstellt',
    camera: 'Kamera',
    gallery: 'Galerie',
    removeImage: 'Bild entfernen',
  },
  shop: {
    title: 'Einkaufsliste',
    share: 'Teilen',
    copy: 'Kopieren',
    clearChecked: 'Abgehakte Artikel entfernen',
    clearAll: 'Ganze Liste leeren',
    confirmClear: 'Die ganze Einkaufsliste leeren?',
    addPlaceholder: 'Artikel hinzufügen, z. B. 2 kg Äpfel',
    addItem: 'Artikel hinzufügen',
    fromRecipes: 'Aus Rezepten',
    changeRecipes: 'Rezepte ändern',
    empty: 'Deine Liste ist leer',
    emptyHint: 'Wähle Rezepte in der Rezeptliste aus oder füge oben Artikel hinzu.',
    chooseRecipes: 'Rezepte auswählen',
    copied: 'In die Zwischenablage kopiert',
    copyFailed: 'Liste konnte nicht kopiert werden',
  },
  settings: {
    title: 'Einstellungen',
    appearance: 'Darstellung',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    language: 'Sprache',
    backup: 'Sicherung',
    backupHint: 'Exportiere alle Rezepte (inklusive Bilder) als eine JSON-Datei oder importiere eine zuvor exportierte Datei.',
    exportJson: 'JSON exportieren',
    importJson: 'JSON importieren',
    keepDuplicates: 'Auch Rezepte importieren, deren Titel schon existiert',
    imported: (imported, skipped) =>
      `${imported} ${plural(imported, 'Rezept', 'Rezepte')} importiert${skipped ? `, ${skipped} vorhandene übersprungen` : ''}`,
    ingredients: 'Zutaten',
    ingredientsHint:
      'Jede Zutat wird in allen Rezepten gleich geschrieben, damit die Einkaufsliste sie zusammenfassen kann. Die Kategorie bestimmt, wo sie auf der Einkaufsliste erscheint.',
    filterIngredients: 'Zutaten filtern',
    nameOf: (name) => `Name von ${name}`,
    categoryOf: (name) => `Kategorie von ${name}`,
    usedIn: 'In Rezepten verwendet',
    stillUsed: 'Wird noch in Rezepten verwendet',
    deleteItem: (name) => `${name} löschen`,
    noIngredients: 'Keine Zutaten.',
  },
  errors: {
    'You seem to be offline. This needs a connection.': 'Du bist offline. Dafür wird eine Verbindung benötigt.',
    'Invalid input': 'Ungültige Eingabe',
    'Recipe not found': 'Rezept nicht gefunden',
    'Item not found': 'Artikel nicht gefunden',
    'Ingredient not found': 'Zutat nicht gefunden',
    'Not found': 'Nicht gefunden',
    'No image uploaded': 'Kein Bild hochgeladen',
    'The file is not a supported image': 'Die Datei ist kein unterstütztes Bild',
    'Image is too large (max 25 MB)': 'Das Bild ist zu groß (max. 25 MB)',
    'Backup file is too large': 'Die Sicherungsdatei ist zu groß',
    'The file is not valid JSON': 'Die Datei ist kein gültiges JSON',
    'The file is not a cookbook backup': 'Die Datei ist keine Kochbuch-Sicherung',
    'This ingredient is still used in recipes': 'Diese Zutat wird noch in Rezepten verwendet',
    'An ingredient with this name already exists': 'Eine Zutat mit diesem Namen gibt es bereits',
    'Internal server error': 'Interner Serverfehler',
    'Expected a JSON body': 'Ungültige Anfrage',
  },
};

const DICTS: Record<Lang, Dict> = { de, en };
const STORAGE_KEY = 'lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

interface I18n {
  lang: Lang;
  t: Dict;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Translates an error message from the API (falls back to the original text). */
  tError: (message: string) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const value = useMemo<I18n>(() => {
    const t = DICTS[lang];
    return {
      lang,
      t,
      setLang,
      toggleLang: () => setLangState((l) => (l === 'de' ? 'en' : 'de')),
      tError: (message) => {
        // "Invalid input: <detail>" keeps the detail but translates the prefix.
        const [head, ...rest] = message.split(': ');
        const translated = t.errors[message] ?? t.errors[head];
        if (!translated) return message;
        return t.errors[message] ? translated : [translated, ...rest].join(': ');
      },
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
