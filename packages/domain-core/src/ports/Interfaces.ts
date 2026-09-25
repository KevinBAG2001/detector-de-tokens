import { RateLimitWindow } from '../value-objects/RateLimitWindow';
import { TokenSessionAggregate } from '../aggregates/TokenSessionAggregate';

export interface ITokenTelemetryRepository {
  saveSession(session: TokenSessionAggregate): Promise<void>;
  getActiveSession(sessionId: string): Promise<TokenSessionAggregate | null>;
}

export interface IQuotaProviderService {
  getTPMRateLimit(): Promise<RateLimitWindow>;
  getRPMRateLimit(): Promise<RateLimitWindow>;
}

export interface IMetricLogRepository {
  appendLog(packet: any): Promise<void>;
}
