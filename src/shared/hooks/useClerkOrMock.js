import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';

export function useAuth() {
  return useClerkAuth();
}

export function useUser() {
  return useClerkUser();
}
