import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export default function SearchInput({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.searchContainer}>
      <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
      <TextInput 
        style={styles.searchInput} 
        placeholder={placeholder || "Buscar..."}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  searchIcon: {
    marginRight: spacing.sm,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
});
