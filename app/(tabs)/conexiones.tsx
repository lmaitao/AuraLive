import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions, StyleSheet, Modal, PanResponder } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Heart, X, Search, Sparkles, MessageCircle, Flame, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';

const MOCK_PROFILES = [
  {
    id: '1',
    name: 'Mariana',
    age: 23,
    country: 'República Dominicana 🇩🇴',
    city: 'Santiago',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
    status: 'Activa',
    tag: 'Streamer VIP',
    intent: 'Buscar una relación',
    bio: 'Apasionada por la música cyberpunk y los viajes. ¡Escríbeme! ✨',
  },
  {
    id: '2',
    name: 'Elena Neo',
    age: 25,
    country: 'Colombia 🇨🇴',
    city: 'Medellín',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    status: 'Activa',
    tag: 'Popular',
    intent: 'Hacer amigos',
    bio: 'Me encanta transmitir en vivo y crear contenido 🎥',
  },
  {
    id: '3',
    name: 'Sofia Mendoza',
    age: 22,
    country: 'México 🇲🇽',
    city: 'CDMX',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    status: 'En Vivo',
    tag: 'Top 100',
    intent: 'Conocer gente',
    bio: 'DJ & Creadora de contenido en AURA LIVE 🎧',
  },
  {
    id: '4',
    name: 'Valentina',
    age: 24,
    country: 'Argentina 🇦🇷',
    city: 'Buenos Aires',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    status: 'Activa',
    tag: 'Gremio Leader',
    intent: 'Buscar parejita',
    bio: 'Buscando con quién compartir momentos en salas 3D 💖',
  },
];

export default function ConexionesScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);

  // Card dimensions for Tinder layout
  const cardWidth = Math.min(width - 24, 420);
  const cardHeight = Math.min(height * 0.60, 500);

  // Reanimated values for Tinder Swipe
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const currentProfile = MOCK_PROFILES[currentIndex % MOCK_PROFILES.length];

  const triggerNext = (direction: 'like' | 'pass') => {
    if (direction === 'like') {
      translateX.value = withTiming(width * 1.2, { duration: 300 }, () => {
        runOnJS(handleMatch)(currentProfile);
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
    setCurrentIndex((prev) => (prev + 1) % MOCK_PROFILES.length);
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
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>Conexiones 3D 💕</Text>
        </View>
        <View style={styles.counterBadge}>
          <Sparkles size={12} color="#FFD700" />
          <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800' }}>Match Radar</Text>
        </View>
      </View>

      {/* Main Tinder Card Container */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
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

        {/* Action Buttons Bar – positioned above floating tab bar */}
        <View style={styles.actionsBar}>
          {/* Pass / Dislike */}
          <TouchableOpacity
            onPress={() => triggerNext('pass')}
            activeOpacity={0.8}
            style={styles.passBtn}
          >
            <X size={26} color="#FF3B30" />
          </TouchableOpacity>

          {/* Super Like / Star */}
          <TouchableOpacity
            onPress={() => triggerNext('like')}
            activeOpacity={0.8}
            style={styles.superLikeBtn}
          >
            <Sparkles size={22} color="#00E5FF" />
          </TouchableOpacity>

          {/* Like / Heart */}
          <TouchableOpacity
            onPress={() => triggerNext('like')}
            activeOpacity={0.8}
            style={styles.likeBtn}
          >
            <Heart size={26} color="#FFF" fill="#FFF" />
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
              onPress={() => setMatchModalVisible(false)}
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
  actionsBar: { position: 'absolute', bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 24 },
  passBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', elevation: 6 },
  superLikeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,229,255,0.2)', borderWidth: 1.5, borderColor: '#00E5FF', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  likeBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF007F', alignItems: 'center', justifyContent: 'center', elevation: 8 },
  matchOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 },
  matchCard: { borderRadius: 28, padding: 24, borderWidth: 1.5, borderColor: '#FF007F', width: '100%', maxWidth: 360, alignItems: 'center' },
  matchAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#00E5FF' },
  chatBtn: { width: '100%', paddingVertical: 14, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});

