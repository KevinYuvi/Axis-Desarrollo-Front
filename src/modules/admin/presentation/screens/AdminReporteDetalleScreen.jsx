import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import {
  construirUrlArchivo,
  obtenerReporteDetalleAdmin,
} from '../../services/adminApi';

const CLERK_JWT_TEMPLATE = 'Axis';

const ESTADOS = {
  abierto: {
    label: 'Abierto',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: 'alert-circle-outline',
  },
  en_proceso: {
    label: 'En proceso',
    color: colors.primary,
    bg: '#EFF6FF',
    icon: 'time-outline',
  },
  resuelto: {
    label: 'Resuelto',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: 'checkmark-circle-outline',
  },
};

const GRAVEDAD = {
  baja: {
    label: 'Baja',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: 'chevron-down-circle-outline',
  },
  media: {
    label: 'Media',
    color: colors.primary,
    bg: '#EFF6FF',
    icon: 'remove-circle-outline',
  },
  alta: {
    label: 'Alta',
    color: '#DC2626',
    bg: '#FEE2E2',
    icon: 'alert-circle-outline',
  },
};

export default function AdminReporteDetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getToken } = useAuth();

  const [reporteDetalle, setReporteDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  const reporteInicial = useMemo(() => {
    try {
      if (!params?.data) return null;
      return JSON.parse(decodeURIComponent(params.data));
    } catch {
      return null;
    }
  }, [params?.data]);

  const reporteId = params?.reporteId || reporteInicial?.id;

  const volverAReportes = () => {
    router.replace('/(admin)/reportes');
  };

  const obtenerTokenActual = async () => {
    const token = await getToken({
      template: CLERK_JWT_TEMPLATE,
      skipCache: true,
    });

    if (!token) {
      throw new Error('No se pudo obtener una sesión activa.');
    }

    return token;
  };

  useEffect(() => {
    async function cargarDetalle() {
      try {
        setLoading(true);
        setError('');

        if (!reporteId) {
          throw new Error('No se pudo identificar el reporte.');
        }

        const token = await obtenerTokenActual();
        const data = await obtenerReporteDetalleAdmin(token, reporteId);

        setReporteDetalle(data || reporteInicial);
      } catch (err) {
        console.error('Error cargando detalle reporte:', err);
        setError(err.message || 'No se pudo cargar el detalle del reporte.');
        setReporteDetalle(reporteInicial);
      } finally {
        setLoading(false);
      }
    }

    cargarDetalle();
  }, [reporteId]);

  const reporte = reporteDetalle || reporteInicial;

  const estado = ESTADOS[reporte?.estado] || ESTADOS.abierto;
  const gravedad = GRAVEDAD[reporte?.gravedad] || GRAVEDAD.media;

  const imagenes = obtenerImagenesReporte(reporte);

  const espacio =
    reporte?.espacio_nombre ||
    reporte?.aula ||
    reporte?.espacio ||
    'Aula no registrada';

  const bloque = formatearTextoEspacio(
    reporte?.espacio_bloque || reporte?.bloque || 'Bloque no registrado'
  );

  const reportadoPor =
    reporte?.estudiante_nombre ||
    reporte?.docente_nombre ||
    reporte?.usuario_nombre ||
    reporte?.nombre ||
    'Usuario no registrado';

  const correo =
    reporte?.estudiante_email ||
    reporte?.email ||
    reporte?.docente_email ||
    '';

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Cargando reporte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reporte) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#DC2626" />

          <Text style={styles.emptyTitle}>No se pudo abrir el reporte</Text>

          <TouchableOpacity style={styles.backBtn} onPress={volverAReportes}>
            <Text style={styles.backBtnText}>Volver a reportes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={volverAReportes}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Detalle del reporte</Text>
          <Text style={styles.headerSubtitle}>
            {reporte?.codigo || 'Reporte'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!!error && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={18} color="#D97706" />
            <Text style={styles.warningText}>{error}</Text>
          </View>
        )}

        <View style={styles.mainCard}>
          <View style={styles.topRow}>
            <View style={styles.iconBox}>
              <Ionicons
                name="document-text-outline"
                size={25}
                color={colors.primary}
              />
            </View>

            <View style={styles.titleBox}>
              <Text style={styles.title}>{reporte?.codigo || 'Reporte'}</Text>

              <Text style={styles.dateText}>
                {formatearFecha(reporte?.fecha_reporte)}
              </Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: estado.bg }]}>
              <Ionicons name={estado.icon} size={14} color={estado.color} />
              <Text style={[styles.badgeText, { color: estado.color }]}>
                {estado.label}
              </Text>
            </View>

            <View style={[styles.badge, { backgroundColor: gravedad.bg }]}>
              <Ionicons name={gravedad.icon} size={14} color={gravedad.color} />
              <Text style={[styles.badgeText, { color: gravedad.color }]}>
                Gravedad {gravedad.label}
              </Text>
            </View>
          </View>
        </View>

        <Section title="Descripción">
          <Text style={styles.description}>
            {reporte?.descripcion || 'Sin descripción registrada.'}
          </Text>
        </Section>

        <Section title="Información del espacio">
          <InfoRow icon="business-outline" label="Espacio" value={espacio} />
          <InfoRow icon="layers-outline" label="Bloque" value={bloque} />
          <InfoRow
            icon="construct-outline"
            label="Recurso afectado"
            value={reporte?.recurso_afectado || 'General'}
          />
        </Section>

        <Section title="Reportado por">
          <InfoRow icon="person-outline" label="Nombre" value={reportadoPor} />

          {!!correo && (
            <InfoRow icon="mail-outline" label="Correo" value={correo} />
          )}

          {!!reporte?.tipo_usuario && (
            <InfoRow
              icon="shield-checkmark-outline"
              label="Tipo de usuario"
              value={formatearTextoEspacio(reporte.tipo_usuario)}
            />
          )}
        </Section>

        <Section title={`Imágenes adjuntas (${imagenes.length})`}>
          {imagenes.length > 0 ? (
            <View style={styles.imagesGrid}>
              {imagenes.map((imagen, index) => {
                const url = obtenerUrlImagen(imagen);

                if (!url) return null;

                return (
                  <TouchableOpacity
                    key={`${url}-${index}`}
                    style={styles.imageBox}
                    onPress={() => setImagenSeleccionada(url)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: url }} style={styles.imageThumb} />

                    <View style={styles.imageOverlay}>
                      <Ionicons
                        name="eye-outline"
                        size={16}
                        color={colors.white}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noImagesBox}>
              <Ionicons name="image-outline" size={24} color={colors.textMuted} />
              <Text style={styles.noImagesText}>
                Este reporte no tiene imágenes adjuntas.
              </Text>
            </View>
          )}
        </Section>
      </ScrollView>

      <Modal
        visible={!!imagenSeleccionada}
        transparent
        animationType="fade"
        onRequestClose={() => setImagenSeleccionada(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setImagenSeleccionada(null)}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>

          {!!imagenSeleccionada && (
            <Image
              source={{ uri: imagenSeleccionada }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function obtenerImagenesReporte(reporte) {
  if (!reporte) return [];

  const posibles = [
    reporte.imagenes,
    reporte.adjuntos,
    reporte.archivos,
    reporte.evidencias,
  ];

  for (const item of posibles) {
    if (Array.isArray(item) && item.length > 0) {
      return item;
    }
  }

  return [];
}

function obtenerUrlImagen(imagen) {
  if (!imagen) return null;

  if (typeof imagen === 'string') {
    return construirUrlArchivo(imagen);
  }

  return construirUrlArchivo(
    imagen.url ||
      imagen.ruta ||
      imagen.path ||
      imagen.file_url ||
      imagen.uri ||
      imagen.filename
  );
}

function formatearTextoEspacio(texto) {
  if (!texto) return 'No registrado';

  return String(texto)
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function Section({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>

      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'No registrado'}</Text>
      </View>
    </View>
  );
}

function formatearFecha(fechaTexto) {
  if (!fechaTexto) return 'Sin fecha';

  const fecha = new Date(fechaTexto);

  if (Number.isNaN(fecha.getTime())) {
    return 'Sin fecha';
  }

  return fecha.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    minHeight: 66,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  headerTitleBox: {
    flex: 1,
  },

  headerTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  warningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  warningText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: '#92400E',
    marginLeft: spacing.xs,
    lineHeight: 17,
  },

  mainCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  titleBox: {
    flex: 1,
  },

  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  dateText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    marginLeft: 5,
  },

  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },

  description: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 21,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  infoTextBox: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  infoValue: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  imageBox: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },

  imageThumb: {
    width: '100%',
    height: '100%',
  },

  imageOverlay: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noImagesBox: {
    minHeight: 86,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },

  noImagesText: {
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalClose: {
    position: 'absolute',
    top: 48,
    right: 22,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullImage: {
    width: '92%',
    height: '78%',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  centerText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  emptyTitle: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },

  backBtn: {
    marginTop: spacing.md,
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backBtnText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
});