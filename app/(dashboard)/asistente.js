import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAxisToken } from '../../src/shared/hooks/useAxisToken';
import { AsistenteIAScreen } from '../../src/modules/docente';

export default function AsistenteRoute() {
  const router = useRouter();
  const { obtenerTokenAxis, isLoaded, isSignedIn } = useAxisToken();

  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const cargarToken = async () => {
      try {
        if (!isLoaded) return;

        if (!isSignedIn) {
          setToken(null);
          return;
        }

        const tokenAxis = await obtenerTokenAxis();

        if (activo) {
          setToken(tokenAxis);
        }
      } catch (error) {
        console.error('Error obteniendo token Axis en asistente:', error);
        Alert.alert('Error', 'No se pudo obtener el token de sesión.');
      } finally {
        if (activo && isLoaded) {
          setCargando(false);
        }
      }
    };

    cargarToken();

    return () => {
      activo = false;
    };
  }, [isLoaded, isSignedIn]);

  if (cargando || !isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  return (
    <AsistenteIAScreen
      token={token}
      onBack={() => router.replace('/(dashboard)')}
    />
  );
}