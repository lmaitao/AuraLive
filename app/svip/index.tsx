import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ChevronLeft, Crown, Sparkles, Shield, Mic, Video, Star, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';

// Niveles SVIP: experiencia necesaria para alcanzar cada nivel
const SVIP_LEVELS = [
  { level: 1, req: 10000,    color: ['#FDE047', '#CA8A04'], animal: '🐆', frame: '⭐', label: 'Jaguar Dorado'  },
  { level: 2, req: 50000,    color: ['#FCD34D', '#D97706'], animal: '🦁', frame: '💛', label: 'León Ámbar'     },
  { level: 3, req: 150000,   color: ['#F59E0B', '#B45309'], animal: '🐉', frame: '🔥', label: 'Dragón Fuego'   },
  { level: 4, req: 500000,   color: ['#FBBF24', '#92400E'], animal: '🦅', frame: '👑', label: 'Águila Imperial' },
  { level: 5, req: 1000000,  color: ['#EAB308', '#713F12'], animal: '🐲', frame: '💎', label: 'Dragón Platino' },
];

// Privilegios de sala por nivel
const SVIP_PRIVILEGES = [
  {
    level: 1,
    title: 'SVIP 1 — Jaguar',
    color: '#FDE047',
    icon: '🐆',
    privileges: [
      { icon: <Mic size={16} color="#FDE047" />, label: 'Puede silenciar el micrófono de usuarios normales' },
      { icon: <Video size={16} color="#FDE047" />, label: 'Puede bajar la cámara de usuarios normales' },
      { icon: '⭐', label: 'Marco de entrada: Estrella Dorada' },
      { icon: '🐆', label: 'Efecto de entrada: Jaguar Dorado' },
    ],
    note: null,
  },
  {
    level: 2,
    title: 'SVIP 2 — León',
    color: '#FCD34D',
    icon: '🦁',
    privileges: [
      { icon: <Shield size={16} color="#FCD34D" />, label: 'Inmune a silenciamientos en sala' },
      { icon: <Shield size={16} color="#FCD34D" />, label: 'No puede ser expulsado por el host' },
      { icon: '💛', label: 'Marco de entrada: León Ámbar' },
      { icon: '🦁', label: 'Efecto de entrada: León Rugiente' },
    ],
    note: 'Los SVIP 2–5 no pueden ser moderados por ningún host.',
  },
  {
    level: 3,
    title: 'SVIP 3 — Dragón',
    color: '#F59E0B',
    icon: '🐉',
    privileges: [
      { icon: <Shield size={16} color="#F59E0B" />, label: 'Escudo máximo: Inmune a todo tipo de moderación' },
      { icon: '🔥', label: 'Marco de entrada: Llamas de Dragón' },
      { icon: '🐉', label: 'Efecto de entrada: Dragón en llamas 3D' },
      { icon: '🎁', label: 'Regalos exclusivos de presentadoras desbloqueados' },
    ],
    note: null,
  },
  {
    level: 4,
    title: 'SVIP 4 — Águila',
    color: '#FBBF24',
    icon: '🦅',
    privileges: [
      { icon: <Shield size={16} color="#FBBF24" />, label: 'Escudo Águila Imperial' },
      { icon: '👑', label: 'Marco de entrada: Corona Real' },
      { icon: '🦅', label: 'Efecto de entrada: Águila Imperial' },
      { icon: '📣', label: 'Notificación especial al entrar a sala' },
    ],
    note: null,
  },
  {
    level: 5,
    title: 'SVIP 5 — Dragón Platino',
    color: '#EAB308',
    icon: '🐲',
    privileges: [
      { icon: <Shield size={16} color="#EAB308" />, label: 'Escudo Platino: El nivel más alto de protección' },
      { icon: '💎', label: 'Marco de entrada: Diamante Platino' },
      { icon: '🐲', label: 'Efecto de entrada: Dragón Platino con relámpagos' },
      { icon: '🌌', label: 'Entrada con fondo de Galaxia animada' },
    ],
    note: null,
  },
];

