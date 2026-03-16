import { z } from 'zod';

export const searchSchema = z.object({
  query: z
    .string()
    .min(8, 'Question must be at least 8 characters')
    .max(1500, 'Question must be under 1,500 characters')
    .transform((s) => s.trim()),
});

export type SearchInput = z.infer<typeof searchSchema>;
