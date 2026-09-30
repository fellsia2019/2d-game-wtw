import { expect, it, vi } from 'vitest';
import { browserLocale, portalLocale, setLocale, translate } from '../src/i18n';
import { ERA_BATTLES, ERA_NAMES, UNITS } from '../src/data/content';
import { englishBattles, englishEras, englishUnits } from '../src/i18n/english';
import { translateLab } from '../src/art/sprite-lab-i18n';
import type { EraId, UnitKind } from '../src/core/types';

it('selects supported languages and translates every era, battle, and unit', () => {
  vi.stubGlobal('document', { documentElement: { lang: '' } });
  expect(portalLocale('en')).toBe('en');
  expect(portalLocale('ru')).toBe('ru');
  for (const language of ['be', 'kk', 'uk', 'uz']) expect(portalLocale(language)).toBe('ru');
  for (const language of ['tr', 'de', 'fr', 'az']) expect(portalLocale(language)).toBe('en');
  expect(browserLocale('en-US')).toBe('en');
  expect(browserLocale('uk-UA')).toBe('ru');
  expect(browserLocale('tr-TR')).toBe('en');
  setLocale('en');
  for (const [id, unit] of Object.entries(UNITS)) {
    const english = englishUnits[id as UnitKind];
    expect(translate(unit.name)).toBe(english[0]);
    expect(translate(unit.role)).toBe(english[1]);
  }
  for (const [id, name] of Object.entries(ERA_NAMES)) {
    expect(translate(name)).toBe(englishEras[id as EraId]);
    expect(englishBattles[id as EraId]).toHaveLength(ERA_BATTLES[id as EraId].length);
    ERA_BATTLES[id as EraId].forEach((battle, index) => {
      expect(translate(battle.name)).toBe(englishBattles[id as EraId][index][0]);
      expect(translate(battle.threat)).toBe(englishBattles[id as EraId][index][1]);
    });
  }
  setLocale('ru');
  expect(translate(UNITS.stoneShield.name)).toBe(UNITS.stoneShield.name);
  vi.unstubAllGlobals();
});

it('translates interpolated UI and saved result text', () => {
  vi.stubGlobal('document', { documentElement: { lang: '' } });
  setLocale('en');
  expect(translate('Убрать Пещерный страж из отряда')).toBe('Remove Cave Guard from army');
  expect(translate('1 победа · 0/1')).toBe('1 victory · 0/1');
  expect(translate('0 побед · 1 поход')).toBe('0 victories · 1 campaign');
  expect(translate('Купить здоровье базы, уровень 1, цена 10 золота')).toBe('Buy base health, level 1, cost 10 gold');
  expect(translate('Таланты · Каменный век')).toBe('Talents · Stone Age');
  expect(translate('Cave Guard. Defender · sturdy stone shield Цена: 16 припасов. Клавиша 1.')).toBe('Cave Guard. Defender · sturdy stone shield Cost: 16 supplies. Key 1.');
  expect(translate('Бонус получен: +25 золота.')).toBe('Bonus received: +25 gold.');
  expect(translate('+25 за победу')).toBe('+25 gold for victory');
  vi.unstubAllGlobals();
});

it('keeps the published sprite lab free of mixed-language unit labels', () => {
  vi.stubGlobal('document', { documentElement: { lang: '' } });
  setLocale('en');
  for (const unit of Object.values(UNITS)) {
    expect(translateLab(unit.name)).not.toMatch(/[А-Яа-яЁё]/);
    expect(translateLab(unit.role)).not.toMatch(/[А-Яа-яЁё]/);
  }
  expect(translateLab('Показано 87 из 87 моделей')).toBe('Showing 87 of 87 models');
  expect(translateLab('0 · стойка')).toBe('0 · idle');
  setLocale('ru');
  vi.unstubAllGlobals();
});
