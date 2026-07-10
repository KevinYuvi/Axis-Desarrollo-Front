import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ESTADO_CONFIG = {
  disponible: { bg: '#F0FDF4', text: '#16A34A', label: 'Disponible' },
  ocupado: { bg: '#FEF2F2', text: colors.danger, label: 'Ocupado' },
  mantenimiento: { bg: '#FFF7ED', text: '#D97706', label: 'Mantenimiento' }
};

export default function EspaciosAdminScreen({ token, onBack }) {
  const [espacios, setEspacios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Modal form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', bloque: '', ubicacion: '', tipo: 'aula', capacidad: '30', equipamiento: ''
  });

  const cargarEspacios = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/espacios/`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Error al cargar los espacios');
      setEspacios(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudieron cargar los espacios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { cargarEspacios(); }, [cargarEspacios]);

  const abrirModal = (espacio = null) => {
    if (espacio) {
      setEditando(espacio.id);
      setFormData({
        nombre: espacio.nombre || '',
        bloque: espacio.bloque || '',
        ubicacion: espacio.ubicacion || '',
        tipo: espacio.tipo || 'aula',
        capacidad: String(espacio.capacidad || '30'),
        equipamiento: espacio.equipamiento || ''
      });
    } else {
      setEditando(null);
      setFormData({ nombre: '', bloque: '', ubicacion: '', tipo: 'aula', capacidad: '30', equipamiento: '' });
    }
    setModalVisible(true);
  };

  const guardarEspacio = async () => {
    if (!formData.nombre || !formData.bloque) {
      Alert.alert('Incompleto', 'Nombre y Bloque son obligatorios.');
      return;
    }

    try {
      setProcesando(true);
      const payload = {
        ...formData,
        capacidad: parseInt(formData.capacidad, 10) || 0
      };

      const url = editando ? `${API_URL}/api/v1/espacios/${editando}` : `${API_URL}/api/v1/espacios/`;
      const method = editando ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json',
          Accept: 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || 'Error al guardar el espacio');
      }

      setModalVisible(false);
      cargarEspacios(true);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProcesando(false);
    }
  };

  const cambiarEstadoEspacio = async (id, accion) => {
    // accion can be 'bloquear' or 'liberar'
    try {
      setProcesando(true);
      const res = await fetch(`${API_URL}/api/v1/espacios/${id}/${accion}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || `Error al ${accion} el espacio`);
      }
      cargarEspacios(true);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProcesando(false);
    }
  };

  const renderEspacio = ({ item }) => {
    const estado = ESTADO_CONFIG[item.estado_actual] || ESTADO_CONFIG.disponible;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.espacioNombre}>{item.nombre}</Text>
            <Text style={styles.espacioMeta}>Bloque {item.bloque} • {item.ubicacion}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: estado.bg }]}>
            <Text style={[styles.badgeText, { color: estado.text }]}>{estado.label}</Text>
          </View>
        </View>

        <View style={styles.separator} />
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.capacidad} cap.</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="desktop-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText} numberOfLines={1}>{item.equipamiento || 'Sin equipo'}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => abrirModal(item)}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.btnSecondaryText}>Editar</Text>
          </TouchableOpacity>
          
          {item.estado_actual === 'mantenimiento' ? (
            <TouchableOpacity style={styles.btnSuccess} onPress={() => cambiarEstadoEspacio(item.id, 'liberar')} disabled={procesando}>
              <Ionicons name="build-outline" size={18} color={colors.white} />
              <Text style={styles.btnActionText}>Liberar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnDanger} onPress={() => cambiarEstadoEspacio(item.id, 'bloquear')} disabled={procesando}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.white} />
              <Text style={styles.btnActionText}>Bloquear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Espacios</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.actionStrip}>
        <Text style={styles.subtitle}>{espacios.length} espacios registrados</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => abrirModal()}>
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.btnPrimaryText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={espacios}
          keyExtractor={(item) => item.id}
          renderItem={renderEspacio}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarEspacios(true); }} tintColor={colors.primary} />
          }
        />
      )}

      {/* Modal CRUD */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editando ? 'Editar Espacio' : 'Nuevo Espacio'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Nombre del Espacio</Text>
              <TextInput style={styles.input} placeholder="Ej. Laboratorio 3" value={formData.nombre} onChangeText={(t) => setFormData({...formData, nombre: t})} />

              <Text style={styles.inputLabel}>Bloque</Text>
              <TextInput style={styles.input} placeholder="Ej. A" value={formData.bloque} onChangeText={(t) => setFormData({...formData, bloque: t})} />

              <Text style={styles.inputLabel}>Ubicación</Text>
              <TextInput style={styles.input} placeholder="Ej. Primer piso, al fondo" value={formData.ubicacion} onChangeText={(t) => setFormData({...formData, ubicacion: t})} />

              <Text style={styles.inputLabel}>Capacidad (N° estudiantes)</Text>
              <TextInput style={styles.input} placeholder="Ej. 30" keyboardType="numeric" value={formData.capacidad} onChangeText={(t) => setFormData({...formData, capacidad: t})} />

              <Text style={styles.inputLabel}>Equipamiento</Text>
              <TextInput style={styles.input} placeholder="Ej. 30 PCs, Proyector" value={formData.equipamiento} onChangeText={(t) => setFormData({...formData, equipamiento: t})} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)} disabled={procesando}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={guardarEspacio} disabled={procesando}>
                {procesando ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.modalSaveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

import { KeyboardAvoidingView, Platform } from 'react-native';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  headerSpacer: { width: 32 },
  actionStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white },
  subtitle: { fontSize: typography.size.sm, color: colors.textSecondary },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, gap: 4 },
  btnPrimaryText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, paddingRight: spacing.sm },
  espacioNombre: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: 2 },
  espacioMeta: { fontSize: typography.size.xs, color: colors.textSecondary },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: typography.weight.bold },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  statText: { fontSize: typography.size.xs, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: radius.sm, backgroundColor: '#EFF6FF', gap: 4 },
  btnSecondaryText: { color: colors.primary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  btnDanger: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.danger, gap: 4 },
  btnSuccess: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: radius.sm, backgroundColor: '#16A34A', gap: 4 },
  btnActionText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  modalForm: { padding: spacing.lg },
  inputLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, fontSize: typography.size.md, color: colors.textPrimary },
  modalFooter: { flexDirection: 'row', padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md, paddingBottom: 40 },
  modalCancel: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: radius.full, backgroundColor: colors.background },
  modalCancelText: { color: colors.textPrimary, fontWeight: typography.weight.bold },
  modalSave: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: radius.full, backgroundColor: colors.primary },
  modalSaveText: { color: colors.white, fontWeight: typography.weight.bold },
});
