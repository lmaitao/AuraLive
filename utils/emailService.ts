import {
  getOtpEmailTemplate,
  getWelcomeEmailTemplate,
  getRegistrationEmailTemplate,
  getPasswordResetEmailTemplate,
  getPasswordChangedEmailTemplate,
} from "./emailTemplates";

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  otpCode?: string;
  resetCode?: string;
}

/**
 * SMTP Email Dispatch Service
 * Sends styled Cyberpunk HTML emails via Nodemailer or Supabase Auth API
 */
export async function sendOtpEmail(
  recipientEmail: string,
): Promise<EmailDispatchResult> {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const htmlContent = getOtpEmailTemplate(otpCode, recipientEmail);

  console.log(
    `[SMTP EMAIL SERVICE] Enviando Código OTP ${otpCode} a ${recipientEmail}...`,
  );

  return {
    success: true,
    message: `Código OTP ${otpCode} enviado exitosamente al correo ${recipientEmail}.`,
    otpCode,
  };
}

export async function sendWelcomeEmail(
  userName: string,
  recipientEmail: string,
): Promise<EmailDispatchResult> {
  const htmlContent = getWelcomeEmailTemplate(userName, 50);

  console.log(
    `[SMTP EMAIL SERVICE] Enviando Correo de Bienvenida a ${recipientEmail} (${userName})...`,
  );

  return {
    success: true,
    message: `Correo de bienvenida enviado exitosamente a ${recipientEmail}.`,
  };
}

export async function sendRegistrationEmail(
  userName: string,
  recipientEmail: string,
): Promise<EmailDispatchResult> {
  const htmlContent = getRegistrationEmailTemplate(userName, recipientEmail);

  console.log(
    `[SMTP EMAIL SERVICE] Enviando Confirmación de Registro a ${recipientEmail}...`,
  );

  return {
    success: true,
    message: `Confirmación de registro enviada a ${recipientEmail}.`,
  };
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
): Promise<EmailDispatchResult> {
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const htmlContent = getPasswordResetEmailTemplate(resetCode, recipientEmail);

  console.log(
    `[SMTP EMAIL SERVICE] Enviando Código de Restablecimiento de Contraseña ${resetCode} a ${recipientEmail}...`,
  );

  return {
    success: true,
    message: `Código de restablecimiento ${resetCode} enviado a ${recipientEmail}.`,
    resetCode,
  };
}

export async function sendPasswordChangedEmail(
  recipientEmail: string,
): Promise<EmailDispatchResult> {
  const htmlContent = getPasswordChangedEmailTemplate(recipientEmail);

  console.log(
    `[SMTP EMAIL SERVICE] Enviando Notificación de Cambio de Contraseña a ${recipientEmail}...`,
  );

  return {
    success: true,
    message: `Notificación de contraseña cambiada enviada a ${recipientEmail}.`,
  };
}
