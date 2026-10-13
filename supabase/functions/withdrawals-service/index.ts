import {
  handleCors,
  jsonResponse,
  errorResponse,
  HttpError,
  requireAuth,
  requireSuperAdmin,
} from '../_shared/index.ts';

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'request') {
      const { userClient } = await requireAuth(req);
      const coinAmount = Number(body.coin_amount);
      const paymentMethod = (body.payment_method as string || '').trim();
      const accountDetails = body.account_details || {};
      const applicantType = body.applicant_type === 'agency' ? 'agency' : 'streamer';

      if (!Number.isFinite(coinAmount) || coinAmount < 10000) {
        throw new HttpError('El monto mínimo de retiro es de 10,000 Auras ($10.00 USD).', 400);
      }

      if (!paymentMethod) {
        throw new HttpError('Selecciona un método de pago válido.', 400);
      }

      const { data, error } = await userClient.rpc('request_withdrawal', {
        p_coin_amount: coinAmount,
        p_payment_method: paymentMethod,
        p_account_details: accountDetails,
        p_applicant_type: applicantType,
      });

      if (error) {
        throw new HttpError(error.message, 400);
      }

      return jsonResponse({
        success: true,
        ...data,
      });
    }

    if (action === 'approve' || action === 'reject') {
      const { adminClient } = await requireSuperAdmin(req);
      const withdrawalId = body.withdrawal_id as string;
      const adminNotes = (body.admin_notes as string) || null;

      if (!withdrawalId) {
        throw new HttpError('Falta withdrawal_id.', 400);
      }

      const { data, error } = await adminClient.rpc('review_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_action: action,
        p_admin_notes: adminNotes,
      });

      if (error) {
        throw new HttpError(error.message, 400);
      }

      return jsonResponse({
        success: true,
        ...data,
      });
    }

    throw new HttpError(`Acción inválida en withdrawals-service: ${action}`, 400);
  } catch (err) {
    return errorResponse(err);
  }
});
