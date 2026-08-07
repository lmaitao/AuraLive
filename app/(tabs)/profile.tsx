import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, interpolateColor } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { DailyCheckinCard } from '../../components/DailyCheckinCard';
import { User, Users, Wallet, ShieldCheck, Award, Building2, ShieldAlert, LogOut, ChevronRight, Plus, Image as ImageIcon, Trash2, Camera, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';

export default function UserProfileScreen() {
  const theme = useTheme();
  const router = useRouter();

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
    full_name: string;
    email: string;
    avatar_url: string;
    gender: string;
    phone_number: string;
    birth_date: string;
    is_identity_verified: boolean;
    is_agency: boolean;
  }>({
    full_name: 'Usuario Aura',
    email: 'usuario.aura@auralive.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    gender: 'female',
    phone_number: '+57 300 123 4567',
    birth_date: '1995-01-01',
    is_identity_verified: true,
    is_agency: true,
  });

  const [editBirthDateModal, setEditBirthDateModal] = useState(false);
  const [newBirthDate, setNewBirthDate] = useState('');
  
  const [editNameModal, setEditNameModal] = useState(false);
  const [newName, setNewName] = useState('');

  const [walletBalance, setWalletBalance] = useState(1500);
  const [aurasBalance, setAurasBalance] = useState(10);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [aurasToExchange, setAurasToExchange] = useState('5');
  const [svipLevel, setSvipLevel] = useState(3);
  const [wealthLevel, setWealthLevel] = useState(12);

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

  const [photoGallery, setPhotoGallery] = useState<string[]>([
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
  ]);
  const [addPhotoModalVisible, setAddPhotoModalVisible] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  
  const [agencyStatus, setAgencyStatus] = useState<'none' | 'pending' | 'approved'>(profile.is_agency ? 'approved' : 'none');

  const isFemaleStreamer = profile.gender === 'female';
  const isAgency = profile.is_agency || agencyStatus === 'approved';
  
  let roleTitle = 'Usuario Estándar';
  let gradientColors = ['#1F2937', '#111827'];
  let roleIcon = <User size={12} color="#9CA3AF" />;
  
  if (isAgency) {
    roleTitle = 'Agencia Certificada';
    gradientColors = ['#451A03', '#111827']; // Amber/Gold dark
    roleIcon = <Building2 size={12} color="#F59E0B" />;
  } else if (isFemaleStreamer) {
    roleTitle = 'Presentadora Oficial';
    gradientColors = ['#4C1D95', '#111827']; // Purple/Pink dark
    roleIcon = <Sparkles size={12} color="#FF007F" />;
  }

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (prof) {
            setProfile({
              full_name: prof.full_name || 'Usuario Aura',
              email: prof.email || user.email || '',
              avatar_url: prof.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              gender: prof.gender || 'female',
              phone_number: prof.phone_number || '',
              birth_date: prof.birth_date || 'N/A',
              is_identity_verified: prof.is_identity_verified || false,
              is_agency: prof.is_agency_account ?? false,
            });
            if (prof.is_agency_account) setAgencyStatus('approved');
            setSvipLevel(prof.svip_level || 0);
            setWealthLevel(prof.wealth_level || 0);
          }

          const { data: wall } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
          if (wall) setWalletBalance(wall.coin_balance || 1500);
        }
      } catch (e) {}
    }
    loadUserProfile();
  }, []);

  const handleAddPhotoToGallery = () => {
    if (!newPhotoUrl.trim()) return;
    setPhotoGallery([...photoGallery, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
    setAddPhotoModalVisible(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login' as any);
  };

  const handleUpdateBirthDate = async () => {
    if (!newBirthDate) return;
    const parts = newBirthDate.split('/');
    if (parts.length !== 3) {
      Alert.alert('Error', 'Usa el formato DD/MM/AAAA');
      return;
    }
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const birth = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age < 18) {
      Alert.alert('No Autorizado 🔞', 'Debes ser mayor de 18 años para estar en Aura Live.');
      return;
    }

    const pgDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ birth_date: pgDate }).eq('id', user.id);
      setProfile({ ...profile, birth_date: pgDate });
      setEditBirthDateModal(false);
      Alert.alert('Éxito', 'Fecha de nacimiento actualizada.');
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ full_name: newName.trim() }).eq('id', user.id);
        setProfile({ ...profile, full_name: newName.trim() });
        setEditNameModal(false);
        Alert.alert('Éxito', 'Nombre actualizado correctamente.');
      }
    } catch (e) {
      console.log('Error', e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Cyber3DBackground />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 16 }}>Mi Perfil AURA LIVE 👤</Text>

        <Animated.View entering={FadeInDown.duration(800).springify()} style={{ position: 'relative', marginBottom: 20 }}>
          {/* Main User Card (3D Gradient) */}
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 16,
              borderWidth: 2,
              borderColor: isAgency ? '#F59E0B' : (isFemaleStreamer ? '#FF007F' : '#00E5FF'),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View style={{ position: 'relative' }}>
              <View style={svipLevel > 0 ? { padding: 3, borderRadius: 45, backgroundColor: 'rgba(234,179,8,0.8)', borderWidth: 1, borderColor: '#FDE047' } : { padding: 0 }}>
                <Image source={{ uri: profile.avatar_url }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#000' }} />
              </View>
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#000' }} />
              {svipLevel > 0 && (
                <View style={{ position: 'absolute', top: -8, right: -4, backgroundColor: '#EAB308', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FEF08A' }}>
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 9, italic: 'italic' }}>SVIP {svipLevel}</Text>
                </View>
              )}
            </View>
            
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17 }}>{profile.full_name}</Text>
                <TouchableOpacity onPress={() => { setNewName(profile.full_name); setEditNameModal(true); }}>
                  <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '800' }}>✏️</Text>
                </TouchableOpacity>
                {walletBalance <= 1500 && (
                  <View style={{ backgroundColor: 'rgba(236,72,153,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#F472B6' }}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 8, textTransform: 'uppercase' }}>Nuevo 🔥</Text>
                  </View>
                )}
              </View>
              
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 }}>
                  {roleIcon}
                  <Text style={{ color: '#D1D5DB', fontWeight: '800', fontSize: 9, textTransform: 'uppercase' }}>{roleTitle}</Text>
                </View>
                {profile.is_identity_verified && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 }}>
                    <ShieldCheck size={10} color="#22C55E" />
                    <Text style={{ color: '#4ADE80', fontWeight: '800', fontSize: 9, textTransform: 'uppercase' }}>Verificado ✅</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 229, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 }}>
                  <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 9 }}>ID: #{100042 + (profile?.id ? profile.id.charCodeAt(0) * 17 : 88)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
          {/* Stats Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>126</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Seguidos</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', height: '100%' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>150</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Seguidores</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', height: '100%' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>269</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Visitantes</Text>
            </View>
          </View>

          {/* Wallets 3D Gradient Cards */}
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
                    <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800' }}>Monedas</Text>
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
              userId="user-me-123"
              onClaimSuccess={(claimedCoins) => setWalletBalance((prev) => prev + claimedCoins)}
            />
          </View>

          {/* VIP and Wealth Levels */}
          <View style={{ marginBottom: 20, gap: 10 }}>
            <TouchableOpacity onPress={() => Alert.alert('Centro SVIP', 'Próximamente')}>
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
            
            <TouchableOpacity onPress={() => Alert.alert('Nivel de Riqueza', 'Próximamente')}>
              <LinearGradient
                colors={['#1F2937', '#111827']}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(0,229,255,0.4)', padding: 14, borderRadius: 18 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Building2 size={20} color="#00E5FF" />
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
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Galería de Fotos 📸</Text>
              <TouchableOpacity onPress={() => setAddPhotoModalVisible(true)} style={{ backgroundColor: 'rgba(255,0,127,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F' }}>
                <Text style={{ color: '#FF007F', fontWeight: '800', fontSize: 10, textTransform: 'uppercase' }}>+ Agregar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {photoGallery.map((photo, idx) => (
                <View key={idx} style={{ position: 'relative' }}>
                  <Image source={{ uri: photo }} style={{ width: 100, height: 120, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                  <TouchableOpacity onPress={() => setPhotoGallery(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 10 }}>
                    <Trash2 size={12} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {photoGallery.length === 0 && (
                <View style={{ width: 100, height: 120, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                  <ImageIcon size={24} color="#9CA3AF" />
                </View>
              )}
            </ScrollView>
          </View>

          {/* Menu Navigation Items */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20, gap: 8 }}>
            
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

            <TouchableOpacity onPress={() => router.push('/family/create' as any)}>
              <LinearGradient
                colors={['#312E81', '#1F2937']}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(129,140,248,0.4)' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Users size={18} color="#818CF8" />
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Mi Familia (Gremio) 🛡️</Text>
                </View>
                <ChevronRight size={16} color="#818CF8" />
              </LinearGradient>
            </TouchableOpacity>

            {(isFemaleStreamer || isAgency) && (
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

            <TouchableOpacity onPress={() => router.push('/admin/dashboard' as any)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={18} color="#00E5FF" />
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Panel SuperAdmin Master</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>

          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{ paddingVertical: 14, borderRadius: 24, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}
          >
            <LogOut size={18} color="#EF4444" />
            <Text style={{ color: '#F87171', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Cerrar Sesión</Text>
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
              <TouchableOpacity onPress={handleUpdateBirthDate} style={{ flex: 1, backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal para Agregar Foto a Galería */}
      <Modal visible={addPhotoModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 }}>
          <LinearGradient colors={['#1F2937', '#000000']} style={{ borderWidth: 1, borderColor: '#FF007F', padding: 20, borderRadius: 24, width: '100%', maxWidth: 340 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17, marginBottom: 14, textAlign: 'center' }}>Subir Nueva Foto 📸</Text>
            <TextInput
              value={newPhotoUrl}
              onChangeText={setNewPhotoUrl}
              placeholder="URL de la imagen (ej: https://...)"
              placeholderTextColor="#6B7280"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontWeight: '500', fontSize: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FF007F', marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setAddPhotoModalVisible(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddPhotoToGallery} style={{ flex: 1, backgroundColor: '#FF007F', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
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
              <TouchableOpacity onPress={handleUpdateName} style={{ flex: 1, backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
