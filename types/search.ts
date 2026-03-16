export type ProviderName = 'chatgpt' | 'gemini' | 'claude' | 'grok';

export type ProviderStatus = 'success' | 'error' | 'timeout' | 'disabled';

export type SearchStatus = 'success' | 'partial_failure' | 'failure' | 'rate_limited';

export interface ProviderResult {
  provider: ProviderName;
  label: string;
  model: string;
  status: ProviderStatus;
  text?: string;
  latencyMs?: number;
  promptTokensEst?: number;
  completionTokensEst?: number;
  costEstimate?: number;
  errorMessage?: string;
}

export interface CompiledResult {
  bestAnswer: string;
  consensus: string[];
  disagreements: string[];
  notes: string;
  synthesisModel: string;
}

export interface SearchResponse {
  requestId: string;
  status: SearchStatus;
  query: string;
  compiled: CompiledResult;
  providers: ProviderResult[];
  totalLatencyMs?: number;
}

export interface SearchRequest {
  query: string;
}
