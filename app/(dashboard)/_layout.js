import React from 'react';
import { Tabs } from 'expo-router';
import { useUser } from '../../src/shared/hooks/useClerkOrMock';
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
        {/* 1. INICIO: home dinámico según el rol */}
        <Tabs.Screen
          name="index"
          options={{
            title: isDocente ? 'Mi Aula' : isAyudante ? 'Soporte' : 'Inicio',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
            href: isAdmin ? null : '/(dashboard)',
          }}
        />

        {/* 2. ADMIN: Panel de Gestión (solo para Administradores) */}
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Panel',
            tabBarIcon: ({ color }) => <Ionicons name="briefcase-outline" size={22} color={color} />,
            href: isAdmin ? '/(dashboard)/admin' : null,
          }}
        />

        {/* 3. BIBLIOTECAS: Solo visible en la barra inferior para Estudiantes */}
        <Tabs.Screen
          name="bibliotecas"
          options={{
            title: 'Bibliotecas',
            tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={22} color={color} />,
            href: isEstudiante ? '/(dashboard)/bibliotecas' : null,
          }}
        />

        {/* 4. RESERVAS: Solo visible en la barra inferior para Docentes */}
        <Tabs.Screen
          name="reservas"
          options={{
            title: 'Reservar',
            tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
            href: isDocente ? '/(dashboard)/reservas' : null,
          }}
        />

        {/* 5. ASISTENTE IA: Visible en la barra para TODOS los roles */}
        <Tabs.Screen
          name="asistente"
          options={{
            title: 'Asistente',
            tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={22} color={color} />,
          }}
        />

        {/* 6. REPORTES / INCIDENCIAS: Docentes y Ayudantes */}
        <Tabs.Screen
          name="reportes"
          options={{
            title: 'Incidencias',
            tabBarIcon: ({ color }) => <Ionicons name="warning-outline" size={22} color={color} />,
            href: (isDocente || isAyudante) ? '/(dashboard)/reportes' : null,
          }}
        />

        {/* 7. PERFIL: Oculto de la barra inferior, accesible desde el AppHeader */}
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={22} color={color} />,
            href: null,
          }}
        />

        {/* --- RUTAS OCULTAS DE LA BARRA INFERIOR (Accesibles vía botones internos) --- */}
        <Tabs.Screen
          name="mapa"
          options={{ href: null }} // Oculto de la barra, accesible desde inicio
        />
        <Tabs.Screen
          name="admin-espacios"
          options={{ href: null }} // Ruta hija de Admin
        />
        <Tabs.Screen
          name="admin-usuarios"
          options={{ href: null }} // Ruta hija de Admin
        />

        {/* ── Rutas sin tab propio (pantallas auxiliares) ── */}
        <Tabs.Screen name="edificio/[id]" options={{ href: null }} />
        <Tabs.Screen name="camara" options={{ href: null }} />
        <Tabs.Screen name="ruta/[espacioId]" options={{ href: null }} />
      </Tabs>
    </OccupancyProvider>
  );
}
