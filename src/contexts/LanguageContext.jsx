import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGlobalAuth } from './AuthContext';
import { useProfiles } from '../hooks/useDatabase';

import { translations } from '../data/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const authState = useGlobalAuth() || {};
  const { role } = authState;
  const { profile } = useProfiles(role);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    if (profile?.language && translations[profile.language]) {
      setLang(profile.language);
    } else if (!authState?.isAuthenticated) {
      setLang('en');
    }
  }, [profile?.language, authState?.isAuthenticated]);

  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let current = translations[lang];
    for (const key of keys) {
      if (current[key] === undefined) {
        return keyPath; // fallback la cheie daca nu gaseste traducerea
      }
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
