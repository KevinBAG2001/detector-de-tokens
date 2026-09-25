import { 
  TokenSessionAggregate, 
  GranularTokenCount, 
  GEMINI_2_5_PRO_PRICING, 
  GEMINI_2_5_FLASH_PRICING, 
  ModelPricing 
} from '@antigravity/domain-core';
import { AntigravityTranscriptWatcherAdapter } from '../../infrastructure/watcher/AntigravityTranscriptWatcherAdapter.js';
import { GeminiApiClientAdapter } from '../../infrastructure/gemini/GeminiApiClientAdapter.js';
import { InMemoryMetricLogAdapter } from '../../infrastructure/logging/InMemoryMetricLogAdapter.js';

export interface TokenTelemetryStreamPacket {
  eventId: string;
  timestamp: string;
  sessionId: string;
  model: {
    name: string;
    contextWindowLimit: number;
  };
  tokens: {
    prompt: number;
    output: number;
    cached: number;
    thinking: number;
    totalAccumulated: number;
  };
  gauge: {
    fillPercentage: number;
    severity: 'safe' | 'warning' | 'critical';
    liquidColorHex: string;
  };
  rateLimits: {
    tpmRemaining: number;
    tpmLimit: number;
    rpmRemaining: number;
    rpmLimit: number;
    resetInSeconds: number;
  };
  financial: {
    costUSD: number;
    savingsUSD: number;
  };
}

export type PacketBroadcastListener = (packet: TokenTelemetryStreamPacket) => void;

export class StreamTokensUseCase {
  private activeAggregate: TokenSessionAggregate | null = null;
  private activeModelId: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-pro';
  private broadcastListeners: Set<PacketBroadcastListener> = new Set();

  constructor(
    private readonly watcher: AntigravityTranscriptWatcherAdapter,
    private readonly quotaAdapter: GeminiApiClientAdapter,
    private readonly metricRepo: InMemoryMetricLogAdapter
  ) {}

  public subscribe(listener: PacketBroadcastListener): () => void {
    this.broadcastListeners.add(listener);
    // Enviar estado actual inmediatamente al nuevo suscriptor
    const currentPacket = this.getCurrentPacket();
    if (currentPacket) {
      listener(currentPacket);
    }
    return () => {
      this.broadcastListeners.delete(listener);
    };
  }

  public async initializeWithLatestSession(): Promise<TokenTelemetryStreamPacket | null> {
    const latest = this.watcher.getLatestSession();
    if (!latest) {
      return null;
    }
    return this.switchSession(latest.sessionId, this.activeModelId);
  }

  public async switchSession(sessionId: string, modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash' = this.activeModelId): Promise<TokenTelemetryStreamPacket> {
    this.activeModelId = modelId;
    const isPro = modelId.includes('pro');
    const limit = isPro ? 2_000_000 : 1_000_000;
    const pricing: ModelPricing = isPro 
      ? GEMINI_2_5_PRO_PRICING 
      : GEMINI_2_5_FLASH_PRICING;

    const aggregate = new TokenSessionAggregate(sessionId, limit, pricing);
    this.activeAggregate = aggregate;

    // Conectar el watcher y recibir acumulados iniciales y deltas
    await this.watcher.watchSession(sessionId, (delta) => {
      if (this.activeAggregate && this.activeAggregate.sessionId === sessionId) {
        this.activeAggregate.consumeTokens(delta);
        const packet = this.buildPacket(this.activeAggregate);
        void this.metricRepo.appendLog(packet);
        this.broadcast(packet);
      }
    });

    const packet = this.buildPacket(aggregate);
    void this.metricRepo.appendLog(packet);
    this.broadcast(packet);
    return packet;
  }

  public setModel(modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash'): TokenTelemetryStreamPacket | null {
    if (!this.activeAggregate) return null;
    const currentSessionId = this.activeAggregate.sessionId;
    const currentTokens = this.activeAggregate.accumulatedTokens;

    this.activeModelId = modelId;
    const isPro = modelId.includes('pro');
    const limit = isPro ? 2_000_000 : 1_000_000;
    const pricing: ModelPricing = isPro 
      ? GEMINI_2_5_PRO_PRICING 
      : GEMINI_2_5_FLASH_PRICING;

    const newAggregate = new TokenSessionAggregate(currentSessionId, limit, pricing);
    newAggregate.consumeTokens(currentTokens);
    this.activeAggregate = newAggregate;

    const packet = this.buildPacket(newAggregate);
    void this.metricRepo.appendLog(packet);
    this.broadcast(packet);
    return packet;
  }

  public getCurrentPacket(): TokenTelemetryStreamPacket | null {
    if (!this.activeAggregate) {
      return null;
    }
    return this.buildPacket(this.activeAggregate);
  }

  private buildPacket(aggregate: TokenSessionAggregate): TokenTelemetryStreamPacket {
    const quota = this.quotaAdapter.getModelQuota(this.activeModelId);
    const tokens = aggregate.accumulatedTokens;
    const fill = aggregate.fillLevel;
    const cost = aggregate.financialCost;

    let liquidColorHex = '#00F0FF';
    if (fill.severity === 'critical') {
      liquidColorHex = '#EF4444';
    } else if (fill.severity === 'warning') {
      liquidColorHex = '#F59E0B';
    }

    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sessionId: aggregate.sessionId,
      model: {
        name: quota.modelName,
        contextWindowLimit: aggregate.contextWindowLimit,
      },
      tokens: {
        prompt: tokens.prompt,
        output: tokens.output,
        cached: tokens.cached,
        thinking: tokens.thinking,
        totalAccumulated: tokens.totalAccumulated,
      },
      gauge: {
        fillPercentage: Math.round(fill.percentage * 1000) / 10, // 0.0 a 100.0 con 1 decimal
        severity: fill.severity,
        liquidColorHex,
      },
      rateLimits: {
        tpmRemaining: quota.tpmRemaining,
        tpmLimit: quota.tpmLimit,
        rpmRemaining: quota.rpmRemaining,
        rpmLimit: quota.rpmLimit,
        resetInSeconds: quota.resetInSeconds,
      },
      financial: {
        costUSD: cost.totalUSD,
        savingsUSD: cost.savingsUSD,
      },
    };
  }

  private broadcast(packet: TokenTelemetryStreamPacket): void {
    for (const listener of this.broadcastListeners) {
      try {
        listener(packet);
      } catch (err) {
        console.error('Error al emitir paquete a suscriptor:', err);
      }
    }
  }
}
