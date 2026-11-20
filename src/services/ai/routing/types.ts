/**
 * Olmera Healthcare - Intelligent LLM API Router Types & Schemas
 */

export type LLMProvider = 'gemini' | 'anthropic' | 'openai' | 'nvidia' | 'custom';

export type KeyStatus = 
  | 'HEALTHY'          // Fully operational and within quotas
  | 'DEGRADED'         // Experiencing occasional transient errors
  | 'RATE_LIMITED'     // Hit RPM or TPM rate limit (in cooldown)
  | 'QUOTA_EXHAUSTED'  // Hit daily or monthly budget cap
  | 'DISABLED';        // Manually disabled by administrator

export type RoutingStrategy = 
  | 'priority_weighted' // Primary tier first, weighted by remaining capacity (default)
  | 'least_utilized'    // Route to key with lowest active TPM consumption
  | 'round_robin'       // Sequential distribution among eligible keys
  | 'cost_optimized';   // Route to lowest cost-per-token available key

export interface RateLimits {
  rpm: number;          // Requests per minute limit
  tpm: number;          // Tokens per minute limit
  rpd: number;          // Requests per day limit
  tpd?: number;         // Tokens per day limit
}

export interface QuotasAndCost {
  monthlyBudgetUsd?: number;            // Monthly cost threshold in USD
  costPer1kPromptTokens: number;        // USD per 1,000 prompt/input tokens
  costPer1kCompletionTokens: number;    // USD per 1,000 completion/output tokens
}

export interface LLMKeyConfig {
  id: string;                           // Unique identifier (e.g., 'gemini-prod-1')
  name: string;                         // Human-readable label
  provider: LLMProvider;                // Provider type
  apiKey: string;                       // API key secret (stored locally)
  baseUrl?: string;                     // Optional custom API endpoint base URL
  model: string;                        // Default model (e.g., 'gemini-1.5-flash')
  priority: number;                     // Priority Tier: 1 (Primary), 2 (Secondary), 3 (Emergency)
  weight: number;                       // Weight for load distribution within the tier (1-10)
  rateLimits: RateLimits;               // Real-time limits
  quotas: QuotasAndCost;                // Budget & pricing definition
  enabled: boolean;                     // Master active toggle
  tags?: string[];                      // Tags (e.g. ['clinical', 'general', 'ocr'])
}

export interface KeyRealtimeMetrics {
  keyId: string;
  status: KeyStatus;
  statusReason?: string;
  requestsInCurrentMinute: number;
  tokensInCurrentMinute: number;
  requestsToday: number;
  tokensToday: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUsd: number;
  lastUsedAt?: string;
  cooldownUntil?: string;               // ISO timestamp of cooldown expiration
  consecutiveErrors: number;
  averageLatencyMs: number;
  lastError?: {
    statusCode?: number;
    message: string;
    timestamp: string;
  };
}

export interface RouterExecutionRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  taskType?: 'chat' | 'clinical_summary' | 'prescription_ocr' | 'emergency_triage';
  preferredProvider?: LLMProvider;
  requiredTier?: number;
}

export interface RouterExecutionResponse {
  content: string;
  keyUsed: {
    id: string;
    name: string;
    provider: LLMProvider;
    model: string;
    priority: number;
  };
  metrics: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  };
  routingTrace: {
    attempts: number;
    failovers: Array<{
      keyId: string;
      reason: string;
      statusCode?: number;
    }>;
    strategyUsed: RoutingStrategy;
  };
}

export interface RouterAuditLogEntry {
  id: string;
  timestamp: string;
  keyId: string;
  provider: LLMProvider;
  model: string;
  taskType: string;
  status: 'SUCCESS' | 'FAILOVER' | 'EXHAUSTED';
  latencyMs: number;
  tokens: number;
  costUsd: number;
  failoverReason?: string;
}

export interface RouterSystemHealth {
  activeKeysCount: number;
  totalConfiguredKeys: number;
  healthyKeys: number;
  rateLimitedKeys: number;
  exhaustedKeys: number;
  systemRPM: number;
  systemTPM: number;
  totalSpendTodayUsd: number;
  lifetimeTokens: number;
  activeStrategy: RoutingStrategy;
}
