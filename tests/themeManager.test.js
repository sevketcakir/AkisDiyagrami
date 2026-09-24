import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../src/ui/ThemeManager.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

let docAttrs = {};
globalThis.document = {
  documentElement: {
    getAttribute: (attr) => docAttrs[attr] ?? null,
    setAttribute: (attr, val) => { docAttrs[attr] = String(val); },
    removeAttribute: (attr) => { delete docAttrs[attr]; }
  }
};

const windowEvents = new Map();
globalThis.window = {
  localStorage: globalThis.localStorage,
  addEventListener: (event, handler) => {
    if (!windowEvents.has(event)) windowEvents.set(event, new Set());
    windowEvents.get(event).add(handler);
  },
  removeEventListener: (event, handler) => {
    windowEvents.get(event)?.delete(handler);
  },
  dispatchEvent: (event) => {
    const handlers = windowEvents.get(event.type);
    if (handlers) {
      for (const h of handlers) h(event);
    }
    return true;
  }
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};

describe('ThemeManager Unit Tests', () => {
  beforeEach(() => {
    storage.clear();
    docAttrs = {};
    windowEvents.clear();
    ThemeManager.listeners.clear();
  });

  it('should default to dark theme when no theme is stored', () => {
    const theme = ThemeManager.init();
    expect(theme).toBe('dark');
    expect(ThemeManager.getTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should restore stored theme from localStorage on init', () => {
    localStorage.setItem(ThemeManager.STORAGE_KEY, 'light');
    const theme = ThemeManager.init();
    expect(theme).toBe('light');
    expect(ThemeManager.getTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should allow setting each of the 4 supported themes', () => {
    for (const theme of ['dark', 'light', 'midnight', 'sepia']) {
      ThemeManager.setTheme(theme);
      expect(ThemeManager.getTheme()).toBe(theme);
      expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
      expect(localStorage.getItem(ThemeManager.STORAGE_KEY)).toBe(theme);
    }
  });

  it('should fallback to default dark theme when an invalid theme is set', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ThemeManager.setTheme('neon-cyberpunk-invalid');
    expect(ThemeManager.getTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should notify registered listeners when theme changes', () => {
    const listener = vi.fn();
    const unsub = ThemeManager.onThemeChange(listener);

    ThemeManager.setTheme('sepia');
    expect(listener).toHaveBeenCalledWith('sepia');

    ThemeManager.setTheme('midnight');
    expect(listener).toHaveBeenCalledWith('midnight');

    unsub();
    ThemeManager.setTheme('light');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should dispatch app-theme-changed CustomEvent on window', () => {
    const eventHandler = vi.fn();
    window.addEventListener('app-theme-changed', eventHandler);

    ThemeManager.setTheme('light');
    expect(eventHandler).toHaveBeenCalledTimes(1);
    expect(eventHandler.mock.calls[0][0].detail).toEqual({ theme: 'light' });

    window.removeEventListener('app-theme-changed', eventHandler);
  });

  it('should toggle between dark and light using toggleLightDark()', () => {
    ThemeManager.setTheme('dark');
    const t1 = ThemeManager.toggleLightDark();
    expect(t1).toBe('light');
    expect(ThemeManager.getTheme()).toBe('light');

    const t2 = ThemeManager.toggleLightDark();
    expect(t2).toBe('dark');
    expect(ThemeManager.getTheme()).toBe('dark');

    // If starting from another theme (e.g. sepia), toggle switches to light
    ThemeManager.setTheme('sepia');
    const t3 = ThemeManager.toggleLightDark();
    expect(t3).toBe('light');
  });

  it('should cycle through all 4 themes sequentially using cycleTheme()', () => {
    ThemeManager.setTheme('dark');
    expect(ThemeManager.cycleTheme()).toBe('light');
    expect(ThemeManager.cycleTheme()).toBe('midnight');
    expect(ThemeManager.cycleTheme()).toBe('sepia');
    expect(ThemeManager.cycleTheme()).toBe('dark');
  });
});
