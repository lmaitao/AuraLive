import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { api, CoinPackageCatalogItem, FALLBACK_COIN_PACKAGES } from '../lib/api';
import { Coins, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../components/Cyber3DBackground';

export type CoinPackage = CoinPackageCatalogItem;

export default function ShopScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [packages, setPackages] = useState<CoinPackage[]>(FALLBACK_COIN_PACKAGES);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'google_play'>(
    Platform.OS === 'android' ? 'google_play' : 'stripe'
  );
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(FALLBACK_COIN_PACKAGES[0]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [currentAuras, setCurrentAuras] = useState(0);

  const coinPulse = useSharedValue(1);
  const auraScale = useSharedValue(1);

  useEffect(() => {
    loadShopData();
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

  const loadShopData = async () => {
    try {
      const [catalog, { data: { user } }] = await Promise.all([
        api.catalogs.getCoinPackages(),
        supabase.auth.getUser(),
      ]);

      if (catalog.length > 0) {
        setPackages(catalog);
        setSelectedPkg(catalog[0]);
      }

      if (user) {
        const wallet = await api.wallet.getBalance(user.id);
        setCurrentBalance(wallet.coinBalance);
        setCurrentAuras(wallet.auraBalance);
      }
    } catch (_) {}
  };

  const animatedCoinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinPulse.value }],
  }));

  const animatedAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
  }));

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sesión Requerida', 'Debes iniciar sesión para realizar una recarga de monedas.', [
          { text: 'Iniciar Sesión', onPress: () => router.push('/auth/login' as any) },
          { text: 'Cancelar', style: 'cancel' },
        ]);
        return;
      }

      if (selectedGateway === 'stripe') {
        const returnUrl = Linking.createURL('/shop');
        const res = await api.payments.createStripeCheckout(
          selectedPkg.id,
          `${returnUrl}?status=success`,
          `${returnUrl}?status=cancelled`
        );

        if (!res.checkout_url) {
          throw new Error('No se recibió URL de pago desde Stripe.');
        }

        await WebBrowser.openBrowserAsync(res.checkout_url);
        // Al regresar del navegador, consultar el saldo actualizado por el webhook de Stripe
        const updatedWallet = await api.wallet.getBalance(user.id);
        setCurrentBalance(updatedWallet.coinBalance);
        setCurrentAuras(updatedWallet.auraBalance);
        return;
      }

      if (selectedGateway === 'google_play') {
        if (Platform.OS !== 'android') {
          Alert.alert(
            'Google Play Billing',
            'Las compras integradas de Google Play solo están disponibles en dispositivos Android. Usa Tarjetas (Stripe) en esta plataforma.'
          );
          return;
        }

        const sku = selectedPkg.googlePlayProductId || `com.auralive.coins.${selectedPkg.usdPrice}usd`;
        const ExpoIap: any = await import('expo-iap');
        await ExpoIap.initConnection();

        const purchaseResult = await ExpoIap.requestPurchase({
          request: {
            android: { skus: [sku] },
          },
          type: 'in-app',
        });

        const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
        const purchaseToken = purchase?.purchaseToken || purchase?.transactionReceipt;

        if (!purchaseToken) {
          throw new Error('No se obtuvo el token de compra de Google Play.');
        }

        const verifyRes = await api.payments.verifyGooglePlay({
          packageId: selectedPkg.id,
          productId: sku,
          purchaseToken,
        });

        try {
          await ExpoIap.finishTransaction({ purchase, isConsumable: true });
        } catch (_) {}

        setCurrentBalance(verifyRes.new_balance);
        Alert.alert(
          '¡Recarga Verificada! 🎉',
          `Se han acreditado +${verifyRes.coins_credited.toLocaleString()} Monedas a tu billetera.`
        );
      }
    } catch (err: any) {
      Alert.alert('Error de Pago', err.message || 'No se pudo procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeFiveAuras = () => {
    Alert.alert(
      'Intercambio de Auras 🔮➡️🪙',
      `Tienes ${currentAuras.toLocaleString()} Auras disponibles.\n¿Deseas canjear 5 Auras por +500 Monedas inmediatamente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear 5 Auras (+500 🪙)',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await api.wallet.exchangeAurasForCoins(5);
              setCurrentBalance(res.new_coin_balance);
              setCurrentAuras(res.new_aura_balance);
              Alert.alert('¡Canje Exitoso! 🔮➡️🪙', 'Has convertido 5 Auras en +500 Monedas.');
            } catch (e: any) {
              Alert.alert('No se pudo canjear', e.message || 'Saldo insuficiente de Auras.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
        <Text style={styles.sectionTitle}>1. Medio de Pago Oficial Verificado</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
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
              <Text style={{ color: '#FF007F', fontWeight: '900', fontSize: 13 }}>Stripe Tarjetas 💳</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 9, marginTop: 2 }}>Visa / Mastercard / Apple Pay</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Google Play Billing */}
          <TouchableOpacity
            onPress={() => setSelectedGateway('google_play')}
            activeOpacity={0.85}
            style={{ width: '48%' }}
          >
            <LinearGradient
              colors={selectedGateway === 'google_play' ? ['#064E3B', '#047857'] : ['#1F2937', '#111827']}
              style={[styles.gatewayCard, { borderColor: selectedGateway === 'google_play' ? '#10B981' : 'rgba(255,255,255,0.1)' }]}
            >
              <Text style={{ color: '#34D399', fontWeight: '900', fontSize: 13 }}>Google Play 🟢</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 9, marginTop: 2 }}>In-App Purchases Oficial</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Packages Grid */}
        <Text style={styles.sectionTitle}>2. Paquete de Monedas AURA</Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          {packages.map((pkg) => {
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
                  {pkg.isMax && (
                    <View style={[styles.popularBadge, { backgroundColor: '#EC4899' }]}>
                      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>RECARGA MÁXIMA $200 🌌</Text>
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
          onPress={handleExchangeFiveAuras}
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
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>¿Tienes Auras Acumuladas? ({currentAuras} 🔮)</Text>
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
    justifyContent: 'space-between',
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
    justifyContent: 'center',
  },
  checkoutBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
