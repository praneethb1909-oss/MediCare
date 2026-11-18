/**
 * Olmera Healthcare - Provider Adapters (Gemini, Claude, OpenAI, Custom)
 * 
 * Handles protocol serialization, HTTP request execution, error parsing (429/5xx),
 * token count extraction, and high-fidelity fallback simulations for offline testing.
 */

import { LLMKeyConfig } from './types';

export interface ProviderCallResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

export class ProviderAPIError extends Error {
  public statusCode?: number;
  public isRateLimit: boolean;
  public isQuotaExceeded: boolean;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ProviderAPIError';
    this.statusCode = statusCode;
    this.isRateLimit = statusCode === 429 || message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('resource_exhausted');
    this.isQuotaExceeded = message.toLowerCase().includes('quota') || message.toLowerCase().includes('credit') || message.toLowerCase().includes('billing');
  }
}

/**
 * Execute prompt against specified key config
 */
export async function executeProviderCall(
  keyConfig: LLMKeyConfig,
  prompt: string,
  systemInstruction?: string,
  temperature: number = 0.7,
  maxTokens: number = 1024
): Promise<ProviderCallResult> {
  const startTime = Date.now();

  // Detect placeholder/testing keys to run offline simulation
  const isDemoKey = 
    !keyConfig.apiKey || 
    keyConfig.apiKey.includes('your_') || 
    keyConfig.apiKey.includes('placeholder') || 
    keyConfig.apiKey.includes('DemoLocal');

  if (isDemoKey) {
    return simulateOfflineResponse(keyConfig, prompt, startTime);
  }

  switch (keyConfig.provider) {
    case 'gemini':
      return callGoogleGemini(keyConfig, prompt, systemInstruction, temperature, maxTokens, startTime);
    case 'anthropic':
      return callAnthropicClaude(keyConfig, prompt, systemInstruction, temperature, maxTokens, startTime);
    case 'openai':
    case 'custom':
      return callOpenAICompatible(keyConfig, prompt, systemInstruction, temperature, maxTokens, startTime);
    default:
      throw new ProviderAPIError(`Unsupported provider: ${keyConfig.provider}`, 400);
  }
}

// -----------------------------------------------------------------------------
// Google Gemini REST Adapter
// -----------------------------------------------------------------------------
async function callGoogleGemini(
  key: LLMKeyConfig,
  prompt: string,
  systemInstruction: string | undefined,
  temperature: number,
  maxTokens: number,
  startTime: number
): Promise<ProviderCallResult> {
  const modelName = key.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key.apiKey}`;

  const body: any = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const latencyMs = Date.now() - startTime;

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `Gemini API returned status ${res.status}`;
    throw new ProviderAPIError(message, res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const promptTokens = data?.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
  const completionTokens = data?.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

  return { text, promptTokens, completionTokens, latencyMs };
}

// -----------------------------------------------------------------------------
// Anthropic Claude Messages Adapter
// -----------------------------------------------------------------------------
async function callAnthropicClaude(
  key: LLMKeyConfig,
  prompt: string,
  systemInstruction: string | undefined,
  temperature: number,
  maxTokens: number,
  startTime: number
): Promise<ProviderCallResult> {
  const url = key.baseUrl || 'https://api.anthropic.com/v1/messages';
  const model = key.model || 'claude-3-5-sonnet-20241022';

  const body: any = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }]
  };

  if (systemInstruction) {
    body.system = systemInstruction;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': key.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'dangerously-allow-browser': 'true' // Client-side direct call
    },
    body: JSON.stringify(body)
  });

  const latencyMs = Date.now() - startTime;

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Anthropic API error: ${res.status}`;
    throw new ProviderAPIError(msg, res.status);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  const promptTokens = data?.usage?.input_tokens || Math.ceil(prompt.length / 4);
  const completionTokens = data?.usage?.output_tokens || Math.ceil(text.length / 4);

  return { text, promptTokens, completionTokens, latencyMs };
}

// -----------------------------------------------------------------------------
// OpenAI / Custom Endpoint Adapter
// -----------------------------------------------------------------------------
async function callOpenAICompatible(
  key: LLMKeyConfig,
  prompt: string,
  systemInstruction: string | undefined,
  temperature: number,
  maxTokens: number,
  startTime: number
): Promise<ProviderCallResult> {
  const baseUrl = key.baseUrl || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const model = key.model || 'gpt-4o-mini';

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  const latencyMs = Date.now() - startTime;

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `OpenAI-compatible error: ${res.status}`;
    throw new ProviderAPIError(msg, res.status);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const promptTokens = data?.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
  const completionTokens = data?.usage?.completion_tokens || Math.ceil(text.length / 4);

  return { text, promptTokens, completionTokens, latencyMs };
}

// -----------------------------------------------------------------------------
// Offline Simulation Engine (for testing, benchmarks & zero-auth environments)
// -----------------------------------------------------------------------------
async function simulateOfflineResponse(
  key: LLMKeyConfig,
  prompt: string,
  startTime: number
): Promise<ProviderCallResult> {
  // Simulate network latency (between 80ms and 240ms)
  await new Promise(r => setTimeout(r, Math.floor(80 + Math.random() * 160)));

  const latencyMs = Date.now() - startTime;
  const promptTokens = Math.max(12, Math.ceil(prompt.length / 4));
  
  let simulatedText = `[Olmera AI (${key.name} - ${key.model})]: `;

  const lower = prompt.toLowerCase();
  if (lower.includes('hba1c') || lower.includes('glucose') || lower.includes('sugar')) {
    simulatedText += 'Clinical glycemic analysis indicates stability. Maintain balanced complex carbohydrates, moderate daily physical activity, and follow prescribed oral hypoglycemic schedules.';
  } else if (lower.includes('headache') || lower.includes('fever')) {
    simulatedText += 'Ensure hydration with 500-1000ml fluids and rest in a cool, dark room. If temperature persists >101°F for 48 hours, seek outpatient clinical evaluation.';
  } else if (lower.includes('prescription') || lower.includes('medication')) {
    simulatedText += 'Medication routine successfully scheduled. Remember to take morning doses after breakfast and evening doses after dinner to minimize gastric irritation.';
  } else {
    simulatedText += 'Health guidance processed. Continue maintaining balanced hydration, adequate sleep, and regular biometric tracking in your Olmera Health Vault.';
  }

  const completionTokens = Math.max(35, Math.ceil(simulatedText.length / 4));

  return {
    text: simulatedText,
    promptTokens,
    completionTokens,
    latencyMs
  };
}
