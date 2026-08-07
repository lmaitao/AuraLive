/**
 * Plantillas HTML de Correo Electrónico Estilizadas Neo-Cyberpunk para AURA LIVE
 */

export function getOtpEmailTemplate(otpCode: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación - AURA LIVE</title>
  <style>
    body { background-color: #020205; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #ffffff; }
    .container { max-width: 550px; margin: 0 auto; background-color: #101018; border: 2px solid #00E5FF; border-radius: 20px; padding: 30px; box-shadow: 0 0 25px rgba(0,229,255,0.3); }
    .logo { text-align: center; font-size: 28px; font-weight: 900; color: #00E5FF; letter-spacing: 4px; margin-bottom: 20px; }
    .code-box { background: rgba(0,229,255,0.1); border: 2px dashed #00E5FF; border-radius: 15px; text-align: center; padding: 20px; margin: 25px 0; }
    .code { font-size: 38px; font-weight: 900; color: #FFD700; letter-spacing: 8px; }
    .text { font-size: 14px; color: #9CA3AF; line-height: 1.6; text-align: center; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #6B7280; border-t: 1px solid #1E293B; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ AURA LIVE</div>
    <h2 style="text-align: center; color: #ffffff; margin-top: 0;">Código de Verificación OTP</h2>
    <p class="text">Hola, estás a un paso de acceder a la plataforma Neo-Cyberpunk de streaming y chat en vivo. Usa el siguiente código seguro de 6 dígitos para validar tu cuenta (<strong>${email}</strong>):</p>
    
    <div class="code-box">
      <div class="code">${otpCode}</div>
    </div>
    
    <p class="text">Este código expira en 10 minutos. No compartas este código con nadie por razones de seguridad.</p>
    
    <div class="footer">
      © 2026 AURA LIVE Ecosystem. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `;
}

export function getWelcomeEmailTemplate(userName: string, bonusCoins: number = 50): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a AURA LIVE!</title>
  <style>
    body { background-color: #020205; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #ffffff; }
    .container { max-width: 550px; margin: 0 auto; background-color: #101018; border: 2px solid #FF007F; border-radius: 20px; padding: 30px; box-shadow: 0 0 25px rgba(255,0,127,0.3); }
    .logo { text-align: center; font-size: 28px; font-weight: 900; color: #FF007F; letter-spacing: 4px; margin-bottom: 20px; }
    .bonus-card { background: rgba(255,215,0,0.15); border: 2px solid #FFD700; border-radius: 15px; text-align: center; padding: 20px; margin: 25px 0; }
    .bonus-amount { font-size: 32px; font-weight: 900; color: #FFD700; }
    .btn { display: inline-block; background-color: #00E5FF; color: #020205; font-weight: 900; padding: 14px 30px; border-radius: 50px; text-decoration: none; text-transform: uppercase; margin-top: 15px; }
    .text { font-size: 14px; color: #9CA3AF; line-height: 1.6; text-align: center; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #6B7280; border-t: 1px solid #1E293B; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">👑 AURA LIVE</div>
    <h2 style="text-align: center; color: #ffffff; margin-top: 0;">¡Bienvenida Humana Verificada! 🎉</h2>
    <p class="text">Hola <strong>${userName}</strong>, tu cuenta ha sido aprobada exitosamente mediante nuestro sistema de Reconocimiento Facial Biométrico 3D.</p>
    
    <div class="bonus-card">
      <div style="font-size: 14px; color: #FFD700; font-weight: bold;">BONO DE BIENVENIDA ACREDITADO</div>
      <div class="bonus-amount">+${bonusCoins} Monedas Virtuales 🎁</div>
    </div>
    
    <p class="text">Ya puedes ingresar a las salas en vivo, activar tu cámara WebRTC, chatear a 60 FPS sin lag y enviar regalos animados.</p>
    
    <div style="text-align: center;">
      <a href="http://localhost:8080" class="btn">Entrar a AURA LIVE 📺</a>
    </div>
    
    <div class="footer">
      © 2026 AURA LIVE Ecosystem. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `;
}

export function getRegistrationEmailTemplate(userName: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro de Cuenta - AURA LIVE</title>
  <style>
    body { background-color: #020205; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #ffffff; }
    .container { max-width: 550px; margin: 0 auto; background-color: #101018; border: 2px solid #00E5FF; border-radius: 20px; padding: 30px; box-shadow: 0 0 25px rgba(0,229,255,0.3); }
    .logo { text-align: center; font-size: 28px; font-weight: 900; color: #00E5FF; letter-spacing: 4px; margin-bottom: 20px; }
    .info-box { background: rgba(16,16,24,0.8); border: 1px solid rgba(0,229,255,0.3); border-radius: 12px; padding: 15px; margin: 20px 0; text-align: left; }
    .text { font-size: 14px; color: #9CA3AF; line-height: 1.6; text-align: center; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #6B7280; border-t: 1px solid #1E293B; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ AURA LIVE</div>
    <h2 style="text-align: center; color: #ffffff; margin-top: 0;">Confirmación de Registro</h2>
    <p class="text">Se ha iniciado la creación de tu perfil de usuario en AURA LIVE.</p>
    
    <div class="info-box">
      <div style="color: #00E5FF; font-weight: bold; font-size: 13px;">DETALLES DE LA CUENTA:</div>
      <div style="color: #ffffff; font-size: 13px; margin-top: 5px;">• Nombre: <strong>${userName}</strong></div>
      <div style="color: #ffffff; font-size: 13px; margin-top: 3px;">• Correo: <strong>${email}</strong></div>
      <div style="color: #ffffff; font-size: 13px; margin-top: 3px;">• Estado: <strong>Esperando Verificación Biométrica 3D</strong></div>
    </div>
    
    <p class="text">Si no realizaste este registro, por favor ignora este correo.</p>
    
    <div class="footer">
      © 2026 AURA LIVE Ecosystem. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordResetEmailTemplate(resetCode: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - AURA LIVE</title>
  <style>
    body { background-color: #020205; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #ffffff; }
    .container { max-width: 550px; margin: 0 auto; background-color: #101018; border: 2px solid #FF007F; border-radius: 20px; padding: 30px; box-shadow: 0 0 25px rgba(255,0,127,0.3); }
    .logo { text-align: center; font-size: 28px; font-weight: 900; color: #FF007F; letter-spacing: 4px; margin-bottom: 20px; }
    .code-box { background: rgba(255,0,127,0.1); border: 2px dashed #FF007F; border-radius: 15px; text-align: center; padding: 20px; margin: 25px 0; }
    .code { font-size: 38px; font-weight: 900; color: #00E5FF; letter-spacing: 8px; }
    .text { font-size: 14px; color: #9CA3AF; line-height: 1.6; text-align: center; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #6B7280; border-t: 1px solid #1E293B; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔑 AURA LIVE</div>
    <h2 style="text-align: center; color: #ffffff; margin-top: 0;">Restablecimiento de Contraseña</h2>
    <p class="text">Hemos recibido una solicitud para cambiar la contraseña de tu cuenta (<strong>${email}</strong>). Usa el siguiente código seguro de recuperación:</p>
    
    <div class="code-box">
      <div class="code">${resetCode}</div>
    </div>
    
    <p class="text">Si no solicitaste este cambio, te recomendamos asegurar tu cuenta inmediatamente.</p>
    
    <div class="footer">
      © 2026 AURA LIVE Ecosystem. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordChangedEmailTemplate(email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contraseña Actualizada - AURA LIVE</title>
  <style>
    body { background-color: #020205; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #ffffff; }
    .container { max-width: 550px; margin: 0 auto; background-color: #101018; border: 2px solid #22C55E; border-radius: 20px; padding: 30px; box-shadow: 0 0 25px rgba(34,197,94,0.3); }
    .logo { text-align: center; font-size: 28px; font-weight: 900; color: #22C55E; letter-spacing: 4px; margin-bottom: 20px; }
    .success-card { background: rgba(34,197,94,0.15); border: 1px solid #22C55E; border-radius: 15px; text-align: center; padding: 20px; margin: 25px 0; }
    .text { font-size: 14px; color: #9CA3AF; line-height: 1.6; text-align: center; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #6B7280; border-t: 1px solid #1E293B; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🛡️ AURA LIVE</div>
    <h2 style="text-align: center; color: #ffffff; margin-top: 0;">Contraseña Actualizada Exitosamente</h2>
    <p class="text">Hola, te notificamos que la contraseña de tu cuenta (<strong>${email}</strong>) ha sido modificada satisfactoriamente.</p>
    
    <div class="success-card">
      <div style="color: #22C55E; font-weight: bold; font-size: 16px;">✓ CAMBIO CONFIRMADO Y SEGURO</div>
    </div>
    
    <p class="text">Ya puedes acceder a AURA LIVE usando tu nueva contraseña.</p>
    
    <div class="footer">
      © 2026 AURA LIVE Ecosystem. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `;
}
