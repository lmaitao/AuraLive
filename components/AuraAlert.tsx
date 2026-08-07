import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react-native';

export interface AuraAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'info' | 'success' | 'danger';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const AuraAlert: React.FC<AuraAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
}) => {
  const getColors = () => {
    switch (type) {
      case 'danger': return { border: '#EF4444', gradient: ['#7F1D1D', '#450A0A'] };
      case 'warning': return { border: '#F59E0B', gradient: ['#78350F', '#451A03'] };
      case 'success': return { border: '#10B981', gradient: ['#064E3B', '#022C22'] };
      default: return { border: '#00E5FF', gradient: ['#1E3A8A', '#0F172A'] };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle size={32} color="#EF4444" />;
      case 'warning': return <AlertTriangle size={32} color="#F59E0B" />;
      case 'success': return <CheckCircle size={32} color="#10B981" />;
      default: return <Info size={32} color="#00E5FF" />;
    }
  };

  const colors = getColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient colors={colors.gradient as any} style={[styles.alertBox, { borderColor: colors.border }]}>
          
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <Text style={[styles.title, { color: colors.border }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={onConfirm} style={[styles.confirmBtn, { backgroundColor: colors.border }]}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  message: {
    color: '#E2E8F0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#64748B',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    textTransform: 'uppercase',
  },
});
