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

  // Extraemos el rol. Por defecto, si alguien se registra, es estudiante.
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  // Lógica booleana para mostrar/ocultar
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
        },
      }}
    >
      {/* 1. CAMPUS / MAPA: Visible absolutamente para todos */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Campus',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />

      {/* 2. RESERVAS: Estudiantes y Docentes */}
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis Reservas',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          href: (isEstudiante || isDocente) ? '/(dashboard)/reservas' : null,
        }}
      />

      {/* 3. REPORTES / INCIDENCIAS: Docentes y Admins */}
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Incidencias',
          tabBarIcon: ({ color, size }) => <Ionicons name="warning-outline" size={size} color={color} />,
          href: (isDocente || isAdmin) ? '/(dashboard)/reportes' : null,
        }}
      />

      {/* 4. GESTIÓN: Solo Administradores */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Gestión',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
          href: isAdmin ? '/(dashboard)/admin' : null,
        }}
      />

      {/* 5. PERFIL: Todos los usuarios */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}