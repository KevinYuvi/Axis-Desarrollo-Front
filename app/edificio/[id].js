import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EdificioDetalleScreen() {
  const { id } = useLocalSearchParams(); // Captura si es "fac_ingenieria", "bib_central", etc.
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER DE NAVEGACIÓN */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Edificio</Text>
        <View style={{ width: 24 }} /> {/* Espaciador invisible para centrar el texto */}
      </View>

      {/* ÁREA DEL MAPA SVG (Mitad superior) */}
      <View style={styles.svgContainer}>
        <Ionicons name="map" size={60} color="#D1D5DB" />
        <Text style={styles.svgPlaceholderText}>
          Aquí inyectaremos el componente PlanoSVG{'\n'}
          correspondiente a: {id}
        </Text>
      </View>

      {/* ÁREA DE INFORMACIÓN DE AULAS (Mitad inferior) */}
      <ScrollView style={styles.infoContainer}>
        {/* Tarjetas de estadísticas estilo maqueta */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>8</Text>
            <Text style={styles.statLabel}>Libres</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>5</Text>
            <Text style={styles.statLabel}>Ocupadas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>3</Text>
            <Text style={styles.statLabel}>Próximas</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aulas - Planta Baja</Text>

        {/* Lista simulada de aulas */}
        <View style={styles.aulaCard}>
          <View style={styles.aulaInfo}>
            <Text style={styles.aulaTitle}>Aula 101</Text>
            <Text style={styles.aulaSubtitle}>Edificio A - PB • Bases de Datos</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.badgeText, { color: '#065F46' }]}>Disponible</Text>
          </View>
        </View>

        <View style={styles.aulaCard}>
          <View style={styles.aulaInfo}>
            <Text style={styles.aulaTitle}>Lab 1</Text>
            <Text style={styles.aulaSubtitle}>Edificio B - P2 • Redes</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.badgeText, { color: '#991B1B' }]}>Ocupado</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  /* CONTENEDOR DEL SVG */
  svgContainer: { 
    height: '45%', backgroundColor: '#F3F4F6', 
    justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  svgPlaceholderText: { textAlign: 'center', color: '#9CA3AF', marginTop: 12, fontSize: 14, lineHeight: 20 },

  /* CONTENEDOR DE INFO (Blanco) */
  infoContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statBox: { 
    flex: 1, backgroundColor: '#FFFFFF', marginHorizontal: 4, paddingVertical: 16, 
    borderRadius: 12, alignItems: 'center', 
    borderWidth: 1, borderColor: '#F3F4F6', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05
  },
  statNumber: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  aulaCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05
  },
  aulaInfo: { flex: 1 },
  aulaTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  aulaSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' }
});