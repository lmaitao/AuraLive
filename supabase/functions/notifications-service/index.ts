import {
  handleCors,
  jsonResponse,
  errorResponse,
  HttpError,
  requireAuth,
  getEnvOrThrow,
} from '../_shared/index.ts';

function buildCyberEmailHtml(title: string, badgeText: string, bodyHtml: string, accentColor = '#00E5FF'): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - AURA LIVE</title>
</head>
<body style="background-color:#020205;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:24px;color:#ffffff;">
  <div style="max-width:540px;margin:0 auto;background-color:#101018;border:2px solid ${accentColor};border-radius:22px;padding:30px;">
    <div style="text-align:center;font-size:26px;font-weight:900;color:${accentColor};letter-spacing:4px;margin-bottom:16px;">⚡ AURA LIVE</div>
    <h2 style="text-align:center;color:#ffffff;margin-top:0;">${title}</h2>
    <div style="background:rgba(255,255,255,0.05);border:1px solid ${accentColor};border-radius:14px;text-align:center;padding:16px;margin:20px 0;">
      <div style="font-size:18px;font-weight:900;color:${accentColor};">${badgeText}</div>
    </div>
    <div style="font-size:14px;color:#9CA3AF;line-height:1.6;text-align:center;">
      ${bodyHtml}
    </div>
    <div style="text-align:center;margin-top:28px;font-size:11px;color:#6B7280;border-top:1px solid #1E293B;padding-top:14px;">
      © 2026 AURA LIVE Ecosystem. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { user } = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const type = (body.type as string) || 'welcome';
    const recipientEmail = (body.to as string) || user.email;

    if (!recipientEmail) {
      throw new HttpError('No se especificó correo electrónico destinatario.', 400);
    }

    const resendApiKey = getEnvOrThrow('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'AuraLive <noreply@auralive.app>';

    let subject = 'Notificación de AURA LIVE';
    let html = '';

    if (type === 'welcome') {
      const userName = (body.user_name as string) || user.user_metadata?.full_name || 'Usuario Aura';
      const bonusCoins = Number(body.bonus_coins ?? 50);
      subject = '¡Bienvenido a AURA LIVE! Identidad Verificada 🎉';
      html = buildCyberEmailHtml(
        '¡Bienvenida Humana Verificada! 🎉',
        `+${bonusCoins} Monedas Virtuales Acreditadas 🎁`,
        `Hola <strong>${userName}</strong>, tu identidad biométrica ha sido verificada exitosamente en AURA LIVE.`,
        '#FF007F'
      );
    } else if (type === 'password_changed') {
      subject = 'Contraseña Actualizada Exitosamente — AURA LIVE';
      html = buildCyberEmailHtml(
        'Contraseña Actualizada 🛡️',
        '✓ CAMBIO CONFIRMADO Y SEGURO',
        `Te notificamos que la contraseña de tu cuenta (<strong>${recipientEmail}</strong>) ha sido actualizada satisfactoriamente.`,
        '#22C55E'
      );
    } else if (type === 'withdrawal_status') {
      const statusLabel = body.status === 'completed' ? 'APROBADO Y PAGADO ✅' : 'RECHAZADO / REEMBOLSADO ⚠️';
      const usdAmount = body.usd_amount || '0.00';
      subject = `Estado de tu Retiro ($${usdAmount} USD) — AURA LIVE`;
      html = buildCyberEmailHtml(
        'Actualización de Retiro 💸',
        statusLabel,
        `Tu solicitud de retiro por <strong>$${usdAmount} USD</strong> ha cambiado de estado. ${body.notes ? `<br/>Nota: ${body.notes}` : ''}`,
        body.status === 'completed' ? '#22C55E' : '#F59E0B'
      );
    } else {
      subject = (body.subject as string) || subject;
      html = buildCyberEmailHtml(
        subject,
        (body.badge as string) || 'AURA LIVE',
        (body.message as string) || 'Tienes una nueva notificación en tu cuenta de AuraLive.'
      );
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      throw new HttpError(resendData?.message || 'Error enviando correo mediante Resend.', 502);
    }

    return jsonResponse({
      success: true,
      email_id: resendData.id,
    });
  } catch (err) {
    return errorResponse(err);
  }
});
