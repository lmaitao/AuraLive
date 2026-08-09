import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions, StyleSheet, Modal, PanResponder } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Heart, X, Search, Sparkles, MessageCircle, Flame, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';

import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { isNewUser } from '../../lib/userHelpers';

export default function ConexionesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [filterTab, setFilterTab] = useState<'populares' | 'nuevos' | 'visitados' | 'todos'>('populares');

  React.useEffect(() => {
    fetchProfiles(filterTab);
  }, [filterTab]);

  const fetchProfiles = async (tab: 'populares' | 'nuevos' | 'visitados' | 'todos' = filterTab) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase.from('profiles').select('*');
      if (user) {
        query = query.neq('id', user.id);
      }

      if (tab === 'populares') {
        query = query.order('wealth_level', { ascending: false }).order('created_at', { ascending: false });
      } else if (tab === 'nuevos') {
        query = query.order('created_at', { ascending: false });
      } else if (tab === 'visitados') {
        query = query.order('wealth_experience', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      const mappedProfiles = (data || []).map(prof => {
        let age = 20;
        if (prof.birth_date) {
          const birth = new Date(prof.birth_date);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
            age--;
          }
        }
        const isNew = isNewUser(prof);
        return {
          id: prof.id,
          name: prof.full_name || 'Usuario Aura',
          age: age,
          country: prof.gender === 'female' ? 'Mujer ♀️' : 'Hombre ♂️',
          city: 'Aura Live',
          imageUrl: prof.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
          status: prof.status === 'verified' || prof.is_identity_verified ? 'Verificado ✅' : 'Activo',
          tag: (prof.wealth_level || 0) > 5 ? `Popular Nv.${prof.wealth_level} 🔥` : (prof.svip_level ? `SVIP ${prof.svip_level}` : (isNew ? 'Nuevo 🍀' : 'Usuario Aura')),
          intent: 'Conocer gente y transmitir',
          bio: prof.bio || '¡Hola! Estoy en Aura Live',
        };
      });

      setProfiles(mappedProfiles);
      setCurrentIndex(0);
    } catch (e) {
      console.error('Error fetching real profiles', e);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Card dimensions for Tinder layout
  const cardWidth = Math.min(width - 32, 400);
  const cardHeight = height * 0.72;

  // Reanimated values for Tinder Swipe
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const currentProfile = profiles.length > 0 ? profiles[currentIndex % profiles.length] : null;

  const triggerNext = async (direction: 'like' | 'pass') => {
    if (direction === 'like' && currentProfile) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // 1. Follow the user in Supabase
          await supabase.from('followers').insert({
            follower_id: user.id,
            following_id: currentProfile.id
          });
          
          // 2. Send Match Notification DM to target user
          await supabase.from('direct_messages').insert({
            sender_id: user.id,
            receiver_id: currentProfile.id,
            content: '¡Te he dado un Match 💕 en Conexiones Aura Live! Sígueme de vuelta para chatear en privado.',
          });

          // 3. Check if they follow us back (Mutual Match)
          const { data: mutual } = await supabase.from('followers')
            .select('*')
            .eq('follower_id', currentProfile.id)
            .eq('following_id', user.id)
            .maybeSingle();
            
          if (mutual) {
            translateX.value = withTiming(width * 1.2, { duration: 300 }, () => {
              runOnJS(handleMatch)(currentProfile);
            });
            rotate.value = withTiming(15, { duration: 300 });
            return; // Skip normal advance
          }
        }
      } catch (e) {
        console.log('Follow/Match error:', e);
      }
      
      translateX.value = withTiming(width * 1.2, { duration: 300 }, () => {
        runOnJS(advanceIndex)();
      });
      rotate.value = withTiming(15, { duration: 300 });
    } else {
      translateX.value = withTiming(-width * 1.2, { duration: 300 }, () => {
        runOnJS(advanceIndex)();
      });
      rotate.value = withTiming(-15, { duration: 300 });
    }
  };

  const handleMatch = (profile: any) => {
    setMatchedProfile(profile);
    setMatchModalVisible(true);
    advanceIndex();
  };

  const advanceIndex = () => {
    translateX.value = 0;
    rotate.value = 0;
    cardScale.value = 0.95;
    cardScale.value = withSpring(1);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, profiles.length));
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: cardScale.value },
    ],
  }));

  // PanResponder for smooth drag swipe gesture
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        translateX.value = gestureState.dx;
        rotate.value = (gestureState.dx / width) * 25;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 120) {
          triggerNext('like');
        } else if (gestureState.dx < -120) {
          triggerNext('pass');
        } else {
          translateX.value = withSpring(0);
          rotate.value = withSpring(0);
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Cyber3DBackground />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Flame size={22} color="#FF007F" />
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>Conexiones 💕</Text>
        </View>
        <View style={styles.counterBadge}>
          <Sparkles size={12} color="#FFD700" />
          <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800' }}>Match Radar</Text>
        </View>
      </View>

      {/* Filter Tabs: Populares / Nuevos / Visitados */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => setFilterTab('populares')}>
          <LinearGradient colors={filterTab === 'populares' ? ['#FF007F', '#7C3AED'] : ['#1F2937', '#111827']} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Flame size={13} color={filterTab === 'populares' ? '#FFF' : '#9CA3AF'} />
            <Text style={{ color: filterTab === 'populares' ? '#FFF' : '#9CA3AF', fontWeight: '800', fontSize: 11 }}>🔥 Populares</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilterTab('nuevos')}>
          <LinearGradient colors={filterTab === 'nuevos' ? ['#00E5FF', '#0284C7'] : ['#1F2937', '#111827']} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} color={filterTab === 'nuevos' ? '#000' : '#9CA3AF'} />
            <Text style={{ color: filterTab === 'nuevos' ? '#000' : '#9CA3AF', fontWeight: '800', fontSize: 11 }}>🍀 Nuevos</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilterTab('visitados')}>
          <LinearGradient colors={filterTab === 'visitados' ? ['#34D399', '#059669'] : ['#1F2937', '#111827']} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: filterTab === 'visitados' ? '#000' : '#9CA3AF', fontWeight: '800', fontSize: 11 }}>👁️ Visitados</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Main Tinder Card Container */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 110 }}>
        {currentProfile ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[animatedCardStyle, { width: cardWidth, height: cardHeight }]}
          >
            <LinearGradient colors={['#FF007F', '#00E5FF']} style={{ padding: 2, borderRadius: 28, height: '100%' }}>
              <View style={styles.cardInner}>
                <Image source={{ uri: currentProfile.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                
                {/* Gradient Overlay for text readability */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Status Badge */}
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                    {currentProfile.status}
                  </Text>
                </View>

                {/* Tag Badge */}
                <View style={styles.tagBadge}>
                  <Text style={{ color: '#00E5FF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                    {currentProfile.tag}
                  </Text>
                </View>

                {/* Bottom Overlay Info */}
                <View style={styles.profileOverlay}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '900' }}>{currentProfile.name}</Text>
                    <Text style={{ color: '#FF007F', fontSize: 22, fontWeight: '800' }}>{currentProfile.age}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <MapPin size={13} color="#9CA3AF" />
                    <Text style={{ color: '#D1D5DB', fontSize: 12, fontWeight: '600' }}>{currentProfile.country}, {currentProfile.city}</Text>
                  </View>

                  <Text style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 8, lineHeight: 15 }} numberOfLines={2}>
                    {currentProfile.bio}
                  </Text>

                  <View style={styles.intentChip}>
                    <Search size={12} color="#FFD700" />
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{currentProfile.intent}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        ) : null}

        {/* Action Buttons Bar – positioned overlapping the bottom of the card */}
        <View style={styles.actionsBar}>
          {/* Pass / Dislike */}
          <TouchableOpacity
            onPress={() => triggerNext('pass')}
            activeOpacity={0.8}
            style={styles.passBtn}
          >
            <X size={32} color="#FF3B30" />
          </TouchableOpacity>

          {/* Like / Heart */}
          <TouchableOpacity
            onPress={() => triggerNext('like')}
            activeOpacity={0.8}
            style={styles.likeBtn}
          >
            <Heart size={32} color="#FFF" fill="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Match Modal */}
      <Modal visible={matchModalVisible} transparent animationType="fade">
        <View style={styles.matchOverlay}>
          <LinearGradient colors={['#1F2937', '#0A0A10']} style={styles.matchCard}>
            <Text style={{ color: '#FF007F', fontSize: 28, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 6 }}>
              ¡ES UN MATCH! 💕
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>
              A ti y a {matchedProfile?.name} les gusta el perfil del otro.
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }} style={styles.matchAvatar} />
              <Heart size={28} color="#FF007F" fill="#FF007F" />
              <Image source={{ uri: matchedProfile?.imageUrl }} style={styles.matchAvatar} />
            </View>

            <TouchableOpacity
              onPress={() => {
                setMatchModalVisible(false);
                router.push('/(tabs)/messages' as any);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#FF007F', '#7C3AED']} style={styles.chatBtn}>
                <MessageCircle size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Iniciar Chat Privado 💬</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMatchModalVisible(false)} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontWeight: '700', fontSize: 12 }}>Seguir Deslizando</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,0,127,0.2)' },
  counterBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: '#FFD700' },
  cardInner: { flex: 1, borderRadius: 26, overflow: 'hidden', backgroundColor: '#111827', position: 'relative' },
  statusBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(34,197,94,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  tagBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: '#00E5FF' },
  profileOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  intentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start' },
  actionsBar: { position: 'absolute', bottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 50 },
  passBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  likeBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF8C00', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  matchOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 },
  matchCard: { borderRadius: 28, padding: 24, borderWidth: 1.5, borderColor: '#FF007F', width: '100%', maxWidth: 360, alignItems: 'center' },
  matchAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#00E5FF' },
  chatBtn: { width: '100%', paddingVertical: 14, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});

