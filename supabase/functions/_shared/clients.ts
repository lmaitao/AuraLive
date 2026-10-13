import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { HttpError } from './errors.ts';

export function getEnvOrThrow(name: string): string {
  const val = Deno.env.get(name);
  if (!val) {
    throw new HttpError(`Falta variable de entorno requerida en el servidor: ${name}`, 500, 'MISSING_ENV');
  }
  return val;
}

export function createAdminClient(): SupabaseClient {
  const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
  const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createUserClient(req: Request): SupabaseClient {
  const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
  const anonKey = getEnvOrThrow('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    throw new HttpError('Falta encabezado Authorization Bearer token.', 401, 'UNAUTHORIZED');
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
