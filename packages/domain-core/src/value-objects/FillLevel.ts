export type Severity = 'safe' | 'warning' | 'critical';

export class FillLevel {
  public readonly percentage: number;

  constructor(percentage: number) {
    if (percentage < 0) {
      this.percentage = 0;
    } else if (percentage > 1.0) {
      this.percentage = 1.0;
    } else {
      this.percentage = percentage;
    }
  }

  get severity(): Severity {
    if (this.percentage < 0.70) {
      return 'safe';
    } else if (this.percentage < 0.85) {
      return 'warning';
    } else {
      return 'critical';
    }
  }

  static calculate(currentTokens: number, maxTokens: number): FillLevel {
    if (maxTokens <= 0) return new FillLevel(0);
    return new FillLevel(currentTokens / maxTokens);
  }
}
