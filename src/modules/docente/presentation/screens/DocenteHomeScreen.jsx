import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import DetalleAulaScreen from './DetalleAulaScreen';
import ReportarIncidenciaScreen from './ReportarIncidenciaScreen';
import ReportesScreen from './ReportesScreen';
import ReservarAulaScreen from './ReservarAulaScreen';
import AsistenteIAScreen from './AsistenteIAScreen';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DocenteHomeScreen({ onNavigate, token }) {
  const [pantallaActual, setPantallaActual] = useState('home');

  const [clasesHoy, setClasesHoy] = useState([]);
  const [claseActual, setClaseActual] = useState(null);
  const [proximasClases, setProximasClases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCronograma();
  }, []);

  const cargarCronograma = async () => {
    try {
      setLoading(true);

      let claseActivaDesdeBackend = null;

      const responseClaseActual = await fetch(
        `${API_URL}/api/v1/reservas/mi-clase-actual`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (responseClaseActual.ok) {
        claseActivaDesdeBackend = await responseClaseActual.json();
        setClaseActual(claseActivaDesdeBackend);
      } else {
        setClaseActual(null);
      }

      const responseClasesHoy = await fetch(
        `${API_URL}/api/v1/reservas/mis-clases-hoy`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!responseClasesHoy.ok) {
        throw new Error('Error al obtener el cronograma de hoy.');
      }

      const data = await responseClasesHoy.json();

      setClasesHoy(data);

      if (claseActivaDesdeBackend?.reserva?.id) {
        const otras = data.filter(
          (item) => item.reserva?.id !== claseActivaDesdeBackend.reserva.id
        );

        setProximasClases(otras);
      } else {
        setProximasClases(data);
      }
    } catch (error) {
      console.error('Error cargando cronograma:', error);
      Alert.alert('Error', 'No se pudo sincronizar el itinerario de hoy.');
    } finally {
      setLoading(false);
    }
  };

  const formatHorario = (isoInicio, isoFin) => {
    if (!isoInicio || !isoFin) return 'N/A';

    const opciones = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    return `${new Date(isoInicio).toLocaleTimeString([], opciones)} – ${new Date(
      isoFin
    ).toLocaleTimeString([], opciones)}`;
  };

  if (pantallaActual === 'detalle') {
    return (
      <DetalleAulaScreen
        token={token}
        claseActual={claseActual}
        onBack={() => {
          setPantallaActual('home');
          cargarCronograma();
        }}
        onReportar={() => setPantallaActual('reporte')}
        onVerReportes={() => setPantallaActual('reportes')}
      />
    );
  }

  if (pantallaActual === 'reporte') {
    return (
      <ReportarIncidenciaScreen
        token={token}
        claseActual={claseActual}
        onBack={() => setPantallaActual('detalle')}
      />
    );
  }

  if (pantallaActual === 'reportes') {
    return (
      <ReportesScreen
        token={token}
        onBack={() => setPantallaActual('home')}
      />
    );
  }

  if (pantallaActual === 'reservar') {
    return (
      <ReservarAulaScreen
        token={token}
        onBack={() => {
          setPantallaActual('home');
          cargarCronograma();
        }}
      />
    );
  }

  if (pantallaActual === 'ia') {
    return (
      <AsistenteIAScreen
        token={token}
        onBack={() => setPantallaActual('home')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.appShell}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.navbar}>
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <Ionicons name="school" size={20} color="#FFFFFF" />
            </View>

            <Text style={styles.brandText}>Axis</Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Profesor</Text>
            </View>
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={cargarCronograma}>
              <Ionicons name="refresh-outline" size={22} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarBtn}>
              <Ionicons name="person-circle" size={30} color="#2F80ED" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Mi Aula Asignada Ahora</Text>

            <TouchableOpacity
              style={styles.smallReserveBtn}
              onPress={() => setPantallaActual('reservar')}
            >
              <Ionicons name="add" size={15} color="#FFFFFF" />
              <Text style={styles.smallReserveBtnText}>Reservar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#2F80ED"
              style={{ marginVertical: 20 }}
            />
          ) : claseActual ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.mainCard}
              onPress={() => setPantallaActual('detalle')}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.aulaTitle}>
                    {claseActual.espacio?.nombre || 'Aula asignada'}
                  </Text>

                  <Text style={styles.aulaSub}>
                    {claseActual.espacio?.ubicacion || 'Ubicación no registrada'}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>En curso</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Materia</Text>
                <Text style={styles.infoValue}>
                  {claseActual.reserva?.materia || 'Sin materia'}
                </Text>
              </View>

              <View style={styles.infoRowNoBorder}>
                <Text style={styles.infoLabel}>Horario</Text>
                <Text style={styles.infoValue}>
                  {formatHorario(
                    claseActual.reserva?.hora_inicio,
                    claseActual.reserva?.hora_fin
                  )}
                </Text>
              </View>

              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>Tocar para ver opciones</Text>
                <Ionicons name="chevron-forward" size={16} color="#2F80ED" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noClassCard}>
              <Ionicons name="calendar-outline" size={32} color="#BDBDBD" />
              <Text style={styles.noClassText}>
                No tienes un aula asignada para este horario exacto.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Otras clases de hoy</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#828282" />
          ) : proximasClases.length > 0 ? (
            proximasClases.map((item, index) => (
              <View key={item.reserva.id || index} style={styles.secondaryCard}>
                <View style={styles.secondaryCardHeader}>
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color="#828282"
                    style={{ marginRight: 8 }}
                  />

                  <Text style={styles.secondaryAulaTitle}>
                    {item.espacio?.nombre || 'Aula'}
                  </Text>

                  <Text style={styles.secondaryTime}>
                    {formatHorario(item.reserva.hora_inicio, item.reserva.hora_fin)}
                  </Text>
                </View>

                <Text style={styles.secondaryMateria}>
                  {item.reserva.materia || 'Sin materia'}
                </Text>

                <Text style={styles.secondaryUbicacion}>
                  📍 {item.espacio?.ubicacion || 'Ubicación no registrada'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptySecondaryText}>
              No tienes más clases programadas para hoy.
            </Text>
          )}
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="business" size={22} color="#2F80ED" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Mi Aula</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setPantallaActual('reportes')}
          >
            <Ionicons name="document-text-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Reportes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setPantallaActual('ia')}
          >
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Asistente IA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
  },

  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#F9FAFC',
  },

  navbar: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoContainer: {
    backgroundColor: '#2F80ED',
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginRight: 8,
  },

  roleBadge: {
    backgroundColor: '#EAF2FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },

  roleText: {
    fontSize: 11,
    color: '#2F80ED',
    fontWeight: '700',
  },

  iconBtn: {
    padding: 6,
    marginRight: 8,
  },

  avatarBtn: {
    padding: 4,
  },

  scrollContent: {
    flex: 1,
  },

  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    paddingRight: 10,
  },

  smallReserveBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallReserveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F4F4F',
    marginTop: 24,
    marginBottom: 12,
  },

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2F80ED',
    padding: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    paddingBottom: 12,
    marginBottom: 12,
  },

  cardHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  aulaTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },

  aulaSub: {
    fontSize: 13,
    color: '#828282',
    marginTop: 2,
  },

  statusBadge: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusText: {
    color: '#27AE60',
    fontSize: 13,
    fontWeight: '700',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },

  infoRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  infoLabel: {
    fontSize: 14,
    color: '#828282',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    maxWidth: '58%',
    textAlign: 'right',
  },

  tapHint: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },

  tapHintText: {
    fontSize: 12,
    color: '#2F80ED',
    fontWeight: '700',
    marginRight: 4,
  },

  noClassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noClassText: {
    color: '#828282',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

  secondaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    marginBottom: 10,
  },

  secondaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  secondaryAulaTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333333',
    flex: 1,
  },

  secondaryTime: {
    fontSize: 13,
    color: '#2F80ED',
    fontWeight: '700',
  },

  secondaryMateria: {
    fontSize: 14,
    color: '#4F4F4F',
    fontWeight: '600',
    marginLeft: 26,
  },

  secondaryUbicacion: {
    fontSize: 12,
    color: '#828282',
    marginTop: 4,
    marginLeft: 26,
  },

  emptySecondaryText: {
    color: '#828282',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },

  bottomTab: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  tabLabel: {
    fontSize: 11,
    color: '#828282',
    marginTop: 4,
  },

  tabLabelActive: {
    color: '#2F80ED',
    fontWeight: '700',
  },
});