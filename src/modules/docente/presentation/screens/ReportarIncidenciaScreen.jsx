import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const PRIORIDADES = ['baja', 'media', 'alta'];

export default function ReportarIncidenciaScreen({ token, claseActual, onBack }) {
  const [recursoAfectado, setRecursoAfectado] = useState(claseActual?.espacio?.nombre || '');
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

      if (!response.ok) throw new Error(data?.detail || 'No se pudo generar el reporte.');

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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Cabecera unificada con botón de regreso */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar Incidencia</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nuevo reporte</Text>

          <Text style={styles.inputLabel}>Recurso afectado</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="Seleccionar recurso..."
            placeholderTextColor={colors.textMuted}
            value={recursoAfectado}
            onChangeText={setRecursoAfectado}
            editable={false}
          />

          <Text style={styles.inputLabel}>Prioridad</Text>
          <View style={styles.priorityRow}>
            {PRIORIDADES.map((item) => {
              const active = prioridad === item;
              const isHigh = item === 'alta' && active;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.priorityBtn, active && styles.priorityBtnActive, isHigh && styles.priorityBtnHigh]}
                  onPress={() => setPrioridad(item)}
                >
                  <Text style={[styles.priorityText, active && styles.priorityTextActive, isHigh && styles.priorityTextHigh]}>
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
            placeholderTextColor={colors.textMuted}
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
            {enviando
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.submitBtnText}>Generar ticket</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 30,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollInner: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 52,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  textArea: {
    minHeight: 110,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  priorityBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  priorityBtnHigh: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.danger,
  },
  priorityText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },
  priorityTextActive: {
    color: colors.primary,
  },
  priorityTextHigh: {
    color: colors.danger,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});