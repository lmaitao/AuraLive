import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { X, Calendar } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

const EVENTS = [
  {
    id: '1',
    user: '--LaFlaca--',
    userId: '5990212',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    time: '08/05 02:00 PM - 08/05 05:00 PM',
    description: 'Juguemos domino\nVen a jugar con mi familia domino y diviértete con nosotras, una tarde de juegossss',
  },
  {
    id: '2',
    user: 'Michel 🧸',
    userId: '5332508',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
    time: '08/05 06:00 PM - 08/05 07:00 PM',
    description: 'Ven juguemos stop\nDisfruta de una noche jugando stop trae tu hoja y lapiz',
  },
];

export function EventsPlazaModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/80 p-4">
        <View className="bg-indigo-950/90 w-full h-[80%] rounded-3xl border-2 border-cyan-400 overflow-hidden relative">
          
          <View className="absolute inset-0 bg-gradient-to-b from-blue-600/30 via-transparent to-indigo-900/60" />

          {/* Header */}
          <View className="p-4 flex-row justify-between items-center z-10">
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            <View className="flex-row items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400">
              <Calendar size={14} color="#60A5FA" />
              <Text className="text-blue-300 text-xs font-bold">Fecha</Text>
            </View>
          </View>

          <View className="items-center z-10 mb-4">
            <Text className="text-white font-black text-4xl italic tracking-wider shadow-lg" style={{ textShadowColor: '#00E5FF', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }}>
              Plaza de Eventos
            </Text>
            <View className="bg-blue-600/60 px-4 py-1 rounded-full mt-2 border border-blue-400">
              <Text className="text-blue-100 text-[10px] font-bold">Haz clic a entrar en las salas, participa y diviértete!</Text>
            </View>
            
            <View className="flex-row items-center mt-4 bg-black/40 px-4 py-1.5 rounded-full border border-white/20">
              <Text className="text-cyan-400 font-bold">{'<< '}Eventos Semanales{' >>'}</Text>
            </View>
          </View>

          {/* Events List */}
          <ScrollView className="flex-1 px-4 z-10" showsVerticalScrollIndicator={false}>
            {EVENTS.map((event) => (
              <View key={event.id} className="bg-indigo-900/80 rounded-2xl border-2 border-cyan-500/50 p-4 mb-4 shadow-xl">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center space-x-3">
                    <Image source={{ uri: event.avatar }} className="w-12 h-12 rounded-full border-2 border-pink-400" />
                    <View>
                      <Text className="text-white font-black text-sm">{event.user}</Text>
                      <Text className="text-gray-400 text-[9px]">{event.userId}</Text>
                      <Text className="text-gray-300 text-[9px] mt-0.5">{event.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity className="bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-1.5 rounded-full border border-white/30">
                    <Text className="text-white font-bold text-xs">Reservar</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="bg-white/95 rounded-xl p-3">
                  <Text className="text-indigo-900 font-serif text-xs italic">{event.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}
