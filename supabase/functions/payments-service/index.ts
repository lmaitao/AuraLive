import {
  handleCors,
  jsonResponse,
  errorResponse,
  HttpError,
  requireAuth,
  createAdminClient,
  getEnvOrThrow,
} from '../_shared/index.ts';

function base64UrlEncode(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getGooglePlayAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${claimSet}`;
  const keyData = pemToArrayBuffer(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(signatureBuffer))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new HttpError(`Error autenticando con Google Play API: ${errText}`, 502);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { user } = await requireAuth(req);
    const adminClient = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'create_stripe_checkout') {
      const packageId = body.package_id as string;
      const successUrl = (body.success_url as string) || 'auralive://shop?status=success';
      const cancelUrl = (body.cancel_url as string) || 'auralive://shop?status=cancelled';

      if (!packageId) {
        throw new HttpError('Falta package_id.', 400);
      }

      const { data: pkg, error: pkgErr } = await adminClient
        .from('coin_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .single();

      if (pkgErr || !pkg) {
        throw new HttpError(`Paquete de monedas no encontrado: ${packageId}`, 404);
      }

      const stripeSecretKey = getEnvOrThrow('STRIPE_SECRET_KEY');
      const totalCoins = Number(pkg.coins) + Number(pkg.bonus_coins);
      const unitAmountCents = Math.round(Number(pkg.usd_price) * 100);

      const form = new URLSearchParams();
      form.append('mode', 'payment');
      form.append('client_reference_id', user.id);
      if (user.email) form.append('customer_email', user.email);
      form.append('success_url', successUrl);
      form.append('cancel_url', cancelUrl);
      form.append('line_items[0][quantity]', '1');
      form.append('line_items[0][price_data][currency]', 'usd');
      form.append('line_items[0][price_data][unit_amount]', String(unitAmountCents));
      form.append('line_items[0][price_data][product_data][name]', `${pkg.name} — ${totalCoins.toLocaleString()} Monedas AuraLive`);
      form.append(
        'line_items[0][price_data][product_data][description]',
        `${Number(pkg.coins).toLocaleString()} monedas + ${Number(pkg.bonus_coins).toLocaleString()} bonus`
      );
      form.append('metadata[user_id]', user.id);
      form.append('metadata[package_id]', pkg.id);
      form.append('metadata[coins]', String(totalCoins));

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      const sessionData = await stripeRes.json();
      if (!stripeRes.ok) {
        throw new HttpError(sessionData?.error?.message || 'No se pudo crear la sesión de pago en Stripe.', 502);
      }

      return jsonResponse({
        success: true,
        session_id: sessionData.id,
        checkout_url: sessionData.url,
      });
    }

    if (action === 'verify_google_play') {
      const packageId = body.package_id as string;
      const productId = body.product_id as string;
      const purchaseToken = body.purchase_token as string;
      const androidPackageName = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') || 'com.auralive.app';

      if (!packageId || !purchaseToken) {
        throw new HttpError('Faltan package_id o purchase_token para verificar compra.', 400);
      }

      const { data: pkg, error: pkgErr } = await adminClient
        .from('coin_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .single();

      if (pkgErr || !pkg) {
        throw new HttpError(`Paquete de monedas inválido: ${packageId}`, 404);
      }

      const expectedSku = productId || pkg.google_play_product_id || `com.auralive.coins.${pkg.usd_price}usd`;
      const saJson = getEnvOrThrow('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
      const accessToken = await getGooglePlayAccessToken(saJson);

      const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
        androidPackageName
      )}/purchases/products/${encodeURIComponent(expectedSku)}/tokens/${encodeURIComponent(purchaseToken)}`;

      const gpRes = await fetch(verifyUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!gpRes.ok) {
        const gpErrText = await gpRes.text();
        throw new HttpError(`Verificación de Google Play fallida: ${gpErrText}`, 400);
      }

      const purchaseInfo = await gpRes.json();
      // purchaseState === 0 significa Purchased
      if (purchaseInfo.purchaseState !== 0) {
        throw new HttpError('El recibo de Google Play no está en estado pagado.', 400);
      }

      const { data: creditData, error: creditErr } = await adminClient.rpc('credit_coin_purchase', {
        p_user_id: user.id,
        p_package_id: pkg.id,
        p_provider: 'google_play',
        p_external_tx_id: purchaseToken,
        p_amount_usd: pkg.usd_price,
      });

      if (creditErr) {
        throw new HttpError(creditErr.message, 400);
      }

      return jsonResponse({
        success: true,
        ...creditData,
      });
    }

    throw new HttpError(`Acción no soportada en payments-service: ${action}`, 400);
  } catch (err) {
    return errorResponse(err);
  }
});
