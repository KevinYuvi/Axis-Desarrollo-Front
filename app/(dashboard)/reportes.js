import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReportesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Incidencias</Text>
      <Text style={styles.subtitle}>Reporta daños en proyectores, red o infraestructura del campus.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 10, textAlign: 'center' },
});