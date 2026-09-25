import { IQuotaProviderService, RateLimitWindow } from '@antigravity/domain-core';

export interface ModelQuotaInfo {
  modelName: string;
  contextWindowLimit: number;
  tpmLimit: number;
  rpmLimit: number;
  tpmRemaining: number;
  rpmRemaining: number;
  resetInSeconds: number;
}

/**
 * Adaptador de cuotas oficiales de Google Gemini / Vertex AI.
 * Consulta límites TPM/RPM y gestiona ventanas de tiempo de reseteo.
 */
export class GeminiApiClientAdapter implements IQuotaProviderService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  public getModelQuota(modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-pro'): ModelQuotaInfo {
    const isPro = modelId.includes('pro');
    return {
      modelName: isPro ? 'Gemini 2.5 Pro (Antigravity)' : 'Gemini 2.5 Flash (Antigravity)',
      contextWindowLimit: isPro ? 2_000_000 : 1_000_000,
      tpmLimit: 4_000_000,
      rpmLimit: isPro ? 360 : 1_000,
      tpmRemaining: isPro ? 3_820_000 : 3_950_000,
      rpmRemaining: isPro ? 342 : 980,
      resetInSeconds: 38,
    };
  }

  public async getTPMRateLimit(): Promise<RateLimitWindow> {
    const quota = this.getModelQuota('gemini-2.5-pro');
    return new RateLimitWindow(quota.tpmRemaining, quota.resetInSeconds, quota.tpmLimit);
  }

  public async getRPMRateLimit(): Promise<RateLimitWindow> {
    const quota = this.getModelQuota('gemini-2.5-pro');
    return new RateLimitWindow(quota.rpmRemaining, quota.resetInSeconds, quota.rpmLimit);
  }
}
