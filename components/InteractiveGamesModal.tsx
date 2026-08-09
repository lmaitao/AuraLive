import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing
} from 'react-native';
import { X, Gamepad2, Trophy, Zap, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { zegoService } from '../lib/ZegoService';
import { supabase } from '../lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type GameType = null | 'roulette' | 'dice' | 'slots';

interface GameResult {
  playerName: string;
  game: string;
  result: string;
  prize: number;
  emoji: string;
  timestamp: number;
}

// ─── RULETA ───────────────────────────────────────────────────────────────────
const ROULETTE_COLORS = ['Rojo', 'Negro', 'Verde'];
const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const ROULETTE_EMOJIS: Record<string, string> = { Rojo: '🔴', Negro: '⚫', Verde: '💚' };
const ROULETTE_MULTIPLIERS: Record<string, number> = { Rojo: 2, Negro: 2, Verde: 14 };

// ─── DADOS ────────────────────────────────────────────────────────────────────
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ─── TRAGAMONEDAS ─────────────────────────────────────────────────────────────
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🌟'];
const SLOT_JACKPOTS: Record<string, number> = {
  '🍒': 2, '🍋': 3, '🍊': 5, '🍇': 8, '💎': 20, '7️⃣': 50, '🌟': 100
};

function spinRoulette(): { number: number; color: string } {
  const n = Math.floor(Math.random() * 37);
  let color = 'Verde';
  if (n !== 0) {
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    color = redNumbers.includes(n) ? 'Rojo' : 'Negro';
  }
  return { number: n, color };
}

function rollDice(): number[] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

function spinSlots(): string[] {
  return [
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
  ];
}

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
    Animated.timing(spinAnim, {
      toValue: 1, duration: 2000,
      easing: Easing.out(Easing.cubic), useNativeDriver: true
    }).start(async () => {
      const r = spinRoulette();
      setResult(r);
      setSpinning(false);
      const won = r.color === betColor;
      const prize = won ? bet * ROULETTE_MULTIPLIERS[betColor!] : 0;
      const gr: GameResult = {
        playerName: 'Tú',
        game: 'Ruleta 🎡',
        result: `${r.number} • ${ROULETTE_EMOJIS[r.color]} ${r.color}`,
        prize, emoji: won ? '🎉' : '💀',
        timestamp: Date.now()
      };
      onResult(gr);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('wallets').update({
            coin_balance: won
              ? supabase.rpc('increment', { x: prize - bet })
              : supabase.rpc('decrement', { x: bet })
          }).eq('user_id', user.id);
        }
      } catch (_) {}
      // Broadcast via Zego
      try {
        await zegoService.engine?.sendBroadcastMessage(
          'game-room',
          JSON.stringify({ type: 'GAME_RESULT', data: gr })
        );
      } catch (_) {}
    });
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
  const [guess, setGuess] = useState<'alto' | 'bajo' | null>(null); // >7 or <=7
  const rollAnim = [new Animated.Value(0), new Animated.Value(0)];

  const roll = async () => {
    if (!guess || rolling || bet > userCoins) return;
    setRolling(true);
    Animated.parallel(rollAnim.map(a =>
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(a, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 150, useNativeDriver: true }),
      ])
    )).start(async () => {
      const result = rollDice();
      setDice(result);
      setRolling(false);
      const total = result[0] + result[1];
      const won = (guess === 'alto' && total > 7) || (guess === 'bajo' && total <= 7);
      const prize = won ? bet * 2 : 0;
      const gr: GameResult = {
        playerName: 'Tú',
        game: 'Dados 🎲',
        result: `${DICE_FACES[result[0] - 1]}${DICE_FACES[result[1] - 1]} = ${total}`,
        prize, emoji: won ? '🎉' : '💀',
        timestamp: Date.now()
      };
      onResult(gr);
      try {
        await zegoService.engine?.sendBroadcastMessage('game-room',
          JSON.stringify({ type: 'GAME_RESULT', data: gr }));
      } catch (_) {}
    });
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

// ─── COMPONENTE TRAGAMONEDAS ──────────────────────────────────────────────────
function SlotsGame({
  onResult, bet, userCoins
}: { onResult: (r: GameResult) => void; bet: number; userCoins: number }) {
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  const spin = async () => {
    if (spinning || bet > userCoins) return;
    setSpinning(true);
    let ticks = 0;
    const id = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      ]);
      ticks++;
      if (ticks >= 20) {
        clearInterval(id);
        const final = spinSlots();
        setReels(final);
        setSpinning(false);
        const isJackpot = final[0] === final[1] && final[1] === final[2];
        const isTwoPair = final[0] === final[1] || final[1] === final[2] || final[0] === final[2];
        let prize = 0;
        if (isJackpot) prize = bet * SLOT_JACKPOTS[final[0]];
        else if (isTwoPair) prize = bet * 2;
        const gr: GameResult = {
          playerName: 'Tú',
          game: 'Tragamonedas 🎰',
          result: `${final.join(' ')}`,
          prize, emoji: prize > 0 ? '🎉' : '💀',
          timestamp: Date.now()
        };
        onResult(gr);
        try {
          zegoService.engine?.sendBroadcastMessage('game-room',
            JSON.stringify({ type: 'GAME_RESULT', data: gr }));
        } catch (_) {}
      }
    }, 80);
    setIntervalId(id);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={gs.subtitle}>¡Haz girar los rodillos y gana!</Text>
      <View style={gs.slotMachine}>
        {reels.map((s, i) => (
          <View key={i} style={gs.reel}>
            <Text style={{ fontSize: 42 }}>{s}</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
        3 iguales = JACKPOT 🌟 | 2 iguales = x2
      </Text>
      <TouchableOpacity onPress={spin} disabled={spinning} activeOpacity={0.85}
        style={{ width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 14 }}>
        <LinearGradient colors={spinning ? ['#374151', '#1F2937'] : ['#EC4899', '#9333EA']}
          style={{ paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>
            {spinning ? '🎰 Girando...' : `🎰 ¡Jugar! (${bet} 🪙)`}
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

  const handleResult = useCallback(async (r: GameResult) => {
    setResults(prev => [r, ...prev].slice(0, 5));
    if (r.prize > 0) {
      // Actualizar billetera al ganar
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('wallets')
          .update({ coin_balance: userCoins - bet + r.prize })
          .eq('user_id', user.id);
        setUserCoins(prev => prev - bet + r.prize);
      } catch (_) {}
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('wallets')
          .update({ coin_balance: Math.max(0, userCoins - bet) })
          .eq('user_id', user.id);
        setUserCoins(prev => Math.max(0, prev - bet));
      } catch (_) {}
    }
  }, [bet, userCoins]);

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
                  <View key={i} style={[gs.resultRow, { borderLeftColor: r.prize > 0 ? '#10B981' : '#EF4444' } as any]}>
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
  // Tragamonedas
  slotMachine: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: '#EC4899',
    marginBottom: 8,
  },
  reel: {
    width: 72,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
