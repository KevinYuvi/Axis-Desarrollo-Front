import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { spacing, radius } from '../../../../../shared/theme/spacing';

export default function AdminToast({ visible, tipo = 'success', mensaje, onHide }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const config = {
    success: {
      icon: 'checkmark-circle-outline',
      bg: '#DCFCE7',
      border: '#86EFAC',
      color: '#16A34A',
    },
    error: {
      icon: 'alert-circle-outline',
      bg: '#FEF2F2',
      border: '#FCA5A5',
      color: '#DC2626',
    },
    warning: {
      icon: 'warning-outline',
      bg: '#FEF3C7',
      border: '#FCD34D',
      color: '#D97706',
    },
    info: {
      icon: 'information-circle-outline',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      color: colors.primary,
    },
  };

  const item = config[tipo] || config.info;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: item.bg,
          borderColor: item.border,
        },
      ]}
    >
      <Ionicons name={item.icon} size={20} color={item.color} />

      <Text style={[styles.toastText, { color: item.color }]} numberOfLines={2}>
        {mensaje}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 12,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },

  toastText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    lineHeight: 19,
  },
});