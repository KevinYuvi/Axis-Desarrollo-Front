import React, { useEffect, useMemo, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import * as Location from 'expo-location';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import { obtenerMisClasesHoy } from '../../services/estudianteApi';
// Mapa Leaflet compartido: la misma logica se reutiliza en la seccion de
// bibliotecas (RutaBibliotecaScreen), por eso vive en shared/utils.
import { construirMapaHtml } from '../../../../shared/utils/mapaLeaflet';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const CLERK_JWT_TEMPLATE = 'Axis';

export default function RutaClaseScreen() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { claseId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [clases, setClases] = useState([]);
    const [ubicacionActual, setUbicacionActual] = useState(null);
    const [error, setError] = useState('');

    const clase = useMemo(() => {
        return clases.find((item) => item.id === claseId);
    }, [clases, claseId]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const obtenerTokenAxis = async () => {
        const token = await getToken({
            template: CLERK_JWT_TEMPLATE,
            skipCache: true,
        });

        if (!token) {
            throw new Error('No se pudo obtener una sesión activa.');
        }

        return token;
    };

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError('');

            const token = await obtenerTokenAxis();
            const clasesRes = await obtenerMisClasesHoy({ token });
            const locationResult = await obtenerUbicacionActual();

            setClases(Array.isArray(clasesRes?.data) ? clasesRes.data : []);
            setUbicacionActual(locationResult);
        } catch (err) {
            setError(err?.message || 'No se pudo cargar la ruta.');
        } finally {
            setLoading(false);
        }
    };

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

    const abrirGoogleMaps = async () => {
        const edificio = clase?.edificio;

        if (!edificio?.latitude || !edificio?.longitude) return;

        const destino = `${edificio.latitude},${edificio.longitude}`;

        const url = ubicacionActual
            ? `https://www.google.com/maps/dir/?api=1&origin=${ubicacionActual.latitude},${ubicacionActual.longitude}&destination=${destino}&travelmode=walking`
            : `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=walking`;

        await Linking.openURL(url);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

                <AppHeader rol="estudiante" />

                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.centerText}>Cargando ruta...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !clase) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

                <AppHeader rol="estudiante" />

                <View style={styles.centerBox}>
                    <Ionicons name="map-outline" size={42} color={colors.textMuted} />

                    <Text style={styles.emptyTitle}>Ruta no disponible</Text>

                    <Text style={styles.centerText}>
                        {error || 'No se encontró la clase seleccionada.'}
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

    const edificio = clase.edificio;

    const destino = {
        latitude: Number(edificio.latitude),
        longitude: Number(edificio.longitude),
    };

    const origen = ubicacionActual || null;

    const mapaHtml = construirMapaHtml({
        origen,
        destino,
        nombreDestino: edificio.nombre,
        descripcionDestino: `${clase.aula} · ${edificio.bloque || ''}`,
    });

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <AppHeader rol="estudiante" />

            <View style={styles.pageHeader}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.85}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.pageTextBox}>
                    <Text style={styles.pageTitle}>Ruta a clase</Text>
                    <Text style={styles.pageSubtitle}>{clase.materia}</Text>
                </View>
            </View>

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

            <View style={styles.bottomCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                        <Ionicons name="business-outline" size={21} color={colors.primary} />
                    </View>

                    <View style={styles.cardTextBox}>
                        <Text style={styles.cardTitle}>{edificio.nombre}</Text>
                        <Text style={styles.cardSubtitle}>
                            {clase.aula} · {edificio.bloque}
                        </Text>
                    </View>
                </View>

                <Text style={styles.referenceText}>
                    {edificio.referencia || 'Sin referencia registrada.'}
                </Text>

                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={15} color={colors.textSecondary} />

                    <Text style={styles.infoText}>
                        {clase.hora_inicio} - {clase.hora_fin}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="navigate-outline" size={15} color={colors.textSecondary} />

                    <Text style={styles.infoText}>
                        {origen
                            ? 'Ubicación actual detectada.'
                            : 'No se pudo detectar tu ubicación. Se muestra solo el edificio.'}
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

    referenceText: {
        fontSize: typography.size.sm,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: spacing.sm,
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