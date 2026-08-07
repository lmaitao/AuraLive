import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Gift, Sparkles, CheckCircle2, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DailyCheckinCardProps {
  userId: string;
  onClaimSuccess: (addedCoins: number) => void;
}

export const DailyCheckinCard: React.FC<DailyCheckinCardProps> = ({ userId, onClaimSuccess }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      checkCheckinStatus();
    }
  }, [userId]);

  const checkCheckinStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('last_checkin_date')
        .eq('id', userId)
        .maybeSingle();

      if (data?.last_checkin_date) {
        const lastDate = new Date(data.last_checkin_date).getTime();
        const now = Date.now();
        const diffHours = (now - lastDate) / (1000 * 60 * 60);

        if (diffHours < 24) {
          setClaimedToday(true);
          const remainingHours = Math.ceil(24 - diffHours);
          setTimeRemaining(`${remainingHours}h`);
        } else {
          setClaimedToday(false);
          setTimeRemaining(null);
        }
      }
    } catch (e) {
      console.log('Error checking checkin status:', e);
    }
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_checkin', {
        p_user_id: userId,
      });

      if (error) {
        Alert.alert('Cofre Diario', error.message);
        if (error.message.includes('hoy') || error.message.includes('24')) {
          setClaimedToday(true);
        }
      } else {
        const added = data?.coins_awarded ?? 25;
        setClaimedToday(true);
        setTimeRemaining('24h');
        onClaimSuccess(added);
        Alert.alert('¡Cofre Reclamado! 🎁', `Has recibido +${added} monedas gratis. Próximo reclamo en 24 horas.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#0F0F1A']}
      style={styles.cardContainer}
    >
      <View style={styles.contentLeft}>
        <View style={styles.giftIconBox}>
          <Gift size={22} color="#FFD700" />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.titleText}>Cofre de Recompensa Diario</Text>
            <Sparkles size={12} color="#00E5FF" />
          </View>
          <Text style={styles.subtext}>
            {claimedToday ? `Reclamado. Vuelve en ${timeRemaining || '24h'} para reclamar +25 💰` : 'Reclama tu bonus de +25 monedas cada 24 horas.'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleClaim}
        disabled={loading || claimedToday}
        activeOpacity={0.8}
        style={{ borderRadius: 20, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={claimedToday ? ['#374151', '#1F2937'] : ['#00E5FF', '#0284C7']}
          style={styles.claimBtn}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : claimedToday ? (
            <>
              <CheckCircle2 size={13} color="#34D399" />
              <Text style={{ color: '#34D399', fontWeight: '900', fontSize: 10 }}>Reclamado ({timeRemaining || '24h'})</Text>
            </>
          ) : (
            <Text style={styles.claimBtnText}>Reclamar +25 💰</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  contentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  giftIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  subtext: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  claimBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
