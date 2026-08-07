import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Sparkles, Droplet, Sun, Eye } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

type CameraFiltersModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function CameraFiltersModal({ visible, onClose }: CameraFiltersModalProps) {
  const theme = useTheme();

  // Valores de los filtros (Mock)
  const [smoothSkin, setSmoothSkin] = useState(50);
  const [whitening, setWhitening] = useState(30);
  const [bigEyes, setBigEyes] = useState(20);
  const [activeFilter, setActiveFilter] = useState<string>('none');

  const filters = [
    { id: 'none', label: 'Ninguno' },
    { id: 'neon', label: 'Neón' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'warm', label: 'Cálido' },
    { id: 'cool', label: 'Frío' },
  ];

  const renderSlider = (label: string, icon: React.ReactNode, value: number, setValue: (val: number) => void) => (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center space-x-2">
          {icon}
          <Text className="text-white font-bold ml-2">{label}</Text>
        </View>
        <Text className="text-cyan-400 font-bold">{value}%</Text>
      </View>
      {/* Mock Slider - UI Only */}
      <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <View style={{ width: `${value}%` }} className="h-full bg-cyan-500" />
      </View>
      <View className="flex-row justify-between mt-2">
        <TouchableOpacity onPress={() => setValue(Math.max(0, value - 10))} className="px-3 py-1 bg-white/10 rounded-full">
          <Text className="text-white">-</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setValue(Math.min(100, value + 10))} className="px-3 py-1 bg-white/10 rounded-full">
          <Text className="text-white">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <TouchableOpacity className="absolute inset-0 bg-black/60" onPress={onClose} />
        
        <View className="bg-gray-900 rounded-t-3xl border-t border-cyan-500/30 p-5 min-h-[50%]">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Sparkles size={24} color="#00E5FF" />
              <Text className="text-white font-black text-xl ml-2">Modo Belleza & Filtros</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-white/10 rounded-full">
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Ajustes de Belleza */}
            <Text className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-wider">Ajustes Faciales</Text>
            {renderSlider('Suavizar Piel', <Droplet size={18} color="#FF007F" />, smoothSkin, setSmoothSkin)}
            {renderSlider('Blanqueamiento', <Sun size={18} color="#FFD700" />, whitening, setWhitening)}
            {renderSlider('Ojos Grandes', <Eye size={18} color="#00E5FF" />, bigEyes, setBigEyes)}

            {/* Filtros de Color */}
            <Text className="text-gray-400 font-bold mt-4 mb-4 uppercase text-xs tracking-wider">Filtros de Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {filters.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setActiveFilter(f.id)}
                  className={`mr-3 px-4 py-2 rounded-full border ${
                    activeFilter === f.id
                      ? 'bg-cyan-500/20 border-cyan-400'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={activeFilter === f.id ? 'text-cyan-400 font-bold' : 'text-gray-300'}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
