import { supabase } from './supabase';

export interface CoinPackageCatalogItem {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  usdPrice: number;
  googlePlayProductId?: string;
  popular?: boolean;
  isMax?: boolean;
}

export interface GiftCatalogItem {
  id: string;
  name: string;
  coinPrice: number;
  iconUrl: string;
  isExclusive: boolean;
  category: 'Popular' | 'Lujo' | 'VIP' | 'Efectos';
  lottieUrl?: string;
}

export const FALLBACK_COIN_PACKAGES: CoinPackageCatalogItem[] = [
  { id: 'pkg-5usd',   name: 'Paquete Inicial',  coins: 5000,   bonusCoins: 250,   usdPrice: 5,   googlePlayProductId: 'com.auralive.coins.5usd' },
  { id: 'pkg-10usd',  name: 'Paquete Bronce',   coins: 10000,  bonusCoins: 1000,  usdPrice: 10,  googlePlayProductId: 'com.auralive.coins.10usd' },
  { id: 'pkg-20usd',  name: 'Paquete Plata',    coins: 20000,  bonusCoins: 3000,  usdPrice: 20,  googlePlayProductId: 'com.auralive.coins.20usd', popular: true },
  { id: 'pkg-50usd',  name: 'Paquete Oro',      coins: 50000,  bonusCoins: 10000, usdPrice: 50,  googlePlayProductId: 'com.auralive.coins.50usd' },
  { id: 'pkg-100usd', name: 'Paquete Diamante', coins: 100000, bonusCoins: 25000, usdPrice: 100, googlePlayProductId: 'com.auralive.coins.100usd', popular: true },
  { id: 'pkg-200usd', name: 'Paquete Universo', coins: 200000, bonusCoins: 60000, usdPrice: 200, googlePlayProductId: 'com.auralive.coins.200usd', isMax: true },
];

