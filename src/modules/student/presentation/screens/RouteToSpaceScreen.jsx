import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { API_V1 } from '../../../../shared/config/api';
import { colors } from '../../../../shared/theme/colors';

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY;

export default function RouteToSpaceScreen() {
  const { espacioId } = useLocalSearchParams();
  const { getToken } = useAuth();
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Se necesita permiso de ubicación para trazar la ruta');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setOrigen({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });

      const token = await getToken();
      const res = await fetch(`${API_V1}/espacios/${espacioId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setError('No se pudo cargar el espacio');
        return;
      }
      const espacio = await res.json();
      if (!espacio.coordenadas_gps) {
        setError(`"${espacio.nombre}" no tiene coordenadas registradas`);
        return;
      }
      const [lat, lng] = espacio.coordenadas_gps.split(',').map(Number);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setError(`Las coordenadas de "${espacio.nombre}" no son válidas`);
        return;
      }
      setDestino({ latitude: lat, longitude: lng, nombre: espacio.nombre });
    })().catch(() => setError('Error obteniendo la ruta'));
  }, [espacioId]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!origen || !destino) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...origen, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
      showsUserLocation
    >
      <Marker
        coordinate={{ latitude: destino.latitude, longitude: destino.longitude }}
        title={destino.nombre}
      />
      <MapViewDirections
        origin={origen}
        destination={{ latitude: destino.latitude, longitude: destino.longitude }}
        apikey={GOOGLE_MAPS_APIKEY}
        mode="WALKING"
        strokeWidth={4}
        strokeColor={colors.primary}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: colors.textPrimary, textAlign: 'center' },
});
