import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Mic, MicOff, Camera as CameraIcon, VideoOff, Grid, Shield, Swords, Flame, UserX, Lock, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraGrid4 } from './CameraGrid4';
import { CameraGrid8 } from './CameraGrid8';
import { zegoService } from '../lib/ZegoService';
import { supabase } from '../lib/supabase';

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoFrozen?: boolean;
  streamID?: string;
  svipLevel?: number;
}



export interface ZegoVideoEngineProps {
  layoutMode: '4_cam' | '8_cam';
  isHost: boolean;
  onLayoutChange: (mode: '4_cam' | '8_cam') => void;
  onSelectUser?: (user: { id: string; name: string; avatarUrl: string }) => void;
  userProfileAvatar?: string;
  roomId?: string;
}

export const ZegoVideoEngine: React.FC<ZegoVideoEngineProps> = ({
  layoutMode,
  isHost,
  onLayoutChange,
  onSelectUser,
  userProfileAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  roomId = 'default-room'
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [pkBattleActive, setPkBattleActive] = useState(false);
  const [pkBluePoints, setPkBluePoints] = useState(14200);
  const [pkPinkPoints, setPkPinkPoints] = useState(18900);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);

  const [voiceSeats, setVoiceSeats] = useState([
    { index: 0, name: null as string | null, avatarUrl: null as string | null, isLocked: false },
    { index: 1, name: null as string | null, avatarUrl: null as string | null, isLocked: false },
    { index: 2, name: null as string | null, avatarUrl: null as string | null, isLocked: false },
    { index: 3, name: null as string | null, avatarUrl: null as string | null, isLocked: false },
  ]);

  useEffect(() => {
    const initRealTimeLogic = async () => {
      if (!permission?.granted) await requestPermission();
      if (!micPermission?.granted) await requestMicPermission();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'user-' + Math.floor(Math.random() * 1000);
        let hostName = 'Host Aura 👑';
        let hostAvatar = userProfileAvatar;

        if (user?.id) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();
          if (prof) {
            hostName = prof.full_name || 'Host Aura 👑';
            if (prof.avatar_url) hostAvatar = prof.avatar_url;
          }
        }
        
        await zegoService.initEngine();
        await zegoService.loginRoom(roomId, userId, hostName);
        
        if (isHost) {
          const streamID = `${roomId}_${userId}_main`;
          await zegoService.startPublishingStream(streamID);
        }
        
        setIsConnecting(false);
        setParticipants([
          { id: userId, name: hostName, avatarUrl: hostAvatar, isHost: true },
        ]);
      } catch (e) {
        console.error("Zego connection error", e);
        setIsConnecting(false);
      }
    };
    initRealTimeLogic();

    return () => {
      zegoService.stopPublishingStream();
      zegoService.logoutRoom(roomId);
    };
  }, [permission, micPermission, roomId, isHost]);

  const startRealWebcam = () => setCameraActive(true);

  const stopRealWebcam = () => {
    if (isHost) {
      Alert.alert(
        'Cámara Requerida 🎥',
        'La cámara de la presentadora debe permanecer activa en todo momento durante la transmisión.'
      );
      return;
    }
    setCameraActive(false);
  };

  const toggleMic = () => setMicActive(!micActive);

  const toggleMuteParticipant = (id: string) => {
    const target = participants.find(p => p.id === id);
    if (target && (target.svipLevel || 0) >= 2) {
      Alert.alert('Inmunidad SVIP 🛡️', `${target.name} tiene SVIP Nivel ${target.svipLevel} y es inmune a silenciamientos en sala.`);
      return;
    }
    if (!isHost) {
      Alert.alert('Acceso Denegado 🔒', 'Solo la presentadora o un SVIP 1+ pueden silenciar a usuarios normales.');
      return;
    }
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isMuted: !p.isMuted } : p))
    );
  };

  const handleOccupySeat = async (seatId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Inicia Sesión', 'Debes iniciar sesión para subir al puesto.');
        return;
      }
      const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      
      const newParticipant: Participant = {
        id: user.id,
        name: prof?.full_name || 'Usuario Aura',
        avatarUrl: prof?.avatar_url || userProfileAvatar,
        isMuted: false,
      };

      setParticipants(prev => [...prev.filter(p => p.id !== user.id), newParticipant]);
      Alert.alert('¡Puesto Ocupado! 🎙️', 'Te has unido al puesto en vivo de la sala.');
    } catch (e) {
      console.log('Error occupying seat:', e);
    }
  };

  const toggleFreezeParticipant = (id: string) => {
    const target = participants.find(p => p.id === id);
    if (target && (target.svipLevel || 0) >= 2) {
      Alert.alert('Inmunidad SVIP 🛡️', `${target.name} tiene SVIP Nivel ${target.svipLevel} y su cámara no puede ser bloqueada.`);
      return;
    }
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isVideoFrozen: !p.isVideoFrozen } : p))
    );
  };

  const handleKickParticipant = (id: string, name: string) => {
    const target = participants.find(p => p.id === id);
    if (target && (target.svipLevel || 0) >= 2) {
      Alert.alert('Inmunidad SVIP 🛡️', `${name} posee SVIP Nivel ${target.svipLevel} y no puede ser expulsado de ninguna sala.`);
      return;
    }
    if (!isHost) {
      Alert.alert('Acceso Denegado 🔒', 'Solo la presentadora o moderadores autorizados pueden expulsar usuarios.');
      return;
    }
    Alert.alert('Expulsar Participante', `¿Expulsar a ${name} de la sala?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Expulsar',
        style: 'destructive',
        onPress: () => setParticipants((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  const toggleLockVoiceSeat = (index: number) => {
    setVoiceSeats((prev) =>
      prev.map((seat) =>
        seat.index === index ? { ...seat, isLocked: !seat.isLocked } : seat
      )
    );
  };

  const VOICE_SEAT_USERS = [
    { name: 'Tu Micro 🎙️', avatarUrl: userProfileAvatar },
    { name: 'Carlos Gamer 🎮', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
    { name: 'Elena Neo 🎥', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400' },
    { name: 'Sofia Streamer 🌟', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' },
  ];

  const handleJoinVoiceSeat = (index: number) => {
    setVoiceSeats((prev) =>
      prev.map((seat) => {
        if (seat.index === index) {
          const isConnected = !!seat.name;
          const assignedUser = VOICE_SEAT_USERS[(index - 1) % VOICE_SEAT_USERS.length];
          return {
            ...seat,
            name: isConnected ? null : assignedUser.name,
            avatarUrl: isConnected ? null : assignedUser.avatarUrl,
          };
        }
        return seat;
      })
    );
  };

  const totalPk = pkBluePoints + pkPinkPoints;
  const blueWidthPct = Math.round((pkBluePoints / totalPk) * 100);

  const { width: windowWidth } = useWindowDimensions();
  const is4Cam = layoutMode === '4_cam';

  return (
    <View style={styles.container}>
      {isConnecting && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, justifyContent: 'center', alignItems: 'center' }}>
          <Activity size={32} color="#00E5FF" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 14 }}>Conectando al Servidor de Streaming...</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4 }}>Obteniendo tokens WebRTC</Text>
        </View>
      )}

      {/* PK Battle Gauge */}
      {pkBattleActive && (
        <View style={styles.pkContainer}>
          <View style={styles.pkHeaderRow}>
            <View style={styles.rowAlign}>
              <Swords size={14} color="#00E5FF" />
              <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 11 }}>PK: {pkBluePoints.toLocaleString()} PTS</Text>
            </View>
            <View style={styles.rowAlign}>
              <Flame size={14} color="#FF007F" />
              <Text style={{ color: '#FF007F', fontWeight: '900', fontSize: 11 }}>{pkPinkPoints.toLocaleString()} PTS</Text>
            </View>
          </View>
          <View style={styles.pkBarWrapper}>
            <View style={{ width: `${blueWidthPct}%`, height: '100%', backgroundColor: '#00E5FF' }} />
            <View style={{ width: `${100 - blueWidthPct}%`, height: '100%', backgroundColor: '#FF007F' }} />
            <View style={styles.pkOverlayText}>
              <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>⚡ BATALLA PK EN VIVO ⚡</Text>
            </View>
          </View>
        </View>
      )}

      {/* Main Multi-Camera Video Grid Component */}
      {is4Cam ? (
        <CameraGrid4
          participants={participants}
          cameraActive={cameraActive}
          micActive={micActive}
          onToggleMute={toggleMuteParticipant}
          onSelectUser={onSelectUser}
          onOccupySeat={handleOccupySeat}
        />
      ) : (
        <CameraGrid8
          participants={participants}
          cameraActive={cameraActive}
          micActive={micActive}
          onToggleMute={toggleMuteParticipant}
          onSelectUser={onSelectUser}
          onOccupySeat={handleOccupySeat}
        />
      )}

      {/* 4 Fixed Voice-Only Bottom Seats */}
      <LinearGradient colors={['#1F2937', '#000000']} style={styles.voiceSection}>
        <View style={styles.voiceHeader}>
          <Text style={styles.voiceTitle}>🎙️ Asientos de Micrófono</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 9 }}>Toca para unirte</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {voiceSeats.map((seat) => (
            <TouchableOpacity
              key={seat.index}
              onPress={() => (isHost ? toggleLockVoiceSeat(seat.index) : handleJoinVoiceSeat(seat.index))}
              style={[
                styles.seatBox,
                {
                  backgroundColor: seat.isLocked
                    ? 'rgba(255, 0, 127, 0.15)'
                    : seat.name
                    ? 'rgba(0, 229, 255, 0.15)'
                    : 'rgba(16, 16, 24, 0.8)',
                  borderColor: seat.isLocked ? '#FF007F' : seat.name ? '#00E5FF' : 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            >
              {seat.isLocked ? (
                <>
                  <Lock size={14} color="#FF007F" />
                  <Text style={{ color: '#FF007F', fontSize: 8, fontWeight: '800', marginTop: 2 }}>Bloqueado</Text>
                </>
              ) : seat.name ? (
                <>
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: seat.avatarUrl || userProfileAvatar }} style={styles.seatAvatar} />
                    <View style={styles.onlineDot} />
                  </View>
                  <Text style={styles.seatName} numberOfLines={1}>{seat.name}</Text>
                </>
              ) : (
                <>
                  <MicOff size={14} color="#00E5FF" />
                  <Text style={{ color: '#00E5FF', fontSize: 8, fontWeight: '800', marginTop: 2 }}>+ Unirse</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowAlignGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masterHostText: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 11,
  },
  btnPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E5FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  btnIconCircle: {
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  pkContainer: {
    marginBottom: 8,
    backgroundColor: '#030712',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.4)',
  },
  pkHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pkBarWrapper: {
    width: '100%',
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 7,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pkOverlayText: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoSlot: {
    backgroundColor: '#101018',
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSlotInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D1117',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micPillBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  frozenBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantLabelBar: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#00E5FF',
    marginRight: 4,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    flex: 1,
  },
  hostControlOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 3,
    borderRadius: 12,
  },
  voiceSection: {
    marginTop: 6,
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  voiceTitle: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  seatBox: {
    width: '23%',
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: '#000',
  },
  seatName: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
});
