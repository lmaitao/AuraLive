import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, VideoOff } from 'lucide-react-native';

export interface ParticipantItem {
  id: string;
  name: string;
  avatarUrl: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoFrozen?: boolean;
}

interface CameraGrid8Props {
  participants: ParticipantItem[];
  cameraActive: boolean;
  micActive: boolean;
  onToggleMute: (id: string) => void;
  onSelectUser?: (user: { id: string; name: string; avatarUrl: string }) => void;
}

export const CameraGrid8: React.FC<CameraGrid8Props> = ({
  participants,
  cameraActive,
  micActive,
  onToggleMute,
  onSelectUser,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  return (
    <View style={styles.gridContainer}>
      {participants.slice(0, 8).map((p) => {
        const isHostSlot = p.isHost;
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
                    <Image source={{ uri: p.avatarUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradientOverlay} />
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveBadgeText}>VIVO</Text>
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
                  <Image source={{ uri: p.avatarUrl }} style={styles.miniAvatar} />
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gradientBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    padding: 1.5,
  },
  videoSlotInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D1117',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  frozenBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frozenText: {
    color: '#FF007F',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  topGradientOverlay: {
    height: 24,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  liveBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginRight: 3,
  },
  liveBadgeText: {
    color: '#4ADE80',
    fontSize: 7,
    fontWeight: '900',
  },
  micPillBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  participantLabelBar: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniAvatar: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00E5FF',
    marginRight: 3,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    flex: 1,
  },
});
