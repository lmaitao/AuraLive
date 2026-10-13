import ZegoExpressEngine, { ZegoScenario, ZegoUpdateType, ZegoRoomStateChangedReason, ZegoPublisherState } from 'zego-express-engine-reactnative';
import { Platform } from 'react-native';

// Extraemos de las variables de entorno configuradas en el archivo .env
const APP_ID = parseInt(process.env.EXPO_PUBLIC_ZEGO_APP_ID || '0', 10);
const APP_SIGN = process.env.EXPO_PUBLIC_ZEGO_APP_SIGN || '';

class ZegoService {
  private static instance: ZegoService;
  public engine: ZegoExpressEngine | null = null;
  public isInitialized = false;

  private constructor() {}

  static getInstance() {
    if (!ZegoService.instance) {
      ZegoService.instance = new ZegoService();
    }
    return ZegoService.instance;
  }

  async initEngine() {
    if (this.isInitialized && this.engine) return this.engine;
    
    if (APP_ID === 0 || APP_SIGN === "") {
      console.warn("⚠️ [ZegoCloud] APP_ID y APP_SIGN no están configurados. El WebRTC fallará.");
    }

    try {
      const profile = {
        appID: APP_ID,
        appSign: Platform.OS !== 'web' ? APP_SIGN : '',
        scenario: ZegoScenario.Broadcast
      };

      this.engine = await ZegoExpressEngine.createEngineWithProfile(profile);
      this.isInitialized = true;
      console.log("✅ ZegoExpressEngine Inicializado");
      return this.engine;
    } catch (e) {
      console.error("❌ Error al inicializar Zego:", e);
      return null;
    }
  }

  async loginRoom(roomID: string, userID: string, userName: string) {
    if (!this.engine) await this.initEngine();
    console.log(`📡 Entrando a la sala WebRTC: ${roomID}`);
    return await this.engine?.loginRoom(roomID, { userID, userName }, undefined);
  }

  async logoutRoom(roomID: string) {
    console.log(`🔌 Saliendo de la sala WebRTC: ${roomID}`);
    await this.engine?.logoutRoom(roomID);
  }

  async startPublishingStream(streamID: string) {
    console.log(`🎥 Publicando stream: ${streamID}`);
    await this.engine?.startPublishingStream(streamID, undefined, undefined);
  }

  async stopPublishingStream() {
    console.log(`🛑 Deteniendo stream local`);
    await this.engine?.stopPublishingStream(undefined);
  }

  async destroyEngine() {
    if (this.engine) {
      await ZegoExpressEngine.destroyEngine();
      this.engine = null;
      this.isInitialized = false;
    }
  }
}

export const zegoService = ZegoService.getInstance();
