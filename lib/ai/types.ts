import type { ProviderResult } from '@/types/search';

export interface AiProvider {
  run(query: string): Promise<ProviderResult>;
}

export const PROVIDER_TIMEOUT_MS = 30000;

export const PROVIDER_MAX_TOKENS = 800;

export const SYNTHESIS_MAX_TOKENS = 1200;
