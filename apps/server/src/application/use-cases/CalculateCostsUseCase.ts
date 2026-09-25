import { 
  GranularTokenCount, 
  CurrencyCost, 
  ModelPricing, 
  GEMINI_2_5_PRO_PRICING, 
  GEMINI_2_5_FLASH_PRICING 
} from '@antigravity/domain-core';

export class CalculateCostsUseCase {
  public execute(tokens: GranularTokenCount, modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-pro'): CurrencyCost {
    const pricing: ModelPricing = modelId.includes('pro') 
      ? GEMINI_2_5_PRO_PRICING 
      : GEMINI_2_5_FLASH_PRICING;

    return CurrencyCost.calculate(tokens, pricing);
  }
}
