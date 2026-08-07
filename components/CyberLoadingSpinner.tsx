import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Sparkles, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CyberLoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export const CyberLoadingSpinner: React.FC<CyberLoadingSpinnerProps> = ({
  fullScreen = false,
  message = 'Cargando AuraLive... 🚀',
}) => {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );

    pulseScale.value = withRepeat(
      withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedCenterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: glowOpacity.value,
  }));

  const content = (
    <View style={styles.container}>
      <View style={styles.spinnerWrapper}>
        {/* Animated Rotating Neon Outer Ring */}
        <Animated.View style={[animatedRingStyle, styles.ringContainer]}>
          <LinearGradient
            colors={['#00E5FF', '#FF007F', '#FFD700', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          />
        </Animated.View>

        {/* Center Glowing Icon */}
        <Animated.View style={[animatedCenterStyle, styles.centerIcon]}>
          <Sparkles size={24} color="#00E5FF" />
        </Animated.View>
      </View>

      {message ? (
        <Text style={styles.messageText}>{message}</Text>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenOverlay}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 2, 5, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    justify: 'center',
    padding: 20,
  },
  spinnerWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  ringContainer: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
  },
  gradientRing: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  centerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
