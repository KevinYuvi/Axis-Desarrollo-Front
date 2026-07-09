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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DetalleAulaScreen({
  token,
  claseActual,
  onBack,
  onReportar,
  onVerReportes,
}) {
  const [liberando, setLiberando] = useState(false);

  const formatHorario = (isoInicio, isoFin) => {
    if (!isoInicio || !isoFin) return 'N/A';

    const opciones = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    return `${new Date(isoInicio).toLocaleTimeString([], opciones)} – ${new Date(
      isoFin
    ).toLocaleTimeString([], opciones)}`;
  };

  const liberarAula = async () => {
    if (!claseActual?.espacio?.id) {
      Alert.alert('Sin aula activa', 'No hay un aula activa para liberar.');
      return;
    }

    Alert.alert(
      'Liberar aula',
      '¿Seguro que deseas liberar esta aula?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Liberar',
          style: 'destructive',
          onPress: confirmarLiberarAula,
        },
      ]
    );
  };

  const confirmarLiberarAula = async () => {
    try {
      setLiberando(true);

      const formData = new FormData();
      formData.append('texto_chat', 'Libera mi aula');

      const response = await fetch(`${API_URL}/api/v1/ia/procesar-solicitud`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo liberar el aula.');
      }

      if (data?.status !== 'success') {
        throw new Error(
          data?.respuesta_app || 'No se pudo liberar el aula desde el asistente.'
        );
      }

      Alert.alert(
        'Aula liberada',
        data?.respuesta_app || 'El aula fue liberada correctamente.'
      );

      onBack();
    } catch (error) {
      console.error('Error liberando aula con IA:', error);
      Alert.alert('Error', error.message || 'No se pudo liberar el aula.');
    } finally {
      setLiberando(false);
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
          <Text style={styles.mainTitle}>Mi Aula Asignada</Text>

          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.aulaTitle}>
                  {claseActual?.espacio?.nombre || 'Aula asignada'}
                </Text>

                <Text style={styles.aulaSub}>
                  {claseActual?.espacio?.ubicacion || 'Ubicación no registrada'}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {claseActual?.espacio?.estado_actual === 'disponible'
                    ? 'Disponible'
                    : 'En curso'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Materia</Text>
              <Text style={styles.infoValue}>
                {claseActual?.reserva?.materia || 'Sin materia'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Horario</Text>
              <Text style={styles.infoValue}>
                {formatHorario(
                  claseActual?.reserva?.hora_inicio,
                  claseActual?.reserva?.hora_fin
                )}
              </Text>
            </View>

            <View style={styles.infoRowNoBorder}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>
                {claseActual?.espacio?.estado_actual || 'ocupado'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.releaseBtn, liberando && styles.disabledBtn]}
            onPress={liberarAula}
            disabled={liberando}
          >
            {liberando ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Text style={styles.releaseBtnText}>Liberar aula</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportBtn} onPress={onReportar}>
            <Text style={styles.reportBtnText}>Reportar incidencia</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={onBack}>
            <Ionicons name="business" size={22} color="#2F80ED" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Mi Aula</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={onVerReportes}
            disabled={!onVerReportes}
          >
            <Ionicons name="document-text-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={onAbrirIA}
            disabled={!onAbrirIA}
          >
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

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#2F80ED',
    padding: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 14,
    marginBottom: 10,
  },

  cardHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  aulaTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  aulaSub: {
    fontSize: 15,
    color: '#7B7F88',
    marginTop: 4,
  },

  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },

  statusText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '700',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  infoRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  infoLabel: {
    fontSize: 15,
    color: '#7B7F88',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    maxWidth: '58%',
    textAlign: 'right',
  },

  releaseBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 18,
  },

  releaseBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },

  reportBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },

  reportBtnText: {
    color: '#92400E',
    fontSize: 16,
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