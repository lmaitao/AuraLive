import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { ArrowLeft, Clock, Clover, Gift, Sparkles, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function StreamerDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [streamHours, setStreamHours] = useState(0);
  const [clovers, setClovers] = useState(0);
  const [kGifts, setKGifts] = useState(0);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isAgencyLinked, setIsAgencyLinked] = useState(false);
  const [agencyName, setAgencyName] = useState('Sin Agencia');
  const [auraBalance, setAuraBalance] = useState(0);

  // Withdrawal Modal state
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmountAuras, setWithdrawAmountAuras] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState('USDT (TRC20)');
  const [accountDestination, setAccountDestination] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const isAllTasksCompleted = streamHours >= 3 && clovers >= 5 && kGifts >= 10;

  useEffect(() => {
    loadStreamerData();
  }, []);

  const loadStreamerData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id, agency_request_status, is_agency')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.agency_id && profile.agency_request_status !== 'pending') {
        setIsAgencyLinked(true);
        const { data: ag } = await supabase
          .from('agencies')
          .select('name')
          .eq('id', profile.agency_id)
          .maybeSingle();
        if (ag?.name) setAgencyName(ag.name);
      } else if (profile?.is_agency) {
        setIsAgencyLinked(true);
        setAgencyName('Agencia Propia');
      }

      const { data: wallet } = await supabase
        .from('wallets')
        .select('aura_balance')
        .eq('user_id', user.id)
        .maybeSingle();
      if (wallet) setAuraBalance(wallet.aura_balance || 0);

      const today = new Date().toISOString().split('T')[0];
      const { data: mission } = await supabase
        .from('streamer_daily_missions')
        .select('*')
        .eq('user_id', user.id)
        .eq('mission_date', today)
        .maybeSingle();

      if (mission) {
        setStreamHours(Math.round(((mission.accumulated_minutes || 0) / 60) * 10) / 10);
        setClovers(mission.received_clovers || 0);
        setKGifts(Math.round(((mission.received_gift_coins || 0) / 1000) * 10) / 10);
        setHasClaimed(Boolean(mission.reward_claimed));
      }
    } catch (e) {
      console.log('Error loading streamer data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAgency = () => {
    router.push('/(tabs)/profile' as any);
  };

  const handleClaimReward = async () => {
    if (!isAgencyLinked) {
      Alert.alert('Enlace Requerido', 'Debes estar vinculada a una Agencia Oficial para desbloquear el reclamo de metas diarias.');
      return;
    }
    if (!isAllTasksCompleted) {
      Alert.alert('Tareas Incompletas', 'Debes completar todas las tareas diarias antes de reclamar el bono.');
      return;
    }

    try {
      const res = await api.streamer.claimDailyMission();
      setHasClaimed(true);
      setAuraBalance(res.new_aura_balance ?? (auraBalance + 2000));
      Alert.alert(
        '¡Felicidades Presentadora! 🌟',
        `Has cumplido todas tus tareas diarias con éxito.\n\nSe han abonado +${res.auras_rewarded || 2000} Auras ($2.00 USD) a tu billetera convertible.`
      );
    } catch (e: any) {
      Alert.alert('Error al reclamar', e.message || 'No se pudo reclamar el bono diario.');
    }
  };

  const handleSubmitWithdrawal = async () => {
    const amount = parseInt(withdrawAmountAuras, 10);
    if (isNaN(amount) || amount < 10000) {
      Alert.alert('Monto inválido', 'El retiro mínimo es de 10,000 Auras ($10.00 USD).');
      return;
    }
    if (!accountDestination.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa tu dirección de billetera o cuenta destino.');
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      const res = await api.withdrawals.request({
        coin_amount: amount,
        payment_method: paymentMethod,
        account_details: { destination: accountDestination.trim() },
        applicant_type: 'streamer',
      });
      setAuraBalance(res.new_aura_balance);
      setWithdrawModalVisible(false);
      setAccountDestination('');
      Alert.alert(
        'Solicitud Enviada 💸',
        `Tu solicitud de retiro por $${res.usd_equivalent.toFixed(2)} USD (${amount.toLocaleString()} Auras) fue registrada y está en revisión.`
      );
    } catch (e: any) {
      Alert.alert('Error al solicitar retiro', e.message || 'Verifica tu saldo e intenta nuevamente.');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, marginRight: 16 }}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 20 }}>Panel de Presentadora 🌟</Text>
          <Text style={{ color: '#F472B6', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' }}>
            {isAgencyLinked ? `Enlazada a: ${agencyName}` : 'Requiere Enlace de Agencia'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        {loading ? (
          <ActivityIndicator color="#FF007F" size="large" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Wallet & Withdrawal Card */}
            <LinearGradient colors={['#4C1D95', '#0F172A']} style={{ padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: '#A855F7', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View>
                  <Text style={{ color: '#C084FC', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>Saldo Retirable (Auras)</Text>
                  <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 2 }}>{auraBalance.toLocaleString()} 🔮</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>Equivalente: ~${(auraBalance / 1000).toFixed(2)} USD</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setWithdrawModalVisible(true)}
                  style={{ backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <DollarSign size={16} color="#000" />
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>Retirar</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {!isAgencyLinked ? (
              <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1.5, borderColor: '#F59E0B', padding: 20, borderRadius: 24, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <AlertCircle size={24} color="#F59E0B" />
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Enlace a Agencia Obligatorio 🏢</Text>
                </View>
                <Text style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 20, marginBottom: 14 }}>
                  Para activar tu Panel de Presentadora y recibir tus metas diarias de monetización ($2/día), es <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>obligatorio unirte a una Agencia Oficial</Text>.
                  {'\n\n'}
                  <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Reparto de Monetización:</Text>
                  {'\n'}• 50% Dueño de la App
                  {'\n'}• 5% Comisión de Agencia (Descontado del 50%)
                  {'\n'}• 45% Ganancia Neta de Presentadora 💰
                </Text>
                <TouchableOpacity onPress={handleRequestAgency} style={{ backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: 18, alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Vincular Agencia en Mi Perfil 🏢</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ backgroundColor: 'rgba(236,72,153,0.15)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.4)', padding: 16, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={20} color="#FF007F" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F472B6', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                    Monetización Activa (Reparto 50% App / 45% Presentadora / 5% Agencia)
                  </Text>
                  <Text style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 18 }}>
                    Completa tus tareas diarias antes de las 23:59 para recibir tu bono automático equivalente a $2.00 USD (2,000 Auras).
                  </Text>
                </View>
              </View>
            )}

            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, marginBottom: 16 }}>Progreso Diario de Tareas</Text>

            {/* Task 1: Hours */}
            <View style={{ backgroundColor: 'rgba(3,7,18,0.8)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock size={20} color="#00E5FF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Transmisión</Text>
                </View>
                <Text style={{ color: '#22D3EE', fontWeight: '900', fontSize: 14 }}>{streamHours} / 3 Hrs</Text>
              </View>
              <View style={{ width: '100%', height: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <View style={{ width: `${Math.min((streamHours / 3) * 100, 100)}%`, height: '100%', backgroundColor: '#22D3EE' }} />
              </View>
            </View>

            {/* Task 2: Clovers */}
            <View style={{ backgroundColor: 'rgba(3,7,18,0.8)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clover size={20} color="#22C55E" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Tréboles</Text>
                </View>
                <Text style={{ color: '#4ADE80', fontWeight: '900', fontSize: 14 }}>{clovers} / 5 Tréboles</Text>
              </View>
              <View style={{ width: '100%', height: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <View style={{ width: `${Math.min((clovers / 5) * 100, 100)}%`, height: '100%', backgroundColor: '#22C55E' }} />
              </View>
            </View>

            {/* Task 3: K Gifts */}
            <View style={{ backgroundColor: 'rgba(3,7,18,0.8)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Gift size={20} color="#FFD700" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Regalos Meta</Text>
                </View>
                <Text style={{ color: '#FBBF24', fontWeight: '900', fontSize: 14 }}>{kGifts}k / 10k</Text>
              </View>
              <View style={{ width: '100%', height: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <View style={{ width: `${Math.min((kGifts / 10) * 100, 100)}%`, height: '100%', backgroundColor: '#FBBF24' }} />
              </View>
            </View>

            {/* Claim Button */}
            <TouchableOpacity
              onPress={handleClaimReward}
              disabled={hasClaimed || !isAllTasksCompleted}
              style={{ 
                paddingVertical: 16, 
                borderRadius: 30, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8, 
                marginBottom: 40,
                backgroundColor: hasClaimed ? 'rgba(34,197,94,0.3)' : isAllTasksCompleted ? '#DB2777' : '#1F2937',
                borderWidth: 1,
                borderColor: hasClaimed ? '#22C55E' : isAllTasksCompleted ? '#F472B6' : '#4B5563'
              }}
            >
              {hasClaimed ? (
                <>
                  <CheckCircle2 size={20} color="#22C55E" />
                  <Text style={{ color: '#4ADE80', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>Recompensa Reclamada</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color={isAllTasksCompleted ? "#FFF" : "#9CA3AF"} />
                  <Text style={{ color: isAllTasksCompleted ? '#FFF' : '#9CA3AF', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                    Reclamar Bono de $2
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal de Solicitud de Retiro */}
      <Modal visible={withdrawModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <LinearGradient colors={['#1F2937', '#0F172A']} style={{ width: '100%', maxWidth: 360, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: '#10B981' }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, marginBottom: 6, textAlign: 'center' }}>Solicitar Retiro 💸</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
              Mínimo 10,000 Auras ($10.00 USD). Disponible: {auraBalance.toLocaleString()} 🔮
            </Text>

            <Text style={{ color: '#D1D5DB', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>Cantidad de Auras a retirar:</Text>
            <TextInput
              value={withdrawAmountAuras}
              onChangeText={setWithdrawAmountAuras}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor="#6B7280"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#374151', fontWeight: '800', marginBottom: 12 }}
            />

            <Text style={{ color: '#D1D5DB', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>Método de pago (USDT / PayPal / Banco):</Text>
            <TextInput
              value={paymentMethod}
              onChangeText={setPaymentMethod}
              placeholder="USDT (TRC20)"
              placeholderTextColor="#6B7280"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#374151', fontWeight: '700', marginBottom: 12 }}
            />

            <Text style={{ color: '#D1D5DB', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>Dirección / Cuenta destino:</Text>
            <TextInput
              value={accountDestination}
              onChangeText={setAccountDestination}
              placeholder="Dirección TRC20, correo PayPal o CLABE/CBU"
              placeholderTextColor="#6B7280"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#374151', fontWeight: '700', marginBottom: 18 }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setWithdrawModalVisible(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitWithdrawal}
                disabled={submittingWithdrawal}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: '#10B981', alignItems: 'center' }}
              >
                {submittingWithdrawal ? <ActivityIndicator color="#000" size="small" /> : <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
