import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      let code = params.code as string | undefined;
      let access_token = params.access_token as string | undefined;
      let refresh_token = params.refresh_token as string | undefined;

      // Buscar en URL si no estaban en params directos
      if (typeof window !== 'undefined' && window.location) {
        const fullUrl = window.location.href;
        const parsed = QueryParams.getQueryParams(fullUrl);
        if (!code) code = parsed.params.code;
        if (!access_token) access_token = parsed.params.access_token;
        if (!refresh_token) refresh_token = parsed.params.refresh_token;

        if (!code && !access_token && fullUrl.includes('#')) {
          try {
            const hashPart = fullUrl.split('#')[1] || '';
            const hashParams = new URLSearchParams(hashPart);
            if (!code) code = hashParams.get('code') || undefined;
            if (!access_token) access_token = hashParams.get('access_token') || undefined;
            if (!refresh_token) refresh_token = hashParams.get('refresh_token') || undefined;
          } catch (_) {}
        }
      }

      // Intercambiar código por sesión si existe
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) console.warn('Exchange code:', exchangeError.message);
      } else if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) console.warn('Set session:', sessionError.message);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('gender, birth_date')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          const username = user.email
            ? user.email.split('@')[0] + '_' + user.id.slice(0, 4)
            : 'usuario_' + user.id.slice(0, 4);

          const full_name = user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario Aura';
          const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email || '',
            username,
            full_name,
            avatar_url,
            gender: 'unspecified',
            status: 'esperando_biometria',
          }, { onConflict: 'id' });

          router.replace('/auth/login?onboarding=true' as any);
        } else if (!profile.gender || profile.gender === 'unspecified' || !profile.birth_date) {
          router.replace('/auth/login?onboarding=true' as any);
        } else {
          router.replace('/(tabs)/feed' as any);
        }
      } else {
        router.replace('/auth/login' as any);
      }
    } catch (e: any) {
      console.error('Error callback:', e);
      setErrorMsg(e.message || 'Error autenticando');
      setTimeout(() => router.replace('/auth/login' as any), 2000);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#05050A', justifyContent: 'center', alignItems: 'center' }}>
      <LinearGradient colors={['#1F2937', '#05050A']} style={{ padding: 32, borderRadius: 24, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00E5FF" style={{ marginBottom: 16 }} />
        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, marginBottom: 8 }}>Conectando con AuraLive...</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Iniciando tu sesión de forma segura ✨</Text>
        {errorMsg && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 12 }}>{errorMsg}</Text>
        )}
      </LinearGradient>
    </View>
  );
}
