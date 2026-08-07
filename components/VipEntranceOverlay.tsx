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
import { Crown, Sparkles } from 'lucide-react-native';

interface VipEntranceOverlayProps {
  username: string;
  isVip?: boolean;
  isVisible: boolean;
  onFinished: () => void;
}

export const VipEntranceOverlay: React.FC<VipEntranceOverlayProps> = ({
  username,
  isVip,
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
        withTiming(0, { duration: 3000 }),
        withTiming(400, { duration: 500, easing: Easing.in(Easing.ease) })
      );

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        onFinished();
      }, 4400);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 220, zIndex: 100 }]}>
      {/* Background Lottie Particle Explosion (VIP ONLY) */}
      {isVip && (
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
      {isVip && (
        <LottieView
          source={{
            uri: 'https://assets4.lottiefiles.com/packages/lf20_q7uarxsb.json', // Dragon/Lion/Cool Animal placeholder
          }}
          autoPlay
          loop
          style={{ width: 120, height: 120, position: 'absolute', bottom: 250 }}
        />
      )}

      {/* Cyber-VIP Animated Marquee Card */}
      <Animated.View style={[animatedStyle]}>
        <View style={{ backgroundColor: isVip ? 'rgba(0,0,0,0.7)' : 'rgba(15, 23, 42, 0.8)', borderWidth: 1.5, borderColor: isVip ? '#FFD700' : '#00E5FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: isVip ? '#FFD700' : '#00E5FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5 }}>
          {isVip && <Crown size={18} color="#FFD700" />}
          <View>
            {isVip ? (
              <Text style={{ color: '#FFD700', fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                ENTRADA CYBER-VIP
              </Text>
            ) : (
              <Text style={{ color: '#00E5FF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                NUEVO ESPECTADOR
              </Text>
            )}
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>
              {username} ha ingresado a la sala
            </Text>
          </View>
          <Sparkles size={16} color={isVip ? "#FFD700" : "#00E5FF"} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  lottieParticle: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
