import { useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  subtext: string;
  accentCyan: string;
  accentMagenta: string;
  accentGold: string;
  primaryButton: string;
}

export function useTheme(): ThemeColors {
  // Aura Live: Neo-Cyberpunk Forzado Globalmente (Siempre Oscuro)
  // Se ignora el sistema operativo (Claro/Oscuro) para mantener la estética Neon en Web y Móvil idéntica.
  
  return {
    isDark: true,
    bg: '#020205',
    card: '#101018',
    cardBorder: '#00E5FF',
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    accentCyan: '#00E5FF',
    accentMagenta: '#FF007F',
    accentGold: '#FFD700',
    primaryButton: '#00E5FF',
  };
}
