import {
  handleCors,
  jsonResponse,
  errorResponse,
  HttpError,
  requireAuth,
  createAdminClient,
} from '../_shared/index.ts';

function normalizeBirthDate(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  throw new HttpError('Formato de fecha de nacimiento inválido. Usa DD/MM/AAAA o AAAA-MM-DD.', 400);
}

function validateAdultAge(isoDate: string): void {
  const dob = new Date(isoDate);
  if (Number.isNaN(dob.getTime())) {
    throw new HttpError('Fecha de nacimiento inválida.', 400);
  }
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age--;
  }
  if (age < 18) {
    throw new HttpError('Debes ser mayor de 18 años para registrarte en AuraLive.', 403, 'UNDERAGE');
  }
}

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { user } = await requireAuth(req);
    const adminClient = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'complete_onboarding' || action === 'register_profile') {
      const gender = body.gender === 'male' ? 'male' : 'female';
      const fullName = (body.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario Aura').trim();
      const avatarUrl = body.avatar_url || user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
      const rawDob = body.birth_date as string | undefined;

      let formattedDate: string | null = null;
      if (rawDob) {
        formattedDate = normalizeBirthDate(rawDob);
        validateAdultAge(formattedDate);
      }

      const username = (
        body.username ||
        (user.email ? `${user.email.split('@')[0]}_${user.id.slice(0, 4)}` : `usuario_${user.id.slice(0, 4)}`)
      ).toLowerCase();

      const { data: profile, error: upsertErr } = await adminClient
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email || `${username}@auralive.app`,
            username,
            full_name: fullName,
            avatar_url: avatarUrl,
            gender,
            ...(formattedDate ? { birth_date: formattedDate } : {}),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (upsertErr) {
        throw new HttpError(upsertErr.message, 400);
      }

      // Garantizar que exista billetera con bono inicial
      const { data: existingWallet } = await adminClient
        .from('wallets')
        .select('id, coin_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingWallet) {
        await adminClient.from('wallets').insert({
          user_id: user.id,
          coin_balance: 1000,
          aura_balance: 0,
          clover_balance: 1,
        });

        await adminClient.from('wallet_transactions').insert({
          user_id: user.id,
          currency: 'coins',
          amount: 1000,
          balance_after: 1000,
          type: 'welcome_bonus',
          metadata: { source: 'account-service' },
        });
      }

      return jsonResponse({
        success: true,
        profile,
      });
    }

    if (action === 'join_agency') {
      const inviteCode = (body.invite_code || '').trim();
      if (!inviteCode) {
        throw new HttpError('Ingresa un código o ID de agencia válido.', 400);
      }

      const { data: agency } = await adminClient
        .from('agencies')
        .select('id, name, status')
        .or(`invite_code.ilike.${inviteCode},id.eq.${/^[0-9a-f-]{36}$/i.test(inviteCode) ? inviteCode : '00000000-0000-0000-0000-000000000000'}`)
        .maybeSingle();

      if (!agency || agency.status !== 'approved') {
        throw new HttpError('No se encontró una Agencia Oficial aprobada con ese código.', 404);
      }

      const { error: linkErr } = await adminClient
        .from('profiles')
        .update({
          agency_id: agency.id,
          agency_request_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (linkErr) throw new HttpError(linkErr.message, 400);

      return jsonResponse({
        success: true,
        agency_id: agency.id,
        agency_name: agency.name,
        status: 'pending',
      });
    }

    if (action === 'delete_account') {
      // Ejecutar borrado en cascada de todas las tablas de negocio
      const { error: rpcErr } = await adminClient.rpc('delete_user_account', {
        p_user_id: user.id,
      });

      if (rpcErr) {
        console.warn('[account-service] Fallback deleteUser after RPC warning:', rpcErr.message);
      }

      // Eliminar usuario del motor de Auth de Supabase
      const { error: authDelErr } = await adminClient.auth.admin.deleteUser(user.id);
      if (authDelErr && !authDelErr.message.toLowerCase().includes('not found')) {
        throw new HttpError(`No se pudo eliminar la cuenta de autenticación: ${authDelErr.message}`, 500);
      }

      return jsonResponse({
        success: true,
        message: 'Cuenta y datos asociados eliminados permanentemente.',
      });
    }

    throw new HttpError(`Acción no reconocida en account-service: ${action}`, 400);
  } catch (err) {
    return errorResponse(err);
  }
});
