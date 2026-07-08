import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ReportarIncidenciaScreen({
  token,
  claseActual,
  onBack,
}) {
  const [recursoAfectado, setRecursoAfectado] = useState(
    claseActual?.espacio?.nombre || ''
  );
  const [prioridad, setPrioridad] = useState('media');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarReporte = async () => {
    if (!claseActual?.espacio?.id) {
      Alert.alert('Sin aula', 'No se pudo identificar el aula afectada.');
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert('Campo requerido', 'Describe el problema encontrado.');
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        espacio_id: claseActual.espacio.id,
        descripcion: descripcion.trim(),
        gravedad: prioridad,
      };

      const response = await fetch(`${API_URL}/api/v1/reportes/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo generar el reporte.');
      }

      Alert.alert('Reporte generado', 'La incidencia fue registrada correctamente.');

      setRecursoAfectado('');
      setPrioridad('media');
      setDescripcion('');

      onBack();
    } catch (error) {
      console.error('Error generando reporte:', error);
      Alert.alert('Error', error.message || 'No se pudo generar el reporte.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.appShell}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.navbar}>
          <View style={styles.brandRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={22} color="#2F80ED" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Ionicons name="school" size={18} color="#FFFFFF" />
            </View>

            <Text style={styles.brandText}>Axis</Text>
          </View>

          <View style={styles.rightActions}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Profesor</Text>
            </View>

            <TouchableOpacity style={styles.avatarBtn}>
              <Ionicons name="person-circle" size={28} color="#2F80ED" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainTitle}>Reportar Incidencia</Text>

          <View style={styles.reportCard}>
            <Text style={styles.reportCardTitle}>Nuevo reporte</Text>

            <Text style={styles.inputLabel}>Recurso afectado</Text>

            <TextInput
              style={styles.input}
              placeholder="Seleccionar recurso..."
              placeholderTextColor="#9CA3AF"
              value={recursoAfectado}
              onChangeText={setRecursoAfectado}
              editable={false}
            />

            <Text style={styles.inputLabel}>Prioridad</Text>

            <View style={styles.priorityRow}>
              {['baja', 'media', 'alta'].map((item) => {
                const active = prioridad === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.priorityBtn,
                      active && styles.priorityBtnActive,
                      item === 'alta' && active && styles.priorityBtnHigh,
                    ]}
                    onPress={() => setPrioridad(item)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        active && styles.priorityTextActive,
                        item === 'alta' && active && styles.priorityTextHigh,
                      ]}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Descripción del daño</Text>

            <TextInput
              style={styles.textArea}
              placeholder="Describe el problema..."
              placeholderTextColor="#9CA3AF"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, enviando && styles.disabledBtn]}
              onPress={enviarReporte}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Generar ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={onBack}>
            <Ionicons name="business-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Mi Aula</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="warning-outline" size={22} color="#2F80ED" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Reportar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Asistente IA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
  },

  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#F9FAFC',
  },

  navbar: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    marginRight: 10,
  },

  logoContainer: {
    backgroundColor: '#2F80ED',
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  roleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },

  roleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  avatarBtn: {
    padding: 4,
    marginLeft: 8,
  },

  scrollContent: {
    flex: 1,
  },

  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },

  reportCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    minHeight: 52,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },

  textArea: {
    minHeight: 110,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },

  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  priorityBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  priorityBtnActive: {
    backgroundColor: '#EAF2FF',
    borderColor: '#2F80ED',
  },

  priorityBtnHigh: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },

  priorityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },

  priorityTextActive: {
    color: '#2F80ED',
  },

  priorityTextHigh: {
    color: '#DC2626',
  },

  submitBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },

  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  disabledBtn: {
    opacity: 0.6,
  },

  bottomTab: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  tabLabel: {
    fontSize: 11,
    color: '#828282',
    marginTop: 4,
  },

  tabLabelActive: {
    color: '#2F80ED',
    fontWeight: '700',
  },
});