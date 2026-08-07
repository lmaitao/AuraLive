import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Crown, Sparkles, Shield, Flame, Star, Zap } from 'lucide-react-native';

interface VipEntranceOverlayProps {
  username: string;
  isVip?: boolean;
  svipLevel?: number;
  wealthLevel?: number;
  isVisible: boolean;
  onFinished: () => void;
}

export const VipEntranceOverlay: React.FC<VipEntranceOverlayProps> = ({
  username,
  isVip,
  svipLevel = 0,
  wealthLevel = 0,
  isVisible,
  onFinished,
}) => {
  const translateX = useSharedValue(-400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withSequence(
        withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(0, { duration: 3200 }),
        withTiming(400, { duration: 500, easing: Easing.in(Easing.ease) })
      );

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        onFinished();
      }, 4600);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  // Lógica de efectos de entrada por cada 5 niveles de riqueza:
  // Nivel 0-4: Jaguar / Bronce
  // Nivel 5-9: León / Plata
  // Nivel 10-14: Dragón / Oro
  // Nivel 15-19: Águila Imperial / Diamante
  // Nivel 20+: Dragón Platino Galáctico
  const getWealthBadge = (level: number) => {
    if (level >= 20) return { title: 'ENTRADA GALÁCTICA 🌌 (NV. 20+)', color: '#EAB308', animal: '🐲', border: '#FEF08A' };
    if (level >= 15) return { title: 'ENTRADA DIAMANTE 💎 (NV. 15-19)', color: '#38BDF8', animal: '🦅', border: '#7DD3FC' };
    if (level >= 10) return { title: 'ENTRADA ORO 🥇 (NV. 10-14)', color: '#F59E0B', animal: '🐉', border: '#FCD34D' };
    if (level >= 5)  return { title: 'ENTRADA PLATA 🥈 (NV. 5-9)', color: '#94A3B8', animal: '🦁', border: '#CBD5E1' };
    if (level >= 1)  return { title: 'ENTRADA BRONCE 🥉 (NV. 1-4)', color: '#D97706', animal: '🐆', border: '#FBBF24' };
    return { title: 'NUEVO ESPECTADOR 👤', color: '#00E5FF', animal: '✨', border: '#00E5FF' };
  };

  const badgeInfo = getWealthBadge(wealthLevel);
  const effectiveVip = isVip || svipLevel > 0 || wealthLevel > 0;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 220, zIndex: 100 }]}>
      {/* Background Lottie Particle Explosion (VIP ONLY) */}
      {effectiveVip && (
        <LottieView
          source={{
            uri: 'https://assets2.lottiefiles.com/packages/lf20_touohxz0.json',
          }}
          autoPlay
          loop={false}
          style={styles.lottieParticle}
        />
      )}
      
      {/* Animal VIP Lottie */}
      {effectiveVip && (
        <LottieView
          source={{
            uri: 'https://assets4.lottiefiles.com/packages/lf20_q7uarxsb.json',
          }}
          autoPlay
          loop
          style={{ width: 120, height: 120, position: 'absolute', bottom: 250 }}
        />
      )}

      {/* Cyber-VIP Animated Marquee Card */}
      <Animated.View style={[animatedStyle]}>
        <View style={{
          backgroundColor: effectiveVip ? 'rgba(10,10,16,0.9)' : 'rgba(15, 23, 42, 0.8)',
          borderWidth: 1.5,
          borderColor: badgeInfo.border,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: badgeInfo.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }}>
          <Text style={{ fontSize: 24 }}>{badgeInfo.animal}</Text>
          <View>
            <Text style={{ color: badgeInfo.color, fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {badgeInfo.title}
            </Text>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>
              {username} ha ingresado a la sala
            </Text>
          </View>
          <Sparkles size={16} color={badgeInfo.color} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  lottieParticle: {
    position: 'absolute',
    bottom: 180,
    width: 320,
    height: 320,
  },
});
