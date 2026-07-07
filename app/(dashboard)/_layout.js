import React from 'react';
import { Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

export default function DashboardLayout() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Obtenemos el rol directamente de los metadatos de Clerk
  // Si no tiene rol asignado, lo tratamos como estudiante por defecto
  const userRole = user?.publicMetadata?.rol || 'estudiante';
  const isAdmin = userRole === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3B82F6', // Azul UCE
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          elevation: 0, // Quita la sombra en Android para un diseño más plano
        },
      }}
    >
      {/* Pestaña 1: El Macro-Mapa (Fase 3) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Campus',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pestaña 2: Motor de Reservas (Fase 5) */}
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pestaña 3: SOLO PARA ADMINISTRADORES */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Gestión',
          // Esta es la magia: Oculta el botón de la barra si no es admin
          href: isAdmin ? '/(dashboard)/admin' : null, 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}