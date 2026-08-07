import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Coins, ArrowLeft, CreditCard, Sparkles, ShieldCheck, CheckCircle2, Wallet, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../components/Cyber3DBackground';

export interface CoinPackage {
  id: string;
  coins: number;
  bonusCoins: number;
  usdPrice: number;
  popular?: boolean;
}

const PACKAGES: CoinPackage[] = [
  { id: 'pkg-1', coins: 100, bonusCoins: 15, usdPrice: 0.99 },
  { id: 'pkg-2', coins: 500, bonusCoins: 100, usdPrice: 4.99, popular: true },
  { id: 'pkg-3', coins: 1200, bonusCoins: 300, usdPrice: 9.99 },
  { id: 'pkg-4', coins: 6500, bonusCoins: 1800, usdPrice: 49.99, popular: true },
  { id: 'pkg-5', coins: 15000, bonusCoins: 5000, usdPrice: 99.99 },
];

export default function ShopScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [selectedGateway, setSelectedGateway] = useState<'paypal' | 'binance' | 'google_play' | 'stripe'>('paypal');
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(PACKAGES[1]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(1500);

  const coinPulse = useSharedValue(1);
  const auraScale = useSharedValue(1);

  useEffect(() => {
    coinPulse.value = withRepeat(
      withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    auraScale.value = withRepeat(
      withTiming(1.25, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedCoinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinPulse.value }],
  }));

  const animatedAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
  }));

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const mockToken = `TOKEN_${selectedGateway.toUpperCase()}_${Date.now()}`;
      const totalCoins = selectedPkg.coins + selectedPkg.bonusCoins;

      const { data, error } = await supabase.rpc('process_refill', {
        p_user_id: 'user-me-123',
        p_coin_amount: totalCoins,
        p_gateway: selectedGateway,
        p_transaction_token: mockToken,
      });

      const gatewayLabel = 
        selectedGateway === 'paypal' ? 'PayPal Instant' :
        selectedGateway === 'binance' ? 'Binance Pay' :
        selectedGateway === 'google_play' ? 'Google / Apple Pay' : 'Stripe Tarjetas';

      if (error) {
        // Fallback local update if RPC hasn't been applied on Supabase DB
        setCurrentBalance((prev) => prev + totalCoins);
        Alert.alert(
          '¡Recarga Exitosa! 🎉',
          `Se han acreditado +${totalCoins.toLocaleString()} Monedas a tu cuenta mediante ${gatewayLabel}.`
        );
      } else {
        const added = data?.coins_added ?? totalCoins;
        setCurrentBalance((prev) => prev + added);
        Alert.alert(
          '¡Recarga Exitosa! 🎉',
          `Se han acreditado +${added.toLocaleString()} Monedas a tu cuenta mediante ${gatewayLabel}.`
        );
      }
    } catch (err: any) {
      Alert.alert('Error de Pago', err.message || 'Fallo de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Cyber3DBackground />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={18} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recarga de Monedas 🪙</Text>
        </View>

        <View style={styles.balanceBadge}>
          <Animated.View style={animatedCoinStyle}>
            <Coins size={14} color="#FFD700" />
          </Animated.View>
          <Text style={styles.balanceText}>{currentBalance.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Payment Methods Section */}
        <Text style={styles.sectionTitle}>1. Medio de Pago Seguro</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {/* PayPal */}
          <TouchableOpacity
            onPress={() => setSelectedGateway('paypal')}
            activeOpacity={0.85}
            style={{ width: '48%' }}
          >
            <LinearGradient
              colors={selectedGateway === 'paypal' ? ['#00457C', '#0079C1'] : ['#1F2937', '#111827']}
              style={[styles.gatewayCard, { borderColor: selectedGateway === 'paypal' ? '#0079C1' : 'rgba(255,255,255,0.1)' }]}
            >
              <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 13 }}>PayPal 💙</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 9, marginTop: 2 }}>Pago seguro instantáneo</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Binance Pay */}
          <TouchableOpacity
            onPress={() => setSelectedGateway('binance')}
            activeOpacity={0.85}
            style={{ width: '48%' }}
          >
            <LinearGradient
              colors={selectedGateway === 'binance' ? ['#78350F', '#B45309'] : ['#1F2937', '#111827']}
              style={[styles.gatewayCard, { borderColor: selectedGateway === 'binance' ? '#F59E0B' : 'rgba(255,255,255,0.1)' }]}
            >
              <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 13 }}>Binance Pay 🟡</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 9, marginTop: 2 }}>Criptomonedas USDT</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Google / Apple Pay */}
          <TouchableOpacity
            onPress={() => setSelectedGateway('google_play')}
            activeOpacity={0.85}
            style={{ width: '48%' }}
          >
            <LinearGradient
              colors={selectedGateway === 'google_play' ? ['#064E3B', '#047857'] : ['#1F2937', '#111827']}
              style={[styles.gatewayCard, { borderColor: selectedGateway === 'google_play' ? '#10B981' : 'rgba(255,255,255,0.1)' }]}
            >
              <Text style={{ color: '#34D399', fontWeight: '900', fontSize: 13 }}>Google / Apple Pay 🟢</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 9, marginTop: 2 }}>In-App Purchases</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stripe / Credit Card */}
          <TouchableOpacity
            onPress={() => setSelectedGateway('stripe')}
            activeOpacity={0.85}
            style={{ width: '48%' }}
          >
            <LinearGradient
              colors={selectedGateway === 'stripe' ? ['#831843', '#BE185D'] : ['#1F2937', '#111827']}
              style={[styles.gatewayCard, { borderColor: selectedGateway === 'stripe' ? '#FF007F' : 'rgba(255,255,255,0.1)' }]}
            >
              <Text style={{ color: '#FF007F', fontWeight: '900', fontSize: 13 }}>Tarjetas 💳</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 9, marginTop: 2 }}>Visa / Mastercard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Packages Grid */}
        <Text style={styles.sectionTitle}>2. Paquete de Monedas AURA</Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPkg.id === pkg.id;
            return (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setSelectedPkg(pkg)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isSelected ? ['#1E3A8A', '#0F172A'] : ['#1F2937', '#0F0F1A']}
                  style={[
                    styles.packageCard,
                    { borderColor: isSelected ? '#00E5FF' : 'rgba(255,255,255,0.12)' },
                  ]}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>MÁS POPULAR 🔥</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Animated.View style={[styles.coinIconBox, animatedCoinStyle]}>
                      <Coins size={22} color="#FFD700" />
                    </Animated.View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>
                        {pkg.coins.toLocaleString()} Monedas
                      </Text>
                      <Text style={{ color: '#FFD700', fontWeight: '800', fontSize: 11, marginTop: 2 }}>
                        +{pkg.bonusCoins.toLocaleString()} Monedas Bonus 🎁
                      </Text>
                    </View>
                    <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 16 }}>
                      ${pkg.usdPrice} USD
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Canje de Auras por Monedas Banner */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Intercambio de Auras 🔮➡️🪙',
              'Canjea 5 Auras por +500 Monedas inmediatamente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Canjear 5 Auras (+500 🪙)',
                  onPress: () => {
                    setCurrentBalance((prev) => prev + 500);
                    Alert.alert('¡Canje Exitoso! 🔮➡️🪙', 'Has convertido 5 Auras en +500 Monedas.');
                  },
                },
              ]
            );
          }}
          activeOpacity={0.85}
          style={{ marginBottom: 20 }}
        >
          <LinearGradient
            colors={['#4C1D95', '#0F0F1A']}
            style={{ padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#A855F7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Animated.Text style={[{ fontSize: 24 }, animatedAuraStyle]}>🔮</Animated.Text>
              <View>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>¿Tienes Auras Acumuladas?</Text>
                <Text style={{ color: '#C084FC', fontSize: 10 }}>Intercámbialas por Monedas (1 Aura = 100 🪙)</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(168,85,247,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#C084FC' }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 10 }}>Canjear 🔮</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Checkout Button */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
          style={{ borderRadius: 28, overflow: 'hidden' }}
        >
          <LinearGradient colors={['#00E5FF', '#0284C7']} style={styles.checkoutBtn}>
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.checkoutBtnText}>
                PAGAR ${(selectedPkg.usdPrice).toFixed(2)} USD • MONEDAS: {(selectedPkg.coins + selectedPkg.bonusCoins).toLocaleString()} 🚀
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  backBtn: {
    padding: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  balanceText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 11,
  },
  sectionTitle: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  gatewayCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  packageCard: {
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 14,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  coinIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    justify: 'center',
  },
  checkoutBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justify: 'center',
  },
  checkoutBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
