# 🔮 AURA LIVE — Master Production Prompt

> **Guarda este archivo.** Contiene toda la información técnica, arquitectura, características y pasos de despliegue para reproducir, escalar o continuar desarrollando AURA LIVE desde cero.

---

## 📌 Descripción del Proyecto

**AURA LIVE** es una plataforma de streaming en vivo de próxima generación, inspirada en apps como **Niki Live** y **SeeTa App**. Permite a los usuarios transmitir en vivo con multi-cámara, enviar regalos animados 3D, participar en batallas PK, usar canales de voz, ver reels cortos y administrar su perfil con fotos y videos.

**Audiencia:** Jóvenes de 18–35 años con interés en entretenimiento en vivo, chat social, gaming y comunidades online.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework App** | Expo SDK 52 + React Native |
| **Router** | Expo Router v4 (file-based routing) |
| **Estilos** | NativeWind v4 (Tailwind CSS para React Native) |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| **Animaciones** | Lottie React Native + Expo Linear Gradient |
| **Iconos** | lucide-react-native |
| **Fuentes** | Expo Google Fonts (Inter) |
| **Web Export** | npx expo export -p web → Nginx via Docker |
| **Containerización Web** | Docker + docker-compose |
| **CI/CD Móvil** | EAS Build (Expo Application Services) |
| **Lenguaje** | TypeScript |

---

## 📁 Estructura de Archivos

```
AuraLive/
├── app/
│   ├── index.tsx              # Landing page web (separada de auth)
│   ├── _layout.tsx            # Layout raíz con fuentes y Supabase
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Barra de navegación inferior (tabs)
│   │   ├── feed.tsx           # Feed de salas en vivo en tiempo real
│   │   ├── reels.tsx          # Reels / videos cortos (TikTok-style)
│   │   └── profile.tsx        # Perfil con fotos adicionales y videos
│   ├── auth/
│   │   └── login.tsx          # Registro + Inicio de sesión (pantalla única)
│   ├── live/
│   │   └── [roomId].tsx       # Sala de transmisión en vivo individual
│   ├── admin/                 # Panel de administración
│   ├── agency/                # Panel de agencias
│   └── shop.tsx               # Tienda de monedas y regalos
├── components/                # Componentes reutilizables
├── lib/
│   └── supabase.ts            # Cliente Supabase configurado
├── utils/                     # Utilidades y helpers
├── supabase/
│   └── migrations/            # Migraciones SQL
├── assets/                    # Iconos y splash screens
├── global.css                 # Clases NativeWind personalizadas
├── tailwind.config.js         # Config de NativeWind/Tailwind
├── app.json                   # Config Expo (newArchEnabled: true)
├── Dockerfile                 # Build multi-etapa: Node → Nginx
├── docker-compose.yml         # Expone puerto 8080
└── .env                       # Variables de entorno (Supabase)
```

---

## 🗄️ Variables de Entorno (.env)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

> **NUNCA subas el archivo `.env` a un repositorio público.** Usa `.env.example` como plantilla.

---

## 🖥️ Pantallas y Funcionalidades

### 🌐 Web Landing Page (`app/index.tsx`)
- **Navbar sticky** con logo AURA LIVE y botón de inicio de sesión
- **Hero section fullscreen** con video de fondo automático + overlay gradiente neón
- **Orbes de luz flotantes** como decoración de fondo animada
- **Stats row**: 12K+ Streamers · 450K+ Usuarios · 60 FPS · 24/7
- **Grid de salas en vivo** con badges EN VIVO, contador de viewers y VIP
- **Grid de 6 características** con iconos neón y descripciones
- **CTA de descarga**: Google Play APK · App Store iOS · Web App
- **Footer** con links de Privacidad, Términos, Contacto y Soporte
- En móvil (`Platform.OS !== 'web'`): muestra directamente `LoginAuthScreen`

### 📱 App Móvil — Pantallas

| Pantalla | Archivo | Descripción |
|---|---|---|
| Auth | `app/auth/login.tsx` | Registro + Login con tabs animados |
| Feed | `app/(tabs)/feed.tsx` | Salas en vivo en tiempo real (Supabase Realtime) |
| Sala en Vivo | `app/live/[roomId].tsx` | Stream + chat + regalos + contador viewers |
| Reels | `app/(tabs)/reels.tsx` | Videos cortos scroll vertical TikTok-style |
| Perfil | `app/(tabs)/profile.tsx` | Foto, fotos adicionales, videos propios |
| Tienda | `app/shop.tsx` | Compra de monedas y regalos animados |
| Admin | `app/admin/` | Panel de administración de la plataforma |
| Agencias | `app/agency/` | Panel de gestión de hosts afiliados |

---

## ✨ Características Técnicas Clave

| Característica | Descripción |
|---|---|
| **Multi-Cámara** | Hasta 8 streams WebRTC simultáneos, latencia ultra baja |
| **Batallas PK 3D** | Pantalla dividida, medidor neón animado, efectos VIP |
| **Regalos Animados 3D** | Lottie + efectos pantalla completa en tiempo real |
| **Canal de Voz 4 Asientos** | Audio real-time, avatar activo por speaker |
| **Verificación Biométrica** | Face ID, anti-multicuentas |
| **Rankings Globales** | Por regalos, tiempo en vivo, PK semanal |
| **Salas Tiempo Real** | Supabase Realtime subscriptions |
| **Fotos/Videos Perfil** | Subida a Supabase Storage |

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npx expo start

# Ejecutar en Android (con emulador abierto)
# → presionar 'a' en la terminal

# Exportar para web
npx expo export -p web --clear

