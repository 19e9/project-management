import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(10),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_EXPIRES_IN: z.coerce.number().int().positive().default(2_592_000),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:3000/api/v1/auth/google/callback'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  /** Shown in admin settings & emails; marketing name */
  PLATFORM_DISPLAY_NAME: z.string().min(1).default('PlanForge PM'),
  /** Shown to operators; optional */
  SUPPORT_EMAIL: z.string().default(''),
  /** When false, POST /auth/register returns 403 (local sign-up) */
  OPEN_REGISTRATION: z
    .string()
    .default('true')
    .transform((v) => !['false', '0', 'no', 'off'].includes(v.toLowerCase())),
  /** When true, POST /auth/register returns 503 */
  MAINTENANCE_MODE: z
    .string()
    .default('false')
    .transform((v) => ['true', '1', 'yes', 'on'].includes(v.toLowerCase())),
  /** Default plan for newly created workspaces */
  DEFAULT_NEW_WORKSPACE_PLAN: z.enum(['free', 'pro', 'enterprise']).default('free'),
  /** List-price assumption for Pro MRR modeling (billing admin + settings) */
  BILLING_PRO_SEAT_USD_MONTHLY: z.coerce.number().positive().default(12),
  /** Optional override for public API base (no trailing slash). If empty, derived from PORT. */
  API_PUBLIC_BASE_URL: z.string().default(''),
  /** Optional build / release label for operators */
  APP_VERSION: z.string().default(''),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function validate(raw: Record<string, unknown>): AppEnv {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      'Invalid environment configuration:\n' +
        JSON.stringify(parsed.error.format(), null, 2),
    );
  }
  return parsed.data;
}

export default function configuration(): AppEnv {
  return validate(process.env);
}
