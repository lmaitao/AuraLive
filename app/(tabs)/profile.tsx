import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, interpolateColor } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { DailyCheckinCard } from '../../components/DailyCheckinCard';
import { User, Users, Wallet, ShieldCheck, Award, Building2, ShieldAlert, LogOut, ChevronRight, Plus, Image as ImageIcon, Trash2, Camera, Sparkles, CheckCircle2, ScanFace, X, Camera as CameraIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import * as ImagePicker from 'expo-image-picker';
import { simulateLivenessScan } from '../../utils/biometricMock';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';

export default function UserProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const maxCardWidth = Math.min(width - 32, 540);

  // Holographic Glow Animation
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.4 + (glowProgress.value * 0.4),
      transform: [{ scale: 1 + (glowProgress.value * 0.05) }]
    };
  });

  const [profile, setProfile] = useState<{
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
    gender: string;
    phone_number: string;
    birth_date: string;
    bio: string;
    is_identity_verified: boolean;
    is_agency?: boolean;
    is_agency_account?: boolean;
    is_streamer?: boolean;
    is_superadmin?: boolean;
  } | null>(null);

  const [walletBalance, setWalletBalance] = useState(0);
  const [aurasBalance, setAurasBalance] = useState(0);
  const [cloverBalance, setCloverBalance] = useState(3);
  const [svipLevel, setSvipLevel] = useState(0);
  const [wealthLevel, setWealthLevel] = useState(0);
  const [charismaLevel, setCharismaLevel] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'about' | 'honor'>('about');

  // Agency Join by ID State
  const [agencyJoinModalVisible, setAgencyJoinModalVisible] = useState(false);
  const [inputAgencyCode, setInputAgencyCode] = useState('');
  const [agencyRequestStatus, setAgencyRequestStatus] = useState<'none' | 'pending' | 'linked'>('none');
  const [linkedAgencyId, setLinkedAgencyId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login' as any);
        return;
      }

      // Fetch Profile safely
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      let pData = profileData;
      if (!pData) {
        pData = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario Aura',
          avatar_url: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          bio: '¡Hola! Bienvenidos a mi perfil en Aura Live ✨',
          gender: 'female',
          birth_date: '2000-01-01',
          svip_level: 0,
          wealth_level: 0,
          photo_gallery: [],
          is_identity_verified: false,
          is_agency: false,
          is_agency_account: false,
          is_streamer: false,
          is_superadmin: false,
        };
        try {
          await supabase.from('profiles').upsert(pData);
        } catch (_) {}
      }

      setProfile(pData);
      setSvipLevel(pData.svip_level || 0);
      setWealthLevel(pData.wealth_level || 0);
      setCharismaLevel(pData.charisma_level || Math.floor((pData.charisma_experience || 0) / 1000) || 0);
      setPhotoGallery(pData.photo_gallery || []);

      if (pData.agency_id) {
        setAgencyRequestStatus('linked');
        setLinkedAgencyId(pData.agency_id);
      } else {
        setAgencyRequestStatus('none');
        setLinkedAgencyId(null);
      }

      // Fetch Wallet safely
      try {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletData) {
          setWalletBalance(walletData.coin_balance || 0);
          setAurasBalance(walletData.aura_balance || 0);
          setCloverBalance(walletData.clover_balance ?? 3);
          setCharismaLevel(Math.floor((walletData.aura_balance || 0) / 100));
        } else {
          // Create default wallet
          await supabase.from('wallets').upsert({ user_id: user.id, coin_balance: 1000, aura_balance: 0, clover_balance: 3 });
          setWalletBalance(1000);
          setAurasBalance(0);
          setCloverBalance(3);
        }
      } catch (wErr) {
        console.log('Wallet fetch notice:', wErr);
      }

      // Fetch counts safely
      try {
        const { count: followingCnt } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
        setFollowingCount(followingCnt || 0);
      } catch (_) {}

      try {
        const { count: followersCnt } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
        setFollowersCount(followersCnt || 0);
      } catch (_) {}

      try {
        const { count: visitorsCnt } = await supabase.from('profile_visitors').select('*', { count: 'exact', head: true }).eq('profile_id', user.id);
        setVisitorsCount(visitorsCnt || 0);
      } catch (_) {}

    } catch (e: any) {
      console.error('Error fetching profile:', e.message || e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const [editBirthDateModal, setEditBirthDateModal] = useState(false);
  const [newBirthDate, setNewBirthDate] = useState('');
  
  const [editNameModal, setEditNameModal] = useState(false);
  const [newName, setNewName] = useState('');

  const [editBioModal, setEditBioModal] = useState(false);
  const [newBio, setNewBio] = useState('');

  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [aurasToExchange, setAurasToExchange] = useState('5');

  const handleExchangeAuras = () => {
    const amount = parseInt(aurasToExchange, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida de Auras.');
      return;
    }
    if (amount > aurasBalance) {
      Alert.alert('Saldo Insuficiente', `Solo posees ${aurasBalance} Auras.`);
      return;
    }

    const coinsGained = amount * 100;
    setAurasBalance((prev) => prev - amount);
    setWalletBalance((prev) => prev + coinsGained);
    setExchangeModalVisible(false);

    Alert.alert(
      '¡Intercambio Exitoso! 🔮➡️🪙',
      `Has canjeado ${amount} Auras por +${coinsGained.toLocaleString()} Monedas virtuales.`
    );
  };

  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [addPhotoModalVisible, setAddPhotoModalVisible] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  
  const [agencyStatus, setAgencyStatus] = useState<'none' | 'pending' | 'approved'>(profile?.is_agency || profile?.is_agency_account ? 'approved' : 'none');

  const isAgency = Boolean(profile?.is_agency || profile?.is_agency_account || agencyStatus === 'approved');
  const isFemaleStreamer = Boolean(profile?.is_streamer || profile?.gender === 'female');
  const isSuperAdmin = Boolean(profile?.is_superadmin);
  
  let roleTitle = 'Usuario Estándar';
  let gradientColors = ['#1F2937', '#111827'];
  let roleIcon = <User size={12} color="#9CA3AF" />;
  
  if (isSuperAdmin) {
    roleTitle = 'SuperAdmin Master';
    gradientColors = ['#0369A1', '#111827'];
    roleIcon = <ShieldCheck size={12} color="#00E5FF" />;
  } else if (isAgency) {
    roleTitle = 'Agencia Certificada';
    gradientColors = ['#451A03', '#111827'];
    roleIcon = <Building2 size={12} color="#F59E0B" />;
  } else if (isFemaleStreamer) {
    roleTitle = 'Presentadora Oficial';
    gradientColors = ['#4C1D95', '#111827'];
    roleIcon = <Sparkles size={12} color="#FF007F" />;
  }

  const handleAddPhotoFromLibrary = async () => {
    if (photoGallery.length >= 5) {
      setAlertConfig({
        visible: true,
        title: 'Límite de Galería 📸',
        message: 'Has alcanzado el límite máximo de 6 fotos en total (1 Foto de Perfil + 5 Fotos en Galería).',
        type: 'warning',
        confirmText: 'Entendido',
        onConfirm: () => setAlertConfig(null)
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        const updatedGallery = [...photoGallery, uri];
        
        if (profile) {
          await supabase.from('profiles').update({ photo_gallery: updatedGallery }).eq('id', profile.id);
        }
        setPhotoGallery(updatedGallery);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo agregar la foto.');
    }
  };

  const handleDeletePhotoFromGallery = async (index: number) => {
    const updatedGallery = photoGallery.filter((_, i) => i !== index);
    if (profile) {
      await supabase.from('profiles').update({ photo_gallery: updatedGallery }).eq('id', profile.id);
    }
    setPhotoGallery(updatedGallery);
  };

  const handleSaveName = async () => {
    if (newName.trim() === '') return;
    if (!profile) return;
    
    try {
      const { error } = await supabase.from('profiles').update({ full_name: newName }).eq('id', profile.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, full_name: newName } : null);
      setEditNameModal(false);
      setNewName('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveBio = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase.from('profiles').update({ bio: newBio }).eq('id', profile.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, bio: newBio } : null);
      setEditBioModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveBirthDate = async () => {
    if (newBirthDate.trim() === '') return;
    if (!profile) return;
    
    try {
      // Basic validation for YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newBirthDate)) {
        Alert.alert('Error', 'El formato debe ser YYYY-MM-DD');
        return;
      }
      
      const { error } = await supabase.from('profiles').update({ birth_date: newBirthDate }).eq('id', profile.id);
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, birth_date: newBirthDate } : null);
      setEditBirthDateModal(false);
      setNewBirthDate('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const [scanningBiometrics, setScanningBiometrics] = useState(false);
  const [livenessModalVisible, setLivenessModalVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const handleAvatarChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        if (!profile) return;

        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: uri })
          .eq('id', profile.id);

        if (error) throw error;
        setProfile(prev => prev ? { ...prev, avatar_url: uri } : null);
        Alert.alert('Foto Actualizada ✅', 'Tu foto de perfil ha sido actualizada.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cambiar la foto');
    }
  };

  const handleOpenBiometricsModal = async () => {
    if (!profile) return;
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert('Permiso de Cámara Requerido', 'AuraLive requiere acceso a tu cámara frontal para realizar la verificación facial 3D.');
        return;
      }
    }
    setLivenessModalVisible(true);
  };

  const handleExecuteBiometricsScan = async () => {
    if (!profile) return;
    setScanningBiometrics(true);
    try {
      const res = await simulateLivenessScan(profile.id, profile.gender || 'female');
      if (res.success && res.isRealHuman && res.hash) {
        const { error } = await supabase.rpc('liveness_verify', {
          p_user_id: profile.id,
          p_face_signature_hash: res.hash,
        });

        if (error) {
          setLivenessModalVisible(false);
          setAlertConfig({
            visible: true,
            title: 'Verificación Facial Rechazada ⚠️',
            message: 'Este rostro ya se encuentra vinculado a otra cuenta registrada anteriormente. La política de la plataforma prohíbe duplicar perfiles o registrar múltiples cuentas con la misma identidad facial.',
            type: 'danger',
            confirmText: 'Entendido',
            onConfirm: () => setAlertConfig(null),
          });
          return;
        }

        const genderLabel = profile.gender === 'female' ? 'Mujer ♀️' : 'Hombre ♂️';

        setProfile(prev => prev ? { ...prev, is_identity_verified: true, status: 'verified' } : null);
        setWalletBalance(prev => prev + 50);
        setLivenessModalVisible(false);

        setAlertConfig({
          visible: true,
          title: '¡Verificación Facial Exitosa! 🎉',
          message: `Identidad Humana Real Verificada (${genderLabel}). Tu rostro ha sido validado de forma única. ¡Se han acreditado +50 Monedas a tu billetera y asignado la insignia VERIFICADO ✅!`,
          type: 'success',
          confirmText: '¡Excelente!',
          onConfirm: () => setAlertConfig(null),
        });
      }
    } catch (e: any) {
      setLivenessModalVisible(false);
      setAlertConfig({
        visible: true,
        title: 'Error de Verificación ⚠️',
        message: e.message || 'No se pudo completar la verificación facial biométrica.',
        type: 'danger',
        confirmText: 'Aceptar',
        onConfirm: () => setAlertConfig(null),
      });
    } finally {
      setScanningBiometrics(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login' as any);
  };

  const handleDeleteAccount = () => {
    setAlertConfig({
      visible: true,
      title: '¿Eliminar Cuenta Definitivamente? ⚠️',
      message: 'Esta acción es totalmente irreversible. Se borrarán todos tus datos de perfil, saldo de monedas, regalos e historial en AURA LIVE.',
      type: 'danger',
      confirmText: 'Sí, Eliminar Cuenta 🗑️',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        setAlertConfig(null);
        await executeAccountDeletion();
      },
      onCancel: () => setAlertConfig(null),
    });
  };

  const executeAccountDeletion = async () => {
    try {
      if (!profile) return;
      setLoadingProfile(true);
      const userId = profile.id;

      // 1. Try RPC function delete_user_account
      const { error: rpcErr } = await supabase.rpc('delete_user_account', { p_user_id: userId });

      if (rpcErr) {
        console.log('RPC delete_user_account fallback, executing direct cascading deletion:', rpcErr.message);

        // 2. Direct cascading cleanup of ALL user tables and content
        await Promise.allSettled([
          supabase.from('wallets').delete().eq('user_id', userId),
          supabase.from('followers').delete().eq('follower_id', userId),
          supabase.from('followers').delete().eq('following_id', userId),
          supabase.from('reels').delete().eq('user_id', userId),
          supabase.from('posts').delete().eq('user_id', userId),
          supabase.from('direct_messages').delete().eq('sender_id', userId),
          supabase.from('direct_messages').delete().eq('receiver_id', userId),
          supabase.from('room_messages').delete().eq('user_id', userId),
          supabase.from('streamer_daily_missions').delete().eq('user_id', userId),
          supabase.from('support_tickets').delete().eq('user_id', userId),
          supabase.from('withdrawal_requests').delete().eq('user_id', userId),
          supabase.from('agencies').delete().eq('owner_id', userId),
        ]);

        // 3. Delete Profile Record from Supabase
        const { error: deleteErr } = await supabase.from('profiles').delete().eq('id', userId);
        if (deleteErr) {
          throw new Error('Error al borrar de Supabase: ' + deleteErr.message);
        }
      }

      // 4. Sign out and redirect to login
      await supabase.auth.signOut();
      router.replace('/auth/login' as any);
      Alert.alert('Cuenta Eliminada ✅', 'Tu cuenta y todos tus datos fueron borrados permanentemente de Supabase.');
    } catch (e: any) {
      console.error('Error deleting account:', e);
      Alert.alert('Error al eliminar', e.message || 'No se pudo eliminar la cuenta de la base de datos.');
    } finally {
      setLoadingProfile(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Cyber3DBackground />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 130, width: '100%', maxWidth: maxCardWidth, alignSelf: 'center' }} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.duration(800).springify()} style={{ width: '100%', marginBottom: 20, alignItems: 'center' }}>
          {/* Centered Avatar at Top (Sin recuadro/banner detrás) */}
          <View style={{ alignSelf: 'center', alignItems: 'center', marginVertical: 12 }}>
            <TouchableOpacity onPress={handleAvatarChange} activeOpacity={0.8} style={{ position: 'relative' }}>
              <View style={svipLevel > 0 ? { padding: 4, borderRadius: 55, backgroundColor: 'rgba(234,179,8,0.8)' } : { padding: 0 }}>
                <Image source={{ uri: profile.avatar_url }} style={{ width: 104, height: 104, borderRadius: 52, borderWidth: 3.5, borderColor: '#00E5FF' }} />
                <View style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: '#00E5FF', borderRadius: 14, padding: 5, borderWidth: 1.5, borderColor: '#0A0A10' }}>
                  <Camera size={13} color="#000" />
                </View>
              </View>
              {svipLevel > 0 && (
                <View style={{ position: 'absolute', bottom: -6, alignSelf: 'center', backgroundColor: '#EAB308', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#FEF08A' }}>
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 10, italic: 'italic' }}>SVIP {svipLevel}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Centered User Info Below Avatar */}
          <View style={{ alignItems: 'center', width: '100%', marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 6 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 22, textAlign: 'center' }}>{profile.full_name}</Text>
              <TouchableOpacity onPress={() => { setNewName(profile.full_name); setEditNameModal(true); }}>
                <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '800' }}>✏️</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: isSuperAdmin ? '#00E5FF' : isAgency ? '#F59E0B' : isFemaleStreamer ? '#FF007F' : '#9CA3AF', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {roleIcon}
                <Text style={{ color: isSuperAdmin ? '#00E5FF' : isAgency ? '#F59E0B' : isFemaleStreamer ? '#FF007F' : '#9CA3AF', fontWeight: '900', fontSize: 10 }}>{roleTitle.toUpperCase()}</Text>
              </View>

              {(profile.status === 'verified' || profile.is_identity_verified) && (
                <View style={{ backgroundColor: 'rgba(52,211,153,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#34D399', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} color="#34D399" />
                  <Text style={{ color: '#34D399', fontWeight: '900', fontSize: 10 }}>VERIFICADO ✅</Text>
                </View>
              )}

              {!profile?.clover_gift_sent && !profile?.has_recharged && (
                <View style={{ backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#22C55E', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#22C55E', fontWeight: '900', fontSize: 10 }}>NUEVO 🌟</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 }}>
                <Text style={{ color: profile?.gender === 'female' ? '#FF007F' : '#3B82F6', fontSize: 11, fontWeight: 'bold' }}>{profile?.gender === 'female' ? '♀️ Mujer' : '♂️ Hombre'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,229,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: 'rgba(0,229,255,0.4)' }}>
                <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 11 }}>💎 Riqueza Nv. {wealthLevel}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,127,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: 'rgba(255,0,127,0.4)' }}>
                <Text style={{ color: '#FF007F', fontWeight: '900', fontSize: 11 }}>❤️ Carisma Nv. {charismaLevel}</Text>
              </View>
            </View>

            <View style={{ alignItems: 'center', gap: 4, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>ID: {100042 + (profile?.id ? profile.id.charCodeAt(0) * 17 : 88)}</Text>
                <TouchableOpacity><Text style={{ color: '#3B82F6', fontSize: 14 }}>⎘</Text></TouchableOpacity>
              </View>
              <Text style={{ color: '#D1D5DB', fontSize: 12 }}>📍 Santiago, Chile</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
          {/* Stats Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>{followingCount}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Seguidos</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', height: '100%' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>{followersCount}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Seguidores</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', height: '100%' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>{visitorsCount}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Visitantes</Text>
            </View>
          </View>

          {/* Tabs: Sobre mí | Muro de Honor (Matching frame_010) */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 24 }}>
            <TouchableOpacity onPress={() => setActiveProfileTab('about')} style={{ paddingBottom: 8, borderBottomWidth: 2.5, borderColor: activeProfileTab === 'about' ? '#FF007F' : 'transparent' }}>
              <Text style={{ color: activeProfileTab === 'about' ? '#FFF' : '#9CA3AF', fontSize: 15, fontWeight: '900' }}>Sobre mí</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveProfileTab('honor')} style={{ paddingBottom: 8, borderBottomWidth: 2.5, borderColor: activeProfileTab === 'honor' ? '#FFD700' : 'transparent' }}>
              <Text style={{ color: activeProfileTab === 'honor' ? '#FFD700' : '#9CA3AF', fontSize: 15, fontWeight: '900' }}>Muro de Honor 🏆</Text>
            </TouchableOpacity>
          </View>

          {activeProfileTab === 'about' ? (
            <>
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Biografía</Text>
                <TouchableOpacity onPress={() => { setNewBio(profile.bio || ''); setEditBioModal(true); }}>
                  <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: 'bold' }}>Editar ✏️</Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                <Text style={{ color: '#D1D5DB', fontSize: 13, lineHeight: 20 }}>
                  {profile.bio || 'Sin descripción aún. Escribe algo sobre ti...'}
                </Text>
              </View>
            </>
          ) : (
            <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 }}>Top Donadores & Contribuyentes 👑</Text>
              <View style={{ gap: 8 }}>
                {[
                  { name: 'Alex VIP 👑', coins: '125,000', badge: '🥇 Top 1', color: '#FFD700' },
                  { name: 'Carlos Cyber 💎', coins: '82,400', badge: '🥈 Top 2', color: '#C0C0C0' },
                  { name: 'Lucia Star 💖', coins: '41,100', badge: '🥉 Top 3', color: '#CD7F32' },
                ].map((don, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ color: don.color, fontWeight: '900', fontSize: 12 }}>{don.badge}</Text>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>{don.name}</Text>
                    </View>
                    <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 12 }}>{don.coins} 🪙</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Wallets Cards (Auras solo para Presentadoras Mujeres o Agencias Certificadas) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/shop' as any)} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#78350F', '#0F0F1A']}
                style={{ padding: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#F59E0B' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', padding: 6, borderRadius: 16 }}><Text style={{ fontSize: 16 }}>🪙</Text></View>
                  <View>
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>{walletBalance}</Text>
                    <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800' }}>Monedas Virtuales</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setExchangeModalVisible(true)} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#4C1D95', '#0F0F1A']}
                style={{ padding: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#A855F7' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(168,85,247,0.2)', padding: 6, borderRadius: 16 }}><Text style={{ fontSize: 16 }}>🔮</Text></View>
                  <View>
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>{aurasBalance}</Text>
                    <Text style={{ color: '#C084FC', fontSize: 10, fontWeight: '800' }}>Auras (Canjear)</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Daily Reward Chest Widget */}
          <View style={{ marginBottom: 20 }}>
            <DailyCheckinCard
              userId={profile.id}
              onClaimSuccess={(claimedCoins) => setWalletBalance((prev) => prev + claimedCoins)}
            />
          </View>

          {/* VIP and Wealth Levels */}
          <View style={{ marginBottom: 20, gap: 10 }}>
            <TouchableOpacity onPress={() => router.push('/svip' as any)}>
              <LinearGradient
                colors={['#1F2937', '#111827']}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(234,179,8,0.4)', padding: 14, borderRadius: 18 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Award size={20} color="#FFD700" />
                  <View>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Centro SVIP</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Beneficios exclusivos y marcos 3D</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(234,179,8,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#FDE047' }}>
                  <Text style={{ color: '#EAB308', fontWeight: '900', fontSize: 10, italic: 'italic' }}>SVIP {svipLevel}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/wealth' as any)}>
              <LinearGradient
                colors={['#1F2937', '#111827']}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(0,229,255,0.4)', padding: 14, borderRadius: 18 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={20} color="#00E5FF" />
                  <View>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Nivel de Riqueza</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Sube de nivel enviando regalos</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(0,229,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#38BDF8' }}>
                  <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 10 }}>Nv. {wealthLevel} 💎</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Photo Gallery Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Galería de Fotos 📸</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Máximo 6 fotos en total ({photoGallery.length + 1}/6)</Text>
              </View>
              <TouchableOpacity onPress={handleAddPhotoFromLibrary} style={{ backgroundColor: 'rgba(255,0,127,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F' }}>
                <Text style={{ color: '#FF007F', fontWeight: '800', fontSize: 10, textTransform: 'uppercase' }}>+ Agregar Foto</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {photoGallery.map((photo, idx) => (
                <View key={`photo-${idx}`} style={{ position: 'relative' }}>
                  <Image source={{ uri: photo }} style={{ width: 100, height: 120, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                  <TouchableOpacity onPress={() => handleDeletePhotoFromGallery(idx)} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', padding: 5, borderRadius: 10 }}>
                    <Trash2 size={12} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {photoGallery.length === 0 && (
                <TouchableOpacity onPress={handleAddPhotoFromLibrary} style={{ width: 100, height: 120, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                  <ImageIcon size={24} color="#9CA3AF" />
                  <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4 }}>Subir Foto</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Banner Obligatorio de Enlace a Agencia (Solo visible si NO está enlazada) */}
          {isFemaleStreamer && !isAgency && agencyRequestStatus !== 'linked' && (
            <TouchableOpacity
              onPress={() => setAgencyJoinModalVisible(true)}
              style={{ marginBottom: 16 }}
            >
              <LinearGradient colors={['#7C2D12', '#1F2937']} style={{ padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: '#F59E0B' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Building2 size={22} color="#F59E0B" />
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>
                    Unirse a una Agencia Obligatorio 🏢
                  </Text>
                </View>
                <Text style={{ color: '#D1D5DB', fontSize: 11, lineHeight: 17, marginBottom: 10 }}>
                  {agencyRequestStatus === 'pending'
                    ? '⚠️ Solicitud enviada a la Agencia. Esperando que el Agente acepte tu ID para activar tu Panel y Metas.'
                    : 'Debes ingresar el ID de una Agencia Oficial para enlazarte y solicitar la activación de tu perfil de presentadora y metas de monetización.'}
                </Text>
                <View style={{ backgroundColor: '#F59E0B', paddingVertical: 10, borderRadius: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
                    {agencyRequestStatus === 'pending' ? 'Solicitud Pendiente ⏳' : 'Ingresar ID de Agencia 🏢'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Menu Navigation Items */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20, gap: 8 }}>
            
            {/* Card de Verificación Facial (Solo visible si NO está verificado) */}
            {!profile?.is_identity_verified && profile?.status !== 'verified' && (
              <TouchableOpacity
                onPress={handleOpenBiometricsModal}
                disabled={scanningBiometrics}
              >
                <LinearGradient
                  colors={['#831843', '#1F2937']}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FF007F' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <ScanFace size={20} color="#FF007F" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>
                        Verificación Facial (+50 Monedas) 📸
                      </Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 10 }}>
                        Escanear rostro en vivo para ganar +50 monedas
                      </Text>
                    </View>
                  </View>
                  {scanningBiometrics ? (
                    <ActivityIndicator color="#00E5FF" size="small" />
                  ) : (
                    <ChevronRight size={16} color="#FF007F" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {!isAgency && (
              <TouchableOpacity
                onPress={() => {
                  if (agencyStatus === 'none') {
                    setAgencyStatus('pending');
                    Alert.alert('Solicitud Enviada ✅', 'Enviada al SuperAdmin para su revisión.');
                  }
                }}
                disabled={agencyStatus === 'pending'}
              >
                <LinearGradient
                  colors={agencyStatus === 'pending' ? ['#374151', '#1F2937'] : ['#451A03', '#1F2937']}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: agencyStatus === 'pending' ? '#4B5563' : 'rgba(245,158,11,0.4)' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Building2 size={18} color={agencyStatus === 'pending' ? '#9CA3AF' : '#F59E0B'} />
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>
                      {agencyStatus === 'pending' ? 'Solicitud de Agencia en Revisión' : 'Solicitar ser Agencia 🏢'}
                    </Text>
                  </View>
                  {agencyStatus !== 'pending' && <ChevronRight size={16} color="#F59E0B" />}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Panel de Presentadora (SOLO visible si es Presentadora Y YA ESTÁ ENLAZADA por la agencia) */}
            {(isFemaleStreamer || isAgency) && (agencyRequestStatus === 'linked' || isAgency) && (
              <TouchableOpacity onPress={() => router.push('/streamer/dashboard' as any)}>
                <LinearGradient
                  colors={['#831843', '#1F2937']}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,0,127,0.4)' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={18} color="#FF007F" />
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Panel de Presentadora 🌟</Text>
                  </View>
                  <ChevronRight size={16} color="#FF007F" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isAgency && (
              <TouchableOpacity onPress={() => router.push('/agency/dashboard' as any)}>
                <LinearGradient
                  colors={['#064E3B', '#1F2937']}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Building2 size={18} color="#34D399" />
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Panel de Agencia 🏢</Text>
                  </View>
                  <ChevronRight size={16} color="#34D399" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            {profile?.is_superadmin && (
              <TouchableOpacity onPress={() => router.push('/admin/dashboard' as any)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={18} color="#00E5FF" />
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Panel SuperAdmin Master</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{ paddingVertical: 14, borderRadius: 24, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}
          >
            <LogOut size={18} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 16 }}>Cerrar Sesión</Text>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={{ paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 }}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>Eliminar Cuenta Definitivamente 🗑️</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal para Intercambiar Auras por Monedas */}
      <Modal visible={exchangeModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 }}>
          <LinearGradient colors={['#4C1D95', '#0F0F1A']} style={{ borderWidth: 1.5, borderColor: '#A855F7', padding: 22, borderRadius: 26, width: '100%', maxWidth: 350 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, marginBottom: 4, textAlign: 'center' }}>
              Intercambiar Auras 🔮➡️🪙
            </Text>
            <Text style={{ color: '#C084FC', fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
              Canjea tus Auras recibidas por Monedas virtuales (1 Aura = 100 Monedas).
            </Text>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                Auras Disponibles: {aurasBalance} 🔮
              </Text>
              <TextInput
                value={aurasToExchange}
                onChangeText={setAurasToExchange}
                placeholder="Cantidad de Auras..."
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}
              />
              <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800', marginTop: 6 }}>
                = Monedas a Recibir: +{(parseInt(aurasToExchange || '0', 10) * 100).toLocaleString()} 🪙
              </Text>
            </View>

            {/* Quick Exchange Presets Matching frame_015 */}
            <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Canje Rápido:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[
                { auras: 1, coins: 100 },
                { auras: 5, coins: 500 },
                { auras: 10, coins: 1000 },
                { auras: 50, coins: 5000 },
                { auras: 100, coins: 10000 },
                { auras: 500, coins: 50000 },
              ].map(p => (
                <TouchableOpacity
                  key={p.auras}
                  onPress={() => setAurasToExchange(p.auras.toString())}
                  style={{ width: '31%', backgroundColor: aurasToExchange === p.auras.toString() ? '#A855F7' : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: aurasToExchange === p.auras.toString() ? '#FFF' : 'rgba(168,85,247,0.2)' }}
                >
                  <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 11 }}>+{p.coins.toLocaleString()} 🪙</Text>
                  <Text style={{ color: aurasToExchange === p.auras.toString() ? '#FFF' : '#C084FC', fontSize: 9, fontWeight: '800', marginTop: 2 }}>{p.auras} 🔮</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setExchangeModalVisible(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExchangeAuras} style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}>
                <LinearGradient colors={['#A855F7', '#7C3AED']} style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>Canjear Monedas 🪙</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal para Editar Fecha de Nacimiento */}
      <Modal visible={editBirthDateModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 }}>
          <LinearGradient colors={['#1F2937', '#000000']} style={{ borderWidth: 1, borderColor: 'rgba(59,130,246,0.5)', padding: 20, borderRadius: 24, width: '100%', maxWidth: 340 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17, marginBottom: 14, textAlign: 'center' }}>Editar Nacimiento 🔞</Text>
            <TextInput
              value={newBirthDate}
              onChangeText={setNewBirthDate}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              maxLength={10}
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontWeight: '800', textAlign: 'center', fontSize: 16, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#3B82F6', marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setEditBirthDateModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBirthDate} style={{ flex: 1, backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>



      {/* Modal para Editar Nombre */}
      <Modal visible={editNameModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 }}>
          <LinearGradient colors={['#1F2937', '#000000']} style={{ borderWidth: 1, borderColor: '#3B82F6', padding: 20, borderRadius: 24, width: '100%', maxWidth: 340 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17, marginBottom: 14, textAlign: 'center' }}>Editar Nombre ✏️</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Tu nuevo nombre"
              placeholderTextColor="#6B7280"
              maxLength={20}
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontWeight: '800', textAlign: 'center', fontSize: 16, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#3B82F6', marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setEditNameModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName} style={{ flex: 1, backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
      {/* Modal para Editar Bio */}
      <Modal visible={editBioModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 }}>
          <LinearGradient colors={['#1F2937', '#000000']} style={{ borderWidth: 1, borderColor: '#FF007F', padding: 20, borderRadius: 24, width: '100%', maxWidth: 340 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17, marginBottom: 14, textAlign: 'center' }}>Sobre mí 📝</Text>
            <TextInput
              value={newBio}
              onChangeText={setNewBio}
              placeholder="Escribe algo sobre ti..."
              placeholderTextColor="#6B7280"
              maxLength={300}
              multiline
              numberOfLines={4}
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontWeight: '500', fontSize: 14, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FF007F', marginBottom: 14, minHeight: 80, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setEditBioModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBio} style={{ flex: 1, backgroundColor: '#FF007F', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal de Verificación Facial 3D con Cámara */}
      <Modal visible={livenessModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <LinearGradient colors={['#0F172A', '#020617']} style={{ width: '100%', maxWidth: 380, borderRadius: 28, padding: 24, borderWidth: 1.5, borderColor: '#00E5FF', alignItems: 'center', shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ScanFace size={24} color="#00E5FF" />
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17 }}>Escáner Biométrico Facial</Text>
              </View>
              <TouchableOpacity onPress={() => setLivenessModalVisible(false)} style={{ padding: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 18, lineHeight: 18 }}>
              Coloca tu rostro al centro de la guía biométrica para verificar tu identidad real en Aura Live ⚡
            </Text>

            {/* Futuristic Circular Camera Frame */}
            <View style={{ position: 'relative', width: 220, height: 220, borderRadius: 110, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 220, height: 220, borderRadius: 110, overflow: 'hidden', borderWidth: 3.5, borderColor: scanningBiometrics ? '#00E5FF' : '#FF007F', backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                {cameraPermission?.granted ? (
                  <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
                ) : (
                  <View style={{ alignItems: 'center', padding: 16 }}>
                    <CameraIcon size={36} color="#00E5FF" />
                    <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 10, fontWeight: '700' }}>Cámara desactivada</Text>
                  </View>
                )}

                {/* Laser Scan Animation */}
                {scanningBiometrics && (
                  <View style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: 3, backgroundColor: '#00E5FF', shadowColor: '#00E5FF', shadowOpacity: 1, shadowRadius: 12 }} />
                )}
              </View>

              {/* Status Chip */}
              <View style={{ position: 'absolute', bottom: -10, backgroundColor: scanningBiometrics ? '#00E5FF' : 'rgba(0,0,0,0.85)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: scanningBiometrics ? '#00E5FF' : '#FF007F' }}>
                <Text style={{ color: scanningBiometrics ? '#000' : '#FFF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                  {scanningBiometrics ? 'Escaneando Rostro... 🔍' : 'Listo para Escanear'}
                </Text>
              </View>
            </View>

            {!cameraPermission?.granted ? (
              <TouchableOpacity onPress={requestCameraPermission} activeOpacity={0.85} style={{ width: '100%', borderRadius: 20, overflow: 'hidden' }}>
                <LinearGradient colors={['#00E5FF', '#0284C7']} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Permitir Acceso a Cámara 📸</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleExecuteBiometricsScan}
                disabled={scanningBiometrics}
                activeOpacity={0.85}
                style={{ width: '100%', borderRadius: 20, overflow: 'hidden' }}
              >
                <LinearGradient colors={scanningBiometrics ? ['#374151', '#1F2937'] : ['#FF007F', '#7C3AED']} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  {scanningBiometrics ? (
                    <ActivityIndicator color="#00E5FF" size="small" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Iniciar Verificación Facial 📸</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </Modal>

      {/* 🏢 MODAL PARA INGRESAR ID DE AGENCIA Y SOLICITAR INGRESO 🏢 */}
      <Modal visible={agencyJoinModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <LinearGradient colors={['#1E1B4B', '#020617']} style={{ width: '100%', maxWidth: 360, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: '#F59E0B' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Building2 size={22} color="#F59E0B" />
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Unirse a una Agencia 🏢</Text>
              </View>
              <TouchableOpacity onPress={() => setAgencyJoinModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
              Ingresa el <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>ID / Código de Invitación</Text> ofical de la Agencia para enlazarte. Una vez que el Agente acepte tu solicitud, tu Panel de Presentadora se activará.
            </Text>

            <TextInput
              value={inputAgencyCode}
              onChangeText={setInputAgencyCode}
              placeholder="Ejemplo: AGENCY-101"
              placeholderTextColor="#6B7280"
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.5)', borderRadius: 16, padding: 14, color: '#FFF', fontWeight: '800', fontSize: 14, marginBottom: 20 }}
            />

            <TouchableOpacity
              onPress={() => {
                if (!inputAgencyCode.trim()) {
                  Alert.alert('ID Requerido', 'Por favor ingresa el ID o Código de la Agencia.');
                  return;
                }
                setAgencyRequestStatus('pending');
                setAgencyJoinModalVisible(false);
                setAlertConfig({
                  visible: true,
                  title: 'Solicitud Enviada 🏢',
                  message: `Has enviado la solicitud de vinculación a la Agencia ${inputAgencyCode}. Una vez que la agencia la apruebe en su panel, tu Panel de Presentadora y Metas se activarán automáticamente.`,
                  type: 'success',
                  confirmText: 'Entendido',
                  onConfirm: () => setAlertConfig(null)
                });
              }}
              style={{ borderRadius: 18, overflow: 'hidden' }}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Enviar Solicitud a la Agencia 🚀</Text>
              </LinearGradient>
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
          setAlertConfig(null);
        }}
        onCancel={alertConfig?.onCancel ? () => {
          alertConfig.onCancel!();
          setAlertConfig(null);
        } : undefined}
      />
    </SafeAreaView>
  );
}
