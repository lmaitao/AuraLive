import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, Modal, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, Send, Camera, Image as ImageIcon, Trash2, Clock, UserPlus, UserCheck, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';

type Message = {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  timerSeconds?: number;
  isDeleted?: boolean;
  timestamp: string;
};

const MOCK_USER_ID = 'u1';
const MOCK_PARTNER_ID = 'u2';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      senderId: MOCK_PARTNER_ID,
      text: '¡Hola! ¿Cómo estás?',
      timestamp: '12:00 PM',
    },
    {
      id: 'm2',
      senderId: MOCK_USER_ID,
      text: '¡Todo excelente! Acabo de transmitir en AuraLive.',
      timestamp: '12:01 PM',
    },
    {
      id: 'm3',
      senderId: MOCK_PARTNER_ID,
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
      timerSeconds: 5,
      timestamp: '12:05 PM',
    }
  ]);

  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);
  const [inputText, setInputText] = useState('');
  const [activePhoto, setActivePhoto] = useState<{ id: string, url: string, timeRemaining: number } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(true); // Partner follows you
  const isMutualFollow = isFollowing && isFollowedBy;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activePhoto && activePhoto.timeRemaining > 0) {
      interval = setInterval(() => {
        setActivePhoto((prev) => prev ? { ...prev, timeRemaining: prev.timeRemaining - 1 } : null);
      }, 1000);
    } else if (activePhoto && activePhoto.timeRemaining === 0) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === activePhoto.id
            ? { ...msg, imageUrl: undefined, text: '📸 Foto efímera expirada', timerSeconds: undefined }
            : msg
        )
      );
      setActivePhoto(null);
    }
    return () => clearInterval(interval);
  }, [activePhoto]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: MOCK_USER_ID,
      text: inputText,
      timestamp: 'Ahora',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const sendEphemeralPhoto = () => {
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: MOCK_USER_ID,
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      timerSeconds: 5,
      timestamp: 'Ahora',
    };
    setMessages((prev) => [...prev, newMsg]);
    setAlertConfig({
      visible: true,
      title: "Foto Efímera Enviada 📸",
      message: "Se envió una foto con autodestrucción de 5 segundos.",
      type: "success",
      confirmText: "Ok",
      onConfirm: () => setAlertConfig(null)
    });
  };

  const confirmDelete = (msgId: string) => {
    setAlertConfig({
      visible: true,
      title: "Eliminar Mensaje",
      message: "¿Deseas eliminar este mensaje?",
      type: "warning",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, isDeleted: true, text: '🚫 Mensaje eliminado' } : m))
        );
        setAlertConfig(null);
      },
      onCancel: () => setAlertConfig(null)
    });
  };

  const handlePressPhoto = (msg: Message) => {
    if (msg.timerSeconds && msg.imageUrl && !msg.isDeleted) {
      setActivePhoto({ id: msg.id, url: msg.imageUrl, timeRemaining: msg.timerSeconds });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Cyber3DBackground />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color="#FFF" />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100' }}
          style={styles.headerAvatar}
        />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.headerName}>Elena Neo 🌟</Text>
          <Text style={styles.headerStatus}>En línea</Text>
        </View>
      </View>

      {/* Messages List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((item) => {
          const isMe = item.senderId === MOCK_USER_ID;
          return (
            <TouchableOpacity
              key={item.id}
              onLongPress={() => isMe && !item.isDeleted && confirmDelete(item.id)}
              delayLongPress={500}
              activeOpacity={0.85}
              style={[styles.msgRow, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}
            >
              <View
                style={[
                  styles.msgBubble,
                  item.isDeleted
                    ? styles.deletedBubble
                    : isMe
                    ? styles.myBubble
                    : styles.partnerBubble,
                ]}
              >
                {item.isDeleted ? (
                  <Text style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 12 }}>{item.text}</Text>
                ) : item.timerSeconds && item.imageUrl ? (
                  <TouchableOpacity
                    onPress={() => handlePressPhoto(item)}
                    style={styles.ephemeralBox}
                  >
                    <Clock size={20} color="#00E5FF" />
                    <Text style={styles.ephemeralText}>Ver foto efímera ({item.timerSeconds}s)</Text>
                  </TouchableOpacity>
                ) : item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={{ width: 180, height: 220, borderRadius: 14 }} />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600', lineHeight: 18 }}>{item.text}</Text>
                )}
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 4, textAlign: 'right' }}>
                  {item.timestamp}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Input Area or Mutual Follow Lock Card */}
      {!isMutualFollow ? (
        <View style={styles.mutualLockCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Lock size={16} color="#FF007F" />
            <Text style={styles.lockTitle}>Chat Privado Bloqueado</Text>
          </View>
          <Text style={styles.lockSubtext}>
            Para chatear directamente en privado, ambos usuarios deben seguirse mutuamente.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsFollowing(true);
              setAlertConfig({
                visible: true,
                title: "¡Ahora se siguen! 💕",
                message: "Has comenzado a seguir a este usuario. Chat privado activado.",
                type: "success",
                confirmText: "Genial",
                onConfirm: () => setAlertConfig(null)
              });
            }}
            activeOpacity={0.85}
            style={{ borderRadius: 20, overflow: 'hidden', marginTop: 10, width: '100%' }}
          >
            <LinearGradient colors={['#FF007F', '#8B5CF6']} style={styles.followBtn}>
              <UserPlus size={16} color="#FFF" />
              <Text style={styles.followBtnText}>+ SEGUIR TAMBIÉN PARA ACTIVAR CHAT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={sendEphemeralPhoto} style={styles.actionIconBtn}>
            <Clock size={20} color="#FF007F" />
          </TouchableOpacity>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe un mensaje privado..."
            placeholderTextColor="#6B7280"
            style={styles.textInput}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <LinearGradient colors={['#00E5FF', '#0284C7']} style={styles.sendBtnGradient}>
              <Send size={16} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Visor de Fotos Efímeras */}
      <Modal visible={!!activePhoto} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {activePhoto && (
            <>
              <View style={styles.timerBadge}>
                <Clock size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18, marginLeft: 6 }}>{activePhoto.timeRemaining}s</Text>
              </View>
              <Image source={{ uri: activePhoto.url }} style={{ width: '90%', height: '70%', borderRadius: 20 }} resizeMode="contain" />
              <Text style={{ color: '#9CA3AF', marginTop: 16, fontSize: 12, fontWeight: '700' }}>
                La imagen expira cuando el contador llegue a 0.
              </Text>
            </>
          )}
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  backBtn: {
    padding: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    marginLeft: 10,
  },
  headerName: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  headerStatus: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  deletedBubble: {
    backgroundColor: 'rgba(31,41,55,0.6)',
    borderWidth: 1,
    borderColor: '#374151',
  },
  ephemeralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  ephemeralText: {
    color: '#00E5FF',
    fontWeight: '800',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    gap: 8,
  },
  mutualLockCard: {
    padding: 16,
    margin: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 0, 127, 0.4)',
    alignItems: 'center',
  },
  lockTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  lockSubtext: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  followBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  followBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,0,127,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,127,0.3)',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  sendBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    position: 'absolute',
    top: 48,
    right: 20,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
