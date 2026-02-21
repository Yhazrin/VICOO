export const DEFAULT_API_BASE = 'http://localhost:8000';

interface ResolveApiBaseOptions {
  platform?: 'web' | 'ios' | 'android' | 'native';
  expoExtraApiBase?: string;
  processEnvApiBase?: string;
}

/**
 * Resolve API base URL with platform-sensitive defaults.
 * - Simulator/emulator can use localhost
 * - Real device should use LAN IP via EXPO_PUBLIC_API_BASE
 */
export function resolveApiBase(options: ResolveApiBaseOptions = {}): string {
  const fromEnv = options.expoExtraApiBase || options.processEnvApiBase;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }

  return DEFAULT_API_BASE;
}
