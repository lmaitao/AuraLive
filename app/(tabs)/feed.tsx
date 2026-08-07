import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Modal, Pressable, useWindowDimensions, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { Search, Trophy, Plus, Video, Users, Sparkles, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';


const AnimatedFeedCard = ({ room, index, onPress, cardWidth, cardHeight }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()} style={{ width: cardWidth, marginBottom: 12 }}>
      <Pressable onPressIn={() => { scale.value = withSpring(0.94); }} onPressOut={() => { scale.value = withSpring(1); }} onPress={onPress}>
        <Animated.View style={animatedStyle}>
          <LinearGradient colors={room.color} style={{ padding: 2, borderRadius: 22 }}>
            <View style={{ backgroundColor: '#0D1117', borderRadius: 20, overflow: 'hidden' }}>
              <View style={{ height: cardHeight, width: '100%' }}>
                <Image source={{ uri: room.bannerUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={StyleSheet.absoluteFillObject} />
                
                <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(239,68,68,0.9)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', marginRight: 4 }} />
                  <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }}>EN VIVO</Text>
                </View>

                <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Text style={{ color: '#00E5FF', fontSize: 8, fontWeight: '800' }}>{room.category}</Text>
                </View>

                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11, flex: 1, marginRight: 4 }} numberOfLines={1}>{room.title}</Text>
                    <Text style={{ color: '#FFD700', fontSize: 8, fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6 }}>👥 {room.viewerCount}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: room.avatarUrl }} style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#00E5FF' }} />
                    <View style={{ marginLeft: 5 }}>
                      <Text style={{ color: '#E5E7EB', fontSize: 9, fontWeight: '700' }}>{room.hostName}</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 7 }}>{room.city}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default function FeedScreen() {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'recomendar' | 'ligera'>('recomendar');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [createRoomModalVisible, setCreateRoomModalVisible] = useState(false);
  const [selectedRoomLayout, setSelectedRoomLayout] = useState<'4cam' | '8cam'>('8cam');

  // Background breathing animation orbs
  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.25);

  useEffect(() => {
    orbScale.value = withRepeat(
      withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orbOpacity.value = withRepeat(
      withTiming(0.45, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedOrbCyan = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  const animatedOrbPink = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * 0.9 }],
    opacity: orbOpacity.value * 0.8,
  }));

  const HORIZONTAL_PADDING = 12;
  const CARD_GAP = 10;
  const cardWidth = Math.floor((width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2);
  const cardHeight = Math.max(150, Math.floor(cardWidth * 1.25));

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(() => setIsAuthenticated(true)).catch(() => setIsAuthenticated(true));
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_rooms')
        .select('id, title, category, viewer_count, is_active, host_id, profiles!stream_rooms_host_id_fkey(full_name, avatar_url)')
        .eq('is_active', true)
        .order('viewer_count', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setRooms(data);
      }
      // Si no hay salas en BD aún, dejamos el array vacío (no mock)
    } catch (e) {
      console.log('Error fetching rooms:', e);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Paleta de colores para las tarjetas de sala
  const CARD_COLORS = [
    ['#8B5CF6', '#3B82F6'], ['#EC4899', '#8B5CF6'], ['#06B6D4', '#3B82F6'],
    ['#10B981', '#06B6D4'], ['#10B981', '#F59E0B'], ['#F59E0B', '#EF4444'],
  ];

  const BANNER_URLS = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
  ];


  const filteredRooms = rooms.filter(room => {
    const q = searchQuery.trim().toLowerCase();
    const hostName = room.profiles?.full_name || '';
    const matchesSearch = q === '' ||
      room.id.toLowerCase().includes(q) ||
      hostName.toLowerCase().includes(q) ||
      room.title.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (activeFilter === 'ligera') return (room.viewer_count || 0) < 1000;
    return true;
  });


  const handleEnterRoom = (roomId: string) => {
    if (isAuthenticated === false) {
      Alert.alert('Registro Requerido', 'Inicia sesión para entrar.', [
        { text: 'Login', onPress: () => router.replace('/auth/login' as any) },
        { text: 'Cancelar', style: 'cancel' }
      ]);
      return;
    }
    router.push({ pathname: '/live/[id]', params: { id: roomId } } as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Dynamic Animated Ambient Background Orbs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View style={[animatedOrbCyan, { position: 'absolute', top: -40, left: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0, 229, 255, 0.15)' }]} />
        <Animated.View style={[animatedOrbPink, { position: 'absolute', top: '35%', right: -50, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255, 0, 127, 0.12)' }]} />
      </View>

      {/* Header - Tight padding */}
      <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF' }}>En Vivo</Text>
            <View style={{ height: 3, width: 20, backgroundColor: '#00E5FF', borderRadius: 2, marginTop: 2, alignSelf: 'center' }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={{ padding: 6, backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 10, borderWidth: 1, borderColor: '#FFD700' }}>
            <Trophy size={16} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSearchInput(!showSearchInput)} style={{ padding: 7, backgroundColor: showSearchInput ? '#00E5FF' : 'rgba(255,255,255,0.1)', borderRadius: 18 }}>
            <Search size={16} color={showSearchInput ? '#000' : '#FFF'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      {showSearchInput && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
          <View style={{ backgroundColor: '#111827', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#00E5FF' }}>
            <Search size={14} color="#00E5FF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por ID de sala (ej. room-101) o Nombre de Host..."
              placeholderTextColor="#6B7280"
              style={{ color: '#FFF', flex: 1, marginLeft: 8, fontSize: 12, fontWeight: '600' }}
              autoFocus
            />
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={() => setActiveFilter('recomendar')}>
          <LinearGradient colors={activeFilter === 'recomendar' ? ['#00E5FF', '#0284C7'] : ['#1F2937', '#111827']} style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Flame size={13} color={activeFilter === 'recomendar' ? '#000' : '#9CA3AF'} />
            <Text style={{ color: activeFilter === 'recomendar' ? '#000' : '#9CA3AF', fontWeight: '800', fontSize: 11 }}>Recomendar</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveFilter('ligera')}>
          <LinearGradient colors={activeFilter === 'ligera' ? ['#EC4899', '#8B5CF6'] : ['#1F2937', '#111827']} style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} color={activeFilter === 'ligera' ? '#FFF' : '#9CA3AF'} />
            <Text style={{ color: activeFilter === 'ligera' ? '#FFF' : '#9CA3AF', fontWeight: '800', fontSize: 11 }}>Modo Ligera</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Room Grid */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 4, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(300)} key={activeFilter} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {loadingRooms ? (
              <View style={{ width: '100%', alignItems: 'center', marginTop: 60 }}>
                <ActivityIndicator color="#00E5FF" size="large" />
                <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 13 }}>Cargando salas en vivo...</Text>
              </View>
            ) : filteredRooms.length === 0 ? (
              <View style={{ width: '100%', alignItems: 'center', marginTop: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📡</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Sin salas activas</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 }}>Sé el primero en abrir una sala y comenzar a transmitir.</Text>
              </View>
            ) : (
              filteredRooms.map((room, index) => {
                const color = CARD_COLORS[index % CARD_COLORS.length];
                const banner = BANNER_URLS[index % BANNER_URLS.length];
                const enriched = {
                  ...room,
                  hostName: room.profiles?.full_name || 'Host',
                  avatarUrl: room.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                  bannerUrl: banner,
                  viewerCount: room.viewer_count || 0,
                  color,
                };
                return (
                  <AnimatedFeedCard key={room.id} room={enriched} index={index} cardWidth={cardWidth} cardHeight={cardHeight} onPress={() => handleEnterRoom(room.id)} />
                );
              })
            )}
          </Animated.View>
      </ScrollView>

      {/* FAB button */}
      <TouchableOpacity onPress={() => setCreateRoomModalVisible(true)} style={{ position: 'absolute', bottom: 96, right: 14 }} activeOpacity={0.85}>
        <LinearGradient colors={['#FF007F', '#4C1D95']} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FF69B4' }}>
          <Plus size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={createRoomModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <LinearGradient colors={['#1F2937', '#000000']} style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderTopWidth: 2, borderColor: 'rgba(0,229,255,0.4)' }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 44, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 16 }} />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 20 }}>Configurar Mi Sala 3D 🎥</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setSelectedRoomLayout('4cam')} style={{ flex: 1 }}>
                <LinearGradient colors={selectedRoomLayout === '4cam' ? ['#00E5FF', '#0284C7'] : ['#374151', '#111827']} style={{ padding: 16, borderRadius: 16, alignItems: 'center' }}>
                  <Video size={32} color={selectedRoomLayout === '4cam' ? '#000' : '#9CA3AF'} />
                  <Text style={{ color: selectedRoomLayout === '4cam' ? '#000' : '#9CA3AF', fontWeight: '700', fontSize: 14, marginTop: 8 }}>4 Cámaras</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedRoomLayout('8cam')} style={{ flex: 1 }}>
                <LinearGradient colors={selectedRoomLayout === '8cam' ? ['#FF007F', '#4C1D95'] : ['#374151', '#111827']} style={{ padding: 16, borderRadius: 16, alignItems: 'center' }}>
                  <Users size={32} color={selectedRoomLayout === '8cam' ? '#FFF' : '#9CA3AF'} />
                  <Text style={{ color: selectedRoomLayout === '8cam' ? '#FFF' : '#9CA3AF', fontWeight: '700', fontSize: 14, marginTop: 8 }}>8 Cámaras</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <TouchableOpacity onPress={() => setCreateRoomModalVisible(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setCreateRoomModalVisible(false); router.push({ pathname: '/live/[id]', params: { id: 'host-123', isHost: 'true', layout: selectedRoomLayout } } as any); }} style={{ flex: 1 }}>
                <LinearGradient colors={['#00E5FF', '#0284C7']} style={{ paddingVertical: 14, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>¡Transmitir!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
