import { describe, it, expect } from 'vitest';
import { CurrencyCost, GEMINI_2_5_PRO_PRICING } from './CurrencyCost';

describe('CurrencyCost', () => {
  it('should calculate cost correctly based on pricing model', () => {
    const tokens = {
      prompt: 1_000_000,
      output: 1_000_000,
      cached: 1_000_000,
      thinking: 0
    };
    
    const cost = CurrencyCost.calculate(tokens, GEMINI_2_5_PRO_PRICING);
    
    expect(cost.promptUSD).toBe(1.25);
    expect(cost.outputUSD).toBe(5.00);
    expect(cost.cachedUSD).toBe(0.30);
    expect(cost.totalUSD).toBe(6.55);
    // Savings = (1.25 - 0.30) = 0.95
    expect(cost.savingsUSD).toBe(0.95);
  });

  it('should calculate thinking cost as output cost', () => {
    const tokens = {
      prompt: 0,
      output: 500_000,
      cached: 0,
      thinking: 500_000 // Total output = 1M
    };
    
    const cost = CurrencyCost.calculate(tokens, GEMINI_2_5_PRO_PRICING);
    expect(cost.outputUSD).toBe(5.00);
    expect(cost.totalUSD).toBe(5.00);
  });

  it('should not allow negative costs', () => {
    expect(() => new CurrencyCost(-1, 0, 0, 0, 0)).toThrow();
  });
});