# Levantar en Docker (web en localhost:8080)
docker compose up -d --build

# Ver logs del contenedor
docker compose logs -f
```

---

## 🐳 Despliegue Web con Docker

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx expo export -p web --clear

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### docker-compose.yml
```yaml
services:
  aura-live-web:
    build: .
    container_name: aura_live_web_app
    ports:
      - "8080:80"
    restart: unless-stopped
```

---

## 📲 EAS Build — Producción Móvil

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Compilar APK Android
eas build --platform android --profile production

# Compilar IPA iOS
eas build --platform ios --profile production

# Submit a tiendas
eas submit --platform android
eas submit --platform ios
```

### eas.json
```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    }
  }
}
```

---

## 🗃️ Base de Datos Supabase — Esquema SQL

```sql
-- Perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  coins INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salas de transmisión en vivo
CREATE TABLE live_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  category TEXT,
  viewer_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT TRUE,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos adicionales del perfil
CREATE TABLE profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reels / Videos cortos
CREATE TABLE reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes de chat en sala
CREATE TABLE room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES live_rooms(id),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regalos enviados
CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  room_id UUID REFERENCES live_rooms(id),
  gift_type TEXT NOT NULL,
  coin_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 Paleta de Colores y Diseño

| Token | Valor Hex | Uso |
|---|---|---|
| Cyan | `#00E5FF` | Color primario / acentos / botones principales |
| Magenta | `#FF007F` | Secundario / batallas PK / vivos |
| Gold | `#FFD700` | VIP / regalos premium |
| Purple | `#A855F7` | Canal de voz / efectos especiales |
| Green | `#22C55E` | Verificado / usuario online |
| Dark BG | `#020205` | Fondo principal |
| Card BG | `#080815` | Cards y paneles |
| Nav BG | `rgba(0,0,0,0.92)` | Navbar con blur |

**Fuente:** Inter (Google Fonts via Expo)  
**Estilo visual:** Dark Mode · Glassmorphism · Neon Glow · Gradientes neón

---

## ⚙️ app.json completo

```json
{
  "expo": {
    "name": "AURA LIVE",
    "slug": "aura-live",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "auralive",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#020205"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#020205"
      },
      "package": "com.auralive.app"
    },
    "ios": {
      "bundleIdentifier": "com.auralive.app",
      "supportsTablet": true
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": ["expo-router"]
  }
}
```

---

## 🐞 Bugs Conocidos y Soluciones

### Bug 1: NativeWind parseAspectRatio crash en Android

**Error:** `TypeError: Cannot read properties of undefined (reading '0')`

**Causa:** NativeWind v4 intenta leer `aspectRatio.ratio[0]` sin validar que exista.

**Solución:** Parchear `node_modules/react-native-css-interop/dist/css-to-rn/parseDeclaration.js`:
```js
// ANTES:
function parseAspectRatio(aspectRatio) {
    if (aspectRatio.auto) { return "auto"; }

// DESPUÉS:
function parseAspectRatio(aspectRatio) {
    if (!aspectRatio || !aspectRatio.ratio || aspectRatio.auto) {
        return "auto";
    }
```

### Bug 2: Assets no encontrados al compilar

**Error:** `Unable to resolve asset ./assets/icon.png`

**Solución:** Crear la carpeta `assets/` con los 4 archivos requeridos:
- `icon.png` (1024×1024)
- `splash.png` (1284×2778)
- `adaptive-icon.png` (1024×1024)
- `favicon.png` (64×64)

### Bug 3: NativeWind crash con `@tailwind base`

**Error:** parseAspectRatio al procesar reglas CSS web.

**Solución:** En `global.css`, eliminar `@tailwind base;` — solo usar:
```css
@tailwind components;
@tailwind utilities;
```

---

## 📈 Roadmap Futuro

- [ ] **WebRTC real** para multi-cámara (Agora.io / LiveKit)
- [ ] **Regalos reales** con animaciones Lottie y websockets
- [ ] **Batallas PK** medidor en tiempo real con ganador/perdedor
- [ ] **Pagos** con Stripe / PayPal para compra de monedas
- [ ] **Moderación IA** anti-contenido inapropiado
- [ ] **Notificaciones Push** cuando streamer favorito está en vivo
- [ ] **Multi-idioma** (ES, EN, PT, AR)
- [ ] **Panel de Admin** con métricas de plataforma completas
- [ ] **Panel de Agencias** gestión de hosts afiliados
- [ ] **Subida de video a perfil** con Supabase Storage
- [ ] **Dark/Light mode** toggle por usuario

---

## ⚡ Cheatsheet de Comandos

```bash
# DESARROLLO
npx expo start                          # Iniciar dev server
npx expo start --clear                  # Iniciar limpiando caché Metro
npx expo start -a                       # Abrir directo en Android

# DOCKER WEB
docker compose up -d --build            # Build + levantar contenedor
docker compose logs -f                  # Ver logs en tiempo real
docker compose restart                  # Reiniciar sin rebuild
docker compose down                     # Parar y eliminar contenedor
docker compose build --no-cache         # Rebuild sin caché Docker

# EAS MÓVIL
eas build --platform android            # Build Android
eas build --platform ios                # Build iOS
eas build --platform all                # Ambos simultáneo
eas submit --platform android           # Submit a Google Play
eas submit --platform ios               # Submit a App Store

# DEPENDENCIAS
npm install --legacy-peer-deps          # Instalar con compat flags
npx expo install expo@latest            # Actualizar Expo SDK
```

---

*© 2026 AURA LIVE — Documento de Producción v1.0*  
*Generado: 2026-08-04 | Proyecto: /home/luism/Escritorio/AuraLive*
