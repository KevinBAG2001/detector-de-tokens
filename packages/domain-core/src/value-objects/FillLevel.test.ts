import { describe, it, expect } from 'vitest';
import { FillLevel } from './FillLevel';

describe('FillLevel', () => {
  it('should return safe severity for less than 70%', () => {
    const fill = new FillLevel(0.69);
    expect(fill.severity).toBe('safe');
  });

  it('should return warning severity for 70% to 84%', () => {
    const fill1 = new FillLevel(0.70);
    const fill2 = new FillLevel(0.84);
    expect(fill1.severity).toBe('warning');
    expect(fill2.severity).toBe('warning');
  });

  it('should return critical severity for 85% or more', () => {
    const fill = new FillLevel(0.85);
    expect(fill.severity).toBe('critical');
  });

  it('should bound percentage between 0 and 1', () => {
    expect(new FillLevel(-0.5).percentage).toBe(0);
    expect(new FillLevel(1.5).percentage).toBe(1.0);
  });

  it('should calculate fill level from current and max tokens', () => {
    const fill = FillLevel.calculate(500, 1000);
    expect(fill.percentage).toBe(0.5);
    expect(fill.severity).toBe('safe');
  });
});
