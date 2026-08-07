import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, Easing, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Flame, Shield, Radio } from 'lucide-react-native';

interface AuraLaunchSplashProps {
  onFinish?: () => void;
}

export const AuraLaunchSplash: React.FC<AuraLaunchSplashProps> = ({ onFinish }) => {
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);

  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const ringRotate = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Entrance 3D scale and fade in
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 10, stiffness: 80 });

    // 2. Rotating glowing ring animation
    ringRotate.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    ringScale.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // 3. Auto dismiss splash after 2.2s
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(dismiss)();
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (onFinish) onFinish();
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${ringRotate.value}deg` },
      { scale: ringScale.value },
    ],
  }));

  const animatedScreenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animatedScreenStyle, styles.container]} pointerEvents="none">
      {/* Background 3D Animated Ambient Gradient & Orbs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient colors={['#020205', '#0F0F1A', '#020205']} style={StyleSheet.absoluteFillObject} />
        
        {/* Animated Rotating Glowing Ring */}
        <Animated.View style={[animatedRingStyle, styles.orbGlowCyan]} />
        <Animated.View style={[animatedRingStyle, styles.orbGlowPink]} />
      </View>

      {/* Main 3D Brand Logo & Icon */}
      <Animated.View style={[animatedLogoStyle, styles.logoContainer]}>
        <LinearGradient colors={['#FF007F', '#00E5FF']} style={styles.iconBorder}>
          <View style={styles.iconInner}>
            <Sparkles size={48} color="#00E5FF" />
          </View>
        </LinearGradient>

        <Text style={styles.brandTitle}>AuraLive</Text>
        <Text style={styles.brandSubtitle}>PLATAFORMA SOCIAL 3D NEO-CYBERPUNK</Text>

        <View style={styles.loadingIndicator}>
          <Radio size={14} color="#00E5FF" />
          <Text style={styles.loadingText}>INICIALIZANDO MOTOR 3D...</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020205',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  orbGlowCyan: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  orbGlowPink: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 0, 127, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 127, 0.3)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBorder: {
    padding: 3,
    borderRadius: 36,
    marginBottom: 20,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  iconInner: {
    width: 90,
    height: 90,
    borderRadius: 33,
    backgroundColor: '#0A0A12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 3,
    marginTop: 6,
    textAlign: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 40,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  loadingText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
