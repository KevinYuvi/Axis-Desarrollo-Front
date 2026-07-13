import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import { colors } from '../../../../../shared/theme/colors';
import { spacing, radius } from '../../../../../shared/theme/spacing';

export default function SkeletonAulas() {
  return (
    <View>
      <View style={styles.summaryCompact} />

      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.card}>
          <View style={styles.top}>
            <View style={styles.circle} />
            <View style={styles.textBlock}>
              <View style={styles.lineTitle} />
              <View style={styles.lineSub} />
            </View>
            <View style={styles.badge} />
          </View>

          <View style={styles.row}>
            <View style={styles.pill} />
            <View style={styles.pill} />
            <View style={styles.pill} />
          </View>

          <View style={styles.footer} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCompact: {
    height: 62,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: spacing.sm,
  },

  textBlock: {
    flex: 1,
  },

  lineTitle: {
    width: '70%',
    height: 16,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  lineSub: {
    width: '45%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  badge: {
    width: 78,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  pill: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },

  footer: {
    height: 38,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },
});