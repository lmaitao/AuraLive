import {
  handleCors,
  jsonResponse,
  errorResponse,
  HttpError,
  createAdminClient,
  getEnvOrThrow,
} from '../_shared/index.ts';

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyStripeWebhookSignature(
  rawBody: string,
  sigHeader: string | null,
  webhookSecret: string
): Promise<void> {
  if (!sigHeader) {
    throw new HttpError('Falta encabezado Stripe-Signature.', 400);
  }

  const parts = sigHeader.split(',').reduce<Record<string, string[]>>((acc, item) => {
    const [k, v] = item.trim().split('=');
    if (k && v) {
      acc[k] = acc[k] || [];
      acc[k].push(v);
    }
    return acc;
  }, {});

  const timestamp = parts['t']?.[0];
  const signatures = parts['v1'] || [];

  if (!timestamp || signatures.length === 0) {
    throw new HttpError('Formato de firma Stripe-Signature inválido.', 400);
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (Number.isNaN(ageSeconds) || ageSeconds > 300) {
    throw new HttpError('Firma de Stripe expirada fuera de la ventana de tolerancia.', 400);
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const matched = signatures.some((sig) => timingSafeEqualHex(sig.toLowerCase(), expectedHex.toLowerCase()));
  if (!matched) {
    throw new HttpError('Firma criptográfica de Stripe inválida.', 401);
  }
}

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const webhookSecret = getEnvOrThrow('STRIPE_WEBHOOK_SECRET');
    const rawBody = await req.text();
    await verifyStripeWebhookSignature(rawBody, req.headers.get('stripe-signature'), webhookSecret);

    const event = JSON.parse(rawBody);
    const adminClient = createAdminClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const userId = session?.metadata?.user_id || session?.client_reference_id;
      const packageId = session?.metadata?.package_id;
      const sessionId = session?.id;
      const amountTotal = session?.amount_total ? Number(session.amount_total) / 100 : null;

      if (!userId || !packageId || !sessionId) {
        throw new HttpError('Metadatos incompletos en checkout.session.completed.', 400);
      }

      const { data, error } = await adminClient.rpc('credit_coin_purchase', {
        p_user_id: userId,
        p_package_id: packageId,
        p_provider: 'stripe',
        p_external_tx_id: sessionId,
        p_amount_usd: amountTotal,
      });

      if (error) {
        throw new HttpError(error.message, 400);
      }

      return jsonResponse({ received: true, result: data });
    }

    return jsonResponse({ received: true, ignored_type: event.type });
  } catch (err) {
    return errorResponse(err);
  }
});
