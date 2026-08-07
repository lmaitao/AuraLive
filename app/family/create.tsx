import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Users, Camera, ShieldCheck, Info } from 'lucide-react-native';
import { Cyber3DBackground } from '../../components/Cyber3DBackground';
import { AuraAlert, AuraAlertProps } from '../../components/AuraAlert';

export default function CreateFamilyScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [familyStatus, setFamilyStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [existingFamilyId, setExistingFamilyId] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<AuraAlertProps | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    checkExistingFamily();
  }, []);

  const checkExistingFamily = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is owner of any family
      const { data: ownedFamily, error } = await supabase
        .from('families')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ownedFamily) {
        setFamilyStatus(ownedFamily.status);
        setExistingFamilyId(ownedFamily.id);
        
        if (ownedFamily.status === 'approved') {
          // If approved, redirect to family hub
          router.replace(`/family/${ownedFamily.id}` as any);
        }
      }
    } catch (e) {
      console.log('Error checking family:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      setAlertConfig({
        visible: true,
        title: "Campos Incompletos",
        message: "Debes ingresar un nombre y una descripción para tu familia.",
        type: "warning",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase.from('families').insert([
        {
          owner_id: user.id,
          name: name.trim(),
          description: description.trim(),
          avatar_url: avatarUrl.trim() || 'https://images.unsplash.com/photo-1529156069898-49953eb1b5b6?w=400',
          status: 'pending'
        }
      ]).select().single();

      if (error) {
        if (error.code === '23505') {
          setAlertConfig({
            visible: true,
            title: "Nombre Ocupado",
            message: "El nombre de esta familia ya está en uso. Por favor elige otro.",
            type: "danger",
            confirmText: "Entendido",
            onConfirm: () => setAlertConfig(null)
          });
        } else {
          throw error;
        }
      } else {
        // Automatically add owner as a member with 'owner' role and 'accepted' status
        await supabase.from('family_members').insert([
          {
            family_id: data.id,
            user_id: user.id,
            role: 'owner',
            status: 'accepted'
          }
        ]);

        setFamilyStatus('pending');
        setAlertConfig({
          visible: true,
          title: "¡Solicitud Enviada! 🚀",
          message: "Tu solicitud ha sido enviada al SuperAdmin para su revisión.",
          type: "success",
          confirmText: "Genial",
          onConfirm: () => setAlertConfig(null)
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: e.message,
        type: "danger",
        confirmText: "Ok",
        onConfirm: () => setAlertConfig(null)
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#818CF8" />
      </View>
    );
  }

  if (familyStatus === 'pending') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <Cyber3DBackground />
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8, borderRadius: 20 }}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 20, marginLeft: 8 }}>Mi Familia</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{ backgroundColor: 'rgba(99,102,241,0.2)', padding: 24, borderRadius: 100, marginBottom: 24, borderWidth: 2, borderColor: 'rgba(99,102,241,0.5)' }}>
            <ShieldCheck size={64} color="#818CF8" />
          </View>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 24, marginBottom: 12, textAlign: 'center' }}>Solicitud en Revisión</Text>
          <Text style={{ color: '#9CA3AF', textAlign: 'center', marginBottom: 32 }}>Tu solicitud para crear la familia está siendo evaluada por nuestro equipo. Te notificaremos cuando sea aprobada.</Text>
          
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 30 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Volver al Perfil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Cyber3DBackground />
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8, borderRadius: 20 }}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 20, marginLeft: 8 }}>Crear Familia</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <View style={{ backgroundColor: 'rgba(49,46,129,0.4)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', marginBottom: 32, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <Info size={20} color="#818CF8" style={{ marginTop: 4 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#A5B4FC', fontWeight: 'bold', marginBottom: 4 }}>Sobre las Familias</Text>
            <Text style={{ color: 'rgba(165,180,252,0.8)', fontSize: 12, lineHeight: 20 }}>
              Crea tu propia comunidad. Las familias permiten agrupar hasta 100 miembros con un chat privado exclusivo. Todas las creaciones requieren aprobación.
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#D1D5DB', fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>Nombre de la Familia</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej. Los Guerreros Aura"
            placeholderTextColor="#4B5563"
            maxLength={40}
            style={{ backgroundColor: '#111827', color: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#D1D5DB', fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="¿De qué trata tu familia?"
            placeholderTextColor="#4B5563"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ backgroundColor: '#111827', color: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 128 }}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: '#D1D5DB', fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>URL del Emblema (Opcional)</Text>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://ejemplo.com/logo.png"
            placeholderTextColor="#4B5563"
            style={{ backgroundColor: '#111827', color: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{ paddingVertical: 16, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 40, backgroundColor: submitting ? 'rgba(99,102,241,0.5)' : '#6366F1' }}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Users size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>Enviar Solicitud</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <AuraAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        onConfirm={() => {
          alertConfig?.onConfirm();
          if (!alertConfig?.visible) setAlertConfig(null);
        }}
        onCancel={alertConfig?.onCancel ? () => {
          alertConfig.onCancel!();
          setAlertConfig(null);
        } : undefined}
      />
    </SafeAreaView>
  );
}
