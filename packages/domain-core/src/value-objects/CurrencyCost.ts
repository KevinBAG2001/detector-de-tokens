export interface ModelPricing {
  modelName: string;
  pricePerMillionPrompt: number;
  pricePerMillionOutput: number;
  pricePerMillionCached: number;
}

export const GEMINI_2_5_PRO_PRICING: ModelPricing = {
  modelName: "gemini-2.5-pro",
  pricePerMillionPrompt: 1.25,
  pricePerMillionOutput: 5.00,
  pricePerMillionCached: 0.30
};

export const GEMINI_2_5_FLASH_PRICING: ModelPricing = {
  modelName: "gemini-2.5-flash",
  pricePerMillionPrompt: 0.075,
  pricePerMillionOutput: 0.30,
  pricePerMillionCached: 0.01875
};

export class CurrencyCost {
  constructor(
    public readonly totalUSD: number,
    public readonly promptUSD: number,
    public readonly outputUSD: number,
    public readonly cachedUSD: number,
    public readonly savingsUSD: number
  ) {
    if (totalUSD < 0 || promptUSD < 0 || outputUSD < 0 || cachedUSD < 0 || savingsUSD < 0) {
      throw new Error("El costo no puede ser negativo");
    }
  }

  static calculate(tokens: { prompt: number, output: number, cached: number, thinking: number }, pricing: ModelPricing): CurrencyCost {
    // Thinking cost is identical to output cost for Gemini
    const outputTokens = tokens.output + tokens.thinking;
    
    const promptUSD = (tokens.prompt / 1_000_000) * pricing.pricePerMillionPrompt;
    const outputUSD = (outputTokens / 1_000_000) * pricing.pricePerMillionOutput;
    const cachedUSD = (tokens.cached / 1_000_000) * pricing.pricePerMillionCached;
    
    const totalUSD = promptUSD + outputUSD + cachedUSD;
    
    // Calcula cuánto habría costado si los cached fueran prompts normales
    const wouldHaveCostPromptUSD = (tokens.cached / 1_000_000) * pricing.pricePerMillionPrompt;
    const savingsUSD = Math.max(0, wouldHaveCostPromptUSD - cachedUSD);

    return new CurrencyCost(totalUSD, promptUSD, outputUSD, cachedUSD, savingsUSD);
  }
}
