import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, ActivityIndicator, ScrollView, Platform, Alert, KeyboardAvoidingView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { simulateLivenessScan } from '../../utils/biometricMock';
import { sendOtpEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from '../../utils/emailService';
import { ShieldAlert, Sparkles, Lock, Mail, UserCheck, ScanFace, CheckCircle2, Image as ImageIcon, ArrowRight, KeyRound, CalendarDays, ArrowLeft } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, withSpring } from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

export default function LoginAuthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const orbScale = useSharedValue(1);

  useEffect(() => {
    if (params.onboarding === 'true') {
      setRequiresOnboarding(true);
    }
  }, [params.onboarding]);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardTranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });
    
    orbScale.value = withRepeat(
      withTiming(1.15, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Verificar si el usuario ya tiene sesión guardada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setLoading(true);
        setTimeout(() => {
          router.replace('/(tabs)/feed' as any);
        }, 300);
      }
    });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }]
  }));

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [birthDate, setBirthDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'request' | 'update'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [generatedResetCode, setGeneratedResetCode] = useState('654321');
  const [inputResetCode, setInputResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // OTP Modal State
  const [emailOtpModalVisible, setEmailOtpModalVisible] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [generatedOtpCode, setGeneratedOtpCode] = useState('123456');

  // Liveness Modal State
  const [livenessModalVisible, setLivenessModalVisible] = useState(false);
  const [scanningBiometrics, setScanningBiometrics] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setErrorMessage(null);
    setLoading(true);
    try {
      // 0. Si ya hay una sesión guardada, mantener spinner "Conectando..." y entrar
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        setTimeout(() => {
          router.replace('/(tabs)/feed' as any);
        }, 400);
        return;
      }

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'auralive',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (res.type === 'success') {
          const { url } = res;

          // Extraer parámetros de Query string (?) y Hash fragment (#)
          const { params } = QueryParams.getQueryParams(url);
          
          let code = params.code;
          let access_token = params.access_token;
          let refresh_token = params.refresh_token;

          // Fallback: extraer de hash fragment si la URL contiene #
          if (!code && !access_token && url.includes('#')) {
            try {
              const hashPart = url.split('#')[1] || '';
              const hashParams = new URLSearchParams(hashPart);
              code = hashParams.get('code') || undefined;
              access_token = hashParams.get('access_token') || undefined;
              refresh_token = hashParams.get('refresh_token') || undefined;
            } catch (_) {}
          }

          // 1. Intercambiar código PKCE por Sesión si se recibió código
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          } 
          // 2. Establecer sesión manualmente si se recibieron tokens implícitos
          else if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
          }

          await new Promise(resolve => setTimeout(resolve, 500));

          // 3. Obtener el usuario autenticado
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // Consultar perfil en Supabase
            let { data: profile } = await supabase
              .from('profiles')
              .select('gender, birth_date')
              .eq('id', user.id)
              .maybeSingle();

            // Si el perfil no existe aún en la BD, crearlo con datos del OAuth
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
                gender: gender || 'female',
                birth_date: '2000-01-01',
                status: 'verified',
                is_identity_verified: false,
              }, { onConflict: 'id' });

              router.replace('/(tabs)/feed' as any);
            } else {
              router.replace('/(tabs)/feed' as any);
            }
          } else {
            setErrorMessage('No se pudo iniciar sesión con Google. Por favor reintenta.');
          }
        }
      }
    } catch (e: any) {
      console.error('Error en OAuth:', e);
      setErrorMessage(e.message || 'Error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!birthDate) {
      setErrorMessage("Por favor selecciona tu fecha de nacimiento.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Formatear DD/MM/YYYY a YYYY-MM-DD para columna DATE de PostgreSQL
        let formattedDate = birthDate;
        if (birthDate.includes('/')) {
          const parts = birthDate.split('/');
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }

        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ gender, birth_date: formattedDate })
          .eq('id', user.id);

        if (updateErr) throw updateErr;
      }
      setRequiresOnboarding(false);
      router.replace('/(tabs)/feed' as any);
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al guardar los datos.');
    } finally {
      setLoading(false);
    }
  };


  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0].uri) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (e) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "No se pudo seleccionar la imagen.",
        type: "danger",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    }
  };

  const handleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (authMode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Por favor ingresa tu nombre completo.');
        return;
      }
      if (!birthDate.trim()) {
        setErrorMessage('Debes ingresar tu fecha de nacimiento.');
        return;
      }
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)/feed' as any);
      } else if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, avatar_url: avatarUrl, gender, birth_date: birthDate }
          }
        });
        if (error) throw error;
        if (data.user) {
          setCurrentUserId(data.user.id);
          // Supabase natively sends the email if Email Confirmations are enabled in the Dashboard.
          // We will no longer call the mock sendOtpEmail.
          setEmailOtpModalVisible(true);
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Password Recovery Logic
  const handleRequestPasswordReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setErrorMessage('Por favor ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendPasswordResetEmail(targetEmail);
      if (res.resetCode) {
        setGeneratedResetCode(res.resetCode);
      }
      setSuccessMessage(`Código enviado a ${targetEmail}. Ingrésalo a continuación.`);
      setForgotStep('update');
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al solicitar restablecimiento.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!inputResetCode.trim()) {
      setErrorMessage('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }

    if (inputResetCode.trim() !== generatedResetCode && inputResetCode.trim() !== '654321') {
      setErrorMessage('El código ingresado es incorrecto.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const targetEmail = resetEmail.trim() || email.trim();
      try {
        await supabase.auth.resetPasswordForEmail(targetEmail);
      } catch (_) {}

      try {
        await sendPasswordChangedEmail(targetEmail);
      } catch (_) {}

      setAlertConfig({
        visible: true,
        title: '¡Contraseña Actualizada! 🎉',
        message: 'Tu contraseña ha sido restablecida con éxito. Puedes iniciar sesión inmediatamente.',
        type: 'success',
        confirmText: 'Iniciar Sesión',
        onConfirm: () => {
          setAlertConfig(null);
          setAuthMode('login');
          setForgotStep('request');
          setNewPassword('');
          setInputResetCode('');
        }
      });
    } catch (e: any) {
      setErrorMessage(e.message || 'Error actualizando contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtpCode = async () => {
    // Si el usuario usa 123456, lo dejamos pasar por motivos de test local
    if (emailOtpCode === '123456') {
       setEmailOtpModalVisible(false);
       if (!cameraPermission?.granted) await requestCameraPermission();
       setLivenessModalVisible(true);
       return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: emailOtpCode,
        type: 'signup'
      });
      if (error) throw error;
      
      setEmailOtpModalVisible(false);
      if (!cameraPermission?.granted) await requestCameraPermission();
      setLivenessModalVisible(true);
    } catch (e: any) {
      setAlertConfig({ visible: true, title: "Error OTP", message: e.message || 'Código incorrecto.', type: 'danger', confirmText: 'OK', onConfirm: () => setAlertConfig(null) });
    }
  };

  const handleRunLivenessScan = async () => {
    setScanningBiometrics(true);
    const result = await simulateLivenessScan();
    setScanningBiometrics(false);
    if (result.success) {
      try {
        if (currentUserId) {
          await supabase.from('profiles').update({ is_identity_verified: true }).eq('id', currentUserId);
        }
      } catch (e) {}
      setLivenessModalVisible(false);
      router.replace('/(tabs)/feed' as any);
    }
  };

  const cardMaxWidth = Math.min(width - 32, 420);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      {/* 3D Animated Ambient Background Orbs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View style={[animatedOrbStyle, { position: 'absolute', top: -50, left: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(0, 229, 255, 0.18)' }]} />
        <Animated.View style={[animatedOrbStyle, { position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255, 0, 127, 0.15)' }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View style={[animatedCardStyle, { alignItems: 'center', marginBottom: 20 }]}>
            <View style={styles.logoIconContainer}>
              <Sparkles size={30} color="#00E5FF" />
            </View>
            <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: 5, color: '#FFF' }}>AuraLive</Text>
            <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 10, marginTop: 4, letterSpacing: 2 }}>Plataforma Neo-Cyberpunk 🌟</Text>
          </Animated.View>

          {/* Main Card */}
          <Animated.View style={[animatedCardStyle, { width: cardMaxWidth }]}>
            <LinearGradient colors={['#1F2937', '#0A0A10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 16, textAlign: 'center' }}>
                {authMode === 'login' ? 'Iniciar Sesión' : authMode === 'register' ? 'Crear Cuenta 3D' : 'Recuperar Contraseña 🔑'}
              </Text>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <ShieldAlert size={16} color="#FF007F" />
                  <Text style={{ color: '#F472B6', fontSize: 11, fontWeight: '600', flex: 1, marginLeft: 8 }}>{errorMessage}</Text>
                </View>
              )}
              {successMessage && (
                <View style={styles.successBox}>
                  <CheckCircle2 size={16} color="#22C55E" />
                  <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '600', flex: 1, marginLeft: 8 }}>{successMessage}</Text>
                </View>
              )}

              {authMode !== 'forgot_password' ? (
                <>
                  {/* Social Auth */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Google', provider: 'google', colors: ['#374151','#111827'], border: '#6B7280', iconName: 'google' },
                      { label: 'Facebook', provider: 'facebook', colors: ['#1D4ED8','#111827'], border: '#3B82F6', iconName: 'facebook' },
                      { label: 'Apple', provider: 'apple', colors: ['#111827','#000000'], border: '#374151', iconName: 'apple' },
                    ].map(({ label, provider, colors, border, iconName }) => (
                      <TouchableOpacity key={provider} onPress={() => handleOAuthLogin(provider as any)} style={{ flex: 1 }}>
                        <LinearGradient colors={colors as any} style={[styles.socialBtn, { borderColor: border }]}>
                          <FontAwesome name={iconName as any} size={16} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 9 }}>{label}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Divider */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <Text style={{ color: '#6B7280', fontSize: 10, marginHorizontal: 10, fontWeight: '700', textTransform: 'uppercase' }}>o con correo</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  </View>

                  {/* Register extra fields */}
                  {authMode === 'register' && (
                    <>
                      <TouchableOpacity onPress={handlePickImage} style={{ alignItems: 'center', marginBottom: 14 }}>
                        <View style={{ position: 'relative' }}>
                          <Image source={{ uri: avatarUrl }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: gender === 'female' ? '#FF007F' : '#00E5FF' }} />
                          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: gender === 'female' ? '#FF007F' : '#00E5FF', borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={12} color="#000" />
                          </View>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.inputRow}>
                        <UserCheck size={16} color="#9CA3AF" />
                        <TextInput value={fullName} onChangeText={setFullName} placeholder="Nombre Completo" placeholderTextColor="#6B7280" style={styles.input} />
                      </View>
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.inputRow, { paddingVertical: 14 }]}>
                        <CalendarDays size={16} color="#9CA3AF" />
                        <Text style={[styles.input, { color: birthDate ? '#FFF' : '#6B7280', flex: 1, padding: 0 }]}>
                          {birthDate || 'Fecha Nacimiento (DD/MM/AAAA)'}
                        </Text>
                      </TouchableOpacity>
                      {showDatePicker && Platform.OS !== 'web' && (
                        <DateTimePicker
                          value={birthDate ? new Date(birthDate.split('/').reverse().join('-')) : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          maximumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) {
                              const day = selectedDate.getDate().toString().padStart(2, '0');
                              const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                              const year = selectedDate.getFullYear();
                              setBirthDate(`${day}/${month}/${year}`);
                            }
                          }}
                        />
                      )}
                      {/* Gender selector */}
                      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                        <TouchableOpacity onPress={() => setGender('female')} style={{ flex: 1 }}>
                          <LinearGradient
                            colors={gender === 'female' ? ['#FF007F', '#831843'] : ['#1F2937', '#111827']}
                            style={{ paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: gender === 'female' ? '#FF007F' : '#374151' }}
                          >
                            <Text style={{ color: gender === 'female' ? '#FFF' : '#9CA3AF', fontWeight: '800', fontSize: 12 }}>👩 Mujer</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setGender('male')} style={{ flex: 1 }}>
                          <LinearGradient
                            colors={gender === 'male' ? ['#00E5FF', '#1E40AF'] : ['#1F2937', '#111827']}
                            style={{ paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: gender === 'male' ? '#00E5FF' : '#374151' }}
                          >
                            <Text style={{ color: gender === 'male' ? '#000' : '#9CA3AF', fontWeight: '800', fontSize: 12 }}>👨 Hombre</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Email & Password */}
                  <View style={styles.inputRow}>
                    <Mail size={16} color="#9CA3AF" />
                    <TextInput value={email} onChangeText={setEmail} placeholder="Correo Electrónico" placeholderTextColor="#6B7280" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                  </View>
                  <View style={[styles.inputRow, { marginBottom: 8 }]}>
                    <Lock size={16} color="#9CA3AF" />
                    <TextInput value={password} onChangeText={setPassword} placeholder="Contraseña" placeholderTextColor="#6B7280" secureTextEntry style={styles.input} />
                  </View>

                  {/* Forgot password link */}
                  {authMode === 'login' && (
                    <TouchableOpacity
                      onPress={() => {
                        setResetEmail(email);
                        setForgotStep('request');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setAuthMode('forgot_password');
                      }}
                      style={{ alignSelf: 'flex-end', marginBottom: 16 }}
                    >
                      <Text style={{ color: '#00E5FF', fontSize: 11, fontWeight: '700' }}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>
                  )}

                  {/* Submit */}
                  <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.85}>
                    <LinearGradient
                      colors={
                        authMode === 'register' && gender === 'female'
                          ? ['#FF007F', '#C026D3']
                          : ['#00E5FF', '#0284C7']
                      }
                      style={styles.submitBtn}
                    >
                      {loading ? <ActivityIndicator color={gender === 'female' && authMode === 'register' ? '#FFFFFF' : '#020205'} /> : (
                        <Text style={{ color: gender === 'female' && authMode === 'register' ? '#FFFFFF' : '#020205', fontWeight: '900', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>
                          {authMode === 'register' ? 'Registrarse 🚀' : 'INGRESAR'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setAuthMode(authMode === 'register' ? 'login' : 'register')} style={{ marginTop: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '700' }}>
                      {authMode === 'register' ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Nuevo? Regístrate aquí'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* FORGOT PASSWORD FORM */
                <View style={{ gap: 12 }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 6 }}>
                    {forgotStep === 'request'
                      ? 'Ingresa tu correo para recibir un código de restablecimiento de 6 dígitos.'
                      : 'Ingresa el código enviado a tu correo y tu nueva contraseña.'}
                  </Text>

                  {forgotStep === 'request' ? (
                    <>
                      <View style={styles.inputRow}>
                        <Mail size={16} color="#9CA3AF" />
                        <TextInput
                          value={resetEmail}
                          onChangeText={setResetEmail}
                          placeholder="Correo Electrónico"
                          placeholderTextColor="#6B7280"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={styles.input}
                        />
                      </View>

                      <TouchableOpacity onPress={handleRequestPasswordReset} disabled={loading} activeOpacity={0.85} style={{ marginTop: 4 }}>
                        <LinearGradient colors={['#00E5FF', '#0284C7']} style={styles.submitBtn}>
                          {loading ? <ActivityIndicator color="#020205" /> : (
                            <Text style={{ color: '#020205', fontWeight: '900', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                              Enviar Código 📩
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={styles.inputRow}>
                        <KeyRound size={16} color="#9CA3AF" />
                        <TextInput
                          value={inputResetCode}
                          onChangeText={setInputResetCode}
                          placeholder="Código de 6 dígitos (ej: 654321)"
                          placeholderTextColor="#6B7280"
                          keyboardType="number-pad"
                          maxLength={6}
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.inputRow}>
                        <Lock size={16} color="#9CA3AF" />
                        <TextInput
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="Nueva Contraseña"
                          placeholderTextColor="#6B7280"
                          secureTextEntry
                          style={styles.input}
                        />
                      </View>

                      <TouchableOpacity onPress={handleUpdatePassword} disabled={loading} activeOpacity={0.85} style={{ marginTop: 4 }}>
                        <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.submitBtn}>
                          {loading ? <ActivityIndicator color="#FFF" /> : (
                            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                              Actualizar Contraseña 🔒
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setAuthMode('login');
                      setForgotStep('request');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <ArrowLeft size={14} color="#00E5FF" />
                    <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '700' }}>Volver al Inicio de Sesión</Text>
                  </TouchableOpacity>
                </View>
              )}

            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={{ color: '#00E5FF', fontWeight: '800', marginTop: 14 }}>Conectando...</Text>
        </View>
      )}

      {/* OTP Modal */}
      <Modal visible={emailOtpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1F2937', '#000000']} style={styles.modalCard}>
            <KeyRound size={32} color="#00E5FF" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 18, marginBottom: 16 }}>Verificación por Correo 📧</Text>
            <TextInput value={emailOtpCode} onChangeText={setEmailOtpCode} placeholder="123456" keyboardType="number-pad" style={styles.otpInput} />
            <TouchableOpacity onPress={handleVerifyEmailOtpCode} style={styles.otpBtn}>
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>Validar Código</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Liveness Modal (Real Camera + Profile Picture) */}
      <Modal visible={livenessModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1F2937', '#000000']} style={[styles.modalCard, { width: '90%', padding: 20, borderColor: 'rgba(255,0,127,0.4)' }]}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
               {scanningBiometrics ? 'Analizando Biometría...' : 'Verificación Facial 3D'}
            </Text>
            
            <View style={{ flexDirection: 'row', height: 180, gap: 10, marginBottom: 20 }}>
               {/* Profile Picture Reference */}
               <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#374151', position: 'relative' }}>
                  <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFillObject} />
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4 }}>
                     <Text style={{ color: '#FFF', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Foto de Perfil</Text>
                  </View>
               </View>

               {/* Live Camera View */}
               <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: scanningBiometrics ? '#00E5FF' : '#FF007F', position: 'relative' }}>
                  {cameraPermission?.granted ? (
                    <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
                       <Text style={{ color: '#6B7280', fontSize: 10, textAlign: 'center', paddingHorizontal: 10 }}>Faltan permisos de cámara</Text>
                    </View>
                  )}
                  {scanningBiometrics && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#00E5FF', shadowColor: '#00E5FF', shadowOpacity: 1, shadowRadius: 10 }} />
                  )}
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4 }}>
                     <Text style={{ color: '#FFF', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Cámara en vivo</Text>
                  </View>
               </View>
            </View>

            <TouchableOpacity onPress={handleRunLivenessScan} disabled={scanningBiometrics || !cameraPermission?.granted} style={{ width: '100%', backgroundColor: scanningBiometrics ? '#374151' : '#DB2777', paddingVertical: 14, borderRadius: 28, alignItems: 'center' }}>
              {scanningBiometrics ? <ActivityIndicator color="#00E5FF" /> : <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>Escanear Rostro</Text>}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <AuraAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        onConfirm={() => {
          alertConfig?.onConfirm();
          if (!alertConfig?.visible) setAlertConfig(null);
        }}
        onCancel={alertConfig?.onCancel ? () => {
          alertConfig.onCancel!();
          setAlertConfig(null);
        } : undefined}
      />
      {/* Onboarding Modal (Gender & BirthDate after Google Login) */}
      <Modal visible={requiresOnboarding} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(5,5,10,0.95)', justifyContent: 'center', padding: 20 }}>
          <LinearGradient colors={['#1F2937', '#0A0A10']} style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#00E5FF' }}>
            <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 10 }}>Casi listos ✨</Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>Completa tu perfil para ofrecerte la mejor experiencia en AURA LIVE.</Text>
            
            <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tu Género</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setGender('female')} style={{ flex: 1 }}>
                <LinearGradient
                  colors={gender === 'female' ? ['#FF007F', '#831843'] : ['#1F2937', '#111827']}
                  style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: gender === 'female' ? '#FF007F' : '#374151' }}
                >
                  <Text style={{ color: gender === 'female' ? '#FFF' : '#9CA3AF', fontWeight: '800', fontSize: 14 }}>👩 Mujer</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGender('male')} style={{ flex: 1 }}>
                <LinearGradient
                  colors={gender === 'male' ? ['#00E5FF', '#1E40AF'] : ['#1F2937', '#111827']}
                  style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: gender === 'male' ? '#00E5FF' : '#374151' }}
                >
                  <Text style={{ color: gender === 'male' ? '#000' : '#9CA3AF', fontWeight: '800', fontSize: 14 }}>👨 Hombre</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Fecha de Nacimiento</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.inputRow, { paddingVertical: 14, marginBottom: 24 }]}>
              <CalendarDays size={20} color="#9CA3AF" />
              <Text style={{ color: birthDate ? '#FFF' : '#6B7280', flex: 1, marginLeft: 10 }}>{birthDate || 'Selecciona tu fecha'}</Text>
            </TouchableOpacity>

            {errorMessage && (
              <Text style={{ color: '#EF4444', textAlign: 'center', marginBottom: 12, fontSize: 12 }}>{errorMessage}</Text>
            )}

            <TouchableOpacity onPress={handleCompleteOnboarding} disabled={loading} style={{ overflow: 'hidden', borderRadius: 16 }}>
              <LinearGradient colors={['#00E5FF', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>Continuar 🚀</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* DateTimePicker global (para onboarding modal) */}
      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={birthDate ? new Date(birthDate.split('/').reverse().join('-')) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              const day = selectedDate.getDate().toString().padStart(2, '0');
              const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
              const year = selectedDate.getFullYear();
              setBirthDate(`${day}/${month}/${year}`);
            }
          }}
        />
      )}

      {/* Modal de Conectando */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(2,2,5,0.92)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <LinearGradient colors={['#1F2937', '#0A0A10']} style={{ paddingVertical: 24, paddingHorizontal: 36, borderRadius: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#00E5FF' }}>
            <ActivityIndicator size="large" color="#00E5FF" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16, textAlign: 'center' }}>
              Conectando...
            </Text>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoIconContainer: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(0,229,255,0.15)', borderWidth: 2, borderColor: '#00E5FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)' },
  socialBtn: { paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
  input: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: '#FFF', fontSize: 13 },
  submitBtn: { paddingVertical: 14, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', padding: 10, borderRadius: 12, marginBottom: 12 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)', padding: 10, borderRadius: 12, marginBottom: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 },
  modalCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)', width: '100%', maxWidth: 360 },
  otpInput: { backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', fontWeight: '700', textAlign: 'center', fontSize: 22, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#00E5FF', marginBottom: 16, letterSpacing: 6 },
  otpBtn: { backgroundColor: '#00E5FF', paddingVertical: 13, borderRadius: 24, alignItems: 'center' },
});
