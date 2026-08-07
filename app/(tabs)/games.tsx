import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Flame, Gamepad2, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useFocusEffect } from 'expo-router';

const MULTIPLIERS = [0, 0.5, 1, 2, 0, 5, 0.5, 1.5]; // 8 segments

export default function GamesScreen() {
  const { session } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;

  const fetchBalance = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('wallets').select('coin_balance').eq('user_id', session.user.id).single();
      if (data) setBalance(data.coin_balance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBalance();
    }, [session])
  );

  const spinWheel = async () => {
    if (!session?.user?.id) return;
    if (balance < betAmount) {
      setAlertConfig({
        visible: true,
        title: "Saldo Insuficiente",
        message: "No tienes suficientes monedas para esta apuesta.",
        type: "danger",
        confirmText: "Cerrar",
        onConfirm: () => setAlertConfig(null)
      });
      return;
    }

    setIsSpinning(true);
    
    // Descontar apuesta inmediatamente
    const newBalAfterBet = balance - betAmount;
    setBalance(newBalAfterBet);
    await supabase.from('wallets').update({ coin_balance: newBalAfterBet }).eq('user_id', session.user.id);

    // Calcular resultado
    const randomIndex = Math.floor(Math.random() * MULTIPLIERS.length);
    const multiplier = MULTIPLIERS[randomIndex];
    const winAmount = Math.floor(betAmount * multiplier);
    
    // Animación visual de ruleta
    const spins = 5; 
    const finalAngle = (spins * 360) + (randomIndex * (360 / MULTIPLIERS.length));
    
    Animated.timing(spinAnim, {
      toValue: finalAngle,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(async () => {
      setIsSpinning(false);
      spinAnim.setValue(randomIndex * (360 / MULTIPLIERS.length)); // reset for next spin

      // Otorgar ganancia
      if (winAmount > 0) {
        const finalBal = newBalAfterBet + winAmount;
        setBalance(finalBal);
        await supabase.from('wallets').update({ coin_balance: finalBal }).eq('user_id', session.user.id);
        
        setAlertConfig({
          visible: true,
          title: "¡Ganaste! 🎉",
          message: `Multiplicador x${multiplier}. Has ganado ${winAmount} monedas.`,
          type: "success",
          confirmText: "Reclamar",
          onConfirm: () => setAlertConfig(null)
        });
      } else {
        setAlertConfig({
          visible: true,
          title: "¡Oh no! 😭",
          message: "No hubo suerte esta vez. Sigue intentando.",
          type: "danger",
          confirmText: "Intentar de nuevo",
          onConfirm: () => setAlertConfig(null)
        });
      }
    });
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020205' }} edges={['top']}>
      <Cyber3DBackground />
      <View style={{ flex: 1, padding: 20, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Gamepad2 size={24} color="#FF007F" />
          <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2 }}>AURA CASINO 🎰</Text>
        </View>

        <View style={{ backgroundColor: 'rgba(255, 215, 0, 0.15)', borderWidth: 1, borderColor: '#FFD700', padding: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          <Coins size={20} color="#FFD700" />
          <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 18 }}>Saldo: {balance.toLocaleString()}</Text>
        </View>

        {/* Roulete Visual */}
        <View style={{ width: 300, height: 300, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {/* Indicador */}
          <View style={{ position: 'absolute', top: -15, zIndex: 10 }}>
            <AlertTriangle size={32} color="#00E5FF" style={{ transform: [{ rotate: '180deg' }] }} />
          </View>
          
          <Animated.View style={{ width: 280, height: 280, borderRadius: 140, borderWidth: 4, borderColor: '#FF007F', overflow: 'hidden', transform: [{ rotate: spinInterpolate }] }}>
            {MULTIPLIERS.map((mult, index) => {
              const rotation = (index * (360 / MULTIPLIERS.length));
              return (
                <View key={index} style={{
                  position: 'absolute',
                  width: '50%',
                  height: 2,
                  backgroundColor: 'rgba(255,0,127,0.3)',
                  top: '50%',
                  left: '50%',
                  transform: [{ rotate: `${rotation}deg` }, { translateX: 70 }],
                }}>
                  <Text style={{ color: mult > 1 ? '#00E5FF' : '#FFF', fontWeight: '900', fontSize: 16, transform: [{ rotate: '90deg' }, { translateY: -40 }] }}>x{mult}</Text>
                </View>
              );
            })}
          </Animated.View>
        </View>

        {/* Apuestas */}
        <View style={{ marginTop: 50, width: '100%' }}>
          <Text style={{ color: '#9CA3AF', fontWeight: '700', marginBottom: 10, textAlign: 'center' }}>Selecciona tu apuesta:</Text>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            {[10, 50, 100, 500].map(amt => (
              <TouchableOpacity
                key={amt}
                onPress={() => setBetAmount(amt)}
                style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 2, borderColor: betAmount === amt ? '#00E5FF' : '#374151', backgroundColor: betAmount === amt ? 'rgba(0, 229, 255, 0.2)' : 'transparent' }}
              >
                <Text style={{ color: betAmount === amt ? '#00E5FF' : '#FFF', fontWeight: '800' }}>{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={spinWheel}
            disabled={isSpinning || loading}
            style={{ borderRadius: 20, overflow: 'hidden' }}
          >
            <LinearGradient colors={isSpinning ? ['#374151', '#1F2937'] : ['#FF007F', '#831843']} style={{ paddingVertical: 16, alignItems: 'center' }}>
              {isSpinning ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, textTransform: 'uppercase', letterSpacing: 2 }}>GIRAR RULETA 🔄</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <AuraAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        confirmText={alertConfig?.confirmText}
        onConfirm={() => {
          if (alertConfig?.onConfirm) alertConfig.onConfirm();
          setAlertConfig(null);
        }}
      />
    </SafeAreaView>
  );
}
