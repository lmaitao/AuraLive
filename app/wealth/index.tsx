import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ChevronLeft, Building2, Sparkles, Flame, Star, Shield, Lock, Crown, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';

// Tramos de Nivel de Riqueza (cambio de efecto de entrada cada 5 niveles)
const WEALTH_BRACKETS = [
  {
    range: 'Niveles 1–4',
    minLevel: 1,
    maxLevel: 4,
    reqExp: 1000,
    title: 'Riqueza Bronce 🐆',
    animal: '🐆',
    frame: '🥉',
    color: ['#D97706', '#78350F'],
    borderColor: '#FBBF24',
    effectName: 'Entrada Jaguar Dorado 3D',
    benefits: [
      'Efecto de entrada Bronce al ingresar a cualquier sala',
      'Distintivo Riqueza Bronce en el chat de sala',
      'Animación de Jaguar Dorado al entrar'
    ]
  },
  {
    range: 'Niveles 5–9',
    minLevel: 5,
    maxLevel: 9,
    reqExp: 10000,
    title: 'Riqueza Plata 🦁',
    animal: '🦁',
    frame: '🥈',
    color: ['#94A3B8', '#334155'],
    borderColor: '#CBD5E1',
    effectName: 'Entrada León Rugiente 3D',
    benefits: [
      'Efecto de entrada Plata destacado al ingresar a salas',
      'Distintivo Riqueza Plata con brillo en sala',
      'Animación de León Rugiente 3D',
      'Destacado en lista de espectadores'
    ]
  },
  {
    range: 'Niveles 10–14',
    minLevel: 10,
    maxLevel: 14,
    reqExp: 50000,
    title: 'Riqueza Oro 🐉',
    animal: '🐉',
    frame: '🥇',
    color: ['#F59E0B', '#B45309'],
    borderColor: '#FCD34D',
    effectName: 'Entrada Dragón de Fuego 3D',
    benefits: [
      'Efecto de entrada Oro en llamas al ingresar a salas',
      'Distintivo Riqueza Oro 3D en perfil y chat',
      'Animación de Dragón de Fuego en pantalla',
      'Notificación de entrada en el chat de sala'
    ]
  },
  {
    range: 'Niveles 15–19',
    minLevel: 15,
    maxLevel: 19,
    reqExp: 200000,
    title: 'Riqueza Diamante 🦅',
    animal: '🦅',
    frame: '💎',
    color: ['#38BDF8', '#0369A1'],
    borderColor: '#7DD3FC',
    effectName: 'Entrada Águila Imperial 3D',
    benefits: [
      'Efecto de entrada Diamante con destellos neón',
      'Distintivo Riqueza Diamante VIP',
      'Animación de Águila Imperial desplegando alas',
      'Anuncio marquesina global al entrar a sala'
    ]
  },
  {
    range: 'Niveles 20+',
    minLevel: 20,
    maxLevel: 99,
    reqExp: 1000000,
    title: 'Riqueza Galáctica 🐲',
    animal: '🐲',
    frame: '🌌',
    color: ['#EAB308', '#713F12'],
    borderColor: '#FEF08A',
    effectName: 'Entrada Galáctica 3D con Relámpagos',
    benefits: [
      'Efecto supremo Galáctico con fondo animado 3D',
      'Distintivo Rey de Riqueza en toda la aplicación',
      'Animación de Dragón Platino con rayos y relámpagos',
      'Anuncio especial en pantalla completa para todos los miembros'
    ]
  }
];

