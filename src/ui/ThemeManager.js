/**
 * @file ThemeManager.js
 * Manages active application theme (Slate Dark, Classroom Projector Light, Midnight OLED, Sepia Paper).
 * Handles persistent state in localStorage and dispatches change events.
 */

export class ThemeManager {
  static THEMES = ['dark', 'light', 'midnight', 'sepia'];
  static DEFAULT_THEME = 'dark';
  static STORAGE_KEY = 'app-theme';

  /** @type {Set<Function>} */
  static listeners = new Set();

  /**
   * Initializes the theme from localStorage or fallback.
   * Applies the theme attribute to the <html> document root.
   * @returns {string} The active theme name
   */
  static init() {
    let savedTheme = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        savedTheme = window.localStorage.getItem(this.STORAGE_KEY);
      }
    } catch {
      // LocalStorage access might fail in restricted environments
    }

    const initialTheme = (savedTheme && this.THEMES.includes(savedTheme)) ? savedTheme : this.DEFAULT_THEME;
    this.applyTheme(initialTheme);
    return initialTheme;
  }

  /**
   * Returns current active theme.
   * @returns {string}
   */
  static getTheme() {
    if (typeof document !== 'undefined' && document.documentElement) {
      const current = document.documentElement.getAttribute('data-theme');
      if (current && this.THEMES.includes(current)) {
        return current;
      }
    }
    return this.DEFAULT_THEME;
  }

  /**
   * Sets and persists the application theme.
   * @param {string} themeName - 'dark' | 'light' | 'midnight' | 'sepia'
   * @returns {boolean} Whether theme was successfully changed
   */
  static setTheme(themeName) {
    if (!this.THEMES.includes(themeName)) {
      console.warn(`[ThemeManager] Unknown theme: "${themeName}". Fallback to "${this.DEFAULT_THEME}".`);
      themeName = this.DEFAULT_THEME;
    }

    this.applyTheme(themeName);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, themeName);
      }
    } catch {
      // Ignore localStorage failure
    }

    // Notify registered listeners
    for (const listener of this.listeners) {
      try {
        listener(themeName);
      } catch (err) {
        console.error('[ThemeManager] Listener error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-theme-changed', { detail: { theme: themeName } }));
    }

    return true;
  }

  /**
   * Toggles between Dark and Light/Projector mode.
   * If current is light, switches to dark; otherwise switches to light.
   * @returns {string} The new theme
   */
  static toggleLightDark() {
    const current = this.getTheme();
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    return next;
  }

  /**
   * Cycles through all available themes in order.
   * @returns {string} The new theme
   */
  static cycleTheme() {
    const current = this.getTheme();
    const currentIndex = this.THEMES.indexOf(current);
    const nextIndex = (currentIndex + 1) % this.THEMES.length;
    const nextTheme = this.THEMES[nextIndex];
    this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Subscribes to theme changes.
   * @param {(theme: string) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  static onThemeChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }

  /**
   * Directly sets the data-theme attribute on <html> element.
   * @private
   * @param {string} theme
   */
  static applyTheme(theme) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
