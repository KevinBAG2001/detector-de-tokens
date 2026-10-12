import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveWindowsAppDataRoaming } from './resolveWindowsAppDataRoaming.js';

describe('resolveWindowsAppDataRoaming', () => {
  it('prefiere APPDATA cuando está definido', () => {
    expect(
      resolveWindowsAppDataRoaming({
        APPDATA: 'C:\\Users\\Kevin\\AppData\\Roaming',
        USERPROFILE: 'C:\\Users\\Kevin',
      })
    ).toBe('C:\\Users\\Kevin\\AppData\\Roaming');
  });

  it('usa USERPROFILE\\AppData\\Roaming si APPDATA está vacío', () => {
    expect(
      resolveWindowsAppDataRoaming({
        APPDATA: '',
        USERPROFILE: 'C:\\Users\\Kevin',
      })
    ).toBe(path.join('C:\\Users\\Kevin', 'AppData', 'Roaming'));
  });

  it('devuelve null si no hay APPDATA ni USERPROFILE', () => {
    expect(resolveWindowsAppDataRoaming({})).toBeNull();
  });
});
