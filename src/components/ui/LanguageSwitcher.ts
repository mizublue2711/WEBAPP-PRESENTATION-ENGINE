import { languageManager, SupportedLanguage } from '../../i18n/languageManager';

export interface LanguageSwitcherOptions {
  className?: string;
  onChange?: (lang: SupportedLanguage) => void;
}

/**
 * Cyber-Brutalism Language Switcher Component
 * Generates an interactive button with 1px Cyan border, glow/flicker effects,
 * and seamless toggle between [VI] and [EN].
 */
export function createLanguageSwitcher(options: LanguageSwitcherOptions = {}): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `cyber-btn-swiss cyber-lang-switcher ${options.className || ''}`.trim();
  btn.setAttribute('aria-label', 'Toggle Language (Vietnamese / English)');
  btn.title = languageManager.t('lang.switchTooltip');

  const updateLabel = (lang: SupportedLanguage) => {
    if (lang === 'vi') {
      btn.innerHTML = `
        <span class="cyber-lang-tag active">[VI]</span>
        <span class="cyber-lang-sep">/</span>
        <span class="cyber-lang-tag inactive">EN</span>
      `;
    } else {
      btn.innerHTML = `
        <span class="cyber-lang-tag inactive">VI</span>
        <span class="cyber-lang-sep">/</span>
        <span class="cyber-lang-tag active">[EN]</span>
      `;
    }
    btn.title = languageManager.t('lang.switchTooltip');
  };

  updateLabel(languageManager.getLanguage());

  btn.addEventListener('click', () => {
    const nextLang = languageManager.toggleLanguage();
    updateLabel(nextLang);
    if (options.onChange) {
      options.onChange(nextLang);
    }
  });

  languageManager.subscribe((lang) => {
    updateLabel(lang);
  });

  return btn;
}

export default createLanguageSwitcher;
