import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { useState, useEffect, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';

let globalMockSession = null;
let globalIsLoaded = false;
const listeners = new Set();
const loadListeners = new Set();

const updateGlobalMockSession = (val) => {
  globalMockSession = val;
  globalIsLoaded = true;
  listeners.forEach(l => l(val));
  loadListeners.forEach(l => l(true));
};

export async function initMockSession() {
  try {
    const sess = await SecureStore.getItemAsync('mock_session');
    if (sess) {
      updateGlobalMockSession(JSON.parse(sess));
    } else {
      globalIsLoaded = true;
    }
  } catch (e) {
    globalIsLoaded = true;
  }
}

export function setMockSession(session) {
  if (session) {
    SecureStore.setItemAsync('mock_session', JSON.stringify(session));
    updateGlobalMockSession(session);
  } else {
    SecureStore.deleteItemAsync('mock_session');
    updateGlobalMockSession(null);
  }
}

export function useAuth() {
  const clerkAuth = useClerkAuth();
  const [session, setSession] = useState(globalMockSession);
  const [isLoaded, setIsLoaded] = useState(globalIsLoaded);

  useEffect(() => {
    listeners.add(setSession);
    loadListeners.add(setIsLoaded);
    // Sync initial state
    setSession(globalMockSession);
    setIsLoaded(globalIsLoaded);
    return () => {
      listeners.delete(setSession);
      loadListeners.delete(setIsLoaded);
    };
  }, []);

  const mockAuth = useMemo(() => {
    if (!isLoaded) {
      return {
        isLoaded: false,
        isSignedIn: false,
        signOut: async () => {},
        getToken: async () => null,
      };
    }
    if (session) {
      return {
        isLoaded: true,
        isSignedIn: true,
        signOut: async () => {
          setMockSession(null);
        },
        getToken: async () => {
          return session.token;
        }
      };
    }
    return null;
  }, [isLoaded, session]);

  if (session || !isLoaded) {
    return mockAuth;
  }

  return clerkAuth;
}

export function useUser() {
  const clerkUser = useClerkUser();
  const [session, setSession] = useState(globalMockSession);
  const [isLoaded, setIsLoaded] = useState(globalIsLoaded);

  useEffect(() => {
    listeners.add(setSession);
    loadListeners.add(setIsLoaded);
    // Sync initial state
    setSession(globalMockSession);
    setIsLoaded(globalIsLoaded);
    return () => {
      listeners.delete(setSession);
      loadListeners.delete(setIsLoaded);
    };
  }, []);

  const mockUser = useMemo(() => {
    if (!isLoaded) {
      return {
        isLoaded: false,
        isSignedIn: false,
        user: null,
      };
    }
    if (session) {
      return {
        isLoaded: true,
        isSignedIn: true,
        user: {
          firstName: session.nombre.split(' ')[0],
          lastName: session.nombre.split(' ').slice(1).join(' '),
          fullName: session.nombre,
          primaryEmailAddress: { emailAddress: session.email },
          publicMetadata: { rol: session.rol },
          unsafeMetadata: { rol: session.rol },
        }
      };
    }
    return null;
  }, [isLoaded, session]);

  if (session || !isLoaded) {
    return mockUser;
  }

  return clerkUser;
}
