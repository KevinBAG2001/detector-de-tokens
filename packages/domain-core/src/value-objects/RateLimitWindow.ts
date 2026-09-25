export class RateLimitWindow {
  constructor(
    public readonly limit: number,
    public readonly remaining: number,
    public readonly resetInSeconds: number
  ) {
    if (limit < 0 || remaining < 0 || resetInSeconds < 0) {
      throw new Error("Los valores de RateLimit no pueden ser negativos");
    }
  }

  get isExhausted(): boolean {
    return this.remaining === 0;
  }
  
  get usagePercentage(): number {
    if (this.limit === 0) return 0;
    return 1 - (this.remaining / this.limit);
  }
}
