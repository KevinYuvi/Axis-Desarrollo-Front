import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { spacing, radius } from '../../../../../shared/theme/spacing';

const ESTADOS = [
  {
    value: 'disponible',
    label: 'Disponible',
    icon: 'checkmark-circle-outline',
    color: '#16A34A',
    bg: '#DCFCE7',
  },
  {
    value: 'ocupado',
    label: 'Ocupada',
    icon: 'radio-button-on-outline',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    value: 'mantenimiento',
    label: 'Mantenimiento',
    icon: 'construct-outline',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
];

const TIPOS = [
  {
    value: 'aula',
    label: 'Aula',
    icon: 'school-outline',
  },
  {
    value: 'laboratorio',
    label: 'Laboratorio',
    icon: 'desktop-outline',
  },
];

const EQUIPOS = [
  {
    key: 'proyector',
    label: 'Proyector',
    icon: 'videocam-outline',
  },
  {
    key: 'computadoras',
    label: 'Computadoras',
    icon: 'desktop-outline',
  },
  {
    key: 'parlantes',
    label: 'Parlantes',
    icon: 'volume-high-outline',
  },
  {
    key: 'pizarra',
    label: 'Pizarra',
    icon: 'easel-outline',
  },
];

export default function AulaFormModal({
  visible,
  modo,
  form,
  guardando,
  errorMensaje,
  onChange,
  onClose,
  onSubmit,
}) {
  const toggleEquipo = (key) => {
    const nuevoValor = !form[key];

    onChange(key, nuevoValor);

    if (key === 'computadoras' && !nuevoValor) {
      onChange('cantidadComputadoras', '');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {modo === 'crear' ? 'Nueva aula' : 'Editar aula'}
              </Text>

              <Text style={styles.subtitle}>
                Completa los datos del espacio.
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {Boolean(errorMensaje) && (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={18} color="#D97706" />
              <Text style={styles.errorText}>{errorMensaje}</Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScroll}
          >
            <InputAula
              label="Nombre"
              value={form.nombre}
              placeholder="Ejemplo: Aula 101"
              onChangeText={(value) => onChange('nombre', value)}
            />

            <InputAula
              label="Ubicación"
              value={form.ubicacion}
              placeholder="Ejemplo: Segundo piso"
              onChangeText={(value) => onChange('ubicacion', value)}
            />

            <View style={styles.row}>
              <View style={styles.column}>
                <InputAula
                  label="Bloque"
                  value={form.bloque}
                  placeholder="A"
                  onChangeText={(value) => onChange('bloque', value)}
                />
              </View>

              <View style={styles.column}>
                <InputAula
                  label="Capacidad"
                  value={form.capacidad}
                  placeholder="30"
                  keyboardType="numeric"
                  onChangeText={(value) => onChange('capacidad', value)}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Tipo</Text>

            <View style={styles.tipoRow}>
              {TIPOS.map((item) => {
                const active = form.tipo === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.tipoOption,
                      active && styles.tipoOptionActive,
                    ]}
                    onPress={() => onChange('tipo', item.value)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? colors.primary : colors.textSecondary}
                    />

                    <Text
                      style={[
                        styles.tipoText,
                        active && styles.tipoTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Equipamiento</Text>

            <View style={styles.equipmentGrid}>
              {EQUIPOS.map((item) => {
                const active = Boolean(form[item.key]);

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.equipmentOption,
                      active && styles.equipmentOptionActive,
                    ]}
                    onPress={() => toggleEquipo(item.key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? colors.primary : colors.textSecondary}
                    />

                    <Text
                      style={[
                        styles.equipmentText,
                        active && styles.equipmentTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={17}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {form.computadoras && (
              <InputAula
                label="Cantidad de computadoras"
                value={form.cantidadComputadoras}
                placeholder="Ejemplo: 20"
                keyboardType="numeric"
                onChangeText={(value) =>
                  onChange('cantidadComputadoras', value)
                }
              />
            )}

            <InputAula
              label="Otros equipos"
              value={form.equipamientoTexto}
              placeholder="Ejemplo: cámara, micrófono"
              onChangeText={(value) => onChange('equipamientoTexto', value)}
              multiline
            />

            <Text style={styles.inputLabel}>Estado</Text>

            <View style={styles.estadoOptions}>
              {ESTADOS.map((item) => {
                const active = form.estado_actual === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.estadoOption,
                      active && {
                        backgroundColor: item.bg,
                        borderColor: item.color,
                      },
                    ]}
                    onPress={() => onChange('estado_actual', item.value)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? item.color : colors.textSecondary}
                    />

                    <Text
                      style={[
                        styles.estadoText,
                        active && { color: item.color },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, guardando && styles.disabledBtn]}
              onPress={onSubmit}
              disabled={guardando}
              activeOpacity={0.85}
            >
              {guardando ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {modo === 'crear' ? 'Crear aula' : 'Guardar cambios'}
                  </Text>

                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={colors.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InputAula({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },

  content: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.lg,
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBox: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: '#D97706',
    lineHeight: 19,
  },

  formScroll: {
    paddingBottom: spacing.lg,
  },

  inputGroup: {
    marginBottom: spacing.sm,
  },

  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 7,
  },

  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },

  inputMultiline: {
    minHeight: 82,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  column: {
    flex: 1,
  },

  tipoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  tipoOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  tipoOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },

  tipoText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  tipoTextActive: {
    color: colors.primary,
  },

  equipmentGrid: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  equipmentOption: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  equipmentOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },

  equipmentText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  equipmentTextActive: {
    color: colors.primary,
  },

  estadoOptions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  estadoOption: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  estadoText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  submitBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  submitText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  disabledBtn: {
    opacity: 0.6,
  },
});