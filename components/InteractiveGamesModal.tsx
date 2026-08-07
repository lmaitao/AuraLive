import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { X, Lock, Gamepad2, Trophy, Flame } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const GAMES = [
  { id: '1', name: 'Ruleta de la Suerte 🎰', locked: false, image: 'https://images.unsplash.com/photo-1606167668511-2292f441097e?w=300' },
  { id: '2', name: 'Fortune Tiger 🐯', locked: false, image: 'https://images.unsplash.com/photo-1582531333465-274e62ff1875?w=300' },
  { id: '3', name: 'Dado Cyberpunk 🎲', locked: false, image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=300' },
  { id: '4', name: 'Lucky Buffalo 777 🦬', locked: false, image: 'https://images.unsplash.com/photo-1596700874052-16e7807204de?w=300' },
  { id: '5', name: 'Duelo de Presentadoras ⚔️', locked: false, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300' },
  { id: '6', name: 'Torneo VIP 🏆', locked: true, image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300' },
];

export function InteractiveGamesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();

  const handleLaunchGame = (gameName: string) => {
    Alert.alert('¡Minijuego Activado! 🎮', `Iniciando ${gameName} en la sala de transmisión en vivo.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={['#1F2937', '#0D1117']} style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Gamepad2 size={20} color="#F59E0B" />
              <Text style={styles.headerTitle}>Minijuegos Interactivos en Vivo 🎮</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            <View style={styles.gridRow}>
              {GAMES.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  onPress={() => !game.locked && handleLaunchGame(game.name)}
                  disabled={game.locked}
                  activeOpacity={0.8}
                  style={styles.gameCardItem}
                >
                  <LinearGradient
                    colors={game.locked ? ['#374151', '#111827'] : ['#1E1B4B', '#0F172A']}
                    style={[
                      styles.cardBox,
                      { borderColor: game.locked ? '#4B5563' : '#F59E0B' },
                    ]}
                  >
                    <View style={styles.imageWrapper}>
                      {game.locked ? (
                        <View style={styles.lockOverlay}>
                          <Lock size={22} color="#9CA3AF" />
                        </View>
                      ) : (
                        <Image source={{ uri: game.image }} style={styles.gameImage} resizeMode="cover" />
                      )}
                    </View>
                    <Text style={[styles.gameName, game.locked && { color: '#6B7280' }]} numberOfLines={1}>
                      {game.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justify: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 16,
    height: 360,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justify: 'space-between',
  },
  gameCardItem: {
    width: '31%',
    marginBottom: 12,
  },
  cardBox: {
    padding: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justify: 'center',
  },
  gameName: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
});
