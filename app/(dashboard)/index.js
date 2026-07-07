import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CampusMapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa del Campus</Text>
      <Text style={styles.subtitle}>Aquí integraremos Google Maps y los polígonos SVG.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 10 },
});