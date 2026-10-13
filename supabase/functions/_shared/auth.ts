import { User } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { createAdminClient, createUserClient } from './clients.ts';
import { HttpError } from './errors.ts';

export async function requireAuth(req: Request): Promise<{ user: User; userClient: ReturnType<typeof createUserClient> }> {
  const userClient = createUserClient(req);
  const { data: { user }, error } = await userClient.auth.getUser();

  if (error || !user) {
    throw new HttpError('Sesión inválida o expirada.', 401, 'UNAUTHORIZED');
  }

  return { user, userClient };
}

export async function requireSuperAdmin(req: Request): Promise<{ user: User; adminClient: ReturnType<typeof createAdminClient> }> {
  const { user } = await requireAuth(req);
  const adminClient = createAdminClient();

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('is_superadmin, is_banned')
    .eq('id', user.id)
    .single();

  if (error || !profile?.is_superadmin || profile?.is_banned) {
    throw new HttpError('Acceso denegado: se requieren privilegios de SuperAdmin.', 403, 'FORBIDDEN');
  }

  return { user, adminClient };
}