export const FALLBACK_GIFTS: GiftCatalogItem[] = [
  { id: 'clover-welcome-1', name: 'Trébol Dorado 🍀 (1 Gratis 24h)', coinPrice: 300, iconUrl: 'https://cdn-icons-png.flaticon.com/512/346/346195.png', lottieUrl: 'https://lottie.host/8c1303ed-7cfa-4ebf-801a-8ff6cc6eb2c2/2O0p2c34kK.json', isExclusive: false, category: 'Popular' },
  { id: '1', name: 'Rosa Neón 🌹', coinPrice: 100, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3004/3004071.png', lottieUrl: 'https://lottie.host/8c1303ed-7cfa-4ebf-801a-8ff6cc6eb2c2/2O0p2c34kK.json', isExclusive: false, category: 'Popular' },
  { id: '2', name: 'Beso Cyber 💋', coinPrice: 300, iconUrl: 'https://cdn-icons-png.flaticon.com/512/2850/2850550.png', lottieUrl: 'https://lottie.host/80769d49-411a-42cd-bb43-7f72295240c5/Z5f5u9bN0S.json', isExclusive: false, category: 'Popular' },
  { id: '3', name: 'Corona Diamante 👑', coinPrice: 1000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/714/714407.png', lottieUrl: 'https://lottie.host/17e5a7b6-cc7d-417d-bebb-42df6495d4d3/7oG9Y8N4uH.json', isExclusive: false, category: 'Lujo' },
  { id: '4', name: 'Nave Espacial 🚀', coinPrice: 5000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3255/3255057.png', lottieUrl: 'https://lottie.host/98c5d14e-d98c-447b-83de-ec5c0d5926be/lI1f4Ww7N4.json', isExclusive: false, category: 'Lujo' },
  { id: '5', name: 'Dragón Legendario 🐉', coinPrice: 20000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/5725/5725514.png', lottieUrl: 'https://lottie.host/95d82998-1cd5-46eb-81c8-db28b9c647b0/Xz4x2hO4YI.json', isExclusive: true, category: 'VIP' },
  { id: '6', name: 'Auto Lujo 3D 🏎️', coinPrice: 50000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', lottieUrl: 'https://lottie.host/e2d08a50-6eb6-4556-9130-1c667a4214f5/H8S3p4Z7P2.json', isExclusive: true, category: 'VIP' },
  { id: '7', name: 'Universo Aura 🌌 ($200 USD)', coinPrice: 200000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', lottieUrl: 'https://lottie.host/e2d08a50-6eb6-4556-9130-1c667a4214f5/H8S3p4Z7P2.json', isExclusive: true, category: 'VIP' },
];

async function invokeEdgeFunction<T = any>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || `Error invocando microservicio ${functionName}`);
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as T;
}

export const api = {
  catalogs: {
    async getCoinPackages(): Promise<CoinPackageCatalogItem[]> {
      const { data, error } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return FALLBACK_COIN_PACKAGES;
      }

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        coins: Number(row.coins),
        bonusCoins: Number(row.bonus_coins || 0),
        usdPrice: Number(row.usd_price),
        googlePlayProductId: row.google_play_product_id || undefined,
        popular: Boolean(row.is_popular),
        isMax: Boolean(row.is_max),
      }));
    },

    async getGifts(): Promise<GiftCatalogItem[]> {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return FALLBACK_GIFTS;
      }

      return data.map((row: any) => ({
        id: String(row.id),
        name: row.name,
        coinPrice: Number(row.coin_price),
        iconUrl: row.icon_url,
        lottieUrl: row.lottie_animation_url || undefined,
        isExclusive: Boolean(row.is_exclusive),
        category: (['Popular', 'Lujo', 'VIP', 'Efectos'].includes(row.category) ? row.category : 'Popular') as GiftCatalogItem['category'],
      }));
    },
  },

  account: {
    async completeOnboarding(params: {
      full_name?: string;
      avatar_url?: string;
      gender: 'female' | 'male';
      birth_date: string;
    }) {
      try {
        return await invokeEdgeFunction('account-service', {
          action: 'complete_onboarding',
          ...params,
        });
      } catch (_) {
        // Fallback directo a tabla profiles respetando RLS del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sesión no encontrada.');

        let formattedDate = params.birth_date;
        if (params.birth_date.includes('/')) {
          const parts = params.birth_date.split('/');
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...(params.full_name ? { full_name: params.full_name } : {}),
            ...(params.avatar_url ? { avatar_url: params.avatar_url } : {}),
            gender: params.gender,
            birth_date: formattedDate,
          })
          .eq('id', user.id)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        return { success: true, profile: data };
      }
    },

    async joinAgency(inviteCode: string) {
      try {
        return await invokeEdgeFunction<{
          success: boolean;
          agency_id: string;
          agency_name: string;
          status: string;
        }>('account-service', {
          action: 'join_agency',
          invite_code: inviteCode,
        });
      } catch (_) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sesión requerida.');

        const { data: agency, error: agErr } = await supabase
          .from('agencies')
          .select('id, name, status')
          .ilike('invite_code', inviteCode.trim())
          .maybeSingle();

        if (agErr || !agency || agency.status !== 'approved') {
          throw new Error('No se encontró una Agencia Oficial aprobada con ese código.');
        }

        const { error: updErr } = await supabase
          .from('profiles')
          .update({ agency_id: agency.id, agency_request_status: 'pending' })
          .eq('id', user.id);

        if (updErr) throw new Error(updErr.message);
        return {
          success: true,
          agency_id: agency.id,
          agency_name: agency.name,
          status: 'pending',
        };
      }
    },

    async deleteAccount(userId?: string) {
      try {
        return await invokeEdgeFunction('account-service', {
          action: 'delete_account',
        });
      } catch (_) {
        const { data, error } = await supabase.rpc('delete_user_account', {
          ...(userId ? { p_user_id: userId } : {}),
        });
        if (error) throw new Error(error.message);
        return data;
      }
    },
  },

  payments: {
    async createStripeCheckout(packageId: string, successUrl?: string, cancelUrl?: string) {
      return await invokeEdgeFunction<{
        success: boolean;
        session_id: string;
        checkout_url: string;
      }>('payments-service', {
        action: 'create_stripe_checkout',
        package_id: packageId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    },

    async verifyGooglePlay(params: {
      packageId: string;
      productId: string;
      purchaseToken: string;
    }) {
      return await invokeEdgeFunction<{
        success: boolean;
        already_processed?: boolean;
        coins_credited: number;
        new_balance: number;
      }>('payments-service', {
        action: 'verify_google_play',
        package_id: params.packageId,
        product_id: params.productId,
        purchase_token: params.purchaseToken,
      });
    },
  },

  withdrawals: {
    async request(params: {
      coinAmount?: number;
      coin_amount?: number;
      paymentMethod?: string;
      payment_method?: string;
      accountDetails?: Record<string, string>;
      account_details?: Record<string, string>;
      applicantType?: 'streamer' | 'agency';
      applicant_type?: 'streamer' | 'agency';
    }) {
      const coinAmount = params.coinAmount ?? params.coin_amount ?? 0;
      const paymentMethod = params.paymentMethod ?? params.payment_method ?? 'USDT';
      const accountDetails = params.accountDetails ?? params.account_details ?? {};
      const applicantType = params.applicantType ?? params.applicant_type ?? 'streamer';

      try {
        return await invokeEdgeFunction('withdrawals-service', {
          action: 'request',
          coin_amount: coinAmount,
          payment_method: paymentMethod,
          account_details: accountDetails,
          applicant_type: applicantType,
        });
      } catch (_) {
        const { data, error } = await supabase.rpc('request_withdrawal', {
          p_coin_amount: coinAmount,
          p_payment_method: paymentMethod,
          p_account_details: accountDetails,
          p_applicant_type: applicantType,
        });
        if (error) throw new Error(error.message);
        return data;
      }
    },

    async review(withdrawalId: string, action: 'approve' | 'reject', adminNotes?: string) {
      try {
        return await invokeEdgeFunction('withdrawals-service', {
          action,
          withdrawal_id: withdrawalId,
          admin_notes: adminNotes,
        });
      } catch (_) {
        const { data, error } = await supabase.rpc('review_withdrawal', {
          p_withdrawal_id: withdrawalId,
          p_action: action,
          p_admin_notes: adminNotes || null,
        });
        if (error) throw new Error(error.message);
        return data;
      }
    },
  },

  notifications: {
    async sendEmail(params: {
      type: 'welcome' | 'password_changed' | 'withdrawal_status' | 'custom';
      to?: string;
      user_name?: string;
      bonus_coins?: number;
      status?: string;
      usd_amount?: string;
      notes?: string;
      subject?: string;
      message?: string;
    }) {
      return await invokeEdgeFunction('notifications-service', params);
    },
  },

  wallet: {
    async getBalance(userId: string) {
      const { data, error } = await supabase
        .from('wallets')
        .select('coin_balance, aura_balance, clover_balance, has_recharged, last_daily_checkin')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return {
        coinBalance: Number(data?.coin_balance ?? 0),
        auraBalance: Number(data?.aura_balance ?? 0),
        cloverBalance: Number(data?.clover_balance ?? 0),
        hasRecharged: Boolean(data?.has_recharged),
        lastDailyCheckin: data?.last_daily_checkin || null,
      };
    },

    async claimDailyCheckin(userId?: string) {
      const { data, error } = await supabase.rpc('claim_daily_checkin', {
        ...(userId ? { p_user_id: userId } : {}),
      });
      if (error) throw new Error(error.message);
      return data as {
        success: boolean;
        coins_awarded: number;
        new_balance: number;
        claimed_at: string;
      };
    },

    async exchangeAurasForCoins(userIdOrAmount: string | number, maybeAmount?: number) {
      const aurasAmount = typeof userIdOrAmount === 'number' ? userIdOrAmount : (maybeAmount ?? 0);
      const { data, error } = await supabase.rpc('exchange_auras_for_coins', {
        p_auras_amount: aurasAmount,
      });
      if (error) throw new Error(error.message);
      const raw = (data || {}) as any;
      const coinsGained = Number(raw.coins_gained ?? raw.coins_added ?? 0);
      const newCoinBalance = Number(raw.new_coin_balance ?? raw.new_coins ?? 0);
      const newAuraBalance = Number(raw.new_aura_balance ?? raw.new_auras ?? 0);
      return {
        success: Boolean(raw.success ?? true),
        auras_spent: Number(raw.auras_spent ?? aurasAmount),
        coins_gained: coinsGained,
        coins_added: coinsGained,
        new_coin_balance: newCoinBalance,
        new_coins: newCoinBalance,
        new_aura_balance: newAuraBalance,
        new_auras: newAuraBalance,
      };
    },
  },

  gifts: {
    async sendGift(params: {
      senderId: string;
      receptorId: string;
      giftId: string;
      roomId?: string | null;
    }) {
      const { data, error } = await supabase.rpc('send_gift', {
        p_sender_id: params.senderId,
        p_receptor_id: params.receptorId,
        p_gift_id: params.giftId,
        p_room_id: params.roomId || null,
      });
      if (error) throw new Error(error.message);
      const raw = (data || {}) as any;
      const senderBalance = Number(raw.sender_balance ?? raw.new_balance ?? 0);
      const effectivePrice = Number(raw.effective_price ?? 0);
      const aurasAdded = Number(raw.receptor_auras_added ?? raw.auras_credited ?? 0);
      return {
        success: Boolean(raw.success ?? true),
        message: String(raw.message || 'Regalo enviado'),
        sender_balance: senderBalance,
        new_balance: senderBalance,
        effective_price: effectivePrice,
        was_free_clover: effectivePrice === 0 || Boolean(raw.was_free_clover),
        receptor_auras_added: aurasAdded,
        auras_credited: aurasAdded,
        gift_id: String(raw.gift_id || params.giftId),
        gift_name: String(raw.gift_name || 'Regalo'),
      };
    },
  },

  games: {
    async playGame(
      arg1:
        | {
            gameType: 'roulette' | 'dice' | 'slots' | 'wheel';
            betAmount: number;
            choice?: string | null;
            roomId?: string | null;
          }
        | string,
      gameTypeArg?: 'roulette' | 'dice' | 'slots' | 'wheel',
      betAmountArg?: number,
      choiceArg?: string | null,
      roomIdArg?: string | null
    ) {
      const params =
        typeof arg1 === 'object'
          ? arg1
          : {
              gameType: gameTypeArg || 'wheel',
              betAmount: betAmountArg || 0,
              choice: choiceArg ?? null,
              roomId: roomIdArg ?? null,
            };

      const { data, error } = await supabase.rpc('play_game', {
        p_game_type: params.gameType,
        p_bet_amount: params.betAmount,
        p_choice: params.choice || null,
        p_room_id: params.roomId || null,
      });
      if (error) throw new Error(error.message);
      const raw = (data || {}) as any;
      const prize = Number(raw.prize ?? 0);
      const bet = Number(raw.bet_amount ?? params.betAmount);
      const multiplier = Number(
        raw.outcome?.multiplier ?? (bet > 0 ? Math.floor(prize / bet) : 0)
      );
      return {
        success: Boolean(raw.success ?? true),
        game_type: String(raw.game_type || params.gameType),
        bet_amount: bet,
        prize,
        won: prize > 0,
        multiplier,
        net_change: Number(raw.net_change ?? prize - bet),
        new_balance: Number(raw.new_balance ?? 0),
        outcome: raw.outcome || {},
      };
    },
  },

  biometrics: {
    async verifyLiveness(userId: string, faceSignatureHash: string) {
      const { data, error } = await supabase.rpc('liveness_verify', {
        p_user_id: userId,
        p_face_signature_hash: faceSignatureHash,
      });
      if (error) throw new Error(error.message);
      const raw = (data || {}) as any;
      const coins = Number(raw.coins_awarded ?? raw.coins_rewarded ?? 50);
      return {
        success: Boolean(raw.success ?? true),
        coins_awarded: coins,
        coins_rewarded: coins,
        new_balance: Number(raw.new_balance ?? 0),
        message: String(raw.message || 'Identidad verificada'),
      };
    },
  },

  rooms: {
    async createRoom(params: {
      title: string;
      category?: string;
      layoutMode?: '4_cam' | '8_cam';
    }) {
      const { data, error } = await supabase.rpc('create_stream_room', {
        p_title: params.title,
        p_category: params.category || 'Variedad',
        p_layout_mode: params.layoutMode || '8_cam',
      });
      if (error) throw new Error(error.message);
      const raw = (data || {}) as any;
      const roomObj = raw.room || raw;
      return {
        success: Boolean(raw.success ?? true),
        id: String(roomObj.id || ''),
        host_id: String(roomObj.host_id || ''),
        title: String(roomObj.title || params.title),
        category: String(roomObj.category || params.category || 'Variedad'),
        layout_mode: (roomObj.layout_mode || params.layoutMode || '8_cam') as '4_cam' | '8_cam',
        is_active: Boolean(roomObj.is_active ?? true),
        viewer_count: Number(roomObj.viewer_count ?? 1),
        room: roomObj,
      };
    },

    async joinRoom(roomId: string) {
      const { data, error } = await supabase.rpc('join_stream_room', {
        p_room_id: roomId,
      });
      if (error) throw new Error(error.message);
      const raw = (data || {}) as any;
      const roomObj = raw.room || raw;
      return {
        success: Boolean(raw.success ?? true),
        id: String(roomObj.id || roomId),
        host_id: String(roomObj.host_id || ''),
        title: String(roomObj.title || ''),
        category: String(roomObj.category || ''),
        layout_mode: (roomObj.layout_mode || '8_cam') as '4_cam' | '8_cam',
        is_active: Boolean(roomObj.is_active ?? true),
        viewer_count: Number(roomObj.viewer_count ?? 1),
        room: roomObj,
        host: raw.host || null,
      };
    },

    async leaveRoom(roomId: string, streamSeconds = 0) {
      const { data, error } = await supabase.rpc('leave_stream_room', {
        p_room_id: roomId,
        p_stream_seconds: streamSeconds,
      });
      if (error) throw new Error(error.message);
      return data as {
        success: boolean;
        status: string;
        minutes_recorded?: number;
      };
    },
  },

  likes: {
    async toggleReelLike(reelId: string) {
      const { data, error } = await supabase.rpc('toggle_reel_like', {
        p_reel_id: reelId,
      });
      if (error) throw new Error(error.message);
      return data as {
        success: boolean;
        liked: boolean;
        likes_count: number;
      };
    },

    async addReelComment(reelId: string, content: string) {
      const { data, error } = await supabase.rpc('add_reel_comment', {
        p_reel_id: reelId,
        p_content: content,
      });
      if (error) throw new Error(error.message);
      return data as {
        success: boolean;
        comment: {
          id: string;
          reel_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        comments_count: number;
      };
    },

    async togglePostLike(postId: string) {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
      });
      if (error) throw new Error(error.message);
      return data as {
        success: boolean;
        liked: boolean;
        likes_count: number;
      };
    },
  },

  streamer: {
    async claimDailyMission() {
      const { data, error } = await supabase.rpc('claim_streamer_daily_mission');
      if (error) throw new Error(error.message);
      const raw = (data || {}) as any;
      const auras = Number(raw.reward_auras ?? raw.auras_rewarded ?? 2000);
      return {
        success: Boolean(raw.success ?? true),
        reward_auras: auras,
        auras_rewarded: auras,
        new_aura_balance: Number(raw.new_aura_balance ?? 0),
      };
    },
  },
};
