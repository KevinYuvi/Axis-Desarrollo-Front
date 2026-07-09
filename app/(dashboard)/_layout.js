import React from 'react';
import { Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { OccupancyProvider } from '../../src/shared/context/OccupancyContext';

export default function DashboardLayout() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Extraemos el rol. Por defecto, si alguien se registra, es estudiante.
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  // Lógica booleana para mostrar/ocultar
  const isAdmin = rol === 'admin';
  const isDocente = rol === 'docente';
  const isEstudiante = rol === 'estudiante';
  const isAyudante = rol === 'ayudante';

  return (
    <OccupancyProvider>
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
          },
        }}
      >
        {/* 1. INICIO: home de estudiante con recomendaciones de ocupación */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
            href: isDocente ? null : '/(dashboard)',
          }}
        />

        {/* 2. DOCENTE: home del profesor (cronograma, aula actual) */}
        <Tabs.Screen
          name="docente"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
            href: isDocente ? '/(dashboard)/docente' : null,
          }}
        />

        {/* 3. CAMPUS / MAPA: Visible absolutamente para todos */}
        <Tabs.Screen
          name="mapa"
          options={{
            title: 'Campus',
            tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
          }}
        />

        {/* 4. BIBLIOTECAS: espacios de estudio con ocupación en tiempo real */}
        <Tabs.Screen
          name="bibliotecas"
          options={{
            title: 'Bibliotecas',
            tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
            href: (isEstudiante || isAyudante) ? '/(dashboard)/bibliotecas' : null,
          }}
        />

        {/* 5. ASISTENTE IA */}
        <Tabs.Screen
          name="asistente"
          options={{
            title: 'Asistente',
            tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />,
          }}
        />

        {/* 6. RESERVAS: Estudiantes y Docentes */}
        <Tabs.Screen
          name="reservas"
          options={{
            title: 'Mis Reservas',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
            href: (isEstudiante || isDocente) ? '/(dashboard)/reservas' : null,
          }}
        />

        {/* 7. REPORTES / INCIDENCIAS: Docentes, Ayudantes y Admins */}
        <Tabs.Screen
          name="reportes"
          options={{
            title: 'Incidencias',
            tabBarIcon: ({ color, size }) => <Ionicons name="warning-outline" size={size} color={color} />,
            href: (isDocente || isAyudante || isAdmin) ? '/(dashboard)/reportes' : null,
          }}
        />

        {/* 8. GESTIÓN: Solo Administradores */}
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Gestión',
            tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
            href: isAdmin ? '/(dashboard)/admin' : null,
          }}
        />

        {/* 9. PERFIL: Todos los usuarios */}
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />

        {/* Rutas sin tab propio */}
        <Tabs.Screen
          name="edificio/[id]"
          options={{ href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="camara"
          options={{ href: null, title: 'Cámara en vivo' }}
        />
        <Tabs.Screen
          name="ruta/[espacioId]"
          options={{ href: null, title: 'Cómo llegar' }}
        />
      </Tabs>
    </OccupancyProvider>
  );
}
