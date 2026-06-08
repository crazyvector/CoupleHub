import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const authState = useAuth();
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useGlobalAuth() {
  return useContext(AuthContext);
}
