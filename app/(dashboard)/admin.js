import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function AdminScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administración</Text>
      <Text style={styles.subtitle}>Control total de aulas, bloqueos e incidencias.</Text>

      <TouchableOpacity onPress={() => signOut()} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 40 },
  logoutButton: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});