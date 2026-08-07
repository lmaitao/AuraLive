import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../hooks/useTheme';
import { Clock, ShieldCheck } from 'lucide-react-native';

interface CloverProgressProps {
  unlockedLeaves: number; // 0 to 5
  accumulatedCoins: number; // e.g. 15,000
  streamMinutes: number; // e.g. 180 (out of 240)
}

export const CloverProgress: React.FC<CloverProgressProps> = ({
  unlockedLeaves,
  accumulatedCoins,
  streamMinutes,
}) => {
  const theme = useTheme();

  return (
    <View
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      className="p-2.5 rounded-2xl border border-cyan-500/40 my-2 flex-row items-center justify-between shadow-lg"
    >
      {/* 5-Leaf Clover visual indicator */}
      <View className="flex-row items-center">
        <View className="w-10 h-10 mr-2 justify-center items-center">
          <LottieView
            source={{
              uri: 'https://assets5.lottiefiles.com/packages/lf20_j1adxtyb.json',
            }}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>

        <View>
          <Text style={{ color: theme.accentGold }} className="font-bold text-xs">
            Meta Trébol 🍀 ({unlockedLeaves}/5 Hojas)
          </Text>
          <Text style={{ color: theme.subtext }} className="text-[10px]">
            {accumulatedCoins.toLocaleString()} / 25,000 monedas
          </Text>
        </View>
      </View>

      {/* Leaf Icons Row */}
      <View className="flex-row items-center gap-1">
        {[1, 2, 3, 4, 5].map((leaf) => (
          <Text
            key={leaf}
            className={`text-sm ${
              leaf <= unlockedLeaves ? 'opacity-100' : 'opacity-25'
            }`}
          >
            🍀
          </Text>
        ))}
      </View>

      {/* 4-Hour Stream Timer Status */}
      <View className="items-end pl-2 border-l border-cyan-500/20">
        <View className="flex-row items-center gap-1">
          <Clock size={12} color={streamMinutes >= 240 ? '#00E5FF' : theme.subtext} />
          <Text
            style={{ color: streamMinutes >= 240 ? theme.accentCyan : theme.text }}
            className="text-[11px] font-semibold"
          >
            {Math.floor(streamMinutes / 60)}h {streamMinutes % 60}m / 4h
          </Text>
        </View>
        {streamMinutes >= 240 && unlockedLeaves >= 5 && (
          <View className="flex-row items-center mt-0.5">
            <ShieldCheck size={10} color="#00E5FF" />
            <Text className="text-[9px] text-cyan-400 font-bold ml-0.5">META CUMPLIDA</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lottie: {
    width: 36,
    height: 36,
  },
});
