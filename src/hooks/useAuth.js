import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword as updateFirebasePassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { app } from '../firebase';

// Obținem instanța auth
const auth = getAuth(app);

const SESSION_PASS_KEY = 'coupleHub_sp';

export function useAuth() {
  const [role, setRole] = useState(null); // null | 'her' | 'his' | 'admin'
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = role === 'her' || role === 'his';
  const isAdmin = role === 'admin';
  const isHer = role === 'her';
  const isHis = role === 'his';

  // Ascultăm schimbările de stare a sesiunii (Login / Logout din Firebase)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Obținem rolul din Firestore bazat pe UID
        try {
          const roleDoc = await getDoc(doc(db, 'userRoles', user.uid));
          if (roleDoc.exists()) {
            setRole(roleDoc.data().role);
          } else {
            // Fallback în cazul în care documentul a fost șters
            if (user.email === 'anadicu2004@gmail.com' || user.email === 'ana@couple.hub') setRole('her');
            else if (user.email === 'deiu.cristescu@gmail.com' || user.email === 'andrei@couple.hub') setRole('his');
            else if (user.email === 'admin@couple.hub') setRole('admin');
            else setRole(null);
          }
        } catch (err) {
          console.error("Eroare la obținerea rolului:", err);
          setRole(null);
        }
      } else {
        setRole(null);
        sessionStorage.removeItem(SESSION_PASS_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (password, selectedRole) => {
    try {
      let emailToUse = '';
      if (selectedRole === 'her') emailToUse = 'anadicu2004@gmail.com';
      else if (selectedRole === 'his') emailToUse = 'deiu.cristescu@gmail.com';
      else if (selectedRole === 'admin') emailToUse = 'admin@couple.hub';
      else return false;

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      } catch (err) {
        // Dacă nu există contul pentru aceste email-uri, îl creăm automat.
        // Asta face tranziția ușoară. Dacă a greșit parola la un cont existent, createUser va da eroare 'email-already-in-use' și o prindem.
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, emailToUse, password);
            await setDoc(doc(db, 'userRoles', userCredential.user.uid), { role: selectedRole });
          } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
              return false; // Parolă greșită pentru contul deja existent
            }
            throw createErr;
          }
        } else {
          return false;
        }
      }
      
      // Salvăm parola temporar pentru decriptarea jurnalului
      sessionStorage.setItem(SESSION_PASS_KEY, btoa(password));
      
      // Rolul va fi setat automat de onAuthStateChanged, dar pentru a returna instant răspunsul la UI:
      const roleDoc = await getDoc(doc(db, 'userRoles', userCredential.user.uid));
      let fetchedRole = selectedRole; // default
      if (roleDoc.exists()) {
        fetchedRole = roleDoc.data().role;
      }
      return fetchedRole;
    } catch (err) {
      console.error("Eroare la logare:", err);
      return false; 
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem(SESSION_PASS_KEY);
      setRole(null);
    } catch (err) {
      console.error("Eroare la delogare:", err);
    }
  };

  const getDiaryPassphrase = () => {
    if (role !== 'her' && role !== 'his') return null;
    try {
      const encoded = sessionStorage.getItem(SESSION_PASS_KEY);
      return encoded ? atob(encoded) : null;
    } catch {
      return null;
    }
  };

  const updatePassword = async (newPassword) => {
    if (!auth.currentUser) return false;
    try {
      await updateFirebasePassword(auth.currentUser, newPassword);
      // Păstrăm sincronizat sessionStorage
      if (role === 'her' || role === 'his') {
        sessionStorage.setItem(SESSION_PASS_KEY, btoa(newPassword));
      }
      return true;
    } catch (e) {
      console.error("Eroare la schimbarea parolei:", e);
      // Notă: Dacă utilizatorul este logat de mult timp, Firebase poate returna 'auth/requires-recent-login'
      return false;
    }
  };

  const resetPassword = async (selectedRole) => {
    let emailToUse = '';
    if (selectedRole === 'her') emailToUse = 'anadicu2004@gmail.com';
    else if (selectedRole === 'his') emailToUse = 'deiu.cristescu@gmail.com';
    else return false;

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      return true;
    } catch (err) {
      console.error("Eroare la resetarea parolei:", err);
      return false;
    }
  };

  return {
    isAuthenticated,
    isAdmin,
    isHer,
    isHis,
    isLoading,
    login,
    logout,
    updatePassword,
    resetPassword,
    role,
    getDiaryPassphrase
  };
}
