import ZegoExpressEngine, { ZegoScenario, ZegoUpdateType, ZegoRoomStateChangedReason, ZegoPublisherState } from 'zego-express-engine-reactnative';
import { Platform } from 'react-native';

// TODO: Registrate en ZegoCloud.com y reemplaza estas credenciales
const APP_ID = 255929730; // Extraído de tu captura
const APP_SIGN = ""; // Falta el AppSign completo

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
        scenario: ZegoScenario.LiveBroadcasting
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
    return await this.engine?.loginRoom(roomID, { userID, userName });
  }

  async logoutRoom(roomID: string) {
    console.log(`🔌 Saliendo de la sala WebRTC: ${roomID}`);
    await this.engine?.logoutRoom(roomID);
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
