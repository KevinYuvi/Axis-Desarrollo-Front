import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Piso01 from '../../../src/components/Planos/Piso01';
import Piso02 from '../../../src/components/Planos/Piso02';

export default function EdificioDetalleScreen() {
  console.log("🟠 [DETALLE] 1. Renderizando cascarón de la pantalla...");
  
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [pisoActivo, setPisoActivo] = useState(1);
  const [mapaListo, setMapaListo] = useState(false);

  useEffect(() => {
    console.log(`🟢 [DETALLE] 2. Pantalla montada exitosamente. ID recibido: ${id}`);
    console.log("⏳ [DETALLE] 3. Iniciando temporizador para no congelar la transición...");
    
    // Le daremos 1 segundo completo (1000ms) para que la pantalla termine su animación
    // de entrada antes de tirarle el trabajo pesado del SVG.
    const timer = setTimeout(() => {
      console.log("✅ [DETALLE] 4. Temporizador terminado. ¡Iniciando dibujo del SVG!");
      setMapaListo(true);
    }, 1000);

    return () => {
      console.log("🔴 [DETALLE] Pantalla desmontada (Saliendo).");
      clearTimeout(timer);
    };
  }, [id]);

  useEffect(() => {
    if (mapaListo) {
      console.log(`🎨 [DETALLE] 5. El componente SVG (Piso ${pisoActivo}) se está inyectando en la vista.`);
    }
  }, [mapaListo, pisoActivo]);

  const manejarToqueAula = (nombreAula) => {
    Alert.alert("Interacción SVG", `Has seleccionado: ${nombreAula}`);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle: {id}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* SELECTOR DE PISOS */}
      <View style={styles.floorSelectorContainer}>
        <TouchableOpacity style={[styles.floorButton, pisoActivo === 1 && styles.floorButtonActive]} onPress={() => setPisoActivo(1)}>
          <Text style={[styles.floorButtonText, pisoActivo === 1 && styles.floorButtonTextActive]}>Planta Baja</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floorButton, pisoActivo === 2 && styles.floorButtonActive]} onPress={() => setPisoActivo(2)}>
          <Text style={[styles.floorButtonText, pisoActivo === 2 && styles.floorButtonTextActive]}>Primer Piso</Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DEL MAPA */}
      <View style={styles.svgContainer}>
        {!mapaListo ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 10, color: '#6B7280', fontWeight: 'bold' }}>Cargando motor vectorial...</Text>
            <Text style={{ marginTop: 5, color: '#9CA3AF', fontSize: 12 }}>Preparando aceleración de hardware</Text>
          </View>
        ) : (
          pisoActivo === 1 ? <Piso01 onAulaPress={manejarToqueAula} /> : <Piso02 onAulaPress={manejarToqueAula} />
        )}
      </View>

      {/* INFORMACIÓN DE AULAS */}
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

        <Text style={styles.sectionTitle}>Listado de Espacios</Text>

        <View style={styles.aulaCard}>
          <View style={styles.aulaInfo}>
            <Text style={styles.aulaTitle}>Aula 101</Text>
            <Text style={styles.aulaSubtitle}>Ingeniería de Software</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.badgeText, { color: '#065F46' }]}>Disponible</Text>
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
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  floorSelectorContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', justifyContent: 'center' },
  floorButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#F3F4F6', marginHorizontal: 5 },
  floorButtonActive: { backgroundColor: '#3B82F6' },
  floorButtonText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  floorButtonTextActive: { color: '#FFFFFF' },
  svgContainer: { height: '45%', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
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