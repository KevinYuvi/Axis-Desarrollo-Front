import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../src/shared/theme/colors';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8A8F98',
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="aulas"
        options={{
          title: 'Aulas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Sección Bibliotecas del admin: estadísticas de ocupación de la
          Biblioteca Cisco + acceso a la cámara en tiempo real. */}
      <Tabs.Screen
        name="bibliotecas"
        options={{
          title: 'Bibliotecas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reporte/[reporteId]"
        options={{
          href: null,
        }}
      />

      {/* Pantallas internas de Bibliotecas (sin pestaña propia): ubicación en
          el mapa y cámara en tiempo real (esta última exclusiva del admin). */}
      <Tabs.Screen name="biblioteca-ubicacion/[spaceId]" options={{ href: null }} />
      <Tabs.Screen name="biblioteca-camara/[spaceId]" options={{ href: null }} />

      <Tabs.Screen name="perfil" options={{ href: null }} />
    </Tabs>
  );
}