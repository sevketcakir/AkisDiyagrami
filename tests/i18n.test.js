import { describe, it, expect, beforeEach } from 'vitest';
import { I18n } from '../src/i18n/I18n.js';
import tr from '../src/i18n/locales/tr.js';
import en from '../src/i18n/locales/en.js';
import { SamplePrograms } from '../src/utils/SamplePrograms.js';

describe('I18n Internationalization Subsystem', () => {
  beforeEach(() => {
    I18n.setLanguage('tr');
  });

  it('should default to Turkish (tr)', () => {
    expect(I18n.getLanguage()).toBe('tr');
    expect(I18n.t('brand.title')).toBe('C Akış Diyagramı');
    expect(I18n.t('status.ready')).toBe('Hazır');
  });

  it('should translate keys in English when switched to en', () => {
    I18n.setLanguage('en');
    expect(I18n.getLanguage()).toBe('en');
    expect(I18n.t('brand.title')).toBe('Flowchart C Interpreter');
    expect(I18n.t('status.ready')).toBe('Ready');
    expect(I18n.t('nodes.startTitle')).toBe('START');
  });

  it('should notify registered listeners upon language switch', () => {
    let notifiedLang = null;
    const unsub = I18n.onLanguageChange((lang) => {
      notifiedLang = lang;
    });

    I18n.setLanguage('en');
    expect(notifiedLang).toBe('en');

    I18n.setLanguage('tr');
    expect(notifiedLang).toBe('tr');

    unsub();
  });

  it('should dynamically update SamplePrograms name and description getters', () => {
    I18n.setLanguage('tr');
    expect(SamplePrograms.rectangleArea.name).toBe('1. Dikdörtgen Alanı (Sıralı Akış)');
    expect(SamplePrograms.evenOrOdd.name).toBe('2. Tek / Çift Sayı (If-Else Koşulu)');
    expect(SamplePrograms.isPrimeCheck.name).toBe('6. Asal Sayı Testi (N Asal mı?)');

    I18n.setLanguage('en');
    expect(SamplePrograms.rectangleArea.name).toBe('1. Rectangle Area (Sequential Flow)');
    expect(SamplePrograms.evenOrOdd.name).toBe('2. Even / Odd (If-Else Decision)');
    expect(SamplePrograms.isPrimeCheck.name).toBe('6. Prime Test (Is N Prime?)');
  });

  it('should translate help section keys correctly in both languages', () => {
    I18n.setLanguage('tr');
    expect(I18n.t('help.title')).toBe('Kullanım Kılavuzu & C Referansı');
    expect(I18n.t('help.tabSymbols')).toBe('🔷 Akış Blokları');
    expect(I18n.t('help.tabTypes')).toBe('🔢 Değişken Tipleri');
    expect(I18n.t('help.tabOperators')).toBe('⚙️ Operatörler');

    I18n.setLanguage('en');
    expect(I18n.t('help.title')).toBe('User Guide & C Reference');
    expect(I18n.t('help.tabSymbols')).toBe('🔷 Flowchart Symbols');
    expect(I18n.t('help.tabTypes')).toBe('🔢 Data Types');
    expect(I18n.t('help.tabOperators')).toBe('⚙️ Operators');
  });

  it('should have parity between Turkish and English translation structures', () => {
    const getKeys = (obj, prefix = '') => {
      let keys = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null) {
          keys = keys.concat(getKeys(v, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    };

    const trKeys = getKeys(tr).sort();
    const enKeys = getKeys(en).sort();

    expect(trKeys).toEqual(enKeys);
  });
});
