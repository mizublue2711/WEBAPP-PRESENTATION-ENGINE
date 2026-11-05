import { SupportedLanguage, TRANSLATIONS, TranslationKey } from './translations';

export type { SupportedLanguage, TranslationKey };

const STORAGE_KEY = 'app_language';
type LanguageChangeListener = (lang: SupportedLanguage) => void;

class LanguageManager {
  private currentLang: SupportedLanguage = 'vi';
  private listeners: Set<LanguageChangeListener> = new Set();

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
        if (saved === 'vi' || saved === 'en') {
          this.currentLang = saved;
        } else {
          this.currentLang = 'vi';
          window.localStorage.setItem(STORAGE_KEY, 'vi');
        }
      }
    } catch {
      this.currentLang = 'vi';
    }
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  public setLanguage(lang: SupportedLanguage): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch {
      // Ignore localStorage errors in restricted environments
    }
    this.notify();
  }

  public toggleLanguage(): SupportedLanguage {
    const nextLang: SupportedLanguage = this.currentLang === 'vi' ? 'en' : 'vi';
    this.setLanguage(nextLang);
    return nextLang;
  }

  public subscribe(listener: LanguageChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentLang);
      } catch (err) {
        console.error('Error in language change listener', err);
      }
    }
  }

  public t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.vi;
    let text: string = (dict as Record<string, string>)[key] || (TRANSLATIONS.en as Record<string, string>)[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  /**
   * Helper to resolve localized fields from JSON documents (e.g., title_vi vs title_en, or { vi, en })
   */
  public getLocalizedField(obj: unknown, baseKey: string): string {
    if (!obj || typeof obj !== 'object') return '';
    const record = obj as Record<string, unknown>;
    const lang = this.currentLang;
    const otherLang = lang === 'vi' ? 'en' : 'vi';

    // 1. Direct field like `title_vi` or `title_en`
    const specificKey = `${baseKey}_${lang}`;
    if (typeof record[specificKey] === 'string' && record[specificKey]) {
      return record[specificKey] as string;
    }

    // 2. Nested object like `title: { vi: "...", en: "..." }`
    const nested = record[baseKey];
    if (nested && typeof nested === 'object') {
      const nestedRecord = nested as Record<string, unknown>;
      if (typeof nestedRecord[lang] === 'string' && nestedRecord[lang]) {
        return nestedRecord[lang] as string;
      }
      if (typeof nestedRecord[otherLang] === 'string' && nestedRecord[otherLang]) {
        return nestedRecord[otherLang] as string;
      }
    }

    // 3. Fallback to other language specificKey (e.g. `title_en` if lang is vi and vi is missing)
    const fallbackKey = `${baseKey}_${otherLang}`;
    if (typeof record[fallbackKey] === 'string' && record[fallbackKey]) {
      return record[fallbackKey] as string;
    }

    // 4. Default plain baseKey
    if (typeof record[baseKey] === 'string') {
      return record[baseKey] as string;
    }

    return '';
  }
}

export const languageManager = new LanguageManager();
export const t = (key: TranslationKey, params?: Record<string, string | number>): string =>
  languageManager.t(key, params);
export const useLanguage = () => ({
  language: languageManager.getLanguage(),
  setLanguage: (lang: SupportedLanguage) => languageManager.setLanguage(lang),
  toggleLanguage: () => languageManager.toggleLanguage(),
  t: (key: TranslationKey, params?: Record<string, string | number>) => languageManager.t(key, params),
  subscribe: (cb: LanguageChangeListener) => languageManager.subscribe(cb),
});
