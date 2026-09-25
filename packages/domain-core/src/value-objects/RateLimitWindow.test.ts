import { describe, it, expect } from 'vitest';
import { RateLimitWindow } from './RateLimitWindow';

describe('RateLimitWindow', () => {
  it('should report as exhausted when remaining is 0', () => {
    const limit = new RateLimitWindow(100, 0, 60);
    expect(limit.isExhausted).toBe(true);
  });

  it('should calculate usage percentage correctly', () => {
    const limit = new RateLimitWindow(100, 25, 60);
    expect(limit.usagePercentage).toBe(0.75); // 75% used
  });

  it('should not allow negative values', () => {
    expect(() => new RateLimitWindow(-1, 10, 60)).toThrow();
    expect(() => new RateLimitWindow(100, -10, 60)).toThrow();
    expect(() => new RateLimitWindow(100, 10, -60)).toThrow();
  });
});
