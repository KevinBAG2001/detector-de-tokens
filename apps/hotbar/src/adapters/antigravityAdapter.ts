import { invoke } from '@tauri-apps/api/core';

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
  message: string | null;
}

export async function fetchAntigravitySnapshot(): Promise<AntigravityTokenSnapshot> {
  return invoke<AntigravityTokenSnapshot>('fetch_antigravity_snapshot');
}
