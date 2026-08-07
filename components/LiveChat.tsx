import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { sanitizeMessage } from '../utils/antiLeakFilter';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Send, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface ChatItem {
  id: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  isVip?: boolean;
  isCensored?: boolean;
  timestamp: string;
}

interface LiveChatProps {
  roomId: string;
  messages: ChatItem[];
  onSendMessage: (text: string, isCensored: boolean, avatarUrl?: string, customSenderName?: string, isVip?: boolean) => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({ roomId, messages, onSendMessage }) => {
  const theme = useTheme();
  const [inputText, setInputText] = useState('');
  const [myAvatarUrl, setMyAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');

  // Load user profile avatar
  useEffect(() => {
    async function loadAvatar() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
          if (profile && profile.avatar_url) {
            setMyAvatarUrl(profile.avatar_url);
          }
        }
      } catch (e) {}
    }
    loadAvatar();
  }, []);

  // Realtime Supabase Channel Subscription for Live Room Chat
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.message) {
            onSendMessage(newMsg.message, newMsg.is_censored || false, myAvatarUrl);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, myAvatarUrl]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const { sanitizedText, isCensored } = sanitizeMessage(inputText);

    onSendMessage(sanitizedText, isCensored, myAvatarUrl);
    setInputText('');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase.from('chat_messages').insert({
          room_id: roomId && roomId.includes('-') ? roomId : null,
          sender_id: user.id,
          message: sanitizedText,
          is_censored: isCensored,
        });
      }
    } catch (e) {}
  };

  const renderItem = ({ item }: { item: ChatItem }) => (
    <View style={styles.msgItem}>
      <Image
        source={{ uri: item.senderAvatar || myAvatarUrl }}
        style={styles.avatar}
      />
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        <Text style={styles.senderName}>
          {item.isVip && <Sparkles size={10} color="#FFD700" />} {item.senderName}:
        </Text>
        <Text
          style={[
            styles.msgText,
            item.isCensored && { color: '#FF007F', fontStyle: 'italic', fontWeight: 'bold' },
          ]}
        >
          {item.message}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.chatContainer}>
      {/* High-Performance 60 FPS FlashList Chat Engine */}
      <View style={styles.listContainer}>
        <FlashList
          data={messages}
          renderItem={renderItem}
          estimatedItemSize={38}
          keyExtractor={(item) => item.id}
          inverted={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Futuristic Cyberpunk Chat Input Bar */}
      <View style={styles.inputBarContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe un mensaje en vivo..."
          placeholderTextColor="#9CA3AF"
          style={styles.textInput}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          activeOpacity={0.8}
          style={{ borderRadius: 18, overflow: 'hidden' }}
        >
          <LinearGradient colors={['#00E5FF', '#0284C7']} style={styles.sendBtnGradient}>
            <Send size={16} color="#000000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  listContainer: {
    height: 115,
    width: '100%',
  },
  msgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  senderName: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 10,
    marginRight: 4,
  },
  msgText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  sendBtnGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
