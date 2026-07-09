import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AsistenteScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="hardware-chip-outline" size={80} color="#3B82F6" />
      <Text style={styles.title}>Asistente Inteligente</Text>
      <Text style={styles.subtitle}>
        Aquí integraremos el motor de IA para procesar consultas de los estudiantes en lenguaje natural.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 20 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 10, lineHeight: 22 }
});