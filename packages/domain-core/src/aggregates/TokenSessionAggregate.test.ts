import { describe, it, expect } from 'vitest';
import { TokenSessionAggregate } from './TokenSessionAggregate';
import { GEMINI_2_5_PRO_PRICING } from '../value-objects/CurrencyCost';
import { GranularTokenCount } from '../value-objects/GranularTokenCount';

describe('TokenSessionAggregate', () => {
  it('should initialize empty', () => {
    const session = new TokenSessionAggregate('session-1', 2_000_000, GEMINI_2_5_PRO_PRICING);
    expect(session.accumulatedTokens.totalAccumulated).toBe(0);
    expect(session.fillLevel.percentage).toBe(0);
    expect(session.fillLevel.severity).toBe('safe');
  });

  it('should consume tokens and calculate costs and levels correctly', () => {
    const session = new TokenSessionAggregate('session-1', 1_000_000, GEMINI_2_5_PRO_PRICING);
    
    // Consume 100k prompt, 50k output
    session.consumeTokens(new GranularTokenCount(100_000, 50_000, 0, 0));
    
    expect(session.accumulatedTokens.totalAccumulated).toBe(150_000);
    expect(session.fillLevel.percentage).toBe(0.15);
    
    // 100k prompt = $0.125, 50k output = $0.25 -> total = $0.375
    expect(session.financialCost.totalUSD).toBe(0.375);
  });

  it('should transition severity from safe to warning at 70%', () => {
    const session = new TokenSessionAggregate('session-1', 1_000_000, GEMINI_2_5_PRO_PRICING);
    
    // Jump to 69%
    session.consumeTokens(new GranularTokenCount(690_000, 0, 0, 0));
    expect(session.fillLevel.severity).toBe('safe');
    
    // Clear events to track the change
    session.clearEvents();

    // Cross the 70% threshold
    session.consumeTokens(new GranularTokenCount(20_000, 0, 0, 0));
    expect(session.fillLevel.severity).toBe('warning');

    const uncommittedEvents = session.uncommittedEvents;
    const thresholdEvent = uncommittedEvents.find(e => e.constructor.name === 'QuotaThresholdCrossedEvent');
    expect(thresholdEvent).toBeDefined();
    expect((thresholdEvent as any).newSeverity).toBe('warning');
  });

  it('should transition severity to critical at 85%', () => {
    const session = new TokenSessionAggregate('session-1', 1_000_000, GEMINI_2_5_PRO_PRICING);
    
    session.consumeTokens(new GranularTokenCount(860_000, 0, 0, 0));
    expect(session.fillLevel.severity).toBe('critical');
  });
});
