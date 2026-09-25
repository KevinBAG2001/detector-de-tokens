import { GranularTokenCount } from '../value-objects/GranularTokenCount';
import { Severity } from '../value-objects/FillLevel';

export interface DomainEvent {
  eventId: string;
  timestamp: Date;
}

export class TokenBatchConsumedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly sessionId: string,
    public readonly delta: GranularTokenCount,
    public readonly totalAccumulated: GranularTokenCount
  ) {
    this.eventId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class QuotaThresholdCrossedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly sessionId: string,
    public readonly newSeverity: Severity,
    public readonly currentPercentage: number
  ) {
    this.eventId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class ContextExhaustionImminentEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly sessionId: string,
    public readonly remainingTokens: number
  ) {
    this.eventId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}
