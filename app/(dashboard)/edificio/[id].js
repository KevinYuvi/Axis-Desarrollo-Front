import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';

// 🔴 IMPORTA TUS 4 SVGs AQUÍ (Ajusta las rutas según tus nombres de archivo)
import EdificioAPiso1 from '../../../src/components/Planos/EdificioAPiso1';
import EdificioAPiso2 from '../../../src/components/Planos/EdificioAPiso2';
import LabsPiso1 from '../../../src/components/Planos/LabsPiso1';
import LabsPiso3 from '../../../src/components/Planos/LabsPiso3';
// Componente vacío de respaldo por si entran a un edificio sin SVG aún
const PlanoVacio = () => <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text style={{color:'#9CA3AF'}}>Plano no disponible</Text></View>;

import { useApi } from '../../../src/hooks/useApi';

// 🔴 DICCIONARIO INTELIGENTE DE EDIFICIOS
const CONFIG_EDIFICIOS = {
  'edificio_a': {
    titulo: 'Edificio de las A',
    pisos: [{ nivel: 1, label: 'Piso 1' }, { nivel: 2, label: 'Piso 2' }],
    planos: { 1: EdificioAPiso1, 2: EdificioAPiso2 }
  },
  'edificio_labs': {
    titulo: 'Edificio de Laboratorios',
    pisos: [{ nivel: 1, label: 'Piso 1' }, { nivel: 3, label: 'Piso 3' }],
    planos: { 1: LabsPiso1, 3: LabsPiso3 }
  }
};

