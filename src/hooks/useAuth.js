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
        role: 'his', // Standard initial
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
    if (!user) return { success: false, error: 'Neautentificat' };
    
    const partnerKey = rawPartnerKey.trim().toUpperCase();

    try {
      // SECRET KEYS FOR MIGRATION (Andrei & Ana)
      if (partnerKey === 'A9K3B7X2P5' || partnerKey === 'F4M8R1W6Y9') {
        const assignedRole = partnerKey === 'F4M8R1W6Y9' ? 'her' : 'his';
        const hardcodedGender = partnerKey === 'F4M8R1W6Y9' ? 'F' : 'M';
        await setDoc(doc(db, 'users', user.uid), {
          name: myName,
          gender: hardcodedGender,
          pairKey: 'MIGRATED',
          coupleId: 'default_couple_hub',
          role: assignedRole,
          status: 'paired',
          isPro: true, // Acorda PRO gratuit
          createdAt: Date.now()
        }, { merge: true });
        
        // Asigurăm că profilul din couples are și el genul și isPro (dacă vrem să-l folosim acolo)
        await setDoc(doc(db, 'couples', 'default_couple_hub', 'profiles', assignedRole), {
          name: myName,
          gender: hardcodedGender,
        }, { merge: true });
        
        return { success: true };
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('pairKey', '==', partnerKey));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return { success: false, error: 'Cheia nu a fost găsită.' };
      }
      
      const partnerDoc = snap.docs[0];
      const partnerData = partnerDoc.data();
      
      // Dacă partenerul are deja un cuplu
      if (partnerData.coupleId) {
        return { success: false, error: 'Această cheie este deja asociată unui cuplu activ!' };
      }
      
      const newCoupleId = partnerDoc.id + '_' + user.uid;
      
      // Salvăm datele noastre (caz nou) - fără să rescriem pairKey
      await setDoc(doc(db, 'users', user.uid), {
        name: myName,
        gender: myGender,
        coupleId: newCoupleId,
        role: 'her', // Partenerul secundar
        status: 'paired',
        createdAt: Date.now()
      }, { merge: true });
      
      // Actualizăm partenerul
      await updateDoc(doc(db, 'users', partnerDoc.id), {
        coupleId: newCoupleId,
        status: 'paired'
      });
      
      // Cream profilele initiale in colectia couples
      await setDoc(doc(db, 'couples', newCoupleId, 'profiles', 'her'), {
        name: myName,
        gender: myGender,
        isConfigured: false
      });
      
      await setDoc(doc(db, 'couples', newCoupleId, 'profiles', 'his'), {
        name: partnerData.name,
        gender: partnerData.gender || 'F', // Fallback in caz ca partenerul nu avea setat
        isConfigured: false
      });
      
      return { success: true };
    } catch(err) {
       console.error(err);
       return { success: false, error: 'Eroare la conectare' };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const breakUp = async () => {
    if (!user || !userData || !userData.coupleId) return;
    
    try {
      const coupleId = userData.coupleId;
      
      // Delete subcollections for this couple
      const subcollections = [
        'home_planner_items', 'finance_transactions', 'finance_goals', 
        'events', 'notifications', 'memories', 'couponsList', 'used_coupons',
        'custom_coupons', 'daily_quotes', 'drawings', 'messages',
        'movie_preferences', 'todos', 'study_tasks', 'profiles', 'finances', 'scratch_cards'
      ];
      
      for (const subcol of subcollections) {
        const subcolRef = collection(db, 'couples', coupleId, subcol);
        const subcolSnap = await getDocs(subcolRef);
        for (const docSnap of subcolSnap.docs) {
          await deleteDoc(docSnap.ref);
        }
      }
      
      // Delete the couple document itself
      await deleteDoc(doc(db, 'couples', coupleId));

      // Reset both users
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('coupleId', '==', coupleId));
      const snap = await getDocs(q);
      
      for (const docSnap of snap.docs) {
        const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
        await updateDoc(docSnap.ref, {
          status: 'new',
          coupleId: null,
          pairKey: newKey,
          role: null
        });
      }
      
      await logout();
    } catch(err) {
      console.error("Error breaking up", err);
      // We still want to log them out even if some deletes fail
      await logout();
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
