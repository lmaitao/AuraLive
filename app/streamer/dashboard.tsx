import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, Clock, Clover, Gift, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react-native';

export default function StreamerDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [streamHours, setStreamHours] = useState(3);
  const [clovers, setClovers] = useState(5);
  const [kGifts, setKGifts] = useState(10);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isAgencyLinked, setIsAgencyLinked] = useState(true);
  const [agencyName, setAgencyName] = useState('Agencia Oficial Aura 🌴');

  const isAllTasksCompleted = streamHours >= 3 && clovers >= 5 && kGifts >= 10;

  const handleRequestAgency = () => {
    Alert.alert(
      'Solicitud de Agencia 🏢',
      'Tu solicitud ha sido notificada a las Agencias Oficiales. Una vez que te acepten, tus metas diarias y ganancias netas del 45% quedarán activadas.',
      [{ text: 'Entendido' }]
    );
  };

  const handleClaimReward = () => {
    if (!isAgencyLinked) {
      Alert.alert('Enlace Requerido', 'Debes estar vinculada a una Agencia Oficial para desbloquear el reclamo de metas diarias.');
      return;
    }
    if (!isAllTasksCompleted) {
      Alert.alert('Tareas Incompletas', 'Debes completar todas las tareas diarias antes de reclamar el bono.');
      return;
    }
    
    Alert.alert(
      '¡Felicidades Presentadora! 🌟',
      'Has cumplido todas tus tareas diarias con éxito.\n\nSe han abonado $2.00 USD a tu billetera convertible.',
      [
        { text: '¡Genial!', onPress: () => setHasClaimed(true) }
      ]
    );
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
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>Solicitar Unirse a una Agencia 🏢</Text>
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
                Completa tus tareas diarias antes de las 23:59 para recibir tu bono automático equivalente a $2.00 USD.
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

      </ScrollView>
    </SafeAreaView>
  );
}
