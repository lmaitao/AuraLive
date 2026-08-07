import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Image } from 'react-native';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, Share2, Users, TrendingUp, Sparkles } from 'lucide-react-native';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';

export interface RecruitedStreamer {
  id: string;
  name: string;
  avatarUrl: string;
  totalGeneratedCoins: number;
  agencyCommission10Pct: number;
  streamerNet40Pct: number;
  isActiveToday: boolean;
}

export default function AgencyDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);

  const [agencyCode] = useState('AGENCY-AURA-99');
  const [streamers] = useState<RecruitedStreamer[]>([
    {
      id: 'st-1',
      name: 'Aura Presentadora 👑',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      totalGeneratedCoins: 120000,
      agencyCommission10Pct: 12000,
      streamerNet40Pct: 48000,
      isActiveToday: true,
    },
    {
      id: 'st-2',
      name: 'Sofia Live 🌟',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      totalGeneratedCoins: 65000,
      agencyCommission10Pct: 650,
      streamerNet40Pct: 26000,
      isActiveToday: true,
    },
    {
      id: 'st-3',
      name: 'Elena Neo 💎',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
      totalGeneratedCoins: 40000,
      agencyCommission10Pct: 4000,
      streamerNet40Pct: 16000,
      isActiveToday: false,
    },
  ]);

  const totalAgencyCoins = streamers.reduce((acc, curr) => acc + curr.agencyCommission10Pct, 0);
  const totalTalentGenerated = streamers.reduce((acc, curr) => acc + curr.totalGeneratedCoins, 0);

  // Animated Glow for Invite Button
  const glowProgress = useSharedValue(0);
  useEffect(() => {
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glowProgress.value * 0.6,
    transform: [{ scale: 1 + glowProgress.value * 0.05 }]
  }));

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `¡Únete a mi Agencia Oficial en AURA LIVE! Reclútate como Streamer Mujer y empieza a ganar el 40% neto de tus regalos. Usa mi código de invitación: ${agencyCode}\nhttps://auralive.app/agency/join?code=${agencyCode}`,
      });
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: "Error al compartir",
        message: err.message,
        type: "danger",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Top Bar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderColor: 'rgba(6,182,212,0.5)', shadowColor: '#06B6D4', shadowOpacity: 0.5, shadowRadius: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft size={18} color="#22D3EE" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 2, textTransform: 'uppercase' }}>Agencia Oficial</Text>
        </View>

        <TouchableOpacity onPress={handleShareInvite} style={{ position: 'relative' }}>
          <Animated.View style={[glowStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(34,211,238,0.5)', borderRadius: 20 }]} />
          <View style={{ backgroundColor: '#06B6D4', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#FFF' }}>
            <Share2 size={14} color="#000000" />
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>Invitar</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          {/* Invite Code Card */}
          <View style={{ padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(6,182,212,0.4)', marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827' }}>
            <View>
              <Text style={{ color: 'rgba(34,211,238,0.8)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Tu Código Maestro</Text>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 24, letterSpacing: 2 }}>{agencyCode}</Text>
            </View>
            <TouchableOpacity onPress={handleShareInvite} style={{ backgroundColor: 'rgba(6,182,212,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#22D3EE' }}>
              <Text style={{ color: '#67E8F9', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>Copiar</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics Grid */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: '#111827', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' }}>
              <TrendingUp size={24} color="#FFD700" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }} numberOfLines={2}>Comisión (10%)</Text>
              <Text style={{ color: '#FBBF24', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{totalAgencyCoins.toLocaleString()}</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#111827', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(236,72,153,0.3)' }}>
              <Users size={24} color="#FF007F" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }} numberOfLines={2}>Total Recaudado</Text>
              <Text style={{ color: '#F472B6', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{totalTalentGenerated.toLocaleString()}</Text>
            </View>
          </View>

          {/* Talent Breakdown List */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <Sparkles size={16} color="#22D3EE" />
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2 }}>
              Tus Presentadoras Oficiales
            </Text>
          </View>
        </Animated.View>

        <View style={{ gap: 12, marginBottom: 40 }}>
          {streamers.map((st, index) => (
            <Animated.View
              entering={FadeInUp.delay(index * 150).springify()}
              key={st.id}
              style={{ padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: st.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#22D3EE' }} />
                  <View
                    style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#000', backgroundColor: st.isActiveToday ? '#22C55E' : '#6B7280' }}
                  />
                </View>

                <View>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>{st.name}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }}>Recaudó: </Text>
                    <Text style={{ color: '#F472B6', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }}>{st.totalGeneratedCoins.toLocaleString()} 🪙</Text>
                  </View>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#FBBF24', fontWeight: '900', fontSize: 14 }}>
                  +{st.agencyCommission10Pct.toLocaleString()} 🪙
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 9, textTransform: 'uppercase', fontWeight: 'bold', marginTop: 4, letterSpacing: 1 }}>Tu 10%</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <AuraAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        onConfirm={() => {
          if (alertConfig?.onConfirm) alertConfig.onConfirm();
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
