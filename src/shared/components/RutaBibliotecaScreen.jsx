import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import AppHeader from './organisms/AppHeader';
import { useOccupancy } from '../hooks/useOccupancy';
// Misma librería/lógica de mapa que la ruta al aula (sección de aulas):
// Leaflet renderizado en un WebView, extraído a shared/utils para reutilizarlo.
import { construirMapaHtml } from '../utils/mapaLeaflet';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

/**
 * Pantalla de ubicación de una biblioteca (p. ej. la Biblioteca Cisco de la
 * Universidad Central). Replica el funcionamiento de la ruta al aula:
 * - Pide la ubicación actual con expo-location (misma librería que aulas).
 * - Dibuja un mapa Leaflet con el destino y, si existe, el origen del usuario.
 * - Ofrece un botón para abrir la ruta exacta en Google Maps.
 * Las coordenadas del destino vienen del backend de ocupación (lat/lng del
 * espacio), por lo que la pantalla debe montarse dentro de un OccupancyProvider.
 *
 * @param {Object} props
 * @param {string} props.spaceId - Id del espacio de biblioteca a ubicar
 * @param {string} props.rol - Rol activo, usado para el chip del AppHeader
 */
export default function RutaBibliotecaScreen({ spaceId, rol = 'estudiante' }) {
  const router = useRouter();
  const { loading, spaces } = useOccupancy();

  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(true);

  const espacio = spaces.find((item) => item.id === spaceId);

  // Al montar la pantalla se solicita la ubicación actual del usuario, igual
  // que hace la sección de aulas. Si el permiso se niega o falla, se muestra
  // solo la biblioteca en el mapa.
  useEffect(() => {
    let activo = true;

    const cargarUbicacion = async () => {
      const resultado = await obtenerUbicacionActual();

      if (activo) {
        setUbicacionActual(resultado);
        setBuscandoUbicacion(false);
      }
    };

    cargarUbicacion();

    return () => {
      activo = false;
    };
  }, []);

  const obtenerUbicacionActual = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      return null;
    }
  };

  // Abre Google Maps con la ruta caminando hacia la biblioteca — la misma
  // construcción de URL que usa la ruta al aula.
  const abrirGoogleMaps = async () => {
    if (!espacio?.lat || !espacio?.lng) return;

    const destino = `${espacio.lat},${espacio.lng}`;

    const url = ubicacionActual
      ? `https://www.google.com/maps/dir/?api=1&origin=${ubicacionActual.latitude},${ubicacionActual.longitude}&destination=${destino}&travelmode=walking`
      : `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=walking`;

    await Linking.openURL(url);
  };

  // Estado de carga: espera tanto los espacios de ocupación como el intento
  // de obtener la ubicación del usuario.
  if (loading || buscandoUbicacion) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        <AppHeader rol={rol} />

        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Cargando ubicación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Estado de error: el espacio no existe o el backend no reporta coordenadas.
  if (!espacio || !espacio.lat || !espacio.lng) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        <AppHeader rol={rol} />

        <View style={styles.centerBox}>
          <Ionicons name="map-outline" size={42} color={colors.textMuted} />

          <Text style={styles.emptyTitle}>Ubicación no disponible</Text>

          <Text style={styles.centerText}>
            No se encontraron coordenadas para esta biblioteca.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const destino = {
    latitude: Number(espacio.lat),
    longitude: Number(espacio.lng),
  };

  const origen = ubicacionActual || null;

  // El HTML del mapa se genera con el util compartido de Leaflet (el mismo
  // que usa la ruta al aula), marcando la biblioteca como destino.
  const mapaHtml = construirMapaHtml({
    origen,
    destino,
    nombreDestino: espacio.name,
    descripcionDestino: espacio.raw?.building || 'Biblioteca',
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader rol={rol} />

      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.pageTextBox}>
          <Text style={styles.pageTitle}>Ubicación de la biblioteca</Text>
          <Text style={styles.pageSubtitle}>{espacio.name}</Text>
        </View>
      </View>

      {/* Mapa Leaflet con la biblioteca (y la posición del usuario si se pudo obtener). */}
      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapaHtml }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          geolocationEnabled
          setSupportMultipleWindows={false}
          scrollEnabled={false}
        />
      </View>

      {/* Tarjeta inferior con los datos del destino y el acceso a Google Maps. */}
      <View style={styles.bottomCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons name="library-outline" size={21} color={colors.primary} />
          </View>

          <View style={styles.cardTextBox}>
            <Text style={styles.cardTitle}>{espacio.name}</Text>
            <Text style={styles.cardSubtitle}>
              {espacio.raw?.building || 'Universidad Central'} ·{' '}
              {espacio.raw?.floor || ''}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="navigate-outline" size={15} color={colors.textSecondary} />

          <Text style={styles.infoText}>
            {origen
              ? 'Ubicación actual detectada.'
              : 'No se pudo detectar tu ubicación. Se muestra solo la biblioteca.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={abrirGoogleMaps}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.white} />
          <Text style={styles.primaryButtonText}>
            Abrir ruta exacta en Google Maps
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  pageTextBox: {
    flex: 1,
  },

  pageTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  pageSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  mapContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },

  bottomCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  cardTextBox: {
    flex: 1,
  },

  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  cardSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  infoText: {
    flex: 1,
    marginLeft: 6,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    lineHeight: 18,
  },

  primaryButton: {
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  centerBox: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  centerText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
});
