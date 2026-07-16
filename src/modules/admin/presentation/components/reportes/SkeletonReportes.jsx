import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../../../../shared/theme/colors';
import { spacing, radius } from '../../../../../shared/theme/spacing';

export default function SkeletonReportes() {
  return (
    <View>
      <View style={styles.summaryCompact} />

      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.card}>
          <View style={styles.line} />

          <View style={styles.inner}>
            <View style={styles.top}>
              <View style={styles.circle} />

              <View style={styles.textBlock}>
                <View style={styles.lineTitle} />
                <View style={styles.lineSub} />
              </View>

              <View style={styles.badge} />
            </View>

            <View style={styles.description} />
            <View style={styles.descriptionShort} />

            <View style={styles.row}>
              <View style={styles.pill} />
              <View style={styles.pill} />
            </View>

            <View style={styles.footer} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCompact: {
    height: 72,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },

  line: {
    height: 3,
    backgroundColor: '#E5E7EB',
  },

  inner: {
    padding: spacing.md,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    width: 82,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  description: {
    width: '92%',
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  descriptionShort: {
    width: '65%',
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: spacing.md,
  },

  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  pill: {
    flex: 1,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
    marginRight: spacing.sm,
  },

  footer: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },
});