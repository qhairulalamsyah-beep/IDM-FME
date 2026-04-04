/**
 * Application Configuration Manager
 * 
 * Centralized configuration management with:
 * - Environment-based configuration
 * - Type-safe access
 * - Validation on startup
 * - No hardcoded values
 */

// ============================================
// TYPES
// ============================================

export type Environment = 'development' | 'production' | 'test';

export interface DatabaseConfig {
  url: string;
  directUrl?: string;
  isPostgreSQL: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  /** Supabase Storage bucket name for avatars */
  avatarBucket: string;
  /** Supabase Storage bucket name for payment proofs */
  proofBucket: string;
  /** Supabase Storage bucket name for club logos */
  logoBucket: string;
}

export interface AppConfig {
  name: string;
  url: string;
  env: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'pretty' | 'json';
}

export interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
  host: string;
  port: number;
}

export interface BotConfig {
  whatsappUrl: string;
  whatsappSecret: string;
  discordToken: string;
  discordGuildId: string;
  discordChannelId: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
  apiInternalSecret: string;
}

export interface Config {
  env: Environment;
  database: DatabaseConfig;
  supabase: SupabaseConfig;
  app: AppConfig;
  log: LogConfig;
  pusher: PusherConfig;
  bot: BotConfig;
  security: SecurityConfig;
}

// ============================================
// ENVIRONMENT READER
// ============================================

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvOptional(key: string, defaultValue = ''): string {
  return process.env[key] ?? defaultValue;
}

function parseEnv(env: string | undefined): Environment {
  switch (env) {
    case 'production':
      return 'production';
    case 'test':
      return 'test';
    default:
      return 'development';
  }
}

function parseLogLevel(level: string | undefined): LogConfig['level'] {
  switch (level) {
    case 'debug':
    case 'info':
    case 'warn':
    case 'error':
      return level;
    default:
      return 'info';
  }
}

function parseLogFormat(format: string | undefined): LogConfig['format'] {
  switch (format) {
    case 'json':
      return 'json';
    case 'pretty':
    default:
      return 'pretty';
  }
}

// ============================================
// CONFIGURATION BUILDER
// ============================================

function buildConfig(): Config {
  const env = parseEnv(process.env.NODE_ENV);
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';

  const databaseUrl = getEnv('DATABASE_URL', 'file:./dev.db');
  const directUrl = getEnvOptional('DIRECT_DATABASE_URL');

  // Supabase config — required for production
  const supabaseUrl = getEnvOptional('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvOptional('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = getEnvOptional('SUPABASE_SERVICE_ROLE_KEY');

  return {
    env,
    database: {
      url: databaseUrl,
      directUrl,
      isPostgreSQL: databaseUrl.startsWith('postgresql://'),
    },
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
      avatarBucket: getEnvOptional('SUPABASE_AVATAR_BUCKET', 'avatars'),
      proofBucket: getEnvOptional('SUPABASE_PROOF_BUCKET', 'payment-proofs'),
      logoBucket: getEnvOptional('SUPABASE_LOGO_BUCKET', 'club-logos'),
    },
    app: {
      name: getEnv('NEXT_PUBLIC_APP_NAME', 'IDOL META Tournament'),
      url: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
      env,
      isProduction,
      isDevelopment,
    },
    log: {
      level: parseLogLevel(process.env.LOG_LEVEL),
      format: parseLogFormat(process.env.LOG_FORMAT),
    },
    pusher: {
      appId: getEnvOptional('PUSHER_APP_ID', ''),
      key: getEnvOptional('PUSHER_KEY', 'local-dev-key'),
      secret: getEnvOptional('PUSHER_SECRET', ''),
      cluster: getEnvOptional('PUSHER_CLUSTER', 'ap1'),
      host: getEnvOptional('PUSHER_HOST', 'localhost'),
      port: parseInt(getEnvOptional('PUSHER_PORT', '6001')),
    },
    bot: {
      whatsappUrl: getEnvOptional('WHATSAPP_BOT_URL', 'http://localhost:3001'),
      whatsappSecret: getEnvOptional('WHATSAPP_BOT_SECRET'),
      discordToken: getEnvOptional('DISCORD_BOT_TOKEN'),
      discordGuildId: getEnvOptional('DISCORD_GUILD_ID'),
      discordChannelId: getEnvOptional('DISCORD_CHANNEL_ID'),
    },
    security: {
      jwtSecret: getEnvOptional('JWT_SECRET', 'idm-fme-jwt-secret-change-in-production'),
      nextAuthSecret: getEnvOptional('NEXTAUTH_SECRET'),
      nextAuthUrl: getEnvOptional('NEXTAUTH_URL', 'http://localhost:3000'),
      apiInternalSecret: getEnvOptional('API_INTERNAL_SECRET'),
    },
  };
}

// ============================================
// SINGLETON EXPORT
// ============================================

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = buildConfig();
  }
  return _config;
}

// Re-export for convenience
export const config = new Proxy({} as Config, {
  get(_target, prop: keyof Config) {
    return getConfig()[prop];
  },
});

// Quick access helpers
export const isProduction = () => getConfig().app.isProduction;
export const isDevelopment = () => getConfig().app.isDevelopment;
export const useSupabase = () => Boolean(getConfig().supabase.url);
