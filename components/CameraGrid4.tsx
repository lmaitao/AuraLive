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

interface CameraGrid4Props {
  participants: ParticipantItem[];
  cameraActive: boolean;
  micActive: boolean;
  onToggleMute: (id: string) => void;
  onSelectUser?: (user: { id: string; name: string; avatarUrl: string }) => void;
}

export const CameraGrid4: React.FC<CameraGrid4Props> = ({
  participants,
  cameraActive,
  micActive,
  onToggleMute,
  onSelectUser,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isCompactHeight = windowHeight < 720;

  return (
    <View style={styles.gridContainer}>
      {participants.slice(0, 4).map((p) => {
        const isHostSlot = p.isHost;
        return (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.9}
            onPress={() => onSelectUser && onSelectUser({ id: p.id, name: p.name, avatarUrl: p.avatarUrl })}
            style={{ width: '48%', aspectRatio: 1, marginBottom: 8 }}
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
                    <VideoOff size={22} color="#FF007F" />
                    <Text style={styles.frozenText}>Congelada</Text>
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: p.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradientOverlay} />
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveBadgeText}>EN VIVO</Text>
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
                  {p.isMuted ? <MicOff size={10} color="#FFF" /> : <Mic size={10} color="#000" />}
                  <Text style={{ color: p.isMuted ? '#FFF' : '#000', fontSize: 8, fontWeight: '900' }}>
                    {p.isMuted ? 'Silenciado' : 'Mic On'}
                  </Text>
                </TouchableOpacity>

                {/* Bottom Label Bar */}
                <View style={styles.participantLabelBar}>
                  <Image source={{ uri: p.avatarUrl }} style={styles.miniAvatar} />
                  <Text style={styles.participantName} numberOfLines={1}>{p.name}</Text>
                  {p.isMuted ? <MicOff size={10} color="#FF007F" /> : <Mic size={10} color="#00E5FF" />}
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
    borderRadius: 18,
    padding: 2,
  },
  videoSlotInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D1117',
    borderRadius: 16,
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
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topGradientOverlay: {
    height: 30,
    width: '100%',
    position: 'absolute',
    top: 0,
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
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  liveBadgeText: {
    color: '#4ADE80',
    fontSize: 8,
    fontWeight: '900',
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
});
