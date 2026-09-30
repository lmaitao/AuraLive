import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, VideoOff, Plus, UserPlus } from 'lucide-react-native';

export interface ParticipantItem {
  id: string;
  name: string;
  avatarUrl: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoFrozen?: boolean;
  isSeatEmpty?: boolean;
}

interface CameraGrid4Props {
  participants: ParticipantItem[];
  cameraActive: boolean;
  micActive: boolean;
  onToggleMute: (id: string) => void;
  onSelectUser?: (user: { id: string; name: string; avatarUrl: string }) => void;
  onOccupySeat?: (seatId: string) => void;
}

export const CameraGrid4: React.FC<CameraGrid4Props> = ({
  participants,
  cameraActive,
  micActive,
  onToggleMute,
  onSelectUser,
  onOccupySeat,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Guarantee 4 slots exist
  const slots: ParticipantItem[] = Array.from({ length: 4 }).map((_, idx) => {
    return participants[idx] || {
      id: `seat-${idx}`,
      name: `Puesto #${idx + 1} Libre`,
      avatarUrl: '',
      isSeatEmpty: true,
    };
  });

  return (
    <View style={styles.gridContainer}>
      {slots.map((p, idx) => {
        const isHostSlot = p.isHost;
        const isVacant = p.isSeatEmpty;

        if (isVacant) {
          return (
            <TouchableOpacity
              key={p.id || `empty-${idx}`}
              activeOpacity={0.8}
              onPress={() => onOccupySeat && onOccupySeat(p.id)}
              style={{ width: '48.5%', aspectRatio: 0.78, marginBottom: 10 }}
            >
              <View style={styles.emptySlotBorder}>
                <View style={styles.emptySlotInner}>
                  <View style={styles.plusIconCircle}>
                    <UserPlus size={26} color="#00E5FF" />
                  </View>
                  <Text style={styles.emptySeatTitle}>Puesto #{idx + 1}</Text>
                  <Text style={styles.emptySeatSubtext}>Toca para Subir 🎙️</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.9}
            onPress={() => onSelectUser && onSelectUser({ id: p.id, name: p.name, avatarUrl: p.avatarUrl })}
            style={{ width: '48.5%', aspectRatio: 0.78, marginBottom: 10 }}
          >
            <LinearGradient
              colors={isHostSlot ? ['#00E5FF', '#0284C7', '#FF007F'] : ['#FF007F', '#8B5CF6', '#101018']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.videoSlotInner}>
                {isHostSlot && cameraActive ? (
                  <CameraView style={StyleSheet.absoluteFillObject} facing="front" mute={!micActive} />
                ) : p.isVideoFrozen ? (
                  <View style={styles.frozenBox}>
                    <VideoOff size={26} color="#FF007F" />
                    <Text style={styles.frozenText}>Congelada</Text>
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }} style={styles.avatarImage} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradientOverlay} />
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveBadgeText}>{isHostSlot ? 'HOST 👑' : 'EN VIVO'}</Text>
                    </View>
                    <View style={[styles.micPillBadge, { backgroundColor: p.isMuted ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)' }]}>
                      {p.isMuted ? <MicOff size={10} color="#FFF" /> : <Mic size={10} color="#FFF" />}
                    </View>

                    <View style={styles.participantLabelBar}>
                      <Image source={{ uri: p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }} style={styles.miniAvatar} />
                      <Text style={styles.participantName} numberOfLines={1}>{p.name}</Text>
                    </View>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  gradientBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    padding: 2,
  },
  videoSlotInner: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  emptySlotBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(15, 15, 26, 0.6)',
    padding: 2,
  },
  emptySlotInner: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  plusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptySeatTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  emptySeatSubtext: {
    color: '#00E5FF',
    fontWeight: '700',
    fontSize: 9,
    marginTop: 2,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  topGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  liveBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  micPillBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  participantLabelBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  participantName: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  frozenBox: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frozenText: {
    color: '#FF007F',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },
});
