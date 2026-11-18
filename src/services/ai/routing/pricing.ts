/**
 * Olmera Healthcare - LLM Model Pricing & Benchmark Constants
 * 
 * Used for cost estimation and budget threshold calculations.
 */

export interface ModelPricingTier {
  provider: 'gemini' | 'anthropic' | 'openai' | 'custom';
  modelId: string;
  name: string;
  costPer1kPromptTokens: number;      // In USD
  costPer1kCompletionTokens: number;  // In USD
  defaultRpm: number;
  defaultTpm: number;
  defaultRpd: number;
}

export const KNOWN_MODEL_BENCHMARKS: Record<string, ModelPricingTier> = {
  // Google Gemini Models
  'gemini-1.5-flash': {
    provider: 'gemini',
    modelId: 'gemini-1.5-flash',
    name: 'Google Gemini 1.5 Flash',
    costPer1kPromptTokens: 0.000075,
    costPer1kCompletionTokens: 0.0003,
    defaultRpm: 15, // Free tier default (1000 in paid)
    defaultTpm: 1000000,
    defaultRpd: 1500
  },
  'gemini-1.5-pro': {
    provider: 'gemini',
    modelId: 'gemini-1.5-pro',
    name: 'Google Gemini 1.5 Pro',
    costPer1kPromptTokens: 0.00125,
    costPer1kCompletionTokens: 0.005,
    defaultRpm: 2,
    defaultTpm: 32000,
    defaultRpd: 50
  },
  'gemini-2.0-flash': {
    provider: 'gemini',
    modelId: 'gemini-2.0-flash',
    name: 'Google Gemini 2.0 Flash (Experimental)',
    costPer1kPromptTokens: 0.0001,
    costPer1kCompletionTokens: 0.0004,
    defaultRpm: 10,
    defaultTpm: 500000,
    defaultRpd: 1000
  },

  // Anthropic Claude Models
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    name: 'Anthropic Claude 3.5 Sonnet',
    costPer1kPromptTokens: 0.003,
    costPer1kCompletionTokens: 0.015,
    defaultRpm: 50,
    defaultTpm: 40000,
    defaultRpd: 10000
  },
  'claude-3-5-haiku': {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    name: 'Anthropic Claude 3.5 Haiku',
    costPer1kPromptTokens: 0.0008,
    costPer1kCompletionTokens: 0.004,
    defaultRpm: 100,
    defaultTpm: 100000,
    defaultRpd: 20000
  },

  // OpenAI Models
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    costPer1kPromptTokens: 0.0025,
    costPer1kCompletionTokens: 0.010,
    defaultRpm: 500,
    defaultTpm: 300000,
    defaultRpd: 10000
  },
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    costPer1kPromptTokens: 0.00015,
    costPer1kCompletionTokens: 0.0006,
    defaultRpm: 500,
    defaultTpm: 200000,
    defaultRpd: 10000
  }
};

/**
 * Calculates prompt and completion cost in USD
 */
export function calculateTokenCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
  customPromptRate?: number,
  customCompletionRate?: number
): number {
  const benchmark = KNOWN_MODEL_BENCHMARKS[model];
  const promptRate = customPromptRate ?? benchmark?.costPer1kPromptTokens ?? 0.0001;
  const completionRate = customCompletionRate ?? benchmark?.costPer1kCompletionTokens ?? 0.0004;

  const promptCost = (promptTokens / 1000) * promptRate;
  const completionCost = (completionTokens / 1000) * completionRate;

  return Number((promptCost + completionCost).toFixed(7));
}
