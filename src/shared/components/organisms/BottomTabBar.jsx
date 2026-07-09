import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export default function BottomTabBar({ activeTab, onTabPress }) {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity style={styles.tabItem} onPress={() => onTabPress('home')}>
        <Feather name="home" size={24} color={activeTab === 'home' ? colors.primary : colors.textSecondary} />
        <Text style={activeTab === 'home' ? styles.tabLabelActive : styles.tabLabel}>Inicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => onTabPress('libraries')}>
        <Feather name="book" size={24} color={activeTab === 'libraries' ? colors.primary : colors.textSecondary} />
        <Text style={activeTab === 'libraries' ? styles.tabLabelActive : styles.tabLabel}>Bibliotecas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => onTabPress('assistant')}>
        <MaterialCommunityIcons name="robot-outline" size={24} color={activeTab === 'assistant' ? colors.primary : colors.textSecondary} />
        <Text style={activeTab === 'assistant' ? styles.tabLabelActive : styles.tabLabel}>Asistente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingBottom: 24,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabelActive: {
    fontSize: typography.size.xs,
    color: colors.primary,
    marginTop: 4,
    fontWeight: typography.weight.medium,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
