import React, { useEffect, useState } from 'react';
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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ReportesScreen({ token, onBack }) {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/v1/reportes/mis-reportes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudieron cargar los reportes.');
      }

      setReportes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    return new Date(fecha).toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.appShell}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.navbar}>
          <View style={styles.brandRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={22} color="#2F80ED" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            </View>

            <Text style={styles.brandText}>Reportes</Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={cargarReportes}>
            <Ionicons name="refresh-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainTitle}>Reportes realizados</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#2F80ED" style={{ marginTop: 30 }} />
          ) : reportes.length > 0 ? (
            reportes.map((item, index) => (
              <View key={item.id || index} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportTitle}>Incidencia reportada</Text>

                    <Text style={styles.reportDate}>
                      {formatearFecha(item.fecha_reporte)}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {item.estado || 'abierto'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reportDescription}>
                  {item.descripcion || 'Sin descripción registrada.'}
                </Text>

                <View style={styles.reportFooter}>
                  <Text style={styles.priorityText}>
                    Gravedad: {item.gravedad || 'No definida'}
                  </Text>

                  <Text style={styles.priorityText}>
                    Espacio ID: {item.espacio_id || 'No registrado'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="document-outline" size={36} color="#BDBDBD" />
              <Text style={styles.emptyText}>
                Todavía no hay reportes registrados.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={onBack}>
            <Ionicons name="business-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Mi Aula</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="document-text" size={22} color="#2F80ED" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Reportes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
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
  },

  backBtn: {
    marginRight: 10,
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
  },

  iconBtn: {
    padding: 6,
  },

  scrollContent: {
    flex: 1,
  },

  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
  },

  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  reportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  reportDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'capitalize',
  },

  reportDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 10,
  },

  reportFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },

  priorityText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 13,
    color: '#828282',
    textAlign: 'center',
    marginTop: 10,
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