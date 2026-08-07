import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, VideoOff, UserPlus } from 'lucide-react-native';

export interface ParticipantItem {
  id: string;
  name: string;
  avatarUrl: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoFrozen?: boolean;
  isSeatEmpty?: boolean;
}

interface CameraGrid8Props {
  participants: ParticipantItem[];
  cameraActive: boolean;
  micActive: boolean;
  onToggleMute: (id: string) => void;
  onSelectUser?: (user: { id: string; name: string; avatarUrl: string }) => void;
  onOccupySeat?: (seatId: string) => void;
}

export const CameraGrid8: React.FC<CameraGrid8Props> = ({
  participants,
  cameraActive,
  micActive,
  onToggleMute,
  onSelectUser,
  onOccupySeat,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  // Guarantee 8 slots exist
  const slots: ParticipantItem[] = Array.from({ length: 8 }).map((_, idx) => {
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
              style={{ width: '48%', aspectRatio: 1.25, marginBottom: 6 }}
            >
              <View style={styles.emptySlotBorder}>
                <View style={styles.emptySlotInner}>
                  <View style={styles.plusIconCircle}>
                    <UserPlus size={18} color="#FF007F" />
                  </View>
                  <Text style={styles.emptySeatTitle}>Puesto #{idx + 1}</Text>
                  <Text style={styles.emptySeatSubtext}>Libre 🎙️</Text>
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
            style={{ width: '48%', aspectRatio: 1.25, marginBottom: 6 }}
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
                    <VideoOff size={18} color="#FF007F" />
                    <Text style={styles.frozenText}>Congelada</Text>
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradientOverlay} />
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveBadgeText}>{isHostSlot ? 'HOST' : 'VIVO'}</Text>
                    </View>
                  </View>
                )}

                {/* Interactive Mic Button */}
                <TouchableOpacity
                  onPress={() => onToggleMute(p.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.micPillBadge,
                    { backgroundColor: p.isMuted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 229, 255, 0.9)' },
                  ]}
                >
                  {p.isMuted ? <MicOff size={9} color="#FFF" /> : <Mic size={9} color="#000" />}
                  <Text style={{ color: p.isMuted ? '#FFF' : '#000', fontSize: 7, fontWeight: '900' }}>
                    {p.isMuted ? 'Mute' : 'On'}
                  </Text>
                </TouchableOpacity>

                {/* Bottom Label Bar */}
                <View style={styles.participantLabelBar}>
                  {p.avatarUrl ? <Image source={{ uri: p.avatarUrl }} style={styles.miniAvatar} /> : null}
                  <Text style={styles.participantName} numberOfLines={1}>{p.name}</Text>
                  {p.isMuted ? <MicOff size={9} color="#FF007F" /> : <Mic size={9} color="#00E5FF" />}
                </View>
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
    justify: 'space-between',
    width: '100%',
  },
  gradientBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 2,
  },
  videoSlotInner: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  emptySlotBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 0, 127, 0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(15, 15, 26, 0.6)',
    padding: 2,
  },
  emptySlotInner: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  plusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 0, 127, 0.15)',
    borderWidth: 1,
    borderColor: '#FF007F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptySeatTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
  },
  emptySeatSubtext: {
    color: '#FF007F',
    fontWeight: '700',
    fontSize: 8,
    marginTop: 1,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  topGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
  },
  liveBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  liveDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFF',
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  },
  micPillBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  participantLabelBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniAvatar: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  participantName: {
    color: '#FFF',
    fontSize: 8,
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
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
});
