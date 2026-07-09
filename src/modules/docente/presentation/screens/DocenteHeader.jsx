import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DocenteHeader({
  title = 'Axis',
  showBack = false,
  onBack,
  showRefresh = false,
  onRefresh,
}) {
  return (
    <View style={styles.navbar}>
      <View style={styles.leftArea}>
        {showBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="#2F80ED" />
          </TouchableOpacity>
        )}

        <View style={styles.logoContainer}>
          <Ionicons name="school" size={18} color="#FFF" />
        </View>

        <Text style={styles.brandText}>{title}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Profesor</Text>
        </View>
      </View>

      <View style={styles.rightArea}>
        {showRefresh && (
          <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={22} color="#111827" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.avatarBtn}>
          <Ionicons name="person-circle" size={30} color="#2F80ED" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    marginRight: 10,
  },

  logoContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginRight: 8,
  },

  roleBadge: {
    backgroundColor: '#EAF2FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },

  roleText: {
    fontSize: 11,
    color: '#2F80ED',
    fontWeight: '700',
  },

  iconBtn: {
    padding: 6,
    marginRight: 8,
  },

  avatarBtn: {
    padding: 4,
  },
});