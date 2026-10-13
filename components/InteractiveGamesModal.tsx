import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing
} from 'react-native';
import { X, Gamepad2, Trophy, Zap, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { zegoService } from '../lib/ZegoService';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type GameType = null | 'roulette' | 'dice' | 'slots';

interface GameResult {
  playerName: string;
  game: string;
  result: string;
  prize: number;
  newBalance?: number;
  emoji: string;
  timestamp: number;
}

// ─── RULETA ───────────────────────────────────────────────────────────────────
const ROULETTE_COLORS = ['Rojo', 'Negro', 'Verde'];
const ROULETTE_EMOJIS: Record<string, string> = { Rojo: '🔴', Negro: '⚫', Verde: '💚' };

// ─── DADOS ────────────────────────────────────────────────────────────────────
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ─── COMPONENTE RULETA ────────────────────────────────────────────────────────
function RouletteGame({
  onResult, bet, userCoins
}: { onResult: (r: GameResult) => void; bet: number; userCoins: number }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ number: number; color: string } | null>(null);
  const [betColor, setBetColor] = useState<string | null>(null);
  const spinAnim = new Animated.Value(0);

  const spin = async () => {
    if (!betColor || spinning || bet > userCoins) return;
    setSpinning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSpinning(false);
        return;
      }
      const res = await api.games.playGame(user.id, 'roulette', bet, betColor);
      Animated.timing(spinAnim, {
        toValue: 1, duration: 2000,
        easing: Easing.out(Easing.cubic), useNativeDriver: true
      }).start(async () => {
        const r = {
          number: res.outcome?.number ?? 0,
          color: res.outcome?.color ?? 'Verde',
        };
        setResult(r);
        setSpinning(false);
        const gr: GameResult = {
          playerName: 'Tú',
          game: 'Ruleta 🎡',
          result: `${r.number} • ${ROULETTE_EMOJIS[r.color] || '🟢'} ${r.color}`,
          prize: res.prize,
          newBalance: res.new_balance,
          emoji: res.won ? '🎉' : '💀',
          timestamp: Date.now()
        };
        onResult(gr);
        try {
          await zegoService.engine?.sendBroadcastMessage(
            'game-room',
            JSON.stringify({ type: 'GAME_RESULT', data: gr })
          );
        } catch (_) {}
      });
    } catch (_) {
      setSpinning(false);
    }
  };

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1440deg']
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={gs.subtitle}>Elige un color y gira la ruleta</Text>
      <Animated.View style={[gs.wheel, { transform: [{ rotate: spinning ? rotation : '0deg' }] }]}>
        <Text style={{ fontSize: 56 }}>🎡</Text>
        {result && !spinning && (
          <Text style={gs.wheelResult}>{result.number}</Text>
        )}
      </Animated.View>
      {result && !spinning && (
        <View style={[gs.resultBadge, { backgroundColor: result.color === 'Rojo' ? '#EF4444' : result.color === 'Verde' ? '#10B981' : '#1F2937' }]}>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>
            {ROULETTE_EMOJIS[result.color]} {result.number} — {result.color}
          </Text>
        </View>
      )}
      <View style={gs.colorRow}>
        {ROULETTE_COLORS.map(c => (
          <TouchableOpacity key={c} onPress={() => setBetColor(c)} activeOpacity={0.8}
            style={[gs.colorBtn, {
              backgroundColor: c === 'Rojo' ? '#EF4444' : c === 'Verde' ? '#10B981' : '#374151',
              borderWidth: betColor === c ? 3 : 1,
              borderColor: betColor === c ? '#FFFFFF' : 'transparent'
            }]}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>{ROULETTE_EMOJIS[c]} {c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={spin} disabled={!betColor || spinning} activeOpacity={0.85}
        style={{ width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 14 }}>
        <LinearGradient colors={spinning ? ['#374151', '#1F2937'] : ['#F59E0B', '#D97706']}
          style={{ paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>
            {spinning ? '🎡 Girando...' : `🎰 ¡Girar! (Apuesta: ${bet} 🪙)`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── COMPONENTE DADOS ─────────────────────────────────────────────────────────
function DiceGame({
  onResult, bet, userCoins
}: { onResult: (r: GameResult) => void; bet: number; userCoins: number }) {
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<number[]>([1, 1]);
  const [guess, setGuess] = useState<'alto' | 'bajo' | null>(null);
  const rollAnim = [new Animated.Value(0), new Animated.Value(0)];

  const roll = async () => {
    if (!guess || rolling || bet > userCoins) return;
    setRolling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRolling(false);
        return;
      }
      const res = await api.games.playGame(user.id, 'dice', bet, guess);
      Animated.parallel(rollAnim.map(a =>
        Animated.sequence([
          Animated.timing(a, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(a, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 150, useNativeDriver: true }),
        ])
      )).start(async () => {
        const d1 = res.outcome?.dice1 ?? 1;
        const d2 = res.outcome?.dice2 ?? 1;
        const total = res.outcome?.total ?? (d1 + d2);
        setDice([d1, d2]);
        setRolling(false);
        const gr: GameResult = {
          playerName: 'Tú',
          game: 'Dados 🎲',
          result: `${DICE_FACES[d1 - 1]}${DICE_FACES[d2 - 1]} = ${total}`,
          prize: res.prize,
          newBalance: res.new_balance,
          emoji: res.won ? '🎉' : '💀',
          timestamp: Date.now()
        };
        onResult(gr);
        try {
          await zegoService.engine?.sendBroadcastMessage('game-room',
            JSON.stringify({ type: 'GAME_RESULT', data: gr }));
        } catch (_) {}
      });
    } catch (_) {
      setRolling(false);
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={gs.subtitle}>¿El total será Alto (+7) o Bajo (≤7)?</Text>
      <View style={gs.diceRow}>
        {dice.map((d, i) => (
          <Animated.View key={i} style={[gs.diceBox, {
            transform: [{ rotate: rolling ? rollAnim[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) : '0deg' }]
          }]}>
            <Text style={{ fontSize: 48 }}>{DICE_FACES[d - 1]}</Text>
          </Animated.View>
        ))}
      </View>
      <View style={gs.colorRow}>
        {(['alto', 'bajo'] as const).map(g => (
          <TouchableOpacity key={g} onPress={() => setGuess(g)} activeOpacity={0.8}
            style={[gs.colorBtn, {
              backgroundColor: g === 'alto' ? '#6D28D9' : '#0891B2',
              borderWidth: guess === g ? 3 : 1,
              borderColor: guess === g ? '#FFFFFF' : 'transparent'
            }]}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>
              {g === 'alto' ? '📈 Alto (+7)' : '📉 Bajo (≤7)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={roll} disabled={!guess || rolling} activeOpacity={0.85}
        style={{ width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 14 }}>
        <LinearGradient colors={rolling ? ['#374151', '#1F2937'] : ['#8B5CF6', '#6D28D9']}
          style={{ paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>
            {rolling ? '🎲 Lanzando...' : `🎲 ¡Lanzar Dados! (${bet} 🪙)`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── TRAGAMONEDAS CASINO 777 ──────────────────────────────────────────────────
const SLOT_SYMBOLS = ['7️⃣', '💎', '⭐', '🔔', '🍒', '🍋'];

function SlotsGame({
  onResult, bet, userCoins
}: { onResult: (r: GameResult) => void; bet: number; userCoins: number }) {
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [winMessage, setWinMessage] = useState<string | null>(null);

  const spin = async () => {
    if (spinning || bet > userCoins) return;
    setSpinning(true);
    setWinMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSpinning(false);
        return;
      }

      const res = await api.games.playGame(user.id, 'slots', bet);
      let ticks = 0;

      const id = setInterval(() => {
        setReels([
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        ]);
        ticks++;
        if (ticks >= 24) {
          clearInterval(id);
          const final: string[] = res.outcome?.reels || ['7️⃣', '💎', '🍒'];
          setReels(final);
          setSpinning(false);

          const isTripleJackpot = final[0] === final[1] && final[1] === final[2];
          const isPair = final[0] === final[1] || final[1] === final[2] || final[0] === final[2];

          let msg = '';
          if (isTripleJackpot && res.prize > 0) {
            msg = `🔥 ¡MEGA JACKPOT TRIPLE ${final[0]}! Ganaste x${res.multiplier} (${res.prize} 🪙) 🔥`;
          } else if (isPair && res.prize > 0) {
            msg = `🎉 ¡PAR GANADOR! Ganaste x${res.multiplier} (${res.prize} 🪙)`;
          } else {
            msg = `💀 Sigue intentando`;
          }

          setWinMessage(msg);

          const gr: GameResult = {
            playerName: 'Tú',
            game: 'Tragaperras 777 🎰',
            result: `${final.join(' | ')}`,
            prize: res.prize,
            newBalance: res.new_balance,
            emoji: res.prize > 0 ? '🎰' : '💀',
            timestamp: Date.now()
          };
          onResult(gr);

          try {
            zegoService.engine?.sendBroadcastMessage('game-room',
              JSON.stringify({ type: 'GAME_RESULT', data: gr }));
          } catch (_) {}
        }
      }, 70);
    } catch (_) {
      setSpinning(false);
    }
  };

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Text style={gs.subtitle}>🎰 Máquina Tragaperras Casino 777 🎰</Text>
      
      {/* Marco de Máquina de Casino Neón Dorado */}
      <LinearGradient colors={['#F59E0B', '#B45309', '#78350F']} style={gs.slotMachineContainer}>
        <View style={gs.slotMachineInner}>
          {reels.map((s, i) => (
            <View key={i} style={gs.slotReelBox}>
              <Text style={{ fontSize: 44 }}>{s}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {winMessage && (
        <View style={gs.winBanner}>
          <Text style={gs.winBannerText}>{winMessage}</Text>
        </View>
      )}

      {/* Tabla de Premios Multiplicadores */}
      <View style={gs.payoutTable}>
        <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '900', textAlign: 'center' }}>
          7️⃣ 7️⃣ 7️⃣ (x100)  |  💎 💎 💎 (x50)  |  ⭐ ⭐ ⭐ (x25)  |  Par (x3)
        </Text>
      </View>

      <TouchableOpacity onPress={spin} disabled={spinning || bet > userCoins} activeOpacity={0.85}
        style={{ width: '100%', borderRadius: 20, overflow: 'hidden', marginTop: 14 }}>
        <LinearGradient colors={spinning ? ['#374151', '#1F2937'] : ['#EC4899', '#7C3AED']}
          style={{ paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
            {spinning ? '🎰 Girando Rodillos 777...' : `🎰 ¡GIRAR CASSINO 777! (${bet} 🪙)`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const BET_OPTIONS = [10, 50, 100, 500];

export function InteractiveGamesModal({
  visible, onClose, roomId = 'game-room'
}: { visible: boolean; onClose: () => void; roomId?: string }) {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [bet, setBet] = useState(10);
  const [userCoins, setUserCoins] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);

  useEffect(() => {
    if (visible) loadCoins();
  }, [visible]);

  const loadCoins = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('wallets')
        .select('coin_balance')
        .eq('user_id', user.id)
        .single();
      if (data) setUserCoins(data.coin_balance);
    } catch (_) {}
  };

  const handleResult = useCallback((r: GameResult) => {
    setResults(prev => [r, ...prev].slice(0, 5));
    if (typeof r.newBalance === 'number') {
      setUserCoins(r.newBalance);
    }
  }, []);

  const GAME_MENU = [
    { id: 'roulette', name: 'Ruleta Cyber 🎡', desc: 'Rojo / Negro / Verde', colors: ['#EF4444', '#991B1B'] as const },
    { id: 'dice',     name: 'Dados Cyberpunk 🎲', desc: 'Alto vs Bajo', colors: ['#7C3AED', '#4C1D95'] as const },
    { id: 'slots',    name: 'Tragamonedas 777 🎰', desc: '3 iguales = Jackpot', colors: ['#EC4899', '#9333EA'] as const },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={gs.overlay}>
        <LinearGradient colors={['#0F172A', '#020617']} style={gs.container}>
          {/* Header */}
          <View style={gs.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Gamepad2 size={20} color="#F59E0B" />
              <Text style={gs.headerTitle}>
                {activeGame ? (
                  activeGame === 'roulette' ? 'Ruleta Cyber 🎡' :
                  activeGame === 'dice' ? 'Dados Cyberpunk 🎲' : 'Tragamonedas 777 🎰'
                ) : 'Juegos en Vivo 🎮'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {activeGame && (
                <TouchableOpacity onPress={() => setActiveGame(null)} style={gs.backBtn}>
                  <RefreshCw size={14} color="#F59E0B" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={gs.closeBtn}>
                <X size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance */}
          <View style={gs.balanceBar}>
            <Zap size={14} color="#F59E0B" />
            <Text style={gs.balanceText}>Tu saldo: {userCoins.toLocaleString()} 🪙</Text>
            <TouchableOpacity onPress={loadCoins} style={{ padding: 4 }}>
              <RefreshCw size={12} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {/* Apuesta */}
            {!activeGame && (
              <>
                <Text style={gs.sectionLabel}>Selecciona tu apuesta:</Text>
                <View style={gs.betRow}>
                  {BET_OPTIONS.map(b => (
                    <TouchableOpacity key={b} onPress={() => setBet(b)} activeOpacity={0.85}
                      style={[gs.betBtn, bet === b && gs.betBtnActive]}>
                      <Text style={[gs.betBtnText, bet === b && { color: '#000' }]}>{b} 🪙</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={gs.sectionLabel}>Elige un juego:</Text>
                {GAME_MENU.map(g => (
                  <TouchableOpacity key={g.id} onPress={() => setActiveGame(g.id as GameType)}
                    activeOpacity={0.85} style={{ marginBottom: 10 }}>
                    <LinearGradient colors={g.colors} style={gs.gameMenuCard}>
                      <View>
                        <Text style={gs.gameName}>{g.name}</Text>
                        <Text style={gs.gameDesc}>{g.desc}</Text>
                      </View>
                      <Text style={{ fontSize: 28 }}>▶️</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Juego activo */}
            {activeGame === 'roulette' && (
              <RouletteGame onResult={handleResult} bet={bet} userCoins={userCoins} />
            )}
            {activeGame === 'dice' && (
              <DiceGame onResult={handleResult} bet={bet} userCoins={userCoins} />
            )}
            {activeGame === 'slots' && (
              <SlotsGame onResult={handleResult} bet={bet} userCoins={userCoins} />
            )}

            {/* Historial */}
            {results.length > 0 && (
              <>
                <Text style={[gs.sectionLabel, { marginTop: 16 }]}>🏆 Últimos Resultados:</Text>
                {results.map((r, i) => (
                  <View key={i} style={[gs.resultRow, { borderLeftColor: r.prize > 0 ? '#10B981' : '#EF4444' }]}>
                    <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={gs.resultGame}>{r.game}</Text>
                      <Text style={gs.resultDetail}>{r.result}</Text>
                    </View>
                    <Text style={[gs.resultPrize, { color: r.prize > 0 ? '#10B981' : '#EF4444' }]}>
                      {r.prize > 0 ? `+${r.prize} 🪙` : `-${bet} 🪙`}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderColor: 'rgba(245,158,11,0.5)',
    padding: 18,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  balanceText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 13,
    flex: 1,
  },
  sectionLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  betRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  betBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#374151',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  betBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  betBtnText: {
    color: '#D1D5DB',
    fontWeight: '800',
    fontSize: 11,
  },
  gameMenuCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gameName: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 2,
  },
  gameDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  // Ruleta
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  wheel: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  wheelResult: {
    position: 'absolute',
    bottom: 8,
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },
  resultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  // Dados
  diceRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  diceBox: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tragamonedas Casino 777
  slotMachineContainer: {
    padding: 6,
    borderRadius: 22,
    marginBottom: 10,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  slotMachineInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(245,158,11,0.5)',
    gap: 8,
  },
  slotReelBox: {
    flex: 1,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#1E1B4B',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  winBanner: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: '#34D399',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  winBannerText: {
    color: '#34D399',
    fontWeight: '900',
    fontSize: 11,
    textAlign: 'center',
  },
  payoutTable: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    width: '100%',
  },
  // Resultados
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 4,
  },
  resultGame: {
    color: '#E2E8F0',
    fontWeight: '800',
    fontSize: 12,
  },
  resultDetail: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  resultPrize: {
    fontWeight: '900',
    fontSize: 14,
  },
});
