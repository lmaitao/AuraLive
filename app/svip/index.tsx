import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ChevronLeft, Award, Crown, Sparkles, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const SVIP_LEVELS = [
  { level: 1, req: 10000, color: '#FDE047' },
  { level: 2, req: 50000, color: '#FCD34D' },
  { level: 3, req: 150000, color: '#F59E0B' },
  { level: 4, req: 500000, color: '#D97706' },
  { level: 5, req: 1000000, color: '#B45309' },
];

const PRIVILEGES = [
  { level: 5, items: [{ name: 'Insignia de nivel', icon: '💎' }, { name: 'Entrada avanzada', icon: '✨' }] },
  { level: 10, items: [{ name: 'Insignia de nivel', icon: '🌟' }, { name: 'Notificación actualizada', icon: '🔔' }, { name: 'Entrada avanzada', icon: '🚀' }] },
  { level: 15, items: [{ name: 'Insignia de nivel', icon: '👑' }, { name: 'Notificación actualizada', icon: '📣' }, { name: 'Entrada avanzada VIP', icon: '🏎️' }] }
];

export default function SvipScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const currentLevel = 3;
  const currentExp = 85000;
  const nextLevel = SVIP_LEVELS.find(l => l.level === currentLevel + 1);
  const progress = nextLevel ? currentExp / nextLevel.req : 1;

  const [activeTab, setActiveTab] = useState<'privilegios' | 'tienda'>('privilegios');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05050A' }} edges={['top']}>
      {/* Dark Gold Ambient Background */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient colors={['rgba(217,119,6,0.15)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']} style={StyleSheet.absoluteFillObject} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ChevronLeft size={28} color="#EAB308" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro SVIP</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <Animated.View entering={FadeInDown.duration(600)} style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <LinearGradient colors={['#1F2937', '#111827']} style={styles.progressCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }} style={styles.avatar} />
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>SVIP {currentLevel}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 4 }}>Usuario Aura</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Privilegios Exclusivos Activados</Text>
              </View>
              <Crown size={32} color="#F59E0B" />
            </View>

            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#EAB308', fontWeight: '800', fontSize: 12 }}>SVIP {currentLevel}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>SVIP {currentLevel + 1}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#FDE047', '#D97706']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                />
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                Faltan {nextLevel ? (nextLevel.req - currentExp).toLocaleString() : 0} monedas para actualizar
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
           <TouchableOpacity onPress={() => setActiveTab('privilegios')} style={styles.tabBtn}>
              <Text style={[styles.tabText, activeTab === 'privilegios' && styles.tabTextActive]}>Privilegios</Text>
              {activeTab === 'privilegios' && <View style={styles.tabIndicator} />}
           </TouchableOpacity>
           <TouchableOpacity onPress={() => setActiveTab('tienda')} style={styles.tabBtn}>
              <Text style={[styles.tabText, activeTab === 'tienda' && styles.tabTextActive]}>Tienda de Puntos</Text>
              {activeTab === 'tienda' && <View style={styles.tabIndicator} />}
           </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'privilegios' ? (
           <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {PRIVILEGES.map((priv) => (
                 <Animated.View entering={FadeInUp.delay(priv.level * 10).duration(400)} key={`priv-${priv.level}`} style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                       <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Nvl.{priv.level}</Text>
                       {currentLevel < priv.level && <Text style={{ color: '#4B5563', fontSize: 12 }}>🔒</Text>}
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 16 }}>
                       {priv.items.map((item, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                             <Text style={{ color: '#D1D5DB', fontSize: 14 }}>{item.name}</Text>
                             <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' }}>
                                <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                             </View>
                          </View>
                       ))}
                    </View>
                 </Animated.View>
              ))}
           </View>
        ) : (
           <View style={{ paddingHorizontal: 16, paddingBottom: 40, alignItems: 'center', marginTop: 40 }}>
              <Star size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Tienda de Puntos SVIP</Text>
              <Text style={{ color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 }}>
                 Acumula puntos SVIP al mantener tu nivel activo y cámbialos por marcos de avatar y efectos de sala exclusivos.
              </Text>
           </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  headerTitle: { color: '#EAB308', fontSize: 20, fontWeight: '900' },
  progressCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#F59E0B' },
  levelBadge: { position: 'absolute', bottom: -6, alignSelf: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FEF08A' },
  levelBadgeText: { color: '#000', fontSize: 9, fontWeight: '900', italic: 'italic' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  tabText: { color: '#6B7280', fontSize: 16, fontWeight: '700' },
  tabTextActive: { color: '#F59E0B' },
  tabIndicator: { position: 'absolute', bottom: -1, width: 40, height: 3, backgroundColor: '#F59E0B', borderRadius: 2 }
});
