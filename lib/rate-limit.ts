import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const limit = parseInt(process.env.FREE_DAILY_LIMIT || '5', 10);
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, '24 h'),
      prefix: 'AskWomensAI:rl',
    });
  }
  return ratelimit;
}

export async function checkRateLimit(
  identifier: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const rl = getRatelimit();
  if (!rl) {
    // No Redis configured — allow in dev
    return { allowed: true, remaining: 999, reset: 0 };
  }

  const result = await rl.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
