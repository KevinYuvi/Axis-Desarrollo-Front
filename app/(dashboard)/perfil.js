import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';

export default function PerfilScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const rol = user?.publicMetadata?.rol || 'Estudiante';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      <Text style={styles.subtitle}>{user?.primaryEmailAddress?.emailAddress}</Text>
      
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Rol activo: {rol.toUpperCase()}</Text>
      </View>

      <TouchableOpacity onPress={() => signOut()} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 5, marginBottom: 20 },
  badge: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 40 },
  badgeText: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 12 },
  logoutButton: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});