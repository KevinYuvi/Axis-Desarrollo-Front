import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Piso01 from '../../../src/components/Planos/Piso01';
import Piso02 from '../../../src/components/Planos/Piso02';
import { useApi } from '../../../src/hooks/useApi'; // 🔴 Inyectamos nuestra conexión segura

export default function EdificioDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const api = useApi();
  
  const [pisoActivo, setPisoActivo] = useState(1);
  const [mapaListo, setMapaListo] = useState(false);
  
  // 🔴 Estados para la Base de Datos
  const [aulas, setAulas] = useState([]);
  const [cargandoAulas, setCargandoAulas] = useState(true);

  // 1. Efecto para la transición del mapa SVG
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapaListo(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [id]);

  // 2. Efecto para descargar datos de MongoDB
  useEffect(() => {
    const fetchAulas = async () => {
      try {
        const response = await api.get('/espacios/');
        // Filtramos solo las aulas que pertenecen a este edificio en específico
        const aulasFiltradas = response.data.filter(espacio => espacio.bloque === id);
        setAulas(aulasFiltradas);
      } catch (error) {
        console.log("Error al obtener aulas:", error);
        Alert.alert("Error de conexión", "No se pudieron cargar las aulas de este edificio.");
      } finally {
        setCargandoAulas(false);
      }
    };

    fetchAulas();
  }, [id]);

  // 3. Función que recibe el toque desde el archivo SVG
  const manejarToqueAula = (aulaSeleccionada) => {
    if (!aulaSeleccionada) {
      Alert.alert("Espacio no registrado", "Esta área no está mapeada en el sistema todavía.");
      return;
    }
    
    // Aquí, en la Fase 8, abriremos el panel para Reservar/Liberar el aula
    Alert.alert(
      `Has tocado: ${aulaSeleccionada.nombre}`, 
      `Capacidad: ${aulaSeleccionada.capacidad} personas\nEstado: ${aulaSeleccionada.estado_actual.toUpperCase()}`
    );
  };

  // 4. Calculamos estadísticas matemáticas reales
  const libres = aulas.filter(a => a.estado_actual === 'disponible').length;
  const ocupadas = aulas.filter(a => a.estado_actual === 'ocupado').length;
  const mantenimiento = aulas.filter(a => a.estado_actual === 'mantenimiento').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Espacios</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.floorSelectorContainer}>
        <TouchableOpacity style={[styles.floorButton, pisoActivo === 1 && styles.floorButtonActive]} onPress={() => setPisoActivo(1)}>
          <Text style={[styles.floorButtonText, pisoActivo === 1 && styles.floorButtonTextActive]}>Planta Baja</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floorButton, pisoActivo === 2 && styles.floorButtonActive]} onPress={() => setPisoActivo(2)}>
          <Text style={[styles.floorButtonText, pisoActivo === 2 && styles.floorButtonTextActive]}>Primer Piso</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.svgContainer}>
        {!mapaListo || cargandoAulas ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 10, color: '#6B7280', fontWeight: 'bold' }}>Sincronizando campus...</Text>
          </View>
        ) : (
          // 🔴 Le pasamos la data real al plano SVG
          pisoActivo === 1 ? <Piso01 aulasData={aulas} onAulaPress={manejarToqueAula} /> : <Piso02 aulasData={aulas} onAulaPress={manejarToqueAula} />
        )}
      </View>

      <ScrollView style={styles.infoContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{libres}</Text>
            <Text style={styles.statLabel}>Libres</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{ocupadas}</Text>
            <Text style={styles.statLabel}>Ocupadas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{mantenimiento}</Text>
            <Text style={styles.statLabel}>Mantenimiento</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Listado de Espacios</Text>

        {aulas.map((aula) => (
          <View key={aula.id} style={styles.aulaCard}>
            <View style={styles.aulaInfo}>
              <Text style={styles.aulaTitle}>{aula.nombre}</Text>
              <Text style={styles.aulaSubtitle}>{aula.tipo.toUpperCase()} • Capacidad: {aula.capacidad}</Text>
            </View>
            <View style={[
              styles.badge, 
              aula.estado_actual === 'disponible' ? { backgroundColor: '#D1FAE5' } :
              aula.estado_actual === 'ocupado' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#FEF3C7' }
            ]}>
              <Text style={[
                styles.badgeText, 
                aula.estado_actual === 'disponible' ? { color: '#065F46' } :
                aula.estado_actual === 'ocupado' ? { color: '#991B1B' } : { color: '#92400E' }
              ]}>{aula.estado_actual.toUpperCase()}</Text>
            </View>
          </View>
        ))}
        {aulas.length === 0 && !cargandoAulas && (
          <Text style={{textAlign: 'center', color: '#9CA3AF', marginTop: 20}}>No hay espacios registrados en este bloque.</Text>
        )}
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