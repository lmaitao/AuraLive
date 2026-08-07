import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Heart, MessageCircle, Share2, Plus, Film, Sparkles, Gift, PlayCircle, Video as VideoIcon, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';

export interface ReelItem {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export default function ShortVideosScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const maxCardWidth = Math.min(width - 24, 480);

  const [reels, setReels] = useState<ReelItem[]>([
    {
      id: 'reel-1',
      creatorName: 'Sofia Mendoza 🌟',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      caption: '¡Probando la nueva cámara WebRTC en AURA LIVE! 👑✨ #Streaming #LiveParty',
      likes: 1420,
      comments: 89,
    },
    {
      id: 'reel-2',
      creatorName: 'Elena Neo 💎',
      creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
      caption: 'Ganadora de la Batalla PK de hoy 🔥 Gracias a todos por sus regalos 🎁',
      likes: 3890,
      comments: 210,
    },
  ]);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState('');

  const toggleLike = (id: string) => {
    setReels((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 }
          : r
      )
    );
  };

  const handlePickLocalVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 30,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSelectedVideoUri(result.assets[0].uri);
        Alert.alert('Video Seleccionado 🎬', 'Video corto listo para subir (máx 30 segundos).');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el video desde el dispositivo.');
    }
  };

  const handlePublishReel = () => {
    if (!newCaption.trim()) {
      Alert.alert('Escribe una descripción', 'Ingresa una breve descripción para tu Reel de 30 segundos.');
      return;
    }

    const newReel: ReelItem = {
      id: `reel-${Date.now()}`,
      creatorName: 'Tu Perfil AURA LIVE 👑',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      videoUrl: selectedVideoUri || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      caption: newCaption,
      likes: 1,
      comments: 0,
    };

    setReels([newReel, ...reels]);
    setUploadModalVisible(false);
    setNewCaption('');
    setSelectedVideoUri(null);
    Alert.alert('¡Reel Publicado! 🎉', 'Tu video corto de 30s ha sido publicado exitosamente.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020205' }} edges={['top']}>
      <Cyber3DBackground />
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Film size={22} color="#FF007F" />
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>Reels (30s) AURA 🎬</Text>
        </View>

        <TouchableOpacity onPress={() => setUploadModalVisible(true)} activeOpacity={0.85}>
          <LinearGradient colors={['#FF007F', '#7C3AED']} style={styles.uploadBtn}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>Subir Reel (30s)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Vertical Reels Feed */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {reels.map((item) => (
          <View key={item.id} style={[styles.reelCard, { width: maxCardWidth }]}>
            {/* Video Player / Thumbnail View */}
            <View style={styles.mediaContainer}>
              {Platform.OS === 'web' ? (
                <video
                  src={item.videoUrl}
                  poster={item.thumbnailUrl}
                  controls
                  loop
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <View style={{ width: '100%', height: '100%', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                  <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }]}>
                    <PlayCircle size={60} color="#00E5FF" />
                  </View>
                </View>
              )}

              {/* Duration Badge */}
              <View style={styles.durationBadge}>
                <Clock size={10} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>30s MÁX</Text>
              </View>

              {/* Creator Overlay Badge */}
              <View style={styles.creatorBadge}>
                <Image source={{ uri: item.creatorAvatar }} style={styles.avatar} />
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>{item.creatorName}</Text>
              </View>
            </View>

            {/* Bottom Actions Bar */}
            <View style={styles.actionRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 4 }} numberOfLines={2}>{item.caption}</Text>
                <Text style={{ color: '#EC4899', fontSize: 10, fontWeight: '700' }}>#Reels30s #AuraLive #Viral</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <TouchableOpacity onPress={() => toggleLike(item.id)} style={{ alignItems: 'center' }}>
                  <Heart size={22} color={item.isLiked ? '#FF007F' : '#9CA3AF'} fill={item.isLiked ? '#FF007F' : 'transparent'} />
                  <Text style={{ color: '#D1D5DB', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{item.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center' }}>
                  <MessageCircle size={22} color="#00E5FF" />
                  <Text style={{ color: '#D1D5DB', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{item.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center' }}>
                  <Share2 size={20} color="#FFD700" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1F2937', '#000000']} style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Film size={24} color="#FF007F" />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>Subir Reel de 30s 🎬</Text>
            </View>

            <TouchableOpacity onPress={handlePickLocalVideo} activeOpacity={0.85} style={{ marginBottom: 16 }}>
              <LinearGradient colors={['#374151', '#111827']} style={styles.pickVideoBtn}>
                <VideoIcon size={24} color="#00E5FF" />
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12, marginTop: 6 }}>
                  {selectedVideoUri ? 'Video corto cargado ✅' : 'Seleccionar Video del Dispositivo (máx 30s)'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>Descripción / Hashtags:</Text>
              <TextInput
                value={newCaption}
                onChangeText={setNewCaption}
                placeholder="Ej: ¡Mi momento épico en vivo hoy! 🔥"
                placeholderTextColor="#6B7280"
                style={styles.input}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePublishReel} style={{ flex: 1 }}>
                <LinearGradient colors={['#FF007F', '#7C3AED']} style={styles.publishBtn}>
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>Publicar 🚀</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(0,229,255,0.2)', backgroundColor: 'rgba(0,0,0,0.9)' },
  uploadBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
  reelCard: { backgroundColor: '#0A0A10', borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.3)', marginBottom: 20 },
  mediaContainer: { width: '100%', height: 380, position: 'relative', backgroundColor: '#000' },
  durationBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(239,68,68,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  creatorBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#00E5FF' },
  avatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#FFF' },
  actionRow: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0A0A10' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 16 },
  modalCard: { borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: 'rgba(255,0,127,0.4)', width: '100%', maxWidth: 380 },
  pickVideoBtn: { padding: 16, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#00E5FF', alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', fontSize: 13, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  publishBtn: { paddingVertical: 12, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
