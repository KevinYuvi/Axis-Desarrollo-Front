import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const VARIANTS = {
  success: { background: colors.available, text: colors.white },
  warning: { background: colors.warning, text: colors.white },
  critical: { background: colors.critical, text: colors.white },
  neutral: { background: colors.border, text: colors.textPrimary },
};

export default function Badge({ label, variant = 'neutral' }) {
  const { background, text } = VARIANTS[variant] ?? VARIANTS.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
});
