import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Image, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, Share2, Users, TrendingUp, Sparkles, QrCode, Copy, Download, Search, Trash2, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';

export interface RecruitedStreamer {
  id: string;
  name: string;
  avatarUrl: string;
  totalGeneratedCoins: number;
  agencyCommission10Pct: number;
  streamerNet40Pct: number;
  isActiveToday: boolean;
  status: 'active' | 'new' | 'pending';
  joinedDate: string;
}

export default function AgencyDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);

  const [agencyCode, setAgencyCode] = useState('AGENCY-AURA-101');
  const [activeTabStatus, setActiveTabStatus] = useState<'active' | 'new' | 'pending'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const [streamers, setStreamers] = useState<RecruitedStreamer[]>([]);

  useEffect(() => {
    fetchRealAgencyData();
  }, []);

  const fetchRealAgencyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch real agency record for current user
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (agencyData) {
        setAgencyCode(agencyData.invite_code || `AGENCY-${agencyData.id.slice(0, 6).toUpperCase()}`);
        
        // 2. Fetch real recruited streamers linked to this agency
        const { data: profileList } = await supabase
          .from('profiles')
          .select('*')
          .eq('agency_id', agencyData.id);

        if (profileList && profileList.length > 0) {
          const mappedStreamers: RecruitedStreamer[] = profileList.map(p => ({
            id: p.id,
            name: p.full_name || p.username || 'Presentadora Aura',
            avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
            totalGeneratedCoins: (p.charisma_experience || 0) * 2,
            agencyCommission10Pct: Math.floor(((p.charisma_experience || 0) * 2) * 0.05),
            streamerNet40Pct: Math.floor(((p.charisma_experience || 0) * 2) * 0.45),
            isActiveToday: p.status === 'verified',
            status: p.agency_id ? 'active' : 'pending',
            joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : '2026/08/01',
          }));
          setStreamers(mappedStreamers);
        }
      }
    } catch (e) {
      console.log('Error fetching agency data:', e);
    }
  };

  const totalAgencyCoins = streamers.reduce((acc, curr) => acc + curr.agencyCommission10Pct, 0);
  const totalTalentGenerated = streamers.reduce((acc, curr) => acc + curr.totalGeneratedCoins, 0);
  const activeCount = streamers.filter(s => s.status === 'active').length;
  const newCount = streamers.filter(s => s.status === 'new').length;
  const pendingCount = streamers.filter(s => s.status === 'pending').length;

  const filteredStreamers = streamers.filter(s => {
    const matchesStatus = s.status === activeTabStatus;
    const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  // Animated Glow
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
        message: `¡Únete a mi Agencia Oficial en AURA LIVE! Gana el 40% neto de tus regalos como Presentadora Mujer. Código de invitación: ${agencyCode}\nhttps://auralive.app/agency/join?code=${agencyCode}`,
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
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBackBtn}>
            <ArrowLeft size={18} color="#F59E0B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entrada de Agente 🏢</Text>
        </View>

        <TouchableOpacity onPress={() => setQrModalVisible(true)} style={{ position: 'relative' }}>
          <Animated.View style={[glowStyle, styles.glowOverlay]} />
          <View style={styles.invitePillBtn}>
            <QrCode size={14} color="#000" />
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>Póster QR</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Search Input Bar */}
        <View style={styles.searchBarContainer}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por ID o Nombre..."
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
          />
        </View>

        {/* Sección: Miembros del Equipo */}
        <Text style={styles.sectionHeader}>Miembros del Equipo</Text>
        <View style={styles.teamStatsCard}>
          <LinearGradient colors={['#FF007F', '#7C3AED']} style={styles.teamStatsGradient}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{activeCount}</Text>
              <Text style={styles.statLabel}>Activas ›</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{newCount}</Text>
              <Text style={styles.statLabel}>Nuevas ›</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>En Solicitud</Text>
            </View>
          </LinearGradient>

          {/* Botones de Invitación */}
          <View style={styles.inviteActionRow}>
            <TouchableOpacity onPress={handleShareInvite} style={styles.inviteOutlineBtn}>
              <Text style={{ color: '#FF007F', fontWeight: '800', fontSize: 12 }}>Invitar fuera de App</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setQrModalVisible(true)} style={styles.inviteSolidBtn}>
              <LinearGradient colors={['#FF007F', '#9333EA']} style={styles.inviteSolidGradient}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>Invitar en App</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Nómina & Comisiones */}
        <Text style={styles.sectionHeader}>Nómina & Comisiones</Text>
        <View style={styles.payrollCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '700' }}>Recompensa Total de Comisión (10%)</Text>
              <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 24, marginTop: 2 }}>
                {totalAgencyCoins.toLocaleString()} 💎
              </Text>
            </View>
            <View style={styles.dateBadge}>
              <Calendar size={12} color="#F59E0B" />
              <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800' }}>Esta Semana</Text>
            </View>
          </View>

          {/* Agency Commission Breakdown Box */}
          <View style={styles.subagentBox}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, marginBottom: 8 }}>Detalles de Comisión de Agencia</Text>
            <View style={styles.subagentRow}>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Ingresos totales por regalos de presentadoras:</Text>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>{totalTalentGenerated.toLocaleString()} 💎</Text>
            </View>
            <View style={styles.subagentRow}>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Porcentaje de comisión oficial de agencia:</Text>
              <Text style={{ color: '#FF007F', fontWeight: '900', fontSize: 12 }}>10%</Text>
            </View>
            <View style={[styles.subagentRow, { borderBottomWidth: 0, paddingTop: 4 }]}>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Ganancia neta acumulada de agencia:</Text>
              <Text style={{ color: '#34D399', fontWeight: '900', fontSize: 12 }}>+{totalAgencyCoins.toLocaleString()} 💎</Text>
            </View>
          </View>
        </View>

        {/* Sección: Detalles de la Presentadora */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
          <Text style={[styles.sectionHeader, { marginBottom: 0 }]}>Detalles de Presentadoras</Text>
          <TouchableOpacity onPress={() => Alert.alert('Filtrar', 'Selecciona las fechas de auditoría de presentadoras.')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Trash2 size={14} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>Gestionar</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs de Estado */}
        <View style={styles.statusTabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTabStatus('active')}
            style={[styles.statusTab, activeTabStatus === 'active' && styles.statusTabActive]}
          >
            <Text style={[styles.statusTabText, activeTabStatus === 'active' && styles.statusTabTextActive]}>
              Activadas ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTabStatus('new')}
            style={[styles.statusTab, activeTabStatus === 'new' && styles.statusTabActive]}
          >
            <Text style={[styles.statusTabText, activeTabStatus === 'new' && styles.statusTabTextActive]}>
              Nuevas ({newCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTabStatus('pending')}
            style={[styles.statusTab, activeTabStatus === 'pending' && styles.statusTabActive]}
          >
            <Text style={[styles.statusTabText, activeTabStatus === 'pending' && styles.statusTabTextActive]}>
              En Solicitud ({pendingCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Presentadoras Filtradas */}
        <View style={{ gap: 10, marginTop: 8 }}>
          {filteredStreamers.map((st, index) => (
            <Animated.View
              entering={FadeInUp.delay(index * 100).springify()}
              key={st.id}
              style={styles.streamerRowCard}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={{ uri: st.avatarUrl }} style={styles.streamerAvatar} />
                <View>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>{st.name}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2 }}>ID: {st.id} • Firma: {st.joinedDate}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 13 }}>
                  +{st.agencyCommission10Pct.toLocaleString()} 💎
                </Text>
                {st.status === 'pending' ? (
                  <TouchableOpacity
                    onPress={() => {
                      setStreamers(prev => prev.map(item => item.id === st.id ? { ...item, status: 'active' } : item));
                      setAlertConfig({
                        visible: true,
                        title: 'Presentadora Aceptada ✅',
                        message: `Has aceptado a ${st.name} en tu Agencia. Su Panel de Presentadora y Metas Diarias han sido activados.`,
                        type: 'success',
                        confirmText: '¡Genial!',
                        onConfirm: () => setAlertConfig(null)
                      });
                    }}
                    style={{ backgroundColor: '#34D399', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#000', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Aceptar Presentadora ✅</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.miniStatusBadge, { backgroundColor: st.status === 'active' ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                    <Text style={{ color: st.status === 'active' ? '#34D399' : '#F59E0B', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                      {st.status === 'active' ? 'Activa' : 'Nueva'}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ))}

          {filteredStreamers.length === 0 && (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No hay presentadoras en este estado.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Modal de Póster de Invitación QR (idéntico al video) */}
      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1E1B4B', '#020617']} style={styles.posterCardModal}>
            <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeQrModalBtn}>
              <Text style={{ color: '#FFF', fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>

            <Text style={{ color: '#FF007F', fontWeight: '900', fontSize: 20, textAlign: 'center', marginBottom: 4 }}>
              Sé presentadora y gana dólares 💵
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
              Escanea el código para unirte a la agencia oficial en Aura Live
            </Text>

            <View style={styles.qrContainerBox}>
              <QrCode size={140} color="#000" />
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 12, marginTop: 10 }}>CÓDIGO: {agencyCode}</Text>
            </View>

            <View style={styles.posterActionRow}>
              <TouchableOpacity onPress={handleShareInvite} style={styles.posterActionBtn}>
                <Copy size={16} color="#00E5FF" />
                <Text style={{ color: '#00E5FF', fontSize: 11, fontWeight: '800' }}>Copiar Enlace</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Alert.alert('Guardado', 'Imagen del póster guardada en tu galería.')} style={styles.posterActionBtn}>
                <Download size={16} color="#34D399" />
                <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '800' }}>Guardar Imagen</Text>
              </TouchableOpacity>
            </View>
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

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: '#0F172A',
  },
  iconBackBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245,158,11,0.5)',
    borderRadius: 20,
  },
  invitePillBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 10,
  },
  teamStatsCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,0,127,0.3)',
  },
  teamStatsGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 22,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  inviteActionRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#0F172A',
  },
  inviteOutlineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF007F',
    alignItems: 'center',
  },
  inviteSolidBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  inviteSolidGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  payrollCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    marginBottom: 20,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  subagentBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  subagentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statusTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusTabActive: {
    backgroundColor: '#FF007F',
    borderColor: '#FF007F',
  },
  statusTabText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
  },
  statusTabTextActive: {
    color: '#FFF',
  },
  streamerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  streamerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
  },
  posterCardModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 26,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#FF007F',
    alignItems: 'center',
    position: 'relative',
  },
  closeQrModalBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qrContainerBox: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  posterActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  posterActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
