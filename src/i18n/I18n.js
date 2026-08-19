import tr from './locales/tr.js';
import en from './locales/en.js';

/**
 * @class I18n
 * Modular client-side internationalization manager.
 * Provides dictionary lookup, string interpolation, DOM binding, and localStorage persistence.
 */
class I18nManager {
  constructor() {
    this.locales = { tr, en };
    // Default to Turkish as main language, or restore student's saved preference
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('flowchart_lang') : null;
    this.currentLang = saved && this.locales[saved] ? saved : 'tr';
    this.listeners = new Set();
  }

  /**
   * Retrieves translation for given dot-notated key.
   * @param {string} key - Dot-separated key path (e.g. 'header.autoLayout')
   * @param {Record<string, any>} [params] - Interpolation variables
   * @param {string} [lang] - Optional override language
   * @returns {string}
   */
  t(key, params = {}, lang = this.currentLang) {
    const dict = this.locales[lang] || this.locales.tr;
    const keys = key.split('.');
    let val = dict;

    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        // Fallback to Turkish or return key
        const fallbackDict = this.locales.tr;
        let fbVal = fallbackDict;
        for (const fbk of keys) {
          if (fbVal && typeof fbVal === 'object' && fbk in fbVal) {
            fbVal = fbVal[fbk];
          } else {
            fbVal = null;
            break;
          }
        }
        val = fbVal || key;
        break;
      }
    }

    if (typeof val === 'string' && params && Object.keys(params).length > 0) {
      return val.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, p) => params[p] !== undefined ? String(params[p]) : `{{${p}}}`);
    }

    return typeof val === 'string' ? val : key;
  }

  /**
   * Switches active language, persists to storage, updates DOM, and notifies listeners.
   * @param {'tr' | 'en'} lang
   */
  setLanguage(lang) {
    if (!this.locales[lang] || this.currentLang === lang) return;
    this.currentLang = lang;
    try {
      localStorage.setItem('flowchart_lang', lang);
    } catch {
      // Storage unavailable in private browsing
    }
    this.updateDOM();
    this.notifyListeners();
  }

  /**
   * Returns current active language code ('tr' | 'en').
   * @returns {'tr' | 'en'}
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Scans and updates all declarative translation attributes in the DOM.
   * @param {HTMLElement|Document} [root]
   */
  updateDOM(root = (typeof document !== 'undefined' ? document : null)) {
    if (!root) return;

    // 1. Text content
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // 2. HTML content (with markup like strong, b, etc.)
    root.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        el.innerHTML = this.t(key);
      }
    });

    // 3. Placeholders
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // 4. Titles / Tooltips
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // 5. Update HTML lang attribute
    if (document.documentElement) {
      document.documentElement.lang = this.currentLang;
    }
  }

  /**
   * Registers a listener to be called whenever language changes.
   * @param {(lang: string) => void} callback
   */
  onLanguageChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentLang);
      } catch (err) {
        console.error('Error in i18n listener:', err);
      }
    }
  }
}

export const I18n = new I18nManager();