export default function SvipScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'privilegios' | 'tienda'>('privilegios');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, avatar_url, svip_level, svip_experience').eq('id', user.id).single();
      setProfile(data);
    } catch (e) {
      console.log('Error fetching SVIP profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const svipLevel = profile?.svip_level || 0;
  const svipExp = profile?.svip_experience || 0;
  const currentLevelData = SVIP_LEVELS.find(l => l.level === svipLevel);
  const nextLevelData = SVIP_LEVELS.find(l => l.level === svipLevel + 1);
  const progress = nextLevelData ? Math.min(svipExp / nextLevelData.req, 1) : 1;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#05050A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EAB308" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05050A' }} edges={['top']}>
      {/* Ambient Gold Background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={['rgba(234,179,8,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ChevronLeft size={28} color="#EAB308" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro SVIP ⚡</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* === PROFILE CARD === */}
        <Animated.View entering={FadeInDown.duration(600)} style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <LinearGradient
            colors={svipLevel > 0 ? (currentLevelData?.color || ['#1F2937', '#111827']) as any : ['#1F2937', '#111827']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.progressCard, { borderColor: svipLevel > 0 ? (currentLevelData?.color[0] || '#374151') : '#374151' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }}
                  style={styles.avatar}
                />
                {svipLevel > 0 && (
                  <View style={[styles.levelBadge, { backgroundColor: currentLevelData?.color[0] }]}>
                    <Text style={styles.levelBadgeText}>SVIP {svipLevel}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 2 }}>
                  {profile?.full_name || 'Usuario Aura'}
                </Text>
                <Text style={{ color: svipLevel > 0 ? '#FDE047' : '#9CA3AF', fontSize: 12, fontWeight: '700' }}>
                  {svipLevel > 0 ? `${currentLevelData?.label} ${currentLevelData?.animal}` : 'Sin nivel SVIP aún'}
                </Text>
              </View>
              <Crown size={32} color={svipLevel > 0 ? '#F59E0B' : '#374151'} />
            </View>

            {/* Progress Bar */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#EAB308', fontWeight: '800', fontSize: 12 }}>
                  {svipLevel > 0 ? `SVIP ${svipLevel}` : 'Sin SVIP'}
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                  {nextLevelData ? `SVIP ${svipLevel + 1}` : 'Nivel Máximo ✨'}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#FDE047', '#D97706']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]}
                />
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                {nextLevelData
                  ? `${svipExp.toLocaleString()} / ${nextLevelData.req.toLocaleString()} exp — Faltan ${(nextLevelData.req - svipExp).toLocaleString()}`
                  : '¡Has alcanzado el nivel máximo de SVIP! 🏆'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Nivel 0 — CTA para obtener SVIP */}
        {svipLevel === 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <LinearGradient colors={['rgba(234,179,8,0.15)', 'rgba(0,0,0,0)']} style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)', alignItems: 'center' }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>👑</Text>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>¿Cómo obtener SVIP?</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
                Recarga monedas, entra a salas y apoya a las presentadoras enviando regalos para acumular experiencia SVIP.
                Al llegar a <Text style={{ color: '#FDE047', fontWeight: '900' }}>10,000 puntos</Text> desbloqueas el Nivel 1.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SVIP_LEVELS.map(l => (
                  <View key={l.level} style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16 }}>{l.animal}</Text>
                    <Text style={{ color: '#FDE047', fontSize: 10, fontWeight: '800' }}>SVIP {l.level}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 9 }}>{l.req.toLocaleString()} exp</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => setActiveTab('privilegios')} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === 'privilegios' && styles.tabTextActive]}>Privilegios de Sala</Text>
            {activeTab === 'privilegios' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('tienda')} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === 'tienda' && styles.tabTextActive]}>Beneficios</Text>
            {activeTab === 'tienda' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* === PRIVILEGIOS TAB === */}
        {activeTab === 'privilegios' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {SVIP_PRIVILEGES.map((priv, index) => {
              const isUnlocked = svipLevel >= priv.level;
              return (
                <Animated.View
                  entering={FadeInUp.delay(index * 80).duration(400)}
                  key={`priv-${priv.level}`}
                  style={{ marginBottom: 16 }}
                >
                  <LinearGradient
                    colors={isUnlocked ? ['rgba(234,179,8,0.12)', 'rgba(0,0,0,0)'] : ['rgba(255,255,255,0.03)', 'rgba(0,0,0,0)']}
                    style={{
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isUnlocked ? priv.color + '60' : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 22 }}>{priv.icon}</Text>
                        <Text style={{ color: isUnlocked ? priv.color : '#6B7280', fontWeight: '900', fontSize: 15 }}>
                          {priv.title}
                        </Text>
                      </View>
                      {!isUnlocked && <Lock size={16} color="#4B5563" />}
                      {isUnlocked && <Sparkles size={16} color={priv.color} />}
                    </View>

                    {priv.note && (
                      <View style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                        <Text style={{ color: '#FDE047', fontSize: 11, fontWeight: '700' }}>⚠️ {priv.note}</Text>
                      </View>
                    )}

                    {priv.privileges.map((item, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <View style={{ width: 30, alignItems: 'center' }}>
                          {typeof item.icon === 'string' ? (
                            <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                          ) : (
                            item.icon
                          )}
                        </View>
                        <Text style={{ color: isUnlocked ? '#D1D5DB' : '#4B5563', fontSize: 13, flex: 1 }}>
                          {item.label}
                        </Text>
                        {isUnlocked && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />}
                      </View>
                    ))}
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* === BENEFICIOS / TIENDA TAB === */}
        {activeTab === 'tienda' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
              Marcos y animales de entrada exclusivos según tu nivel SVIP. Se aplican automáticamente al entrar a cualquier sala.
            </Text>

            {SVIP_LEVELS.map((lvl, index) => {
              const isUnlocked = svipLevel >= lvl.level;
              return (
                <Animated.View
                  entering={FadeInDown.delay(index * 80).duration(400)}
                  key={`shop-${lvl.level}`}
                  style={{ marginBottom: 14 }}
                >
                  <LinearGradient
                    colors={isUnlocked ? (lvl.color as any) : ['#1F2937', '#111827']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 20, padding: 2 }}
                  >
                    <View style={{ backgroundColor: isUnlocked ? 'transparent' : '#0A0A10', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: isUnlocked ? 2 : 1, borderColor: isUnlocked ? lvl.color[0] : '#374151' }}>
                        <Text style={{ fontSize: 28 }}>{lvl.animal}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Text style={{ color: isUnlocked ? '#000' : '#FFF', fontWeight: '900', fontSize: 15 }}>
                            SVIP {lvl.level} — {lvl.label}
                          </Text>
                          {isUnlocked && <Text style={{ fontSize: 14 }}>✅</Text>}
                          {!isUnlocked && <Lock size={14} color="#6B7280" />}
                        </View>
                        <Text style={{ color: isUnlocked ? 'rgba(0,0,0,0.7)' : '#9CA3AF', fontSize: 12 }}>
                          Marco: {lvl.frame}  ·  Animal: {lvl.animal}
                        </Text>
                        {!isUnlocked && (
                          <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
                            Requiere {lvl.req.toLocaleString()} exp SVIP
                          </Text>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              );
            })}

            {/* Extra info card */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 10 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', marginBottom: 10, fontSize: 14 }}>📌 ¿Cómo se usan?</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, lineHeight: 18 }}>
                Al entrar a una sala, si tienes SVIP activo, tu entrada se muestra automáticamente con el marco y el animal de tu nivel actual. Los usuarios sin SVIP entran sin efectos especiales.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  headerTitle: { color: '#EAB308', fontSize: 20, fontWeight: '900' },
  progressCard: { borderRadius: 24, padding: 20, borderWidth: 1.5, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#F59E0B' },
  levelBadge: { position: 'absolute', bottom: -6, alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FEF08A' },
  levelBadgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  tabText: { color: '#6B7280', fontSize: 15, fontWeight: '700' },
  tabTextActive: { color: '#F59E0B' },
  tabIndicator: { position: 'absolute', bottom: -1, width: 40, height: 3, backgroundColor: '#F59E0B', borderRadius: 2 },
});
