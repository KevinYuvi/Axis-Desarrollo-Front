import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { spacing, radius } from '../../../../../shared/theme/spacing';

const ESTADOS = [
  {
    value: 'abierto',
    label: 'Abierto',
    icon: 'alert-circle-outline',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    value: 'en_proceso',
    label: 'En proceso',
    icon: 'time-outline',
    color: colors.primary,
    bg: '#EFF6FF',
  },
  {
    value: 'resuelto',
    label: 'Resuelto',
    icon: 'checkmark-circle-outline',
    color: '#16A34A',
    bg: '#DCFCE7',
  },
];

export default function ReporteStatusModal({
  visible,
  reporte,
  actualizando,
  estadoGuardando,
  onClose,
  onChangeEstado,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Cambiar estado</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {reporte?.codigo || 'Reporte seleccionado'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={actualizando}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {ESTADOS.map((item) => {
              const active = reporte?.estado === item.value;
              const loadingThis = actualizando && estadoGuardando === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.option,
                    active && {
                      backgroundColor: item.bg,
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => onChangeEstado(item.value)}
                  disabled={actualizando || active}
                  activeOpacity={0.85}
                >
                  <View style={[styles.optionIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>

                  <View style={styles.optionTextBox}>
                    <Text
                      style={[
                        styles.optionText,
                        active && { color: item.color },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {active && (
                      <Text style={styles.optionSub}>Estado actual</Text>
                    )}
                  </View>

                  {loadingThis ? (
                    <ActivityIndicator size="small" color={item.color} />
                  ) : active ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={item.color}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textMuted}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {actualizando && (
            <View style={styles.loadingBar}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Actualizando estado...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },

  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: spacing.md,
  },

  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
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

  list: {
    gap: spacing.sm,
  },

  option: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  optionTextBox: {
    flex: 1,
  },

  optionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  optionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  loadingBar: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  loadingText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
});