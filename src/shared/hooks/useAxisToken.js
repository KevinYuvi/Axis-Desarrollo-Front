import { useAuth } from '@clerk/clerk-expo';

const CLERK_JWT_TEMPLATE = 'Axis';

export function useAxisToken() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const obtenerTokenAxis = async () => {
    const token = await getToken({
      template: CLERK_JWT_TEMPLATE,
    });

    if (!token) {
      throw new Error('No se pudo obtener el token de sesión.');
    }

    return token;
  };

  return {
    obtenerTokenAxis,
    isLoaded,
    isSignedIn,
  };
}