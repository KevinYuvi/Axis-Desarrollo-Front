import React from 'react';
import { Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { OccupancyProvider } from '../../src/shared/context/OccupancyContext';
import { colors } from '../../src/shared/theme/colors';

export default function DashboardLayout() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Extraemos el rol. Por defecto, si alguien se registra, es estudiante.
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  // Lógica booleana para mostrar/ocultar tabs según rol
  const isAdmin = rol === 'admin';
  const isDocente = rol === 'docente';
  const isEstudiante = rol === 'estudiante';
  const isAyudante = rol === 'ayudante';

  return (
    <OccupancyProvider>
      <Tabs
        screenOptions={{
          // ─── Desactivamos el header nativo de Expo Router ──────────────
          // Cada pantalla maneja su propio AppHeader (cabecera única, sin duplicado).
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopWidth: 0,
            height: 64,
            paddingBottom: 10,
            paddingTop: 6,
            // Sombra premium hacia arriba
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 14,
            elevation: 14,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        {/* 1. INICIO: home de estudiante con recomendaciones de ocupación */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={22} color={color} />,
            href: isDocente ? null : '/(dashboard)',
          }}
        />

        {/* 2. DOCENTE: home del profesor (cronograma, aula actual) */}
        <Tabs.Screen
          name="docente"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={22} color={color} />,
            href: isDocente ? '/(dashboard)/docente' : null,
          }}
        />

        {/* 3. CAMPUS / MAPA: Visible para todos */}
        <Tabs.Screen
          name="mapa"
          options={{
            title: 'Campus',
            tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={22} color={color} />,
          }}
        />

        {/* 4. BIBLIOTECAS: espacios de estudio con ocupación en tiempo real */}
        <Tabs.Screen
          name="bibliotecas"
          options={{
            title: 'Bibliotecas',
            tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={22} color={color} />,
            href: (isEstudiante || isAyudante) ? '/(dashboard)/bibliotecas' : null,
          }}
        />

        {/* 5. ASISTENTE IA: todos los roles */}
        <Tabs.Screen
          name="asistente"
          options={{
            title: 'Asistente',
            tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={22} color={color} />,
          }}
        />

        {/* 6. RESERVAS: Estudiantes y Docentes */}
        <Tabs.Screen
          name="reservas"
          options={{
            title: 'Reservas',
            tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
            href: (isEstudiante || isDocente) ? '/(dashboard)/reservas' : null,
          }}
        />

        {/* 7. REPORTES / INCIDENCIAS: Docentes, Ayudantes y Admins */}
        <Tabs.Screen
          name="reportes"
          options={{
            title: 'Incidencias',
            tabBarIcon: ({ color }) => <Ionicons name="warning-outline" size={22} color={color} />,
            href: (isDocente || isAyudante || isAdmin) ? '/(dashboard)/reportes' : null,
          }}
        />

        {/* 8. GESTIÓN: Solo Administradores */}
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Gestión',
            tabBarIcon: ({ color }) => <Ionicons name="briefcase-outline" size={22} color={color} />,
            href: isAdmin ? '/(dashboard)/admin' : null,
          }}
        />

        {/* 9. PERFIL: Todos los usuarios */}
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={22} color={color} />,
          }}
        />

        {/* ── Rutas sin tab propio (pantallas auxiliares) ── */}
        <Tabs.Screen name="edificio/[id]" options={{ href: null }} />
        <Tabs.Screen name="camara" options={{ href: null }} />
        <Tabs.Screen name="ruta/[espacioId]" options={{ href: null }} />
      </Tabs>
    </OccupancyProvider>
  );
}