export default function WealthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'progreso' | 'entradas'>('progreso');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url, wealth_level, wealth_experience').eq('id', user.id).single();
      const { data: wal } = await supabase.from('wallets').select('coin_balance').eq('user_id', user.id).single();

      setProfile(prof);
      setWallet(wal);
    } catch (e) {
      console.log('Error fetching wealth data:', e);
    } finally {
      setLoading(false);
    }
  };

  const wealthLevel = profile?.wealth_level || 0;
  const wealthExp = profile?.wealth_experience || 0;

  // Encontrar el tramo actual y el siguiente tramo
  const currentBracket = WEALTH_BRACKETS.find(b => wealthLevel >= b.minLevel && wealthLevel <= b.maxLevel) || WEALTH_BRACKETS[0];
  const nextBracket = WEALTH_BRACKETS.find(b => b.minLevel > wealthLevel) || WEALTH_BRACKETS[WEALTH_BRACKETS.length - 1];

  const progress = nextBracket ? Math.min(wealthExp / nextBracket.reqExp, 1) : 1;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#05050A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05050A' }} edges={['top']}>
      {/* Dynamic Ambient Background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0,229,255,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ChevronLeft size={28} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nivel de Riqueza 💎</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* === CARD PRINCIPAL DE PROGRESO DE RIQUEZA === */}
        <Animated.View entering={FadeInDown.duration(600)} style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <LinearGradient
            colors={currentBracket.color as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.progressCard, { borderColor: currentBracket.borderColor }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }}
                  style={styles.avatar}
                />
                <View style={[styles.levelBadge, { backgroundColor: currentBracket.borderColor }]}>
                  <Text style={styles.levelBadgeText}>Nv. {wealthLevel}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 2 }}>
                  {profile?.full_name || 'Usuario Aura'}
                </Text>
                <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '800' }}>
                  {currentBracket.title}
                </Text>
              </View>
              <Building2 size={32} color={currentBracket.borderColor} />
            </View>

            {/* Progress Bar */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 12 }}>
                  Nivel {wealthLevel} 💎
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                  {nextBracket ? `Próximo Tramo: Nv. ${nextBracket.minLevel} ${nextBracket.animal}` : 'Máximo Nivel 🏆'}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#00E5FF', '#0284C7']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]}
                />
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                {wealthExp.toLocaleString()} / {nextBracket.reqExp.toLocaleString()} monedas enviadas en regalos
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Banner explicativo */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <View style={{ backgroundColor: 'rgba(0,229,255,0.06)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Gift size={28} color="#00E5FF" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13, marginBottom: 2 }}>¿Cómo subir de Nivel de Riqueza?</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11, lineHeight: 16 }}>
                Envía regalos en salas o chats privados. Cada <Text style={{ color: '#00E5FF', fontWeight: '800' }}>1 moneda enviada</Text> equivale a 1 punto de experiencia de Riqueza. ¡Cada 5 niveles cambia tu entrada a la sala!
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => setActiveTab('progreso')} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === 'progreso' && styles.tabTextActive]}>Tramos de Riqueza</Text>
            {activeTab === 'progreso' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('entradas')} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === 'entradas' && styles.tabTextActive]}>Efectos de Entrada (c/5 Nivel)</Text>
            {activeTab === 'entradas' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* === TABS DE TRAMOS DE RIQUEZA === */}
        {activeTab === 'progreso' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {WEALTH_BRACKETS.map((bracket, index) => {
              const isUnlocked = wealthLevel >= bracket.minLevel;
              return (
                <Animated.View entering={FadeInUp.delay(index * 80).duration(400)} key={bracket.range} style={{ marginBottom: 16 }}>
                  <LinearGradient
                    colors={isUnlocked ? (bracket.color as any) : ['#1F2937', '#111827']}
                    style={{ borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: isUnlocked ? bracket.borderColor : 'rgba(255,255,255,0.08)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 24 }}>{bracket.animal}</Text>
                        <View>
                          <Text style={{ color: isUnlocked ? '#FFF' : '#6B7280', fontWeight: '900', fontSize: 15 }}>
                            {bracket.title}
                          </Text>
                          <Text style={{ color: isUnlocked ? bracket.borderColor : '#4B5563', fontSize: 11, fontWeight: '700' }}>
                            {bracket.range}  ·  {bracket.reqExp.toLocaleString()} exp
                          </Text>
                        </View>
                      </View>
                      {isUnlocked ? (
                        <View style={{ backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#22C55E' }}>
                          <Text style={{ color: '#22C55E', fontWeight: '900', fontSize: 10 }}>DESBLOQUEADO ✅</Text>
                        </View>
                      ) : (
                        <Lock size={16} color="#4B5563" />
                      )}
                    </View>

                    {/* Beneficios del tramo */}
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 12, gap: 8 }}>
                      {bracket.benefits.map((benefit, idx) => (
                        <View key={`benefit-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Sparkles size={12} color={isUnlocked ? bracket.borderColor : '#4B5563'} />
                          <Text style={{ color: isUnlocked ? '#D1D5DB' : '#6B7280', fontSize: 12 }}>
                            {benefit}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* === TAB DE EFECTOS DE ENTRADA === */}
        {activeTab === 'entradas' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
              Al ingresar a cualquier sala de transmisión, tu entrada se mostrará con el marco 3D y animal correspondiente a tu tramo de riqueza actual.
            </Text>

            {WEALTH_BRACKETS.map((bracket, index) => {
              const isUnlocked = wealthLevel >= bracket.minLevel;
              return (
                <Animated.View entering={FadeInUp.delay(index * 80).duration(400)} key={`effect-${bracket.range}`} style={{ marginBottom: 14 }}>
                  <View style={{ backgroundColor: isUnlocked ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: isUnlocked ? bracket.borderColor : 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: bracket.borderColor }}>
                      <Text style={{ fontSize: 26 }}>{bracket.animal}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isUnlocked ? '#FFF' : '#6B7280', fontWeight: '900', fontSize: 14, marginBottom: 2 }}>
                        {bracket.effectName}
                      </Text>
                      <Text style={{ color: isUnlocked ? bracket.borderColor : '#4B5563', fontSize: 11 }}>
                        Marco {bracket.frame}  ·  {bracket.range}
                      </Text>
                    </View>

                    {isUnlocked ? (
                      <Text style={{ fontSize: 18 }}>✨</Text>
                    ) : (
                      <Lock size={16} color="#4B5563" />
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  headerTitle: { color: '#00E5FF', fontSize: 20, fontWeight: '900' },
  progressCard: { borderRadius: 24, padding: 20, borderWidth: 1.5, shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#00E5FF' },
  levelBadge: { position: 'absolute', bottom: -6, alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FFF' },
  levelBadgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  tabText: { color: '#6B7280', fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#00E5FF' },
  tabIndicator: { position: 'absolute', bottom: -1, width: 40, height: 3, backgroundColor: '#00E5FF', borderRadius: 2 },
});