export default function EdificioDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const api = useApi();
  const { user } = useUser();
  const rolUsuario = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';
  
  // Extraemos la configuración del edificio actual (o un fallback)
  const configActual = CONFIG_EDIFICIOS[id] || { titulo: id, pisos: [{ nivel: 1, label: 'Piso 1' }], planos: { 1: PlanoVacio } };
  
  const [pisoActivo, setPisoActivo] = useState(configActual.pisos[0].nivel);
  const [mapaListo, setMapaListo] = useState(false);
  const [aulas, setAulas] = useState([]);
  const [cargandoAulas, setCargandoAulas] = useState(true);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setMapaListo(true), 1000);
    return () => clearTimeout(timer);
  }, [id]);

  const fetchAulas = async () => {
    try {
      const response = await api.get('/espacios/');
      const aulasFiltradas = response.data.filter(espacio => espacio.bloque === id);
      setAulas(aulasFiltradas);
      
      // Si hay un aula seleccionada, actualizamos sus datos en vivo
      if (aulaSeleccionada) {
        const aulaActualizada = aulasFiltradas.find(a => a.id === aulaSeleccionada.id);
        setAulaSeleccionada(aulaActualizada || null);
      }
    } catch (error) {
      console.log("Error al obtener aulas:", error);
    } finally {
      setCargandoAulas(false);
    }
  };

  useEffect(() => {
    fetchAulas();
  }, [id]);

  // =====================================================================
  // 🔴 CONEXIÓN A FASTAPI: ACCIONES CRUD
  // =====================================================================
  const actualizarEstadoAula = async (nuevoEstado) => {
    try {
      // Ajusta esta ruta según cómo tengas configurado el PATCH en FastAPI
      await api.patch(`/espacios/${aulaSeleccionada.id}`, { estado_actual: nuevoEstado });
      Alert.alert("Éxito", `El espacio ha cambiado a: ${nuevoEstado}`);
      fetchAulas(); // Refresca los datos para que el SVG cambie de color automáticamente
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado del espacio.");
      console.log(error);
    }
  };

  const solicitarReserva = async () => {
    try {
      // Ajusta los campos según el esquema de reservas de tu backend
      const payload = {
        espacio_id: aulaSeleccionada.id,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: "10:00",
        hora_fin: "12:00",
        motivo: "Clase asignada"
      };
      await api.post('/reservas/', payload);
      // Tras reservar, pasamos el aula a ocupada
      await actualizarEstadoAula('ocupado'); 
    } catch (error) {
      Alert.alert("Error", "No se pudo completar la reserva.");
      console.log(error);
    }
  };

  // Renderizado dinámico del componente SVG correcto
  const ComponentePlano = configActual.planos[pisoActivo] || PlanoVacio;
  const libres = aulas.filter(a => a.estado_actual === 'disponible').length;
  const ocupadas = aulas.filter(a => a.estado_actual === 'ocupado').length;
  const mantenimiento = aulas.filter(a => a.estado_actual === 'mantenimiento').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{configActual.titulo}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* BOTONES DE PISO DINÁMICOS */}
      <View style={styles.floorSelectorContainer}>
        {configActual.pisos.map((piso) => (
          <TouchableOpacity 
            key={piso.nivel}
            style={[styles.floorButton, pisoActivo === piso.nivel && styles.floorButtonActive]} 
            onPress={() => { setPisoActivo(piso.nivel); setAulaSeleccionada(null); }}
          >
            <Text style={[styles.floorButtonText, pisoActivo === piso.nivel && styles.floorButtonTextActive]}>
              {piso.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.svgContainer}>
        {!mapaListo || cargandoAulas ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 10, color: '#6B7280', fontWeight: 'bold' }}>Sincronizando campus...</Text>
          </View>
        ) : (
          <TouchableOpacity activeOpacity={1} style={{flex:1, width:'100%'}} onPress={() => setAulaSeleccionada(null)}>
            {/* Se inyecta el plano correspondiente al edificio y piso seleccionados */}
            <ComponentePlano aulasData={aulas} onAulaPress={(aula) => setAulaSeleccionada(aula || null)} />
          </TouchableOpacity>
        )}
      </View>

      {!aulaSeleccionada ? (
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
              <Text style={styles.statLabel}>Averías</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Listado de Espacios</Text>
          {aulas.map((aula) => (
            <TouchableOpacity key={aula.id} style={styles.aulaCard} onPress={() => setAulaSeleccionada(aula)}>
              <View style={styles.aulaInfo}>
                <Text style={styles.aulaTitle}>{aula.nombre}</Text>
                <Text style={styles.aulaSubtitle}>{aula.tipo.toUpperCase()} • Capacidad: {aula.capacidad}</Text>
              </View>
              <View style={[ styles.badge, aula.estado_actual === 'disponible' ? { backgroundColor: '#D1FAE5' } : aula.estado_actual === 'ocupado' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#FEF3C7' } ]}>
                <Text style={[ styles.badgeText, aula.estado_actual === 'disponible' ? { color: '#065F46' } : aula.estado_actual === 'ocupado' ? { color: '#991B1B' } : { color: '#92400E' } ]}>{aula.estado_actual.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>{aulaSeleccionada.nombre}</Text>
              <Text style={styles.sheetSubtitle}>{aulaSeleccionada.tipo.toUpperCase()} • Capacidad: {aulaSeleccionada.capacidad}</Text>
            </View>
            <View style={[ styles.badge, aulaSeleccionada.estado_actual === 'disponible' ? { backgroundColor: '#D1FAE5' } : aulaSeleccionada.estado_actual === 'ocupado' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#FEF3C7' } ]}>
              <Text style={[ styles.badgeText, aulaSeleccionada.estado_actual === 'disponible' ? { color: '#065F46' } : aulaSeleccionada.estado_actual === 'ocupado' ? { color: '#991B1B' } : { color: '#92400E' } ]}>
                {aulaSeleccionada.estado_actual.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionSubtitle}>Recursos disponibles:</Text>
          <View style={styles.equipamientoContainer}>
            {aulaSeleccionada.equipamiento?.map((item, index) => (
              <View key={index} style={styles.chipRecurso}>
                <Ionicons name="hardware-chip-outline" size={14} color="#4B5563" />
                <Text style={styles.chipRecursoText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionButtonsContainer}>
            {rolUsuario === 'admin' && (
              <>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F59E0B' }]} onPress={() => actualizarEstadoAula('mantenimiento')}>
                  <Ionicons name="construct-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Mantenimiento</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981', marginLeft: 10 }]} onPress={() => actualizarEstadoAula('disponible')}>
                  <Ionicons name="lock-open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Liberar</Text>
                </TouchableOpacity>
              </>
            )}

            {rolUsuario === 'docente' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#3B82F6', width: '100%' }, aulaSeleccionada.estado_actual !== 'disponible' && { backgroundColor: '#9CA3AF' }]} 
                disabled={aulaSeleccionada.estado_actual !== 'disponible'}
                onPress={solicitarReserva}
              >
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {aulaSeleccionada.estado_actual === 'disponible' ? 'Solicitar Reserva' : 'Aula no disponible'}
                </Text>
              </TouchableOpacity>
            )}

            {rolUsuario === 'estudiante' && (
              <View style={styles.estudianteNote}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.estudianteNoteText}>Los estudiantes solo tienen permisos de consulta.</Text>
              </View>
            )}
          </View>
        </View>
      )}
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
  floorButtonActive: { backgroundColor: '#1E3A8A' },
  floorButtonText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  floorButtonTextActive: { color: '#FFFFFF' },
  svgContainer: { height: '50%', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  infoContainer: { flex: 1, backgroundColor: '#FAFAFA', padding: 20 },
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
  badgeText: { fontSize: 12, fontWeight: '700' },
  bottomSheetContainer: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sheetSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  sectionSubtitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  equipamientoContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  chipRecurso: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  chipRecursoText: { fontSize: 13, color: '#4B5563', marginLeft: 6, fontWeight: '500' },
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' },
  actionButton: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  actionButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  estudianteNote: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, alignItems: 'center', width: '100%' },
  estudianteNoteText: { color: '#6B7280', fontSize: 13, marginLeft: 8, flex: 1 }
});