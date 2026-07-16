import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader, Card } from '../../../../shared/components';
import { useOccupancy } from '../../../../shared/hooks/useOccupancy';
import { API_BASE_URL } from '../../../../shared/config/api';
import { CAMERA_STREAM_URL, hasLiveCamera } from '../../../../shared/config/camera';
import { getVisitRecommendation } from '../utils/visitRecommendation';

const TONE_COLORS = {
  available: colors.available,
  warning: colors.warning,
  critical: colors.critical,
  neutral: colors.textSecondary,
};

/**
 * Calcula el color del badge de estado, siguiendo el mismo criterio que
 * SpaceListCard para que ambas pantallas se vean consistentes.
 * @param {string} status - Estado de ocupación del espacio
 * @returns {string} Color hexadecimal asociado al estado
 */
function getStatusColor(status) {
  if (status === 'Disponible') return colors.available;
  if (status === 'Próximo') return colors.warning;
  if (status === 'Ocupado') return colors.critical;
  return colors.primary;
}

/**
 * Construye la URL de la última foto analizada con las cajas de detección
 * dibujadas. Se le agrega updatedAt como parámetro para forzar que la
 * imagen se vuelva a descargar cada vez que el backend calculó un análisis
 * nuevo, en vez de mostrar siempre la copia cacheada por el celular.
 * @param {string} spaceId - Id del espacio con cámara real
 * @param {string} updatedAt - Fecha/hora del último análisis (space.raw.updatedAt)
 * @returns {string} URL lista para usar como source de un <Image>
 */
function getAnnotatedFrameUrl(spaceId, updatedAt) {
  return `${API_BASE_URL}/ocupacion/spaces/${spaceId}/frame?t=${encodeURIComponent(updatedAt)}`;
}

/**
 * Pantalla de cámara en vivo: muestra el stream MJPEG real de la cámara IP
 * (cuando el espacio la tiene conectada) junto con el estado de ocupación y
 * la recomendación de visita, reutilizando los datos ya cargados por
 * useOccupancy() (mismo polling de 10s de siempre, sin pedidos nuevos).
 * @param {Object} props
 * @param {string} props.spaceId - Id del espacio a mostrar
 * @param {Function} props.onNavigate - Callback para cambiar de pantalla
 * @param {string} props.rol - Rol activo (define el chip del AppHeader; la
 *   vista de cámara en vivo solo se enlaza desde la sección de admin)
 */
export default function CameraTrackingScreen({ spaceId, onNavigate, rol = 'estudiante' }) {
  const { spaces } = useOccupancy();
  const space = spaces.find((item) => item.id === spaceId);
  const isLive = hasLiveCamera(spaceId);
  const recommendation = space ? getVisitRecommendation(space.status) : null;

  const annotatedFrameUrl =
    isLive && space?.raw?.updatedAt ? getAnnotatedFrameUrl(spaceId, space.raw.updatedAt) : null;
  const [failedFrameUrl, setFailedFrameUrl] = useState(null);
  const frameFailed = failedFrameUrl === annotatedFrameUrl;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header principal a ancho completo, igual que el resto de pantallas
          de la app (fuera del scroll para que no quede "encajonado"). */}
      <AppHeader rol={rol} />

      {/* Barra de título con botón de volver, mismo patrón visual que las
          demás secciones (Bibliotecas, Ruta, etc.). */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => onNavigate('libraries')}
          activeOpacity={0.85}
        >
          <Feather name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.pageTextBox}>
          <Text style={styles.pageTitle}>Cámara en vivo</Text>
          <Text style={styles.pageSubtitle}>
            {space ? space.name : 'Cargando espacio...'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLive ? (
          <Card style={styles.cameraCard}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>EN VIVO</Text>
            </View>
            <WebView
              originWhitelist={['*']}
              source={{
                html: `<html><body style="margin:0;background:#000"><img src="${CAMERA_STREAM_URL}" style="width:100%;height:100%;object-fit:cover;" /></body></html>`,
              }}
              style={styles.cameraView}
            />
          </Card>
        ) : (
          <Card style={styles.cameraCard}>
            <Feather name="video-off" size={20} color={colors.textSecondary} style={{ marginBottom: spacing.xs }} />
            <Text style={styles.noCameraText}>
              Esta biblioteca todavía no tiene una cámara conectada. Mostrando el último dato de ocupación disponible.
            </Text>
          </Card>
        )}

        {isLive && (
          <Card style={styles.cameraCard}>
            <Text style={styles.frameSectionTitle}>Último análisis con IA (cada 10 s)</Text>
            {annotatedFrameUrl && !frameFailed ? (
              <>
                <Image
                  key={annotatedFrameUrl}
                  source={{ uri: annotatedFrameUrl }}
                  style={styles.cameraView}
                  resizeMode="cover"
                  onError={() => setFailedFrameUrl(annotatedFrameUrl)}
                />
                <Text style={styles.frameHelpText}>
                  Los recuadros verdes marcan a cada persona que la IA detectó en esta foto. Si el número de
                  personas no cambia después de varios ciclos, revisa que la cámara siga capturando (pantalla del
                  celular encendida, sin bloqueo).
                </Text>
              </>
            ) : (
              <Text style={styles.noCameraText}>
                Todavía no hay un análisis con IA disponible para esta cámara (puede tardar hasta 10 segundos desde
                que se enciende el vision-service).
              </Text>
            )}
          </Card>
        )}

        {!space ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Estado</Text>
              <View style={[styles.badge, { backgroundColor: `${getStatusColor(space.status)}1A` }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(space.status) }]}>{space.status}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{space.occupancy}%</Text>
                <Text style={styles.statSubLabel}>Ocupación</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{space.availableTables}</Text>
                <Text style={styles.statSubLabel}>Mesas libres</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{space.availableComputers}</Text>
                <Text style={styles.statSubLabel}>PCs libres</Text>
              </View>
            </View>

            {recommendation && (
              <View style={styles.recommendationRow}>
                <Feather name="info" size={14} color={TONE_COLORS[recommendation.tone]} style={{ marginRight: 6 }} />
                <Text style={[styles.recommendationText, { color: TONE_COLORS[recommendation.tone] }]}>
                  {recommendation.label}
                </Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Barra de título bajo el AppHeader — mismo formato que el resto de
  // secciones de la app (botón circular de volver + título y subtítulo).
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
  // El scroll ocupa el resto de la pantalla con el fondo gris estándar.
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  cameraCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cameraView: {
    height: 240,
    borderRadius: radius.md,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.critical,
    marginRight: spacing.xs,
  },
  liveBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.critical,
  },
  noCameraText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  frameSectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  frameHelpText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  statSubLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    flexShrink: 1,
  },
});
