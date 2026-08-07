import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { MessageSquare, Search, Edit, Sparkles, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';


import { Cyber3DBackground } from '../../components/Cyber3DBackground';

import { supabase } from '../../lib/supabase';

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

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [amigos, setAmigos] = useState<any[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'mensajes' | 'contactos'>('mensajes');
  const [activeSubTab, setActiveSubTab] = useState<'seguidos' | 'amigos' | 'seguidores'>('amigos');

  React.useEffect(() => {
    fetchData();
  }, [activeMainTab]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (activeMainTab === 'mensajes') {
        // Cargar conversaciones reales desde direct_messages
        const { data: msgs } = await supabase
          .from('direct_messages')
          .select('id, content, created_at, is_read, sender_id, receiver_id, profiles!direct_messages_sender_id_fkey(full_name, avatar_url), receiver:profiles!direct_messages_receiver_id_fkey(full_name, avatar_url)')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (msgs) {
          // Agrupar por conversación (usuario con quien chateamos)
          const convoMap: Record<string, any> = {};
          msgs.forEach(m => {
            const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
            const otherProfile = m.sender_id === user.id ? m.receiver : m.profiles;
            if (!convoMap[otherId]) {
              convoMap[otherId] = {
                id: otherId,
                userId: otherId,
                username: otherProfile?.full_name || 'Usuario',
                avatar: otherProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                lastMessage: m.content || '📎 Adjunto',
                timestamp: new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                unreadCount: (!m.is_read && m.receiver_id === user.id) ? 1 : 0,
                isOnline: false,
              };
            }
          });
          setChats(Object.values(convoMap));
        } else {
          setChats([]);
        }
      } else {
        // Cargar seguidores / seguidos
        const { data: follows } = await supabase
          .from('followers')
          .select('follower_id, following_id')
          .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);
          
        if (follows) {
          const myFollowers = follows.filter(f => f.following_id === user.id).map(f => f.follower_id);
          const iFollow = follows.filter(f => f.follower_id === user.id).map(f => f.following_id);
          const mutuals = myFollowers.filter(id => iFollow.includes(id));
          
          let targetIds = mutuals;
          if (activeSubTab === 'seguidores') targetIds = myFollowers;
          if (activeSubTab === 'seguidos') targetIds = iFollow;
          
          if (targetIds.length > 0) {
            const { data: profs } = await supabase.from('profiles').select('*').in('id', targetIds);
            setAmigos(profs || []);
          } else {
            setAmigos([]);
          }
        }
      }
    } catch (e) {
      console.log('Error fetching:', e);
    }
  };


  const filteredChats = chats.filter((c) =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAmigos = amigos.filter((a) =>
    (a.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Cyber3DBackground />
      {/* Header Top Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 10, paddingBottom: 10 }}>
         <TouchableOpacity onPress={() => setActiveMainTab('mensajes')} style={{ marginHorizontal: 20 }}>
            <Text style={{ color: activeMainTab === 'mensajes' ? '#FFF' : '#6B7280', fontSize: 20, fontWeight: '900' }}>Mensajes</Text>
            {activeMainTab === 'mensajes' && <View style={{ height: 3, width: '100%', backgroundColor: '#00E5FF', marginTop: 4, borderRadius: 2 }} />}
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveMainTab('contactos')} style={{ marginHorizontal: 20 }}>
            <Text style={{ color: activeMainTab === 'contactos' ? '#FFF' : '#6B7280', fontSize: 20, fontWeight: '900' }}>Contactos</Text>
            {activeMainTab === 'contactos' && <View style={{ height: 3, width: '100%', backgroundColor: '#FF007F', marginTop: 4, borderRadius: 2 }} />}
         </TouchableOpacity>
      </View>

      {/* Sub Tabs for Contactos */}
      {activeMainTab === 'contactos' && (
         <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 10 }}>
            <TouchableOpacity onPress={() => setActiveSubTab('seguidos')}>
               <Text style={{ color: activeSubTab === 'seguidos' ? '#00E5FF' : '#9CA3AF', fontWeight: 'bold', fontSize: 13 }}>Seguidos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveSubTab('amigos')}>
               <Text style={{ color: activeSubTab === 'amigos' ? '#00E5FF' : '#9CA3AF', fontWeight: 'bold', fontSize: 13 }}>Amigos mutuos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveSubTab('seguidores')}>
               <Text style={{ color: activeSubTab === 'seguidores' ? '#00E5FF' : '#9CA3AF', fontWeight: 'bold', fontSize: 13 }}>Seguidores</Text>
            </TouchableOpacity>
         </View>
      )}

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
        {activeMainTab === 'mensajes' ? (
          <>
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
          </>
        ) : (
          <View>
             {filteredAmigos.map((friend) => (
                <View key={`friend-${friend.id}`} style={[styles.chatRow, { alignItems: 'center' }]}>
                   <Image source={{ uri: friend.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }} style={[styles.avatar, { width: 50, height: 50, borderRadius: 25 }]} />
                   <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{friend.full_name}</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>{friend.status === 'verified' ? 'Verificado' : 'Activo'}</Text>
                   </View>
                   <TouchableOpacity 
                    onPress={() => {
                        if (activeSubTab === 'amigos') {
                           router.push(`/chat/${friend.id}` as any);
                        } else {
                           Alert.alert('Solo Mutuales', 'Deben seguirse mutuamente para poder iniciar un chat privado. ¡Vuelve a Conexiones para hacer Match!');
                        }
                    }}
                    style={{ backgroundColor: 'rgba(255,0,127,0.15)', borderWidth: 1, borderColor: '#FF007F', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
                      <Text style={{ color: '#FF007F', fontWeight: 'bold', fontSize: 12 }}>
                         {activeSubTab === 'amigos' ? 'Chat' : '+ Seguir'}
                      </Text>
                   </TouchableOpacity>
                </View>
             ))}
             {filteredAmigos.length === 0 && (
                 <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>No hay usuarios en esta lista.</Text>
             )}
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
