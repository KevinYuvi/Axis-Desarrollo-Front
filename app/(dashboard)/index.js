import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function DashboardScreen() {
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 10 }}>¡Bienvenido a CampusFlow!</Text>
      <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 30 }}>Sesión iniciada correctamente.</Text>

      <TouchableOpacity onPress={() => signOut()} style={{ backgroundColor: '#EF4444', padding: 12, borderRadius: 8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}