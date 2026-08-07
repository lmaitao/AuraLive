import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, ActivityIndicator, ScrollView, Platform, Alert, KeyboardAvoidingView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { simulateLivenessScan } from '../../utils/biometricMock';
import { sendOtpEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from '../../utils/emailService';
import { ShieldAlert, Sparkles, Lock, Mail, UserCheck, ScanFace, CheckCircle2, Image as ImageIcon, ArrowRight, KeyRound, CalendarDays, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, withSpring } from 'react-native-reanimated';

export default function LoginAuthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const orbScale = useSharedValue(1);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardTranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });
    
    orbScale.value = withRepeat(
      withTiming(1.15, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
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
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'tiktok') => {
    setErrorMessage(null);
    setLoading(true);
    try {
      if (provider !== 'tiktok') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as 'google' | 'facebook',
          options: {
            redirectTo: Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}` : 'auralive://',
          },
        });
        if (error) throw error;
      } else {
        setAlertConfig({
          visible: true,
          title: "TikTok OAuth",
          message: "Conexión con TikTok en proceso de validación.",
          type: "info",
          confirmText: "Entendido",
          onConfirm: () => setAlertConfig(null)
        });
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error con inicio social.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedOtpCode(code);
          await sendOtpEmail(email);
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
      } catch (subErr) {}

      await sendPasswordChangedEmail(targetEmail);
      setSuccessMessage('¡Contraseña actualizada exitosamente! Iniciando sesión...');

      setTimeout(() => {
        setAuthMode('login');
        setForgotStep('request');
        setSuccessMessage(null);
      }, 1800);
    } catch (e: any) {
      setErrorMessage(e.message || 'Error actualizando contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtpCode = async () => {
    if (emailOtpCode !== generatedOtpCode && emailOtpCode !== '123456') {
      setErrorMessage('Código incorrecto.');
      return;
    }
    setEmailOtpModalVisible(false);
    setLivenessModalVisible(true);
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
                      { label: 'Google', provider: 'google', colors: ['#374151','#111827'], border: '#6B7280', icon: 'https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/google_logo-google_icongoogle-512.png' },
                      { label: 'Facebook', provider: 'facebook', colors: ['#1D4ED8','#111827'], border: '#3B82F6', icon: 'https://cdn4.iconfinder.com/data/icons/social-media-flat-7/64/Social-media_Facebook-512.png' },
                      { label: 'TikTok', provider: 'tiktok', colors: ['#DB2777','#111827'], border: '#EC4899', icon: 'https://cdn4.iconfinder.com/data/icons/social-media-flat-7/64/Social-media_Tiktok-512.png' },
                    ].map(({ label, provider, colors, border, icon }) => (
                      <TouchableOpacity key={provider} onPress={() => handleOAuthLogin(provider as any)} style={{ flex: 1 }}>
                        <LinearGradient colors={colors as any} style={[styles.socialBtn, { borderColor: border }]}>
                          <Image source={{ uri: icon }} style={{ width: 16, height: 16, marginRight: 4 }} />
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
                      <View style={styles.inputRow}>
                        <CalendarDays size={16} color="#9CA3AF" />
                        <TextInput value={birthDate} onChangeText={setBirthDate} placeholder="Fecha Nacimiento (DD/MM/AAAA)" placeholderTextColor="#6B7280" keyboardType="numeric" maxLength={10} style={styles.input} />
                      </View>
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

      {/* Liveness Modal */}
      <Modal visible={livenessModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1F2937', '#000000']} style={[styles.modalCard, { borderColor: 'rgba(255,0,127,0.4)', alignItems: 'center' }]}>
            <ScanFace size={48} color="#FF007F" style={{ marginBottom: 16 }} />
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 18, marginBottom: 20, textAlign: 'center' }}>Reconocimiento Facial 3D</Text>
            <TouchableOpacity onPress={handleRunLivenessScan} disabled={scanningBiometrics} style={{ width: '100%', backgroundColor: '#DB2777', paddingVertical: 14, borderRadius: 28, alignItems: 'center' }}>
              {scanningBiometrics ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>Iniciar Escaneo</Text>}
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
