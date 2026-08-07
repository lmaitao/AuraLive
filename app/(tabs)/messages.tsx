import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { MessageSquare, Search, Edit, Sparkles, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ChatPreview = {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isVip?: boolean;
};

const mockChats: ChatPreview[] = [
  {
    id: 'chat-1',
    userId: 'u1',
    username: 'Elena Neo 🌟',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
    lastMessage: 'Enviando foto efímera 📸',
    timestamp: '12:05 PM',
    unreadCount: 2,
    isOnline: true,
    isVip: true,
  },
  {
    id: 'chat-2',
    userId: 'u2',
    username: 'Carlos VIP 👑',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    lastMessage: '¡Excelente transmisión el día de hoy!',
    timestamp: 'Ayer',
    unreadCount: 0,
    isOnline: false,
    isVip: true,
  },
  {
    id: 'chat-3',
    userId: 'u3',
    username: 'Mariana Live 💕',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    lastMessage: 'Nos vemos en la sala de 8 cámaras 🔥',
    timestamp: 'Hace 2 días',
    unreadCount: 0,
    isOnline: true,
  },
];

import { Cyber3DBackground } from '../../components/Cyber3DBackground';

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState(mockChats);

  const filteredChats = chats.filter((c) =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Cyber3DBackground />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={22} color="#00E5FF" />
          <Text style={styles.headerTitle}>Chats Directos 💬</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Edit size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={{ paddingHorizontal: 16, marginVertical: 10 }}>
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar contactos o conversaciones..."
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Messages List Container */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            activeOpacity={0.8}
            onPress={() => router.push(`/chat/${chat.id}` as any)}
            style={styles.chatRow}
          >
            <View style={{ position: 'relative' }}>
              <LinearGradient
                colors={chat.isVip ? ['#FFD700', '#FF007F'] : ['#00E5FF', '#3B82F6']}
                style={{ padding: 2, borderRadius: 28 }}
              >
                <Image source={{ uri: chat.avatar }} style={styles.avatar} />
              </LinearGradient>
              {chat.isOnline && <View style={styles.onlineBadge} />}
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.usernameText} numberOfLines={1}>
                  {chat.username}
                </Text>
                <Text style={styles.timestampText}>{chat.timestamp}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.lastMsgText} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>
                {chat.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredChats.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <MessageSquare size={44} color="#374151" />
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 12, fontWeight: '600' }}>
              No hay conversaciones activas.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  editBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchBar: {
    backgroundColor: '#111827',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchInput: {
    color: '#FFF',
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#000',
  },
  usernameText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  timestampText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
  },
  lastMsgText: {
    color: '#9CA3AF',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF007F',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justify: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
