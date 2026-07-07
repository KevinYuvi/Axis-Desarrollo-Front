import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Importamos los dos planos que acabas de crear
import Piso01 from '../../src/components/Planos/Piso01';
import Piso02 from '../../src/components/Planos/Piso02';

export default function EdificioDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // Estado para controlar qué piso estamos viendo
  const [pisoActivo, setPisoActivo] = useState(1);

  // Función que se dispara cuando tocas un aula en el SVG
  const manejarToqueAula = (nombreAula) => {
    Alert.alert("Interacción SVG", `Has seleccionado: ${nombreAula}`);
  };

  return (
    <View style={styles.container}>
      {/* HEADER DE NAVEGACIÓN */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edificio de Ingeniería</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* SELECTOR DE PISOS */}
      <View style={styles.floorSelectorContainer}>
        <TouchableOpacity 
          style={[styles.floorButton, pisoActivo === 1 && styles.floorButtonActive]}
          onPress={() => setPisoActivo(1)}
        >
          <Text style={[styles.floorButtonText, pisoActivo === 1 && styles.floorButtonTextActive]}>Planta Baja</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.floorButton, pisoActivo === 2 && styles.floorButtonActive]}
          onPress={() => setPisoActivo(2)}
        >
          <Text style={[styles.floorButtonText, pisoActivo === 2 && styles.floorButtonTextActive]}>Primer Piso</Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DEL MAPA SVG DINÁMICO */}
      <View style={styles.svgContainer}>
        {pisoActivo === 1 ? (
          <Piso01 onAulaPress={manejarToqueAula} />
        ) : (
          <Piso02 onAulaPress={manejarToqueAula} />
        )}
      </View>

      {/* ÁREA DE INFORMACIÓN DE AULAS */}
      <ScrollView style={styles.infoContainer}>
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

        <Text style={styles.sectionTitle}>
          Listado - {pisoActivo === 1 ? 'Planta Baja' : 'Primer Piso'}
        </Text>

        <View style={styles.aulaCard}>
          <View style={styles.aulaInfo}>
            <Text style={styles.aulaTitle}>{pisoActivo === 1 ? 'Aula 101' : 'Aula 201'}</Text>
            <Text style={styles.aulaSubtitle}>Ingeniería de Software</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.badgeText, { color: '#065F46' }]}>Disponible</Text>
          </View>
        </View>

        <View style={styles.aulaCard}>
          <View style={styles.aulaInfo}>
            <Text style={styles.aulaTitle}>{pisoActivo === 1 ? 'Lab de Redes' : 'Auditorio Principal'}</Text>
            <Text style={styles.aulaSubtitle}>Mantenimiento programado</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  /* SELECTOR DE PISOS */
  floorSelectorContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', justifyContent: 'center' },
  floorButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#F3F4F6', marginHorizontal: 5 },
  floorButtonActive: { backgroundColor: '#3B82F6' },
  floorButtonText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  floorButtonTextActive: { color: '#FFFFFF' },

  svgContainer: { height: '40%', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  infoContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', marginHorizontal: 4, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  aulaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
  aulaInfo: { flex: 1 },
  aulaTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  aulaSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' }
});