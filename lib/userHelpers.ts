// Auxiliar de ayuda para reglas de usuario en Aura Live

export function isNewUser(profile: { created_at?: string; clover_gift_sent?: boolean } | null | undefined): boolean {
  if (!profile) return false;

  // 1. Si ya realizó el regalo de los 3 tréboles, la insignia "NUEVO" desaparece de inmediato
  if (profile.clover_gift_sent === true) {
    return false;
  }

  // 2. Si han transcurrido más de 72 horas desde la fecha de registro, desaparece
  if (profile.created_at) {
    const regTime = new Date(profile.created_at).getTime();
    const diffHours = (Date.now() - regTime) / (1000 * 60 * 60);
    if (diffHours >= 72) {
      return false;
    }
  }

  return true;
}
