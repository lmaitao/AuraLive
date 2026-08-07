import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Tv, User, Film, MessageCircle, Sparkles, Flame, Radio } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedTabItem = ({ focused, icon: IconComponent, label, activeColor = '#00E5FF' }: { focused: boolean; icon: any; label: string; activeColor?: string }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withTiming(1.15, { duration: 250, easing: Easing.out(Easing.back(1.5)) });
      glowOpacity.value = withRepeat(
        withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.itemContainer}>
      <Animated.View style={[animatedStyle, { alignItems: 'center' }]}>
        <IconComponent size={20} color={focused ? activeColor : '#6B7280'} />
        <Text style={[styles.label, { color: focused ? activeColor : '#9CA3AF', fontWeight: focused ? '900' : '600' }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
      {focused && <Animated.View style={[animatedGlowStyle, styles.glowDot, { backgroundColor: activeColor, shadowColor: activeColor }]} />}
    </View>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const tabBarBottom = Math.max(insets.bottom, 4) + (Platform.OS === 'ios' ? 6 : 2);
  const sideMargin = isTablet ? 120 : 12;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: tabBarBottom,
          left: sideMargin,
          right: sideMargin,
          elevation: 0,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'rgba(5, 5, 10, 0.92)',
          borderTopWidth: 1.5,
          borderTopColor: 'rgba(0, 229, 255, 0.4)',
          borderBottomWidth: 1.5,
          borderBottomColor: 'rgba(255, 0, 127, 0.3)',
          borderLeftWidth: 1,
          borderLeftColor: 'rgba(0, 229, 255, 0.3)',
          borderRightWidth: 1,
          borderRightColor: 'rgba(255, 0, 127, 0.3)',
          shadowColor: '#00E5FF',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          overflow: 'hidden',
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, borderRadius: 28, overflow: 'hidden' }}>
            <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
          </View>
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'En Vivo',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={Radio} label="En Vivo" activeColor="#00E5FF" />,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: 'Reels',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={Film} label="Reels" activeColor="#FF007F" />,
        }}
      />
      <Tabs.Screen
        name="conexiones"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={Sparkles} label="Explorar" activeColor="#F59E0B" />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={MessageCircle} label="Mensajes" activeColor="#00E5FF" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={User} label="Perfil" activeColor="#FF007F" />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  itemContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 2 },
  label: { fontSize: 10, marginTop: 2, letterSpacing: 0.2 },
  glowDot: { width: 12, height: 3, borderRadius: 1.5, marginTop: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4 },
});
