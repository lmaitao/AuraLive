import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Modal,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { ZegoVideoEngine } from "../../components/ZegoVideoEngine";
import { LiveChat, ChatItem } from "../../components/LiveChat";
import { CloverProgress } from "../../components/CloverProgress";
import { VipEntranceOverlay } from "../../components/VipEntranceOverlay";
import { GiftModal } from "../../components/GiftModal";
import { CameraFiltersModal } from "../../components/CameraFiltersModal";
import { InteractiveGamesModal } from "../../components/InteractiveGamesModal";
import { EventsPlazaModal } from "../../components/EventsPlazaModal";
import { Cyber3DBackground } from "../../components/Cyber3DBackground";
import { AuraAlert, AuraAlertProps } from "../../components/AuraAlert";
import {
  ArrowLeft,
  Gift,
  Coins,
  Heart,
  Share2,
  Sparkles,
  Gamepad2,
  CalendarDays,
  AlertTriangle,
  ScanFace,
  Eye,
  EyeOff,
  MessageSquare,
  Grid,
  X,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

// -----------------------------------------------------
// Componente de Regalo Animado 3D (Efecto Flotante)
// -----------------------------------------------------
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const FloatingGift = ({
  giftUrl,
  onAnimationComplete,
}: {
  giftUrl: string;
  onAnimationComplete: () => void;
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT / 2)).current;
  const scale = useRef(new Animated.Value(0.1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación 1: Aparecer con Bounce (Scale up)
    Animated.spring(scale, {
      toValue: 2,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Animación 2: Flotar hacia arriba y desaparecer
    Animated.timing(translateY, {
      toValue: -100, // Sube fuera de la pantalla
      duration: 3000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.timing(opacity, {
      toValue: 0,
      duration: 1000,
      delay: 2000,
      useNativeDriver: true,
    }).start(() => {
      onAnimationComplete();
    });
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: "40%",
        transform: [{ translateY }, { scale }],
        opacity,
        zIndex: 9999,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {giftUrl.includes('.json') ? (
        <LottieView
          source={{ uri: giftUrl }}
          autoPlay
          loop={false}
          style={{ width: 160, height: 160 }}
          onAnimationFinish={() => {}}
        />
      ) : (
        <Image
          source={{
            uri: giftUrl || "https://cdn-icons-png.flaticon.com/512/4213/4213958.png",
          }}
          style={{ width: 80, height: 80 }}
          resizeMode="contain"
        />
      )}
    </Animated.View>
  );
};

// -----------------------------------------------------
// Pantalla Principal de la Sala
// -----------------------------------------------------
export default function LiveRoomScreen() {
  const {
    id,
    isHost: paramIsHost,
    layout: paramLayout,
  } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const initialLayout = paramLayout === "4cam" ? "4_cam" : "8_cam";
  const initialIsHost = paramIsHost === "true";

  const [layoutMode, setLayoutMode] = useState<"4_cam" | "8_cam">(
    initialLayout,
  );
  const [isHost, setIsHost] = useState(initialIsHost);
  const [senderCoins, setSenderCoins] = useState(1500);

  const [unlockedLeaves, setUnlockedLeaves] = useState(3);
  const [accumulatedCoins, setAccumulatedCoins] = useState(0);
  const [streamMinutes, setStreamMinutes] = useState(180);

  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);
  const [currentEntrance, setCurrentEntrance] = useState<{username: string, isVip: boolean, svipLevel?: number, wealthLevel?: number} | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [gamesModalVisible, setGamesModalVisible] = useState(false);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);

  const [faceDetected, setFaceDetected] = useState(true);
  const [faceLostSeconds, setFaceLostSeconds] = useState(0);

  // Estado para manejar múltiples animaciones de regalos
  const [activeGifts, setActiveGifts] = useState<{ id: string; url: string }[]>(
    [],
  );

  const [hostProfile, setHostProfile] = useState<{ full_name: string; avatar_url: string; gender?: string; is_agency?: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setHostProfile({
              full_name: data.full_name,
              avatar_url: data.avatar_url,
              gender: data.gender,
              is_agency: data.is_agency,
            });
            setCurrentEntrance({
              username: data.full_name || 'Usuario Aura',
              isVip: (data.svip_level || 0) > 0 || (data.wealth_level || 0) > 0,
              svipLevel: data.svip_level || 0,
              wealthLevel: data.wealth_level || 0,
            });
          }
        });
        supabase.from('wallets').select('coin_balance').eq('user_id', user.id).single().then(({ data }) => {
          if (data) setSenderCoins(data.coin_balance || 0);
        });
      }
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!faceDetected && isHost) {
      interval = setInterval(() => {
        setFaceLostSeconds((prev) => {
          const next = prev + 1;
          if (next >= 60) {
            clearInterval(interval);
            setAlertConfig({
              visible: true,
              title: "Transmisión Finalizada",
              message: "Sala cerrada por no detectar rostro.",
              type: "danger",
              confirmText: "Ok",
              onConfirm: () => router.replace("/(tabs)/feed" as any)
            });
          }
          return next;
        });
      }, 1000);
    } else {
      setFaceLostSeconds(0);
    }
    return () => clearInterval(interval);
  }, [faceDetected, isHost, router]);

  const [messages, setMessages] = useState<ChatItem[]>([]);

  const handleSendMessage = (
    text: string,
    isCensored: boolean,
    avatarUrl?: string,
    customSenderName?: string,
    isVip?: boolean
  ) => {
    const newMsg: ChatItem = {
      id: Date.now().toString() + Math.random().toString(),
      senderName: customSenderName || "Tú",
      senderAvatar:
        avatarUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      message: text,
      isCensored,
      isVip,
      timestamp: "Ahora",
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleGiftSuccess = (newBal: number, giftData?: { name?: string; iconUrl?: string; lottieUrl?: string; coinPrice?: number }) => {
    setSenderCoins(newBal);
    setAccumulatedCoins((prev) => {
      const aurasEarned = (giftData?.coinPrice || 10) * 0.4;
      const next = prev + aurasEarned;
      setUnlockedLeaves(Math.min(5, Math.floor(next / 5000)));
      return next;
    });

    // Lanzar Animación 3D del Regalo
    const giftId = Date.now().toString();
    const giftUrl = giftData?.lottieUrl || giftData?.iconUrl || "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=300";

    setActiveGifts((prev) => [...prev, { id: giftId, url: giftUrl }]);

    const giftName = giftData?.name || 'Trébol Dorado 🍀';
    handleSendMessage(`¡Envió un Súper Regalo Animado ${giftName}! 🎁✨`, false);
  };

  const removeGiftAnimation = (id: string) => {
    setActiveGifts((prev) => prev.filter((gift) => gift.id !== id));
  };

  const handleExitRoom = () => {
    if (isHost) {
      setAlertConfig({
        visible: true,
        title: "Finalizar Transmisión",
        message: "¿Estás segura de que deseas finalizar tu transmisión en vivo? La sala se cerrará para todos los espectadores.",
        type: "warning",
        confirmText: "Finalizar y Salir",
        cancelText: "Continuar",
        onConfirm: () => router.replace("/(tabs)/feed" as any),
        onCancel: () => setAlertConfig(null)
      });
    } else {
      router.back();
    }
  };

  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatarUrl: string } | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Cyber3DBackground />
      {/* 🌟 OVERLAY DE REGALOS ANIMADOS 🌟 */}
      {activeGifts.map((gift) => (
        <FloatingGift
          key={gift.id}
          giftUrl={gift.url}
          onAnimationComplete={() => removeGiftAnimation(gift.id)}
        />
      ))}

      <VipEntranceOverlay
        username={currentEntrance?.username || ""}
        isVip={currentEntrance?.isVip}
        svipLevel={currentEntrance?.svipLevel}
        wealthLevel={currentEntrance?.wealthLevel}
        isVisible={!!currentEntrance}
        onFinished={() => setCurrentEntrance(null)}
      />

      {!faceDetected && isHost && (
        <View style={{ backgroundColor: 'rgba(239,68,68,0.9)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          <AlertTriangle size={16} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, marginLeft: 6 }}>
            ¡ALERTA! Rostro no detectado. Cierre en {60 - faceLostSeconds}s
          </Text>
        </View>
      )}

      <LinearGradient
        colors={["#4C1D95", "#000000"]}
        style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' }}
      >
        {/* Left Host Avatar & Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image
            source={{
              uri: hostProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
            }}
            style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#FF007F' }}
          />
          <View>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>
              {hostProfile?.full_name || "Aura Host ✨"}
            </Text>
            <Text style={{ color: '#00E5FF', fontSize: 9, fontWeight: '800' }}>
              ID: {id || "101"} • En Vivo 📡
            </Text>
          </View>
        </View>

        {/* Right side stats: Auras Recibidas (Solo Presentadoras Mujeres o Agencias Certificadas) */}
        {(hostProfile?.gender === 'female' || hostProfile?.is_agency) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168,85,247,0.2)', borderWidth: 1.5, borderColor: '#A855F7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 4 }}>
              <Text style={{ fontSize: 13 }}>🔮</Text>
              <Text style={{ color: '#C084FC', fontWeight: '900', fontSize: 11 }}>
                {(accumulatedCoins >= 1000 ? (accumulatedCoins / 1000).toFixed(1) + 'K' : accumulatedCoins)} Auras
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 12 }}>
          <ZegoVideoEngine
            layoutMode={layoutMode}
            isHost={isHost}
            onLayoutChange={(mode) => setLayoutMode(mode)}
            onSelectUser={(u) => setSelectedUser(u)}
          />
        </View>

        {/* Dedicated Room Chat Container (Permanently Active & Responsive) */}
        <View
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            padding: 10,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: '#00E5FF',
            height: windowHeight < 720 ? 145 : 170,
            marginBottom: 12,
            shadowColor: '#00E5FF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={13} color="#00E5FF" />
              <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>
                CHAT DE LA SALA EN VIVO
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 229, 255, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#00E5FF' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
              <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 9 }}>ACTIVO (60 FPS)</Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <LiveChat
              roomId={id as string}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </View>
        </View>

        {/* Bottom Organized 3D Cyberpunk Action Bar */}
        <LinearGradient
          colors={['#1F2937', '#0F0F1A']}
          style={{ padding: 10, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(0, 229, 255, 0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}
        >


          {/* 2. Direct DM Privado Button */}
          <TouchableOpacity
            onPress={() => router.push('/chat/u1' as any)}
            activeOpacity={0.8}
            style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#EC4899', '#8B5CF6']}
              style={{ paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 16, gap: 1 }}
            >
              <MessageSquare size={15} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 9, textTransform: 'uppercase' }}>
                DM 📩
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 3. Regalos Button */}
          <TouchableOpacity
            onPress={() => setGiftModalVisible(true)}
            activeOpacity={0.8}
            style={{ flex: 1.1, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#FF007F', '#8B5CF6']}
              style={{ paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 16, gap: 1 }}
            >
              <Gift size={15} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 9, textTransform: 'uppercase' }}>
                Regalos 🎁
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 4. Juegos Button */}
          <TouchableOpacity
            onPress={() => setGamesModalVisible(true)}
            activeOpacity={0.8}
            style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#F59E0B', '#B45309']}
              style={{ paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 16, gap: 1 }}
            >
              <Gamepad2 size={15} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 9, textTransform: 'uppercase' }}>
                Juegos
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 5. Trébol Meta Button */}
          <TouchableOpacity
            onPress={() => {
              handleGiftSuccess(senderCoins - 500, { name: 'Trébol Dorado 🍀', iconUrl: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=300' });
            }}
            activeOpacity={0.8}
            style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#10B981', '#047857']}
              style={{ paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 16, gap: 1 }}
            >
              <Text style={{ fontSize: 13 }}>🍀</Text>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 9, textTransform: 'uppercase' }}>
                Trébol
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>

      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        senderId="user-me-123"
        receptorId="host-streamer-456"
        receptorGender="female"
        receptorIsStreamer={true}
        senderCoins={senderCoins}
        onGiftSentSuccess={handleGiftSuccess}
      />

      <CameraFiltersModal
        visible={filtersModalVisible}
        onClose={() => setFiltersModalVisible(false)}
      />
      <InteractiveGamesModal
        visible={gamesModalVisible}
        onClose={() => setGamesModalVisible(false)}
      />
      <EventsPlazaModal
        visible={eventsModalVisible}
        onClose={() => setEventsModalVisible(false)}
      />

      {/* 👤 Modal de Perfil de Usuario Seleccionado */}
      <Modal visible={!!selectedUser} transparent animationType="fade" onRequestClose={() => setSelectedUser(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          {selectedUser && (
            <LinearGradient colors={['#1F2937', '#0F172A']} style={{ width: '90%', borderRadius: 28, borderWidth: 2, borderColor: '#00E5FF', padding: 20, alignItems: 'center', position: 'relative' }}>
              <TouchableOpacity onPress={() => setSelectedUser(null)} style={{ position: 'absolute', top: 14, right: 14, padding: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <X size={16} color="#FFF" />
              </TouchableOpacity>

              <Image source={{ uri: selectedUser.avatarUrl }} style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, borderColor: '#00E5FF', marginBottom: 10 }} />
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16, textAlign: 'center' }}>{selectedUser.name}</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 8 }}>
                <View style={{ backgroundColor: 'rgba(0,229,255,0.15)', borderWidth: 1, borderColor: '#00E5FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 9 }}>Nivel 42 VIP 💎</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,0,127,0.15)', borderWidth: 1, borderColor: '#FF007F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#FF007F', fontWeight: '900', fontSize: 9 }}>1,240 Auras 🔮</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ width: '100%', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedUser(null);
                    setGiftModalVisible(true);
                  }}
                  activeOpacity={0.8}
                  style={{ borderRadius: 18, overflow: 'hidden' }}
                >
                  <LinearGradient colors={['#FF007F', '#8B5CF6']} style={{ paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                    <Gift size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>Enviar Regalo 🎁</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const uid = selectedUser.id;
                    setSelectedUser(null);
                    router.push({ pathname: '/chat/[id]', params: { id: uid } } as any);
                  }}
                  activeOpacity={0.8}
                  style={{ borderRadius: 18, overflow: 'hidden' }}
                >
                  <LinearGradient colors={['#00E5FF', '#0284C7']} style={{ paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                    <MessageSquare size={16} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>Chat Privado DM 📩</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setAlertConfig({
                      visible: true,
                      title: "¡Siguiendo!",
                      message: `Ahora sigues a ${selectedUser.name}`,
                      type: "success",
                      confirmText: "Ok",
                      onConfirm: () => setAlertConfig(null)
                    });
                  }}
                  activeOpacity={0.8}
                  style={{ paddingVertical: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 10 }}>+ SEGUIR USUARIO</Text>
                </TouchableOpacity>

                {isHost && (
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setAlertConfig({
                          visible: true,
                          title: "Bajar del Puesto",
                          message: `¿Deseas quitarle el micrófono y la cámara a ${selectedUser.name}?`,
                          type: "warning",
                          confirmText: "Bajar",
                          cancelText: "Cancelar",
                          onConfirm: () => {
                            setSelectedUser(null);
                            setAlertConfig({
                              visible: true,
                              title: "Éxito",
                              message: "El usuario ha sido bajado del puesto.",
                              type: "success",
                              confirmText: "Ok",
                              onConfirm: () => setAlertConfig(null)
                            });
                          },
                          onCancel: () => setAlertConfig(null)
                        });
                      }}
                      activeOpacity={0.8}
                      style={{ paddingVertical: 10, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: '#F59E0B', alignItems: 'center' }}
                    >
                      <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 10, textTransform: 'uppercase' }}>⬇️ Bajar del Puesto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setAlertConfig({
                          visible: true,
                          title: "Expulsar Usuario",
                          message: `¿Deseas expulsar a ${selectedUser.name} permanentemente?`,
                          type: "danger",
                          confirmText: "Expulsar",
                          cancelText: "Cancelar",
                          onConfirm: () => {
                            setSelectedUser(null);
                            setAlertConfig({
                              visible: true,
                              title: "Expulsado",
                              message: "El usuario ha sido expulsado de la sala.",
                              type: "success",
                              confirmText: "Ok",
                              onConfirm: () => setAlertConfig(null)
                            });
                          },
                          onCancel: () => setAlertConfig(null)
                        });
                      }}
                      activeOpacity={0.8}
                      style={{ paddingVertical: 10, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' }}
                    >
                      <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 10, textTransform: 'uppercase' }}>❌ Expulsar de la Sala</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </LinearGradient>
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
