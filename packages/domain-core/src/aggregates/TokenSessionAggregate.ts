import { GranularTokenCount } from '../value-objects/GranularTokenCount';
import { FillLevel, Severity } from '../value-objects/FillLevel';
import { CurrencyCost, ModelPricing } from '../value-objects/CurrencyCost';
import { 
  DomainEvent, 
  TokenBatchConsumedEvent, 
  QuotaThresholdCrossedEvent,
  ContextExhaustionImminentEvent
} from '../events/DomainEvents';

export class TokenSessionAggregate {
  private _accumulatedTokens: GranularTokenCount;
  private _domainEvents: DomainEvent[] = [];
  private _currentSeverity: Severity = 'safe';

  constructor(
    public readonly sessionId: string,
    public readonly contextWindowLimit: number,
    public readonly pricingModel: ModelPricing
  ) {
    this._accumulatedTokens = GranularTokenCount.empty();
  }

  get accumulatedTokens(): GranularTokenCount {
    return this._accumulatedTokens;
  }

  get fillLevel(): FillLevel {
    return FillLevel.calculate(this._accumulatedTokens.totalAccumulated, this.contextWindowLimit);
  }

  get financialCost(): CurrencyCost {
    return CurrencyCost.calculate(this._accumulatedTokens, this.pricingModel);
  }

  get uncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  consumeTokens(delta: GranularTokenCount): void {
    const previousSeverity = this._currentSeverity;
    
    this._accumulatedTokens = this._accumulatedTokens.add(delta);
    
    this._domainEvents.push(
      new TokenBatchConsumedEvent(this.sessionId, delta, this._accumulatedTokens)
    );

    const newFillLevel = this.fillLevel;
    const newSeverity = newFillLevel.severity;

    if (newSeverity !== previousSeverity) {
      this._domainEvents.push(
        new QuotaThresholdCrossedEvent(this.sessionId, newSeverity, newFillLevel.percentage)
      );
      this._currentSeverity = newSeverity;
    }

    if (newFillLevel.percentage >= 0.95) {
      const remaining = this.contextWindowLimit - this._accumulatedTokens.totalAccumulated;
      this._domainEvents.push(
        new ContextExhaustionImminentEvent(this.sessionId, Math.max(0, remaining))
      );
    }
  }
}
