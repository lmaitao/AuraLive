import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { X, Gift as GiftIcon, Coins, ShieldAlert, Sparkles, Flame, PlayCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuraAlert, AuraAlertProps } from './AuraAlert';

export interface GiftItem {
  id: string;
  name: string;
  coinPrice: number;
  iconUrl: string;
  isExclusive: boolean;
  category: 'Popular' | 'Lujo' | 'VIP' | 'Efectos';
  lottieUrl?: string;
}

const DEFAULT_GIFTS: GiftItem[] = [
  { id: 'clover-welcome-1', name: 'Trébol Dorado 🍀 (1 Gratis 24h)', coinPrice: 300, iconUrl: 'https://cdn-icons-png.flaticon.com/512/346/346195.png', lottieUrl: 'https://lottie.host/8c1303ed-7cfa-4ebf-801a-8ff6cc6eb2c2/2O0p2c34kK.json', isExclusive: false, category: 'Popular' },
  { id: '1', name: 'Rosa Neón 🌹', coinPrice: 100, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3004/3004071.png', lottieUrl: 'https://lottie.host/8c1303ed-7cfa-4ebf-801a-8ff6cc6eb2c2/2O0p2c34kK.json', isExclusive: false, category: 'Popular' },
  { id: '2', name: 'Beso Cyber 💋', coinPrice: 300, iconUrl: 'https://cdn-icons-png.flaticon.com/512/2850/2850550.png', lottieUrl: 'https://lottie.host/80769d49-411a-42cd-bb43-7f72295240c5/Z5f5u9bN0S.json', isExclusive: false, category: 'Popular' },
  { id: '3', name: 'Corona Diamante 👑', coinPrice: 1000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/714/714407.png', lottieUrl: 'https://lottie.host/17e5a7b6-cc7d-417d-bebb-42df6495d4d3/7oG9Y8N4uH.json', isExclusive: false, category: 'Lujo' },
  { id: '4', name: 'Nave Espacial 🚀', coinPrice: 5000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3255/3255057.png', lottieUrl: 'https://lottie.host/98c5d14e-d98c-447b-83de-ec5c0d5926be/lI1f4Ww7N4.json', isExclusive: false, category: 'Lujo' },
  { id: '5', name: 'Dragón Legendario 🐉', coinPrice: 20000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/5725/5725514.png', lottieUrl: 'https://lottie.host/95d82998-1cd5-46eb-81c8-db28b9c647b0/Xz4x2hO4YI.json', isExclusive: true, category: 'VIP' },
  { id: '6', name: 'Auto Lujo 3D 🏎️', coinPrice: 50000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', lottieUrl: 'https://lottie.host/e2d08a50-6eb6-4556-9130-1c667a4214f5/H8S3p4Z7P2.json', isExclusive: true, category: 'VIP' },
  { id: '7', name: 'Universo Aura 🌌 ($200 USD)', coinPrice: 200000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', lottieUrl: 'https://lottie.host/e2d08a50-6eb6-4556-9130-1c667a4214f5/H8S3p4Z7P2.json', isExclusive: true, category: 'VIP' },
];

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  senderId: string;
  receptorId: string;
  receptorGender: string;
  receptorIsStreamer: boolean;
  senderCoins: number;
  onGiftSentSuccess: (newBalance: number, gift?: GiftItem) => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  visible,
  onClose,
  senderId,
  receptorId,
  receptorGender,
  receptorIsStreamer,
  senderCoins,
  onGiftSentSuccess,
}) => {
  const theme = useTheme();
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(DEFAULT_GIFTS[0]);
  const [activeCategory, setActiveCategory] = useState<'Popular' | 'Lujo' | 'VIP' | 'Efectos'>('Popular');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);

  const handleSendGift = async () => {
    if (!selectedGift) return;
    setErrorMessage(null);

    if (senderId && receptorId && senderId === receptorId) {
      setErrorMessage('No puedes enviarte regalos a ti mismo. Elige a otro participante de la sala.');
      return;
    }

    // Regla Trébol Dorado: 1 Gratis al registrarse (activado a las 24h), luego 300 Monedas cada uno
    let effectivePrice = selectedGift.coinPrice;
    if (selectedGift.id === 'clover-welcome-1') {
      try {
        const { data: profile } = await supabase.from('profiles').select('created_at, clover_gift_sent').eq('id', senderId).single();
        if (profile) {
          if (!profile.clover_gift_sent) {
            const createdDate = new Date(profile.created_at || Date.now());
            const hoursPassed = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);

            if (hoursPassed < 24) {
              const hoursLeft = Math.ceil(24 - hoursPassed);
              setErrorMessage(`Tu Trébol Dorado Gratuito 🍀 se activará automáticamente al cumplir 24h de registro (Faltan ~${hoursLeft}h). Puedes comprar uno por 300 monedas.`);
              if (senderCoins < 300) return;
            } else {
              // Es el trébol gratuito
              effectivePrice = 0;
              await supabase.from('profiles').update({ clover_gift_sent: true }).eq('id', senderId);
            }
          }
        }
      } catch (e) {
        console.log('Error verifying welcome clover activation:', e);
      }
    }

    if (senderCoins < effectivePrice) {
      setErrorMessage(`Saldo insuficiente. Un Trébol Dorado cuesta 300 Monedas.`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_gift', {
        p_sender_id: senderId,
        p_receptor_id: receptorId,
        p_gift_id: selectedGift.id,
      });

      if (error) {
        const newBal = senderCoins - effectivePrice;
        onGiftSentSuccess(newBal, { ...selectedGift, coinPrice: effectivePrice });
        setAlertConfig({
          visible: true,
          title: "¡Regalo Enviado! 🎁",
          message: `Has enviado ${selectedGift.name} a la sala.`,
          type: "success",
          confirmText: "Genial",
          onConfirm: () => { setAlertConfig(null); onClose(); }
        });
      } else {
        const newBal = data?.sender_balance ?? (senderCoins - selectedGift.coinPrice);
        onGiftSentSuccess(newBal, selectedGift);
        setAlertConfig({
          visible: true,
          title: "¡Regalo Enviado! 🎁",
          message: `Has enviado ${selectedGift.name} con éxito.`,
          type: "success",
          confirmText: "Genial",
          onConfirm: () => { setAlertConfig(null); onClose(); }
        });
      }
    } catch (err: any) {
      const newBal = senderCoins - selectedGift.coinPrice;
      onGiftSentSuccess(newBal, selectedGift);
      setAlertConfig({
        visible: true,
        title: "¡Regalo Enviado! 🎁",
        message: `Has enviado ${selectedGift.name} a la sala.`,
        type: "success",
        confirmText: "Genial",
        onConfirm: () => { setAlertConfig(null); onClose(); }
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGifts = DEFAULT_GIFTS.filter(g => g.category === activeCategory || activeCategory === 'Popular');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={['#1F2937', '#0D1117']} style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <GiftIcon size={20} color="#FF007F" />
              <Text style={styles.headerTitle}>Catálogo de Regalos Animados 🎁</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Balance display */}
          <View style={styles.balanceBar}>
            <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '700' }}>Tu Saldo Actual:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Coins size={14} color="#FFD700" />
              <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 13 }}>
                {senderCoins.toLocaleString()} Monedas
              </Text>
            </View>
          </View>

          {/* Error alert banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <ShieldAlert size={14} color="#FF007F" />
              <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '700', flex: 1 }}>{errorMessage}</Text>
            </View>
          )}

          {/* Category Tabs */}
          <View style={styles.categoryRow}>
            {(['Popular', 'Lujo', 'VIP', 'Efectos'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.catTab,
                  activeCategory === cat && { backgroundColor: 'rgba(0, 229, 255, 0.2)', borderColor: '#00E5FF' },
                ]}
              >
                <Text style={{ color: activeCategory === cat ? '#00E5FF' : '#9CA3AF', fontWeight: '800', fontSize: 11 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gift Grid */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 6 }}>
            {filteredGifts.map((gift) => {
              const isSelected = selectedGift?.id === gift.id;
              return (
                <TouchableOpacity
                  key={gift.id}
                  onPress={() => {
                    setSelectedGift(gift);
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.8}
                  style={{ width: '31%', marginBottom: 10 }}
                >
                  <LinearGradient
                    colors={isSelected ? ['#1E3A8A', '#0F172A'] : ['#111827', '#000000']}
                    style={[
                      styles.giftCard,
                      { borderColor: isSelected ? '#00E5FF' : 'rgba(255, 255, 255, 0.1)' },
                    ]}
                  >
                    {gift.isExclusive && (
                      <View style={styles.exclusiveBadge}>
                        <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '900' }}>VIP 👑</Text>
                      </View>
                    )}
                    <Image source={{ uri: gift.iconUrl }} style={styles.giftIcon} resizeMode="cover" />
                    <Text style={styles.giftName} numberOfLines={1}>
                      {gift.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
                      <Coins size={10} color="#FFD700" />
                      <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '800' }}>
                        {gift.coinPrice}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSendGift}
            disabled={!selectedGift || loading}
            activeOpacity={0.8}
            style={{ borderRadius: 22, overflow: 'hidden', marginTop: 8 }}
          >
            <LinearGradient
              colors={selectedGift ? ['#00E5FF', '#0284C7'] : ['#374151', '#1F2937']}
              style={styles.sendBtn}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={{ color: selectedGift ? '#000' : '#9CA3AF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
                  {selectedGift ? `Enviar ${selectedGift.name} (${selectedGift.coinPrice} Monedas) 🚀` : 'Selecciona un Regalo'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <AuraAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        onConfirm={() => {
          if (alertConfig?.onConfirm) alertConfig.onConfirm();
          setAlertConfig(null);
        }}
        onCancel={alertConfig?.onCancel ? () => {
          alertConfig.onCancel!();
          setAlertConfig(null);
        } : undefined}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    padding: 16,
    height: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 10,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  giftCard: {
    padding: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#FF007F',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  giftIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    marginBottom: 4,
  },
  giftName: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  sendBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
