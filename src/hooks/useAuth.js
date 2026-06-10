import { useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db, app } from '../firebase';

const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unSubDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (unSubDoc) {
        unSubDoc();
        unSubDoc = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        
        unSubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({ status: 'new' });
          }
          setIsLoading(false);
        }, (error) => {
          console.error("onSnapshot Error:", error);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setIsLoading(false); // No more anonymous sign in
      }
    });

    return () => {
      if (unSubDoc) unSubDoc();
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const registerWithEmail = async (email, password, name, gender, anniversaryDate) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      let pairKey = Math.random().toString(36).substring(2, 12).toUpperCase();
      while (pairKey.length < 10) {
        pairKey += Math.random().toString(36).substring(2, 3).toUpperCase();
      }
      
      await setDoc(doc(db, 'users', newUser.uid), {
        name,
        gender,
        pairKey,
        coupleId: null,
        role: gender === 'F' ? 'her' : 'his',
        anniversaryDate: anniversaryDate || null,
        status: 'waiting',
        createdAt: Date.now()
      });
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetPasswordEmail = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const changeUserPassword = async (oldPassword, newPassword) => {
    if (!auth.currentUser) return { success: false, error: 'Not logged in' };
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Funcție păstrată pt backward compatibility (poate fi ignorată la conturi noi)
  const createProfile = async (name, gender = 'F') => {
    if (!user) return false;
    const pairKey = Math.random().toString(36).substring(2, 12).toUpperCase();
    
    await setDoc(doc(db, 'users', user.uid), {
      name,
      gender,
      pairKey,
      coupleId: null,
      role: 'his', // Pentru compatibilitate cu baza de date veche
      status: 'waiting',
      createdAt: Date.now()
    });
    return pairKey;
  };

  // Pasul 2: Conectarea la un partener
  const linkPartner = async (rawPartnerKey, myName, myGender = 'M') => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    const partnerKey = rawPartnerKey.trim().toUpperCase();

    try {
      // SECRET KEYS FOR MIGRATION (Andrei & Ana)
      if (partnerKey === 'A9K3B7X2P5' || partnerKey === 'F4M8R1W6Y9' || partnerKey === 'ANDREI2024' || partnerKey === 'ANA2024') {
        const assignedRole = (partnerKey === 'F4M8R1W6Y9' || partnerKey === 'ANDREI2024') ? 'her' : 'his';
        const hardcodedGender = (partnerKey === 'F4M8R1W6Y9' || partnerKey === 'ANDREI2024') ? 'F' : 'M';
        const adminCoupleId = 'v86tFk9x7jS5z2K2lO7R';
        await setDoc(doc(db, 'users', user.uid), {
          name: myName,
          gender: hardcodedGender,
          pairKey: 'MIGRATED',
          coupleId: adminCoupleId,
          role: assignedRole,
          status: 'paired',
          isPro: true, // Acorda PRO gratuit
          createdAt: Date.now()
        }, { merge: true });
        
        // Asigurăm că profilul din couples are și el genul și isPro (dacă vrem să-l folosim acolo)
        await setDoc(doc(db, 'couples', adminCoupleId, 'profiles', assignedRole), {
          name: myName,
          gender: hardcodedGender,
        }, { merge: true });
        
        return { success: true };
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('pairKey', '==', partnerKey));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return { success: false, error: 'Key not found' };
      }
      
      const partnerDoc = snap.docs[0];
      const partnerData = partnerDoc.data();
      
      // Dacă partenerul are deja un cuplu
      if (partnerData.coupleId) {
        return { success: false, error: 'This key is already associated with an active couple!' };
      }

      // Fetch my own data to check for memory restoration
      let myData = userData;
      if (!myData) {
        const mySnap = await getDocs(query(usersRef, where('__name__', '==', user.uid)));
        if (!mySnap.empty) myData = mySnap.docs[0].data();
      }
      
      let newCoupleId;
      // Memory Restoration: Check if both users share the exact same oldCoupleId
      if (myData?.oldCoupleId && partnerData.oldCoupleId && myData.oldCoupleId === partnerData.oldCoupleId) {
        newCoupleId = myData.oldCoupleId;
      } else {
        newCoupleId = partnerDoc.id + '_' + user.uid;
      }
      
      let partnerGender = partnerData.gender || 'M';
      let myRole = myGender === 'F' ? 'her' : 'his';
      let partnerRole = partnerGender === 'F' ? 'her' : 'his';

      // Conflict resolution for same-sex couples or identical default roles
      if (myRole === partnerRole) {
        if (myRole === 'his') {
          myRole = 'her'; // Fallback to avoid collision
        } else {
          myRole = 'his';
        }
      }

      // Salvăm datele noastre (caz nou) - fără să rescriem pairKey
      await setDoc(doc(db, 'users', user.uid), {
        name: myName,
        gender: myGender,
        coupleId: newCoupleId,
        role: myRole, 
        status: 'paired',
        createdAt: Date.now()
      }, { merge: true });
      
      // Actualizăm partenerul
      await updateDoc(doc(db, 'users', partnerDoc.id), {
        coupleId: newCoupleId,
        status: 'paired',
        role: partnerRole 
      });
      
      // Cream profilele initiale in colectia couples
      await setDoc(doc(db, 'couples', newCoupleId, 'profiles', myRole), {
        name: myName,
        gender: myGender,
        isConfigured: false
      }, { merge: true });
      
      await setDoc(doc(db, 'couples', newCoupleId, 'profiles', partnerRole), {
        name: partnerData.name,
        gender: partnerGender,
        isConfigured: false
      }, { merge: true });
      
      return { success: true };
    } catch(err) {
       console.error(err);
       return { success: false, error: 'Login error' };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const breakUp = async () => {
    if (!user || !userData) return;
    
    try {
      const coupleId = userData.coupleId;
      
      if (coupleId) {
        // Reset both users if possible
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('coupleId', '==', coupleId));
          const snap = await getDocs(q);
          
          const resetPromises = snap.docs.map(docSnap => {
            const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
            return updateDoc(docSnap.ref, {
              status: 'new',
              coupleId: null,
              oldCoupleId: coupleId,
              pairKey: newKey,
              role: null
            });
          });
          await Promise.all(resetPromises);
        } catch (e) {
          console.warn("Could not reset both users via query:", e);
          
          // Fallback: reset current user at least
          const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
          await updateDoc(doc(db, 'users', user.uid), {
            status: 'new',
            coupleId: null,
            oldCoupleId: coupleId,
            pairKey: newKey,
            role: null
          });
        }
      } else {
        // Just reset current user if they have no coupleId but want to break up (edge case)
        const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
        await updateDoc(doc(db, 'users', user.uid), {
          status: 'new',
          coupleId: null,
          pairKey: newKey,
          role: null
        });
      }
      
      await logout();
      window.location.href = '/login'; // Force reload/redirect to ensure UI reset
    } catch(err) {
      console.error("Error breaking up", err);
      await logout();
      window.location.href = '/login';
    }
  };

  const resetProfile = async () => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { status: 'new' });
  };

  return {
    user,
    userData,
    coupleId: userData?.coupleId || null,
    isAuthenticated: userData?.status === 'paired',
    role: userData?.role || null, // 'his' sau 'her' pt UI vechi
    gender: userData?.gender || 'F', // Default la F pt fallback
    isLoading,
    loginWithEmail,
    registerWithEmail,
    resetPasswordEmail,
    changeUserPassword,
    createProfile,
    linkPartner,
    logout,
    breakUp,
    resetProfile,
    // Compatibilitate pt restul app-ului
    isHer: userData?.role === 'her',
    isHis: userData?.role === 'his',
    isAdmin: false,
    getDiaryPassphrase: () => null // Depășit, nu mai avem nevoie momentan de parolă pt jurnal
  };
}
