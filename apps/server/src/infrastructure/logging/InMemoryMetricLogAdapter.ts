import { IMetricLogRepository } from '@antigravity/domain-core';

export interface TelemetryLogEntry {
  timestamp: string;
  sessionId: string;
  packet: any;
}

/**
 * Adaptador de almacenamiento en memoria volátil de alta velocidad para métricas y auditoría.
 * Mantiene un búfer circular de hasta 1,000 entradas para análisis de tendencias sin persistencia invasiva.
 */
export class InMemoryMetricLogAdapter implements IMetricLogRepository {
  private buffer: TelemetryLogEntry[] = [];
  private readonly maxCapacity = 1000;

  public async appendLog(packet: any): Promise<void> {
    const entry: TelemetryLogEntry = {
      timestamp: new Date().toISOString(),
      sessionId: packet.sessionId || 'desconocida',
      packet,
    };

    if (this.buffer.length >= this.maxCapacity) {
      this.buffer.shift();
    }
    this.buffer.push(entry);
  }

  public getRecentLogs(limit: number = 50): TelemetryLogEntry[] {
    return this.buffer.slice(-limit);
  }

  public clear(): void {
    this.buffer = [];
  }
}
