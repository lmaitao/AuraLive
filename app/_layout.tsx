import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';
import { View, Platform, Alert } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { AuraLaunchSplash } from '../components/AuraLaunchSplash';

export default function RootLayout() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 0. Solicitud de Permisos de Producción
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        try {
          const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
          const { status: audioStatus } = await Audio.requestPermissionsAsync();
          
          // Pedir permisos de galería de forma segura para cargar imágenes/videos
          try {
            const ImagePicker = require('expo-image-picker');
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          } catch (imgError) {
            console.warn('ImagePicker permission error:', imgError);
          }
          
          if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
            Alert.alert(
              'Permisos Requeridos ⚠️',
              'AuraLive necesita acceso a tu cámara y micrófono para transmitir en vivo y biometría 3D.'
            );
          }
        } catch (e) {
          console.warn('Error solicitando permisos:', e);
        }
      }
    }
    requestPermissions();

    // 1. Bloqueo de Captura de Pantalla (Privacidad y DRM) - Solo Móvil
    if (Platform.OS !== 'web') {
      ScreenCapture.preventScreenCaptureAsync().catch((err) => console.log('ScreenCapture prevent failed:', err));
    }

    // 2. Enrutamiento Estricto basado en Plataforma
    if (Platform.OS === 'web') {
      if (pathname !== '/') {
        setTimeout(() => {
          router.replace('/');
        }, 0);
      }
    }
  }, [pathname]);

  return (
    <View style={{ flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : '100%', backgroundColor: theme.bg }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AuraLaunchSplash />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="live/[id]" />
        <Stack.Screen name="shop" />
        <Stack.Screen name="agency/dashboard" />
        <Stack.Screen name="admin/dashboard" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
    </View>
  );
}
