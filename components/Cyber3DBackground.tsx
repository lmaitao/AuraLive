import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export const Cyber3DBackground: React.FC = () => {
  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.25);

  useEffect(() => {
    orbScale.value = withRepeat(
      withTiming(1.35, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orbOpacity.value = withRepeat(
      withTiming(0.45, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedOrbCyan = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  const animatedOrbPink = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * 0.9 }],
    opacity: orbOpacity.value * 0.85,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* 3D Cyan Glowing Orb */}
      <Animated.View
        style={[
          animatedOrbCyan,
          {
            position: 'absolute',
            top: -60,
            left: -50,
            width: 270,
            height: 270,
            borderRadius: 135,
            backgroundColor: 'rgba(0, 229, 255, 0.18)',
          },
        ]}
      />

      {/* 3D Pink Glowing Orb */}
      <Animated.View
        style={[
          animatedOrbPink,
          {
            position: 'absolute',
            top: '35%',
            right: -60,
            width: 290,
            height: 290,
            borderRadius: 145,
            backgroundColor: 'rgba(255, 0, 127, 0.15)',
          },
        ]}
      />
    </View>
  );
};
