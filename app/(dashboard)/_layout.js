import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, TouchableOpacity, Image } from 'react-native';

export default function DashboardLayout() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Extraemos el rol. Por defecto, si alguien se registra, es estudiante.
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  // Lógica booleana para mostrar/ocultar según el rol
  const isAdmin = rol === 'admin';
  const isDocente = rol === 'docente';
  const isEstudiante = rol === 'estudiante';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTintColor: '#111827',
        tabBarActiveTintColor: '#3B82F6', // Azul institucional UCE
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          elevation: 0,
          // Al no forzar height o padding, React Navigation respeta la barra nativa de Android automáticamente
        },
      }}
    >
      {/* 1. CAMPUS / MAPA: Visible para todos, con el perfil en la esquina */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Campus',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 16 }} 
              onPress={() => router.push('/perfil')}
              activeOpacity={0.7}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
              ) : (
                <Ionicons name="person-circle" size={36} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {/* 2. REPORTES / INCIDENCIAS: Docentes y Admins */}
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Incidencias',
          tabBarIcon: ({ color, size }) => <Ionicons name="warning-outline" size={size} color={color} />,
          href: (isDocente || isAdmin) ? '/(dashboard)/reportes' : null,
        }}
      />

      {/* 3. GESTIÓN: Solo Administradores */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Gestión',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
          href: isAdmin ? '/(dashboard)/admin' : null,
        }}
      />

      {/* 4. ASISTENTE IA: Visible para todos */}
      <Tabs.Screen
        name="asistente"
        options={{
          title: 'Asistente IA',
          tabBarIcon: ({ color, size }) => <Ionicons name="hardware-chip-outline" size={size} color={color} />,
        }}
      />

      {/* ========================================= */}
      {/* PANTALLAS OCULTAS EN LA BARRA DE NAVEGACIÓN */}
      {/* ========================================= */}
      
      {/* PERFIL: Se accede tocando la imagen en Campus */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          href: null, 
        }}
      />

      {/* DETALLE DEL SVG: Se accede tocando el botón en el mapa */}
      <Tabs.Screen 
        name="edificio/[id]" 
        options={{ 
          href: null, 
          headerShown: false 
        }} 
      />

      {/* RESERVAS: Oculto por ahora según tu lista final, mantenido en código por si lo necesitas luego */}
      <Tabs.Screen
        name="reservas"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}