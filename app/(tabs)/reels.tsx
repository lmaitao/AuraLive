import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform, StyleSheet, useWindowDimensions, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Heart, MessageCircle, Share2, Plus, Film, Sparkles, PlayCircle, Video as VideoIcon, Clock, X, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export interface ReelComment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface ReelItem {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
  commentsList: ReelComment[];
}

export default function ShortVideosScreen() {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const maxCardWidth = Math.min(width - 24, 480);

  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loadingReels, setLoadingReels] = useState(true);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal de comentarios
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [activeViewableId, setActiveViewableId] = useState<string | null>(null);

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveViewableId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('id, full_name, avatar_url').eq('id', user.id).single().then(({ data }) => {
          setCurrentUser(data);
        });
      }
    });
    fetchReels();
  }, []);

  const fetchReels = async () => {
    setLoadingReels(true);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Reels fetch notice:', error.message);
      }

      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map((r: any) => r.user_id).filter(Boolean)));
        let profileMap: Record<string, any> = {};

        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          if (profs) {
            profs.forEach((p: any) => {
              profileMap[p.id] = p;
            });
          }
        }

        const formatted: ReelItem[] = data.map((r: any) => {
          const p = profileMap[r.user_id];
          return {
            id: r.id,
            creatorName: p?.full_name || 'Usuario Aura',
            creatorAvatar: p?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
            videoUrl: r.video_url,
            thumbnailUrl: r.thumbnail_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
            caption: r.caption || '',
            likes: r.likes_count || 0,
            commentsCount: r.comments_count || 0,
            isLiked: false,
            commentsList: [],
          };
        });
        setReels(formatted);
      } else {
        setReels([]);
      }
    } catch (e) {
      console.log('Error fetching 24h reels:', e);
      setReels([]);
    } finally {
      setLoadingReels(false);
    }
  };

  const toggleLike = async (id: string) => {
    const target = reels.find((r) => r.id === id);
    if (!target) return;

    const nextIsLiked = !target.isLiked;
    const nextLikesCount = nextIsLiked ? target.likes + 1 : Math.max(0, target.likes - 1);

    setReels((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isLiked: nextIsLiked, likes: nextLikesCount } : r))
    );

    try {
      await supabase.from('reels').update({ likes_count: nextLikesCount }).eq('id', id);
    } catch (e) {
      console.log('Error updating likes in DB:', e);
    }
  };

  const handleOpenComments = (reelId: string) => {
    setActiveReelId(reelId);
    setCommentsModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !activeReelId) return;

    const newComment: ReelComment = {
      id: `comment-${Date.now()}`,
      userName: currentUser?.full_name || 'Usuario Aura',
      userAvatar: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      text: newCommentText.trim(),
      timestamp: 'Ahora mismo',
    };

    const target = reels.find((r) => r.id === activeReelId);
    const nextCommentsCount = (target?.commentsCount || 0) + 1;

    setReels((prev) =>
      prev.map((r) =>
        r.id === activeReelId
          ? {
              ...r,
              commentsCount: nextCommentsCount,
              commentsList: [newComment, ...r.commentsList],
            }
          : r
      )
    );

    setNewCommentText('');

    try {
      await supabase.from('reels').update({ comments_count: nextCommentsCount }).eq('id', activeReelId);
    } catch (e) {
      console.log('Error updating comments in DB:', e);
    }
  };

  const handleRecordCameraVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de Cámara Requerido', 'Aura Live necesita acceso a tu cámara para grabar el Reel.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 30,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSelectedVideoUri(result.assets[0].uri);
        Alert.alert('Video Grabado 📸🎥', 'Tu video de cámara está listo para publicar.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo activar la cámara para grabar el video.');
    }
  };

  const handlePickLocalVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 30,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSelectedVideoUri(result.assets[0].uri);
        Alert.alert('Video Seleccionado 🎬', 'Video corto listo para subir.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el video desde el dispositivo.');
    }
  };

  const handlePublishReel = async () => {
    if (!selectedVideoUri) {
      Alert.alert('Video Requerido 📸', 'Por favor graba un video con tu cámara o selecciona uno de tu galería.');
      return;
    }
    if (!newCaption.trim()) {
      Alert.alert('Escribe una descripción', 'Ingresa una breve descripción para tu Reel.');
      return;
    }
    if (!currentUser?.id) {
      Alert.alert('Sesión Requerida', 'Inicia sesión para subir un reel.');
      return;
    }

    try {
      // Check 1 video per 24 hours
      const { data: userReels } = await supabase
        .from('reels')
        .select('created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (userReels && userReels.length > 0) {
        const lastReelTime = new Date(userReels[0].created_at).getTime();
        const diffHours = (Date.now() - lastReelTime) / (1000 * 60 * 60);
        if (diffHours < 24) {
          const hoursLeft = Math.ceil(24 - diffHours);
          Alert.alert('Límite Diario (1 Reel / 24h) 🎬', `Ya has publicado 1 Reel en las últimas 24 horas. Podrás subir otro en ${hoursLeft}h.`);
          return;
        }
      }
    } catch (e) {
      console.log('Checking 24h limit:', e);
    }

    setUploadingVideo(true);
    let finalVideoUrl = selectedVideoUri;

    // Subida real a Supabase Storage 'reels' si es URI local del teléfono
    if (selectedVideoUri.startsWith('file://') || selectedVideoUri.startsWith('content://')) {
      try {
        const fileName = `${currentUser.id}_${Date.now()}.mp4`;
        const formData = new FormData();
        formData.append('file', {
          uri: selectedVideoUri,
          name: fileName,
          type: 'video/mp4',
        } as any);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reels')
          .upload(fileName, formData, {
            contentType: 'video/mp4',
            upsert: true,
          });

        if (!uploadError && uploadData?.path) {
          const { data: publicUrlData } = supabase.storage
            .from('reels')
            .getPublicUrl(uploadData.path);
          if (publicUrlData?.publicUrl) {
            finalVideoUrl = publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.log('Supabase Storage upload warning:', storageErr);
      }
    }

    const localReel: ReelItem = {
      id: `reel-${Date.now()}`,
      creatorName: currentUser?.full_name || 'Tu Perfil AURA',
      creatorAvatar: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      videoUrl: finalVideoUrl,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      caption: newCaption.trim(),
      likes: 0,
      commentsCount: 0,
      commentsList: [],
    };

    try {
      await supabase.from('reels').insert({
        user_id: currentUser.id,
        video_url: finalVideoUrl,
        thumbnail_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
        caption: newCaption.trim(),
      });
    } catch (e) {
      console.log('Error saving reel to DB:', e);
    } finally {
      setUploadingVideo(false);
    }

    setReels([localReel, ...reels]);
    setUploadModalVisible(false);
    setNewCaption('');
    setSelectedVideoUri(null);
    Alert.alert('¡Reel Publicado! 🎉', 'Tu video se mantendrá público durante 24 horas para toda la comunidad de Aura Live.');
  };

  const activeReel = reels.find((r) => r.id === activeReelId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020205' }} edges={['top']}>
      <Cyber3DBackground />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Film size={22} color="#FF007F" />
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>Reels 🎬</Text>
        </View>

        <TouchableOpacity onPress={() => setUploadModalVisible(true)} activeOpacity={0.85}>
          <LinearGradient colors={['#FF007F', '#7C3AED']} style={styles.uploadBtn}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>Subir Reel</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Vertical Reels Feed with FlatList & Auto-Play on Viewable Item */}
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 130 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => {
          const isPlaying = isFocused && (activeViewableId === item.id || (!activeViewableId && item.id === reels[0]?.id));
          return (
            <View style={[styles.reelCard, { width: maxCardWidth }]}>
              {/* Video Player / Thumbnail View */}
              <View style={styles.mediaContainer}>
                {item.videoUrl ? (
                  <ExpoVideo
                    source={{ uri: item.videoUrl }}
                    posterSource={{ uri: item.thumbnailUrl }}
                    usePoster={false}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={isPlaying}
                    isLooping={true}
                    isMuted={true}
                    onError={(e) => console.log('ExpoVideo playback error:', e)}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : (
                  <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
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

                  <TouchableOpacity onPress={() => handleOpenComments(item.id)} style={{ alignItems: 'center' }}>
                    <MessageCircle size={22} color="#00E5FF" />
                    <Text style={{ color: '#D1D5DB', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{item.commentsCount}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={{ alignItems: 'center' }}>
                    <Share2 size={20} color="#FFD700" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* MODAL DE COMENTARIOS */}
      <Modal visible={commentsModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <LinearGradient colors={['#1F2937', '#0A0A10']} style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '80%', borderTopWidth: 1.5, borderColor: '#00E5FF' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>
                Comentarios ({activeReel?.commentsCount || 0}) 💬
              </Text>
              <TouchableOpacity onPress={() => setCommentsModalVisible(false)} style={{ padding: 4 }}>
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Lista de comentarios */}
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
              {activeReel?.commentsList.length === 0 ? (
                <Text style={{ color: '#6B7280', textAlign: 'center', marginVertical: 30, fontSize: 13 }}>
                  Sé el primero en comentar este Reel ✨
                </Text>
              ) : (
                activeReel?.commentsList.map((c) => (
                  <View key={c.id} style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                    <Image source={{ uri: c.userAvatar }} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#00E5FF' }} />
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 14 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>{c.userName}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 10 }}>{c.timestamp}</Text>
                      </View>
                      <Text style={{ color: '#D1D5DB', fontSize: 13, lineHeight: 18 }}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Input para agregar comentario */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)' }}>
              <TextInput
                value={newCommentText}
                onChangeText={setNewCommentText}
                placeholder="Escribe un comentario público..."
                placeholderTextColor="#6B7280"
                style={{ flex: 1, color: '#FFF', fontSize: 13, paddingVertical: 8 }}
              />
              <TouchableOpacity onPress={handleAddComment} style={{ backgroundColor: '#00E5FF', padding: 8, borderRadius: 16 }}>
                <Send size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1F2937', '#000000']} style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Film size={24} color="#FF007F" />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>Subir Reel de 30s 🎬</Text>
            </View>

            {/* Opciones para obtener video */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity onPress={handleRecordCameraVideo} activeOpacity={0.85} style={{ flex: 1 }}>
                <LinearGradient colors={['#FF007F', '#831843']} style={{ paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <VideoIcon size={22} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11, marginTop: 4, textAlign: 'center' }}>Grabar Cámara 📸</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePickLocalVideo} activeOpacity={0.85} style={{ flex: 1 }}>
                <LinearGradient colors={['#00E5FF', '#0284C7']} style={{ paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Film size={22} color="#000" />
                  <Text style={{ color: '#000', fontWeight: '800', fontSize: 11, marginTop: 4, textAlign: 'center' }}>Galería 📱</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {selectedVideoUri && (
              <View style={{ backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: '#22C55E', padding: 10, borderRadius: 14, marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ color: '#22C55E', fontWeight: '800', fontSize: 12 }}>✅ Video Grabado / Cargado Listo para Publicar</Text>
              </View>
            )}

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

              <TouchableOpacity onPress={handlePublishReel} disabled={uploadingVideo} style={{ flex: 1 }}>
                <LinearGradient colors={['#FF007F', '#7C3AED']} style={styles.publishBtn}>
                  {uploadingVideo ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>Publicar 🚀</Text>
                  )}
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
