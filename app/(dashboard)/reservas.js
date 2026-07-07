import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReservasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Reservas</Text>
      <Text style={styles.subtitle}>Historial de espacios académicos reservados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 10 },
});