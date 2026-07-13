import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CampusMap() {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={80} color="#9CA3AF" />
      <Text style={styles.title}>Mapa Interactivo</Text>
      <Text style={styles.subtitle}>
        El renderizado 3D del campus con Google Maps está optimizado para dispositivos móviles. 
        Por favor, abre la aplicación en tu celular para interactuar con las rutas y edificios.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA', padding: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 12, textAlign: 'center', lineHeight: 22 },
});