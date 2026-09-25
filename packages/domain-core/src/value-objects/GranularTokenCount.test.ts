import { describe, it, expect } from 'vitest';
import { GranularTokenCount } from './GranularTokenCount';

describe('GranularTokenCount', () => {
  it('should calculate total accumulated and total billable', () => {
    const tokens = new GranularTokenCount(100, 50, 20, 10);
    expect(tokens.totalAccumulated).toBe(180);
    expect(tokens.totalBillable).toBe(180);
  });

  it('should not allow negative values', () => {
    expect(() => new GranularTokenCount(-1, 0, 0, 0)).toThrow();
    expect(() => new GranularTokenCount(0, -1, 0, 0)).toThrow();
  });

  it('should add two token counts correctly', () => {
    const t1 = new GranularTokenCount(10, 20, 30, 40);
    const t2 = new GranularTokenCount(5, 5, 5, 5);
    const result = t1.add(t2);
    
    expect(result.prompt).toBe(15);
    expect(result.output).toBe(25);
    expect(result.cached).toBe(35);
    expect(result.thinking).toBe(45);
  });
});
