import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Tv, User, Film, MessageSquare, Heart, Gamepad2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedTabItem = ({ focused, icon: IconComponent, label }: { focused: boolean; icon: any; label: string }) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withTiming(1.1, { duration: 250, easing: Easing.out(Easing.back(1.5)) });
      glowOpacity.value = withRepeat(
        withTiming(0.85, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
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
        <IconComponent size={18} color={focused ? '#00E5FF' : '#9CA3AF'} />
        <Text style={[styles.label, { color: focused ? '#00E5FF' : '#9CA3AF', fontWeight: focused ? '800' : '600' }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
      {focused && <Animated.View style={[animatedGlowStyle, styles.glowDot]} />}
    </View>
  );
};

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const tabBarBottom = Math.max(insets.bottom, 4) + (Platform.OS === 'ios' ? 6 : 2);
  const sideMargin = isTablet ? 120 : 14;

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
          height: 54,
          borderRadius: 27,
          backgroundColor: 'rgba(10, 10, 16, 0.88)',
          borderTopWidth: 1.5,
          borderTopColor: 'rgba(0, 229, 255, 0.35)',
          borderBottomWidth: 1.5,
          borderBottomColor: 'rgba(255, 0, 127, 0.25)',
          borderLeftWidth: 1,
          borderLeftColor: 'rgba(0, 229, 255, 0.25)',
          borderRightWidth: 1,
          borderRightColor: 'rgba(255, 0, 127, 0.25)',
          shadowColor: '#00E5FF',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          overflow: 'hidden',
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, borderRadius: 27, overflow: 'hidden' }}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          </View>
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'En Vivo',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={Tv} label="En Vivo" />,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: 'Momentos',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={Film} label="Reels" />,
        }}
      />
      <Tabs.Screen
        name="conexiones"
        options={{
          title: 'Conexiones',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={Heart} label="Conexiones" />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Juegos',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={Gamepad2} label="Juegos" />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={MessageSquare} label="Chats" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Yo',
          tabBarIcon: ({ focused }) => <AnimatedTabItem focused={focused} icon={User} label="Yo" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  itemContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 2 },
  label: { fontSize: 9, marginTop: 2, letterSpacing: 0.2 },
  glowDot: { width: 10, height: 2.5, borderRadius: 1.2, backgroundColor: '#00E5FF', marginTop: 2 },
});
