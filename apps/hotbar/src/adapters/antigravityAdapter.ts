import { invoke } from '@tauri-apps/api/core';
import type { CuotaAntigravityIdeStatus } from '../lib/quotaTypes';

export interface AntigravityTokenSnapshot {
  source: 'antigravity';
  available: boolean;
  sessionId: string | null;
  tokens: {
    prompt: number;
    output: number;
    cached: number;
    thinking: number;
    totalAccumulated: number;
  };
  quota: CuotaAntigravityIdeStatus;
  message: string | null;
}

export async function fetchAntigravitySnapshot(): Promise<AntigravityTokenSnapshot> {
  return invoke<AntigravityTokenSnapshot>('fetch_antigravity_snapshot');
}
