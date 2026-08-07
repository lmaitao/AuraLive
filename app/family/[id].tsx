import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Send, Users, Crown, ShieldAlert, UserMinus, MoreVertical, ShieldCheck } from 'lucide-react-native';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';
import { LinearGradient } from 'expo-linear-gradient';

export default function FamilyHubScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'chat'>('chat');
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadFamilyData();
  }, [id]);

  const loadFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Load Family Info
      const { data: fam, error: famError } = await supabase
        .from('families')
        .select('*')
        .eq('id', id)
        .single();
      
      if (famError) throw famError;
      setFamily(fam);

      // Load Members
      const { data: mems, error: memsError } = await supabase
        .from('family_members')
        .select(`
          id, role, status, joined_at, user_id,
          profiles(full_name, avatar_url, username)
        `)
        .eq('family_id', id)
        .eq('status', 'accepted')
        .order('role', { ascending: false }); // owner -> admin -> member
      
      if (memsError) throw memsError;
      
      // Add fake online status for demo
      const enrichedMembers = mems.map(m => ({
        ...m,
        is_online: Math.random() > 0.5 // Random online status for demo
      }));
      setMembers(enrichedMembers);

      // Set current user role
      const me = enrichedMembers.find(m => m.user_id === user.id);
      if (me) {
        setCurrentUserRole(me.role);
      }

      // Load Chat
      const { data: chats, error: chatError } = await supabase
        .from('family_chat')
        .select(`
          id, message, created_at, sender_id,
          profiles(full_name, avatar_url)
        `)
        .eq('family_id', id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (chatError) throw chatError;
      setMessages(chats || []);

    } catch (e) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "No se pudo cargar la información de la familia.",
        type: "danger",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    
    const text = newMessage.trim();
    setNewMessage('');

    try {
      // Optimistic update
      const tempMsg = {
        id: Math.random().toString(),
        message: text,
        sender_id: currentUserId,
        created_at: new Date().toISOString(),
        profiles: {
          full_name: 'Yo',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
        }
      };
      setMessages(prev => [...prev, tempMsg]);

      await supabase.from('family_chat').insert([
        {
          family_id: id,
          sender_id: currentUserId,
          message: text
        }
      ]);
      // Refetch ideally, but optimistic is fine for demo
    } catch (e) {
      console.log('Error sending msg', e);
    }
  };

  const handleExpel = (memberId: string, memberName: string) => {
    setAlertConfig({
      visible: true,
      title: "Expulsar Miembro",
      message: `¿Estás seguro de que deseas expulsar a ${memberName} de la familia?`,
      type: "danger",
      confirmText: "Expulsar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        setAlertConfig(null);
        try {
          await supabase.from('family_members').delete().eq('id', memberId);
          setMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (e) {}
      },
      onCancel: () => setAlertConfig(null)
    });
  };

  const handleAdminAction = (member: any) => {
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return;
    if (member.user_id === currentUserId) return;
    if (member.role === 'owner') return;
    if (currentUserRole === 'admin' && member.role === 'admin') return;

    Alert.alert(
      'Gestionar Miembro',
      `¿Qué deseas hacer con ${member.profiles.full_name}?`,
      [
        {
          text: 'Expulsar de la Familia',
          style: 'destructive',
          onPress: () => handleExpel(member.id, member.profiles.full_name)
        },
        ...(currentUserRole === 'owner' && member.role === 'member' ? [{
          text: 'Promover a Administrador',
          onPress: async () => {
            const adminCount = members.filter(m => m.role === 'admin').length;
            if (adminCount >= 3) {
              setAlertConfig({
                visible: true,
                title: "Límite Alcanzado",
                message: "Solo puedes tener 3 administradores.",
                type: "warning",
                confirmText: "Entendido",
                onConfirm: () => setAlertConfig(null)
              });
              return;
            }
            await supabase.from('family_members').update({ role: 'admin' }).eq('id', member.id);
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: 'admin' } : m));
          }
        }] : []),
        ...(currentUserRole === 'owner' && member.role === 'admin' ? [{
          text: 'Quitar Administrador',
          onPress: async () => {
            await supabase.from('family_members').update({ role: 'member' }).eq('id', member.id);
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: 'member' } : m));
          }
        }] : []),
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  if (loading || !family) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#818CF8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Cyber3DBackground />
      
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8, borderRadius: 20, marginRight: 8 }}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Image source={{ uri: family.avatar_url }} style={{ width: 40, height: 40, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.5)' }} />
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }} numberOfLines={1}>{family.name}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{members.length}/100 Miembros</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <TouchableOpacity 
          onPress={() => setActiveTab('chat')}
          style={{ flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderColor: activeTab === 'chat' ? '#6366F1' : 'transparent', backgroundColor: activeTab === 'chat' ? 'rgba(99,102,241,0.1)' : 'transparent' }}
        >
          <Text style={{ color: activeTab === 'chat' ? '#818CF8' : '#6B7280', fontWeight: activeTab === 'chat' ? 'bold' : 'normal' }}>Chat de Familia</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('members')}
          style={{ flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderColor: activeTab === 'members' ? '#6366F1' : 'transparent', backgroundColor: activeTab === 'members' ? 'rgba(99,102,241,0.1)' : 'transparent' }}
        >
          <Text style={{ color: activeTab === 'members' ? '#818CF8' : '#6B7280', fontWeight: activeTab === 'members' ? 'bold' : 'normal' }}>Miembros</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'members' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Fundador & Administradores</Text>
          {members.filter(m => m.role === 'owner' || m.role === 'admin').map(member => (
            <TouchableOpacity 
              key={member.id} 
              onPress={() => handleAdminAction(member)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: 'rgba(17,24,39,0.5)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ position: 'relative', marginRight: 12 }}>
                  <Image source={{ uri: member.profiles.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#6366F1' }} />
                  {member.is_online && (
                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, backgroundColor: '#22C55E', borderRadius: 7, borderWidth: 2, borderColor: '#111827' }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{member.profiles.full_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    {member.role === 'owner' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Crown size={10} color="#F59E0B" />
                        <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: 'bold' }}>Fundador</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <ShieldCheck size={10} color="#818CF8" />
                        <Text style={{ color: '#818CF8', fontSize: 10, fontWeight: 'bold' }}>Admin</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {(currentUserRole === 'owner' || currentUserRole === 'admin') && member.user_id !== currentUserId && member.role !== 'owner' && (
                <MoreVertical size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}

          <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', marginBottom: 16, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Miembros ({members.filter(m => m.role === 'member').length})</Text>
          {members.filter(m => m.role === 'member').map(member => (
            <TouchableOpacity 
              key={member.id}
              onPress={() => handleAdminAction(member)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: 'rgba(17,24,39,0.5)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ position: 'relative', marginRight: 12 }}>
                  <Image source={{ uri: member.profiles.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#374151' }} />
                  {member.is_online && (
                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, backgroundColor: '#22C55E', borderRadius: 7, borderWidth: 2, borderColor: '#111827' }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>{member.profiles.full_name}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>@{member.profiles.username}</Text>
                </View>
              </View>
              {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                <MoreVertical size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 16 }}
          >
            {messages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                <Users size={40} color="#9CA3AF" style={{ marginBottom: 8 }} />
                <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>Aún no hay mensajes en la familia.</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>¡Sé el primero en saludar!</Text>
              </View>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUserId;
                return (
                  <View key={msg.id} style={{ flexDirection: 'row', marginBottom: 16, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && (
                      <Image source={{ uri: msg.profiles?.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, alignSelf: 'flex-end' }} />
                    )}
                    <View style={{ maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: isMe ? 'rgba(79,70,229,0.9)' : 'rgba(31,41,55,0.9)', borderBottomRightRadius: isMe ? 2 : 16, borderBottomLeftRadius: isMe ? 16 : 2, borderWidth: 1, borderColor: isMe ? '#818CF8' : '#4B5563' }}>
                      {!isMe && <Text style={{ color: '#A5B4FC', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{msg.profiles?.full_name}</Text>}
                      <Text style={{ color: '#FFF', fontSize: 14, lineHeight: 20 }}>{msg.message}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Chat Input */}
          <View style={{ paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.8)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 32 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, minHeight: 48, justifyContent: 'center' }}>
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Escribe un mensaje a la familia..."
                placeholderTextColor="#6B7280"
                style={{ color: '#FFF' }}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity 
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              style={{ padding: 12, borderRadius: 24, backgroundColor: newMessage.trim() ? '#6366F1' : '#1F2937' }}
            >
              <Send size={20} color={newMessage.trim() ? 'white' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      <AuraAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        onConfirm={() => {
          alertConfig?.onConfirm();
          if (!alertConfig?.visible) setAlertConfig(null);
        }}
        onCancel={alertConfig?.onCancel ? () => {
          alertConfig.onCancel!();
          setAlertConfig(null);
        } : undefined}
      />
    </SafeAreaView>
  );
}
