import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { ShieldCheck, Users, CheckCircle, XCircle, ArrowLeft, Building2, Activity, Search, ShieldAlert, Headphones, DollarSign, Ban } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';

type TabType = 'metrics' | 'moderation' | 'approvals' | 'support' | 'payments' | 'history';

export default function SuperAdminDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);

  // Metrics Data
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    totalAgencies: 0,
    totalEarnings: 0,
  });

  // Approvals Data
  const [pendingAgencies, setPendingAgencies] = useState<any[]>([]);

  // Moderation Data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Support Data
  const [tickets, setTickets] = useState<any[]>([]);

  // Payments & History Data
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [streamerHistory, setStreamerHistory] = useState<any[]>([]);

  // Neon Glow for God Mode
  const glowProgress = useSharedValue(0);
  useEffect(() => {
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + glowProgress.value * 0.7,
    transform: [{ scale: 1 + glowProgress.value * 0.05 }]
  }));

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single();
      if (!profile?.is_superadmin) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      setIsSuperAdmin(true);
      await loadAllData();
    } catch (e) {
      console.log('Error checking admin:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      // 1. Load Metrics
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: onlineUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_seen', fiveMinsAgo);
      
      const { count: totalAgencies } = await supabase.from('agencies').select('*', { count: 'exact', head: true }).eq('status', 'approved');

      // Calcular ingresos reales de la plataforma (50% de órdenes de pago completadas)
      const { data: paidOrders } = await supabase
        .from('payment_orders')
        .select('price_usd')
        .eq('status', 'completed');

      const grossUsd = (paidOrders || []).reduce((acc, o) => acc + Number(o.price_usd || 0), 0);
      const platformEarnings = Math.round(grossUsd * 0.5 * 100) / 100;

      setMetrics({
        totalUsers: totalUsers || 0,
        onlineUsers: onlineUsers || 0,
        offlineUsers: Math.max(0, (totalUsers || 0) - (onlineUsers || 0)),
        totalAgencies: totalAgencies || 0,
        totalEarnings: platformEarnings,
      });

      // 2. Load Approvals
      const { data: agData } = await supabase.from('agencies').select('id, name, owner_id, profiles!fk_agency_owner(full_name, email)').eq('status', 'pending');
      if (agData) setPendingAgencies(agData);

      // 3. Load Tickets
      const { data: tData } = await supabase.from('support_tickets').select('id, subject, description, status, profiles(full_name)').eq('status', 'open').order('created_at', { ascending: false }).limit(20);
      setTickets(tData || []);

      // 4. Load Payments (Withdrawals)
      const { data: wData } = await supabase.from('withdrawal_requests').select('id, applicant_type, coin_amount, usd_equivalent, payment_method, account_details, status, created_at, profiles(full_name, email)').order('created_at', { ascending: false });
      if (wData) setWithdrawals(wData);

      // 5. Load Streamer History
      const { data: shData } = await supabase.from('streamer_daily_missions').select('id, mission_date, accumulated_minutes, received_gift_coins, is_completed, profiles(full_name, email, agency_id, agencies(name))').order('mission_date', { ascending: false }).limit(50);
      if (shData) setStreamerHistory(shData);

    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  // Moderation Logic
  const handleSearchUser = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, username, is_banned')
        .or(`email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (data) setSearchResults(data);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    setAlertConfig({
      visible: true,
      title: currentStatus ? 'Desbanear Usuario' : 'Banear Usuario',
      message: `¿Estás seguro de que deseas ${currentStatus ? 'restaurar' : 'bloquear permanentemente'} esta cuenta?`,
      type: currentStatus ? "warning" : "danger",
      confirmText: currentStatus ? 'Desbanear' : 'Banear',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        setAlertConfig(null);
        try {
          await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
          setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
          setAlertConfig({
            visible: true,
            title: "Éxito",
            message: `Usuario ${currentStatus ? 'desbaneado' : 'baneado'}.`,
            type: "success",
            confirmText: "Ok",
            onConfirm: () => setAlertConfig(null)
          });
        } catch (e) {
          setAlertConfig({
            visible: true,
            title: "Error",
            message: "No se pudo actualizar el estado.",
            type: "danger",
            confirmText: "Ok",
            onConfirm: () => setAlertConfig(null)
          });
        }
      },
      onCancel: () => setAlertConfig(null)
    });
  };

  // Approval Logic
  const handleApproveAgency = async (agencyId: string, ownerId: string) => {
    try {
      await supabase.from('agencies').update({ status: 'approved' }).eq('id', agencyId);
      await supabase.from('profiles').update({ is_agency: true, agency_id: agencyId }).eq('id', ownerId);
      setPendingAgencies(prev => prev.filter(a => a.id !== agencyId));
      setMetrics(prev => ({ ...prev, totalAgencies: prev.totalAgencies + 1 }));
    } catch (e) {}
  };

  const handleRejectAgency = async (agencyId: string) => {
    try {
      await supabase.from('agencies').update({ status: 'rejected' }).eq('id', agencyId);
      setPendingAgencies(prev => prev.filter(a => a.id !== agencyId));
    } catch (e) {}
  };

  // Support Logic
  const handleResolveTicket = async (ticketId: string) => {
    try {
      await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setAlertConfig({
        visible: true,
        title: "Ticket Resuelto",
        message: "Se ha notificado al usuario.",
        type: "success",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    } catch (e) {}
  };

  // Payment Logic (vía withdrawals-service / RPC review_withdrawal)
  const handleProcessPayment = async (withdrawalId: string) => {
    try {
      await api.withdrawals.review(withdrawalId, 'approve');
      setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, status: 'completed' } : w));
      setAlertConfig({
        visible: true,
        title: "Pago Procesado",
        message: "Se ha marcado el retiro como completado exitosamente.",
        type: "success",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: "Error al procesar pago",
        message: e.message || "No se pudo aprobar el retiro.",
        type: "danger",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    }
  };

  const handleRejectPayment = async (withdrawalId: string) => {
    try {
      await api.withdrawals.review(withdrawalId, 'reject', 'Rechazado por administración');
      setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, status: 'rejected' } : w));
      setAlertConfig({
        visible: true,
        title: "Pago Rechazado",
        message: "Se ha rechazado el retiro y las Auras han sido reembolsadas a la billetera.",
        type: "warning",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: "Error al rechazar pago",
        message: e.message || "No se pudo rechazar el retiro.",
        type: "danger",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF007F" />
      </View>
    );
  }

  if (!isSuperAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ShieldCheck size={64} color="#EF4444" className="mb-4" />
        <Text className="text-red-500 font-black text-2xl mb-2 text-center">ACCESO DENEGADO</Text>
        <Text className="text-gray-400 text-sm text-center">Requiere privilegios SuperAdmin Master.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-8 bg-white/10 px-6 py-3 rounded-full">
          <Text className="text-white font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Cyber3DBackground />
      {/* Header */}
      <LinearGradient colors={['#4C1D95', '#000000']} className="px-5 py-4 flex-row items-center justify-between border-b-2 border-purple-500/50 shadow-2xl shadow-purple-500/50">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-white/10">
            <ArrowLeft size={18} color="#D8B4FE" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-white tracking-widest uppercase">Master Control</Text>
        </View>
        <View className="relative">
          <Animated.View style={glowStyle} className="absolute top-0 left-0 right-0 bottom-0 bg-red-600/40 rounded-full " />
          <View className="bg-red-900/40 px-3 py-1.5 rounded-full border border-red-500 flex-row items-center gap-1 shadow-lg shadow-red-500/50 relative ">
            <ShieldAlert size={14} color="#EF4444" />
            <Text className="text-red-400 font-black text-[10px] uppercase">GOD MODE</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-white/10 bg-black/60">
        <View className="flex-row items-center px-2">
          <TouchableOpacity onPress={() => setActiveTab('metrics')} className={`px-4 py-3 items-center border-b-2 ${activeTab === 'metrics' ? 'border-purple-500 bg-purple-500/10' : 'border-transparent'}`}>
            <Activity size={18} color={activeTab === 'metrics' ? '#A855F7' : '#6B7280'} />
            <Text className={`text-[10px] font-bold mt-1 ${activeTab === 'metrics' ? 'text-purple-400' : 'text-gray-500'}`}>Métricas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setActiveTab('history')} className={`px-4 py-3 items-center border-b-2 ${activeTab === 'history' ? 'border-pink-500 bg-pink-500/10' : 'border-transparent'}`}>
            <DollarSign size={18} color={activeTab === 'history' ? '#EC4899' : '#6B7280'} />
            <Text className={`text-[10px] font-bold mt-1 ${activeTab === 'history' ? 'text-pink-400' : 'text-gray-500'}`}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('payments')} className={`px-4 py-3 items-center border-b-2 ${activeTab === 'payments' ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent'}`}>
            <CheckCircle size={18} color={activeTab === 'payments' ? '#EAB308' : '#6B7280'} />
            <Text className={`text-[10px] font-bold mt-1 ${activeTab === 'payments' ? 'text-yellow-400' : 'text-gray-500'}`}>Pagos</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('moderation')} className={`px-4 py-3 items-center border-b-2 ${activeTab === 'moderation' ? 'border-red-500 bg-red-500/10' : 'border-transparent'}`}>
            <Ban size={18} color={activeTab === 'moderation' ? '#EF4444' : '#6B7280'} />
            <Text className={`text-[10px] font-bold mt-1 ${activeTab === 'moderation' ? 'text-red-400' : 'text-gray-500'}`}>Baneos</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('approvals')} className={`px-4 py-3 items-center border-b-2 ${activeTab === 'approvals' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent'}`}>
            <CheckCircle size={18} color={activeTab === 'approvals' ? '#3B82F6' : '#6B7280'} />
            <Text className={`text-[10px] font-bold mt-1 ${activeTab === 'approvals' ? 'text-blue-400' : 'text-gray-500'}`}>Solicitudes</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('support')} className={`px-4 py-3 items-center border-b-2 ${activeTab === 'support' ? 'border-green-500 bg-green-500/10' : 'border-transparent'}`}>
            <Headphones size={18} color={activeTab === 'support' ? '#22C55E' : '#6B7280'} />
            <Text className={`text-[10px] font-bold mt-1 ${activeTab === 'support' ? 'text-green-400' : 'text-gray-500'}`}>Soporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* ================= METRICS TAB ================= */}
        {activeTab === 'metrics' && (
          <Animated.View entering={FadeInDown.duration(600).springify()} className="gap-4">
            <Text className="text-white font-extrabold text-lg mb-2 uppercase">Visión Global 🌍</Text>
            
            <View className="flex-row gap-4">
              <LinearGradient colors={['#1F2937', '#000000']} className="flex-1 p-4 rounded-3xl border border-blue-500/50 shadow-lg shadow-blue-500/20">
                <Users size={24} color="#3B82F6" className="mb-2" />
                <Text className="text-gray-400 text-xs font-bold">Total Usuarios</Text>
                <Text className="text-white font-black text-2xl">{metrics.totalUsers}</Text>
              </LinearGradient>
              <LinearGradient colors={['#1F2937', '#000000']} className="flex-1 p-4 rounded-3xl border border-green-500/50 shadow-lg shadow-green-500/20">
                <Activity size={24} color="#22C55E" className="mb-2" />
                <Text className="text-gray-400 text-xs font-bold">Usuarios Online</Text>
                <Text className="text-white font-black text-2xl">{metrics.onlineUsers}</Text>
              </LinearGradient>
            </View>

            <View className="flex-row gap-4 mt-2">
              <LinearGradient colors={['#1F2937', '#000000']} className="flex-1 p-4 rounded-3xl border border-amber-500/50 shadow-lg shadow-amber-500/20">
                <Building2 size={24} color="#F59E0B" className="mb-2" />
                <Text className="text-gray-400 text-xs font-bold">Agencias Activas</Text>
                <Text className="text-white font-black text-2xl">{metrics.totalAgencies}</Text>
              </LinearGradient>
            </View>

            <LinearGradient colors={['#4C1D95', '#000000']} className="mt-4 p-5 rounded-3xl border border-purple-500/50 shadow-lg shadow-purple-500/30">
              <View className="flex-row items-center gap-2 mb-2">
                <DollarSign size={24} color="#A855F7" />
                <Text className="text-purple-300 font-extrabold uppercase">Ingresos Plataforma (50%)</Text>
              </View>
              <Text className="text-white font-black text-3xl">${metrics.totalEarnings.toLocaleString()} USD</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ================= MODERATION TAB ================= */}
        {activeTab === 'moderation' && (
          <Animated.View entering={FadeInDown.duration(600).springify()} className="gap-4">
            <Text className="text-white font-extrabold text-lg mb-2 uppercase">Centro de Moderación 🛡️</Text>
            
            <View className="flex-row gap-2">
              <View className="flex-1 bg-black/60 border border-white/20 rounded-2xl px-4 py-3 flex-row items-center gap-2">
                <Search size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Buscar por username o email..."
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchUser}
                  className="flex-1 text-white font-bold"
                />
              </View>
              <TouchableOpacity onPress={handleSearchUser} disabled={isSearching} className="bg-red-500/80 px-4 justify-center rounded-2xl border border-red-400">
                {isSearching ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold uppercase">Buscar</Text>}
              </TouchableOpacity>
            </View>

            {isSearching ? <ActivityIndicator color="#EF4444" className="mt-10" /> : (
              searchResults.map(user => (
                <View key={user.id} className="bg-gray-900 p-4 rounded-2xl border border-red-500/30 flex-row items-center justify-between mt-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base" numberOfLines={1}>{user.full_name}</Text>
                    <Text className="text-gray-400 text-xs">@{user.username} | {user.email}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleToggleBan(user.id, user.is_banned)}
                    className={`px-4 py-2 rounded-xl border ${user.is_banned ? 'bg-gray-800 border-gray-600' : 'bg-red-500/20 border-red-500'}`}
                  >
                    <Text className={`font-black text-xs ${user.is_banned ? 'text-gray-400' : 'text-red-400'}`}>
                      {user.is_banned ? 'Desbanear' : 'BANEAR'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Animated.View>
        )}

        {/* ================= APPROVALS TAB ================= */}
        {activeTab === 'approvals' && (
          <Animated.View entering={FadeInDown.duration(600).springify()} className="gap-6">
            <Text className="text-amber-400 font-black text-base mb-3 uppercase tracking-wider">🏢 Agencias ({pendingAgencies.length})</Text>
            {pendingAgencies.length === 0 ? <Text className="text-gray-500 italic mb-6">Nada pendiente.</Text> : (
              pendingAgencies.map((agency) => (
                <View key={agency.id} className="bg-gray-900 p-4 rounded-2xl border border-amber-500/30 mb-3 flex-row items-center justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-white font-bold">{agency.name}</Text>
                    <Text className="text-gray-400 text-xs">Dueño: {agency.profiles?.full_name}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => handleApproveAgency(agency.id, agency.owner_id)} className="p-2.5 rounded-xl bg-green-500/20 border border-green-500"><CheckCircle size={20} color="#22C55E" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRejectAgency(agency.id)} className="p-2.5 rounded-xl bg-red-500/20 border border-red-500"><XCircle size={20} color="#EF4444" /></TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}

        {/* ================= SUPPORT TAB ================= */}
        {activeTab === 'support' && (
          <Animated.View entering={FadeInDown.duration(600).springify()} className="gap-4">
            <Text className="text-green-400 font-black text-lg mb-4">Tickets Activos ({tickets.length})</Text>
            {tickets.length === 0 ? <Text className="text-gray-500 italic">Bandeja limpia. ¡Excelente trabajo!</Text> : (
              tickets.map(ticket => (
                <View key={ticket.id} className="bg-gray-900 p-5 rounded-3xl border border-green-500/30 mb-4 shadow-lg shadow-green-500/5">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-white font-bold flex-1 mr-2">{ticket.subject}</Text>
                    <View className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500">
                      <Text className="text-red-400 text-[10px] font-black uppercase">URGENTE</Text>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-xs mb-3">De: {ticket.profiles?.full_name}</Text>
                  <View className="bg-black/50 p-3 rounded-xl mb-4 border border-white/5">
                    <Text className="text-gray-300 text-sm leading-5">{ticket.description}</Text>
                  </View>
                  
                  <TouchableOpacity onPress={() => handleResolveTicket(ticket.id)} className="bg-green-500 py-3 rounded-xl items-center flex-row justify-center gap-2">
                    <CheckCircle size={18} color="white" />
                    <Text className="text-white font-black">Marcar como Resuelto</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Animated.View>
        )}

        {/* ================= HISTORY TAB ================= */}
        {activeTab === 'history' && (
          <Animated.View entering={FadeInDown.duration(600).springify()} className="gap-4">
            <Text className="text-pink-400 font-black text-lg mb-4">Historial de Ganancias 📊</Text>
            {streamerHistory.length === 0 ? <Text className="text-gray-500 italic">Sin registros de ganancias por ahora.</Text> : (
              streamerHistory.map((history) => (
                <View key={history.id} className="bg-gray-900 p-4 rounded-2xl border border-pink-500/30 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-bold">{history.profiles?.full_name}</Text>
                    <Text className="text-gray-400 text-[10px]">{history.mission_date}</Text>
                  </View>
                  <Text className="text-gray-400 text-xs mb-2">{history.profiles?.agencies?.name ? `Agencia: ${history.profiles.agencies.name}` : 'Independiente'}</Text>
                  
                  <View className="flex-row justify-between mt-2 pt-2 border-t border-white/10">
                    <View>
                      <Text className="text-gray-500 text-[10px] font-bold">Monedas Generadas</Text>
                      <Text className="text-yellow-400 font-black text-sm">{(history.received_gift_coins / 0.4).toLocaleString()} 🪙</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-[10px] font-bold text-right">Ganancia Streamer (40%)</Text>
                      <Text className="text-green-400 font-black text-sm text-right">{history.received_gift_coins.toLocaleString()} 🪙</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}

        {/* ================= PAYMENTS TAB ================= */}
        {activeTab === 'payments' && (
          <Animated.View entering={FadeInDown.duration(600).springify()} className="gap-4">
            <Text className="text-yellow-400 font-black text-lg mb-4">Liquidación de Retiros 💸</Text>
            {withdrawals.length === 0 ? <Text className="text-gray-500 italic">No hay solicitudes de retiro pendientes.</Text> : (
              withdrawals.map((withdrawal) => (
                <View key={withdrawal.id} className="bg-gray-900 p-4 rounded-2xl border border-yellow-500/30 mb-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-white font-bold text-base">{withdrawal.profiles?.full_name}</Text>
                      <Text className="text-gray-400 text-xs">Tipo: {withdrawal.applicant_type === 'agency' ? 'Agencia' : 'Streamer Independiente'}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-md border ${withdrawal.status === 'pending' ? 'bg-yellow-500/20 border-yellow-500' : withdrawal.status === 'completed' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                      <Text className={`text-[10px] font-black uppercase ${withdrawal.status === 'pending' ? 'text-yellow-400' : withdrawal.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>{withdrawal.status}</Text>
                    </View>
                  </View>
                  
                  <View className="bg-black/50 p-3 rounded-xl mb-3 border border-white/5">
                    <Text className="text-gray-400 text-[10px] font-bold mb-1">DETALLES DE PAGO</Text>
                    <Text className="text-white font-bold text-lg mb-1">${withdrawal.usd_equivalent} USD</Text>
                    <Text className="text-gray-400 text-xs">Monedas a debitar: {withdrawal.coin_amount.toLocaleString()} 🪙</Text>
                    <Text className="text-gray-400 text-xs mt-2">Método: <Text className="text-white font-bold">{withdrawal.payment_method}</Text></Text>
                    {withdrawal.account_details && Object.entries(withdrawal.account_details).map(([key, value]) => (
                      <Text key={key} className="text-gray-400 text-xs">{key}: <Text className="text-white">{String(value)}</Text></Text>
                    ))}
                  </View>
                  
                  {withdrawal.status === 'pending' && (
                    <View className="flex-row gap-3">
                      <TouchableOpacity onPress={() => handleRejectPayment(withdrawal.id)} className="flex-1 py-3 rounded-xl items-center border border-red-500/50 bg-red-500/10">
                        <Text className="text-red-400 font-bold">Rechazar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleProcessPayment(withdrawal.id)} className="flex-1 py-3 rounded-xl items-center bg-green-500">
                        <Text className="text-white font-black">PAGADO (Completar)</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </Animated.View>
        )}


      </ScrollView>

      <AuraAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        onConfirm={() => {
          alertConfig?.onConfirm();
          if (!alertConfig?.visible) setAlertConfig(null);
        }}
        onCancel={alertConfig?.onCancel ? () => {
          alertConfig.onCancel!();
          setAlertConfig(null);
        } : undefined}
      />
    </SafeAreaView>
  );
}
