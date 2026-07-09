import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';

import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps'; 
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

// 🔴 IMPORTAMOS TU NUEVO PUENTE SEGURO
import { useApi } from '../../hooks/useApi';

const FACULTADES_REGION = {
  general: { latitude: -0.1995, longitude: -78.5028, latitudeDelta: 0.007, longitudeDelta: 0.007 },
  ingenieria: { latitude: -0.1976, longitude: -78.5015, latitudeDelta: 0.002, longitudeDelta: 0.002 },
};

// Diccionario visual para embellecer los IDs de la base de datos
const NOMBRES_EDIFICIOS = {
  'edificio_a': 'Edificio de las A',
  'edificio_labs': 'Edificio de los Laboratorios',
  'fac_ingenieria': 'Facultad de Ingeniería',
  'bib_central': 'Biblioteca Central UCE',
  'fac_administrativas': 'Facultad de C. Administrativas'
};

export default function CampusMap() {
  const mapRef = useRef(null);
  const router = useRouter(); 
  const { user, isLoaded } = useUser();
  const api = useApi(); // Instanciamos la conexión a FastAPI
  
  const [edificiosDB, setEdificiosDB] = useState([]); // 🔴 Guardará los edificios desde Mongo
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // =====================================================================
  // FASE 5: DESCARGA Y AGRUPACIÓN DE DATOS DESDE MONGODB
  // =====================================================================
  useEffect(() => {
    const descargarAulas = async () => {
      try {
        // Hacemos la petición a FastAPI (Axios inyectará el Token de Clerk automáticamente)
        const response = await api.get('/espacios/');
        const espacios = response.data;

        // Agrupamos las aulas por bloque para crear los pines del mapa
        const mapaEdificios = new Map();
        
        espacios.forEach(espacio => {
          if (!mapaEdificios.has(espacio.bloque) && espacio.coordenadas_gps) {
            const [lat, lng] = espacio.coordenadas_gps.split(',').map(Number);
            mapaEdificios.set(espacio.bloque, {
              id: espacio.bloque,
              title: NOMBRES_EDIFICIOS[espacio.bloque] || espacio.bloque,
              description: `Toque para ver aulas y laboratorios`,
              type: espacio.tipo === 'biblioteca' ? 'biblioteca' : 'facultad',
              coordinate: { latitude: lat, longitude: lng }
            });
          }
        });

        // Convertimos el mapa en un Array y actualizamos el estado
        setEdificiosDB(Array.from(mapaEdificios.values()));

      } catch (error) {
        console.log("Error descargando aulas de MongoDB:", error);
      }
    };

    if (isLoaded && user) {
      descargarAulas();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    if (isLoaded && user && mapRef.current) {
      const userFacultad = user.publicMetadata?.facultad?.toLowerCase() || 'general';
      const regionDestino = FACULTADES_REGION[userFacultad] || FACULTADES_REGION.general;
      setTimeout(() => mapRef.current.animateToRegion(regionDestino, 1500), 500);
    }
  }, [isLoaded, user]);

  // Filtramos la nueva lista reactiva que viene de Mongo
  const edificiosFiltrados = edificiosDB.filter(edificio => {
    const coincideFiltro = activeFilter === 'Todos' || 
                          (activeFilter === 'Bibliotecas' && edificio.type === 'biblioteca') ||
                          (activeFilter === 'Facultades' && edificio.type === 'facultad');
    const coincideBusqueda = edificio.title.toLowerCase().includes(searchQuery.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  const trazarRutaOSRM = async () => {
    if (!userLocation || !selectedBuilding) {
      Alert.alert("Buscando GPS...", "Aún estamos obteniendo tu ubicación.");
      return;
    }

    try {
      const start = `${userLocation.longitude},${userLocation.latitude}`;
      const end = `${selectedBuilding.coordinate.longitude},${selectedBuilding.coordinate.latitude}`;
      const url = `https://router.project-osrm.org/route/v1/foot/${start};${end}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        
        setRouteCoordinates(coordinates);
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { right: 50, bottom: 350, left: 50, top: 150 },
          animated: true
        });
      }
    } catch (error) {
      console.log("Error al trazar ruta OSRM:", error);
    }
  };

  const intentarNavegar = () => {
    if (!selectedBuilding) return;
    try {
      router.push(`/(dashboard)/edificio/${selectedBuilding.id}`);
    } catch (error) {
      console.log("Error al navegar:", error);
    }
  };

  const FilterChip = ({ label }) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity 
        style={[styles.chip, isActive && styles.chipActive]} 
        onPress={() => { 
          setActiveFilter(label); 
          setSelectedBuilding(null); 
          setRouteCoordinates([]); 
        }}
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={FACULTADES_REGION.general}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="none" 
        onPress={() => { 
          setSelectedBuilding(null); 
          setRouteCoordinates([]); 
        }}
      >
        <UrlTile
          urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
          zIndex={-1} 
        />

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor="#3B82F6" 
            zIndex={2}
          />
        )}

        {edificiosFiltrados.map((edificio) => (
          <Marker
            key={edificio.id}
            coordinate={edificio.coordinate}
            title={edificio.title}
            description={edificio.description}
            pinColor={selectedBuilding?.id === edificio.id ? 'red' : 'blue'}
            zIndex={3}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedBuilding(edificio);
              setRouteCoordinates([]); 
              mapRef.current.animateToRegion({
                ...edificio.coordinate,
                latitude: edificio.coordinate.latitude - 0.0005,
                latitudeDelta: 0.002, longitudeDelta: 0.002,
              }, 500);
            }}
          />
        ))}
      </MapView>

      <View style={styles.topUIContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar aula, facultad..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          <FilterChip label="Todos" />
          <FilterChip label="Facultades" />
          <FilterChip label="Bibliotecas" />
        </ScrollView>
      </View>

      {selectedBuilding && (
        <View style={styles.bottomSheet}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ionicons name="business-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{selectedBuilding.title}</Text>
              <Text style={styles.cardSubtitle}>{selectedBuilding.description}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={trazarRutaOSRM}>
              <Ionicons name="navigate-outline" size={18} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Ruta para llegar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.primaryButton} 
              activeOpacity={0.7} 
              onPress={intentarNavegar}
            >
              <Ionicons name="layers-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Info de aulas</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  topUIContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, width: '100%', paddingHorizontal: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, height: 50, elevation: 5 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' },
  chipsContainer: { marginTop: 12, flexDirection: 'row' },
  chip: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#1D4ED8' },
  bottomSheet: { position: 'absolute', bottom: 24, backgroundColor: '#FFFFFF', width: '92%', padding: 18, borderRadius: 16, elevation: 10, zIndex: 100 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, marginRight: 12 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondaryButton: { flex: 1, flexDirection: 'row', backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  secondaryButtonText: { color: '#3B82F6', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  primaryButton: { flex: 1, flexDirection: 'row', backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginLeft: 6 }
});