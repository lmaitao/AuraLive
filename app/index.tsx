import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import {
  Sparkles,
  Tv,
  Smartphone,
  Shield,
  Zap,
  Flame,
  Gift,
  Mic,
  Video,
  Users,
  DownloadCloud,
} from "lucide-react-native";
import { Redirect } from "expo-router";

export default function WebLandingScreen() {
  const handleWebClick = () => {
    if (typeof window !== "undefined") {
      window.alert(
        "¡AURA LIVE! 🚀\n\nPor favor descarga nuestra app móvil (Android/iOS) para disfrutar de las transmisiones en vivo, juegos y todas las funciones interactivas.\n\nLa versión web es únicamente informativa.",
      );
    }
  };

  if (Platform.OS !== "web") {
    return <Redirect href="/auth/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#020205", width: "100%" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}>
        {/* ─── NAVIGATION BAR ─── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 40,
            paddingVertical: 18,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,229,255,0.15)",
            backgroundColor: "rgba(0,0,0,0.92)",
            position: Platform.OS === "web" ? ("sticky" as any) : "relative",
            top: 0,
            zIndex: 100,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(0,229,255,0.15)",
                borderWidth: 2,
                borderColor: "#00E5FF",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#00E5FF",
                shadowRadius: 12,
                shadowOpacity: 0.5,
              }}
            >
              <Sparkles size={22} color="#00E5FF" />
            </View>
            <View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: "900",
                  letterSpacing: 4,
                }}
              >
                AuraLive
              </Text>
              <Text
                style={{
                  color: "#FF007F",
                  fontSize: 9,
                  fontWeight: "800",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                Global Social Platform
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {["Inicio", "Salas", "Agencias"].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={handleWebClick}
                style={{ paddingHorizontal: 16, paddingVertical: 8 }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={handleWebClick}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 30,
                backgroundColor: "#00E5FF",
                shadowColor: "#00E5FF",
                shadowRadius: 16,
                shadowOpacity: 0.6,
              }}
            >
              <Text
                style={{
                  color: "#020205",
                  fontWeight: "900",
                  fontSize: 13,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Descargar App 📲
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── HERO SECTION ─── */}
        <View
          style={{
            width: "100%",
            minHeight: 680,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#050510",
          }}
        >
          {/* Decorative Gradients */}
          <View
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 500,
              height: 500,
              borderRadius: 250,
              backgroundColor: "rgba(255,0,127,0.1)",
              filter: "blur(100px)" as any,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: 200,
              backgroundColor: "rgba(0,229,255,0.1)",
              filter: "blur(100px)" as any,
            }}
          />

          {/* Hero Content */}
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 40,
              paddingVertical: 80,
              zIndex: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "rgba(255,0,127,0.1)",
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: "rgba(255,0,127,0.3)",
                marginBottom: 28,
              }}
            >
              <Flame size={14} color="#FF007F" />
              <Text
                style={{
                  color: "#FF007F",
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                }}
              >
                Conéctate al Mundo Real
              </Text>
            </View>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 64,
                fontWeight: "900",
                textAlign: "center",
                lineHeight: 72,
                letterSpacing: -1,
                maxWidth: 900,
                marginBottom: 24,
              }}
            >
              Experimenta la mejor app de{"\n"}
              <Text style={{ color: "#00E5FF" }}>Live Streaming</Text> &{" "}
              <Text style={{ color: "#FF007F" }}>Dating</Text>
            </Text>

            <Text
              style={{
                color: "rgba(200,210,230,0.85)",
                fontSize: 18,
                textAlign: "center",
                maxWidth: 620,
                lineHeight: 30,
                marginBottom: 44,
                fontWeight: "300",
              }}
            >
              Aura Live es la nueva revolución. Entra a salas con hasta 8
              cámaras, juega juegos interactivos, sube de nivel SVIP y haz
              conexiones increíbles con swipe.
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 16,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleWebClick}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 36,
                  paddingVertical: 16,
                  borderRadius: 40,
                  backgroundColor: "#00E5FF",
                  shadowColor: "#00E5FF",
                  shadowRadius: 24,
                  shadowOpacity: 0.7,
                }}
              >
                <DownloadCloud size={20} color="#020205" />
                <Text
                  style={{
                    color: "#020205",
                    fontWeight: "900",
                    fontSize: 14,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  Descargar Ahora
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── FEATURES GRID ─── */}
        <View
          style={{
            paddingHorizontal: 40,
            paddingVertical: 80,
            backgroundColor: "#020205",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 40,
              fontWeight: "900",
              textAlign: "center",
              letterSpacing: -1,
              marginBottom: 12,
            }}
          >
            Todo en un solo lugar
          </Text>
          <Text
            style={{
              color: "rgba(180,200,220,0.65)",
              fontSize: 16,
              textAlign: "center",
              marginBottom: 52,
              fontWeight: "300",
            }}
          >
            Aura Live combina el poder del video con la gamificación.
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 24,
              justifyContent: "center",
            }}
          >
            {[
              {
                icon: Video,
                color: "#00E5FF",
                title: "Salas Multi-Guest",
                desc: "Interactúa con hasta 8 personas en video al mismo tiempo.",
              },
              {
                icon: Gift,
                color: "#FFD700",
                title: "Regalos 3D SVIP",
                desc: "Efectos espectaculares, anillos y yates con animación completa.",
              },
              {
                icon: Users,
                color: "#FF007F",
                title: "Conexiones & Tinder-like",
                desc: "Encuentra amigos o pareja con nuestro sistema de swipe.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <View
                key={title}
                style={{
                  width: 300,
                  padding: 32,
                  borderRadius: 24,
                  backgroundColor: "#080815",
                  borderWidth: 1,
                  borderColor: `${color}20`,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    marginBottom: 20,
                    backgroundColor: `${color}15`,
                    borderWidth: 1,
                    borderColor: `${color}40`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={28} color={color} />
                </View>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: "800",
                    marginBottom: 10,
                  }}
                >
                  {title}
                </Text>
                <Text
                  style={{
                    color: "rgba(160,180,210,0.7)",
                    fontSize: 13,
                    lineHeight: 22,
                  }}
                >
                  {desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── APP DOWNLOAD CTA ─── */}
        <View
          style={{
            paddingHorizontal: 40,
            paddingVertical: 80,
            backgroundColor: "#050510",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
            alignItems: "center",
          }}
        >
          <Smartphone size={52} color="#00E5FF" />
          <View style={{ height: 20 }} />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: "900",
              marginBottom: 12,
            }}
          >
            Disponible para iOS y Android
          </Text>
          <Text
            style={{
              color: "rgba(180,200,220,0.7)",
              fontSize: 15,
              marginBottom: 32,
            }}
          >
            La versión web es solo para información. ¡Descarga la app para
            empezar!
          </Text>
          <TouchableOpacity
            onPress={handleWebClick}
            style={{
              backgroundColor: "#FF007F",
              paddingHorizontal: 40,
              paddingVertical: 16,
              borderRadius: 30,
            }}
          >
            <Text
              style={{
                color: "#FFF",
                fontWeight: "900",
                fontSize: 14,
                textTransform: "uppercase",
              }}
            >
              Descargar App
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
