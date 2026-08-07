import { useGlobalAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  getDoc,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { updateWidgets } from '../utils/widgetUpdater';

// Collections
const MOODS_COL = 'moods';
const EVENTS_COL = 'events';
const SYSTEM_COL = 'system';
const MESSAGES_COL = 'messages';
const NOTIFICATIONS_COL = 'notifications';
const PROFILES_COL = 'profiles';
const MEMORIES_COL = 'memories';
const CUSTOM_COUPONS_COL = 'custom_coupons';

// ==========================================
// Hook: Moods (Specific per rol)
// ==========================================
export function useMoods(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const colName = role ? `moods_${role}` : 'moods_unknown';

  useEffect(() => {
    if (!role) { setLoading(false); return; }
    const q = query(collection(db, 'couples', coupleId, colName), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMoods(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching moods:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role, colName]);

  const addMood = async (moodData) => {
    await addDoc(collection(db, 'couples', coupleId, colName), {
      ...moodData,
      timestamp: new Date().toISOString()
    });
  };

  const clearMoods = async () => {
    const snapshot = await getDocs(query(collection(db, 'couples', coupleId, colName)));
    const batch = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(batch);
  };

  const deleteMood = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, colName, id));
  };

  return { moods, addMood, clearMoods, deleteMood, loading };
}

// ==========================================
// Hook: Diary (Specific per rol)
// ==========================================
export function useDiary(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 'diary_her' sau 'diary_his'
  const colName = role ? `diary_${role}` : 'diary_unknown';

  useEffect(() => {
    if (!role) { setLoading(false); return; }
    const q = query(collection(db, 'couples', coupleId, colName), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching diary:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role, colName]);

  const addEntry = async (encryptedContent, preview, wordCount) => {
    await addDoc(collection(db, 'couples', coupleId, colName), {
      encrypted: encryptedContent,
      preview,
      wordCount,
      timestamp: new Date().toISOString()
    });
  };

  const deleteEntry = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, colName, id));
  };

  return { entries, addEntry, deleteEntry, loading };
}

// ==========================================
// Hook: Events (Calendar)
// ==========================================
export function useEvents() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'couples', coupleId, EVENTS_COL), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Punem ...doc.data() primul pentru ca id: doc.id sa suprascrie orice 'id' salvat din greseala in document
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setEvents(data);
      setLoading(false);
      
      // Update data for widgets
      if (Capacitor.isNativePlatform()) {
        Preferences.set({ key: 'widget_events', value: JSON.stringify(data) })
          .then(updateWidgets)
          .catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  const addEvent = async (eventData) => {
    // Nu salvam field-ul 'id' in interiorul bazei de date
    const { id, ...dataToSave } = eventData;
    await addDoc(collection(db, 'couples', coupleId, EVENTS_COL), {
      ...dataToSave,
      createdAt: new Date().toISOString()
    });
  };

  const deleteEvent = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, 'couples', coupleId, EVENTS_COL, id));
  };

  const updateEvent = async (id, eventData) => {
    const { id: _id, ...dataWithoutId } = eventData;
    if (!id) return;
    await setDoc(doc(db, 'couples', coupleId, EVENTS_COL, id), {
      ...dataWithoutId,
      updatedAt: new Date().toISOString()
    });
  };

  return { events, addEvent, deleteEvent, updateEvent, loading };
}

// ==========================================
// Util: Chat Theme
// ==========================================
export function useChatTheme(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;

  const [chatTheme, setChatTheme] = useState({
    backgroundColor: role === 'his' ? '#1a1a2e' : '#ffffff',
    backgroundImage: null,
    isGradient: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    const unsubscribe = onSnapshot(doc(db, 'couples', coupleId, SYSTEM_COL, 'chatTheme'), (d) => {
      if (d.exists()) {
        setChatTheme(d.data());
      } else {
        setChatTheme({
          backgroundColor: role === 'his' ? '#1a1a2e' : '#ffffff',
          backgroundImage: null,
          isGradient: false
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [coupleId, role]);

  const updateChatTheme = async (themeData) => {
    if (!coupleId) return;
    await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'chatTheme'), themeData, { merge: true });
  };

  return { chatTheme, updateChatTheme, loading };
}

// ==========================================
// Util: System State (Coupons, Scratch)
// ==========================================
export function useSystemState() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [systemState, setSystemState] = useState({ coupons: {}, scratchCards: {}, customCompliments: {}, barista: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe1 = onSnapshot(doc(db, 'couples', coupleId, SYSTEM_COL, 'coupons'), (d) => {
      if (d.exists()) {
        const data = d.data();
        const updatedCoupons = { ...data };
        let changed = false;
        Object.keys(updatedCoupons).forEach(key => {
          if (updatedCoupons[key]?.usedAt) {
            const usedDate = new Date(updatedCoupons[key].usedAt);
            const now = new Date();
            if (usedDate.toDateString() !== now.toDateString()) {
              delete updatedCoupons[key];
              changed = true;
            }
          }
        });
        if (changed) {
          setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'coupons'), updatedCoupons);
        }
        setSystemState(prev => ({ ...prev, coupons: updatedCoupons }));
      }
      else {
        setSystemState(prev => ({ ...prev, coupons: {} }));
      }
    });

    const unsubscribe2 = onSnapshot(doc(db, 'couples', coupleId, SYSTEM_COL, 'scratchCards'), (d) => {
      if (d.exists()) {
        const data = d.data();
        let needsReset = false;

        ['his', 'her'].forEach(role => {
          if (data[role]?.revealedAt) {
            const revDate = new Date(data[role].revealedAt);
            const revTargetTime = new Date(revDate);
            if (revDate.getHours() < 8) {
              revTargetTime.setDate(revTargetTime.getDate() - 1);
            }

            const now = new Date();
            const nowTargetTime = new Date(now);
            if (now.getHours() < 8) {
              nowTargetTime.setDate(nowTargetTime.getDate() - 1);
            }

            if (revTargetTime.toDateString() !== nowTargetTime.toDateString()) {
              needsReset = true;
            }
          }
        });

        if (needsReset) {
          setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'scratchCards'), {
            his: { revealed: false, revealedAt: null },
            her: { revealed: false, revealedAt: null },
            customCard: null
          }, { merge: true });
        }
        setSystemState(prev => ({ ...prev, scratchCards: data }));
      } else {
        setSystemState(prev => ({ ...prev, scratchCards: { his: { revealed: false }, her: { revealed: false } } }));
      }
      setLoading(false);
    });

    const unsubscribe3 = onSnapshot(doc(db, 'couples', coupleId, SYSTEM_COL, 'compliments'), (d) => {
      if (d.exists()) {
        setSystemState(prev => ({ ...prev, customCompliments: d.data() }));
      } else {
        setSystemState(prev => ({ ...prev, customCompliments: {} }));
      }
    });

    const unsubscribe4 = onSnapshot(doc(db, 'couples', coupleId, SYSTEM_COL, 'barista'), (d) => {
      if (d.exists()) {
        setSystemState(prev => ({ ...prev, barista: d.data() }));
      } else {
        setSystemState(prev => ({ ...prev, barista: {} }));
      }
    });

    return () => { unsubscribe1(); unsubscribe2(); unsubscribe3(); unsubscribe4(); };
  }, []);



  const setCouponUsed = async (couponId, note) => {
    await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'coupons'), {
      [couponId]: { usedAt: new Date().toISOString(), note }
    }, { merge: true });
  };

  const resetCoupons = async () => {
    await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'coupons'), {});
  };

  const setScratchRevealed = async (role, revealed) => {
    if (!role) {
      await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'scratchCards'), {
        his: { revealed: false, revealedAt: null },
        her: { revealed: false, revealedAt: null },
        customCard: null
      }, { merge: true });
    } else {
      await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'scratchCards'), {
        [role]: {
          revealed,
          revealedAt: revealed ? new Date().toISOString() : null
        }
      }, { merge: true });
    }
  };

  const setSystemStateDirectly = async (data) => {
    await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'coupons'), data.coupons || {});
  };

  const setCustomCompliment = async (targetRole, text) => {
    await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'compliments'), {
      [targetRole]: text
    }, { merge: true });
  };

  const incrementBaristaCount = async (role) => {
    const docRef = doc(db, 'couples', coupleId, SYSTEM_COL, 'barista');
    const dSnap = await getDoc(docRef);
    const today = new Date().toDateString();

    let currentCount = 0;
    if (dSnap.exists() && dSnap.data()[role]?.date === today) {
      currentCount = dSnap.data()[role].count || 0;
    }

    await setDoc(docRef, {
      [role]: { count: currentCount + 1, date: today }
    }, { merge: true });
  };

  const resetBaristaCounts = async () => {
    await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'barista'), {});
  };

  const setCustomScratchCard = async (customCard) => {
    await setDoc(doc(db, 'couples', coupleId, SYSTEM_COL, 'scratchCards'), {
      customCard,
      revealed: false,
      revealedAt: null
    }, { merge: true });
  };

  return { systemState, setCouponUsed, resetCoupons, setScratchRevealed, setSystemStateDirectly, setCustomCompliment, incrementBaristaCount, resetBaristaCounts, setCustomScratchCard, loading };
}

// ==========================================
// Hook: Notifications (In-App)
// ==========================================
export function useNotifications(currentRole) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [notifications, setNotifications] = useState([]);
  const isInitialLoad = useRef(true);
  const permissionChecked = useRef(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && !permissionChecked.current && currentRole && coupleId) {
      PushNotifications.requestPermissions().then((result) => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });

      PushNotifications.addListener('registration', async (token) => {
        try {
          await updateDoc(doc(db, 'couples', coupleId, PROFILES_COL, currentRole), {
            fcmToken: token.value
          });
        } catch (e) {
          console.error("Error saving FCM token:", e);
        }
      });

      // Păstrăm și LocalNotifications ca fallback/afișare internă dacă e nevoie
      LocalNotifications.requestPermissions().then((res) => {
        permissionChecked.current = true;
      });
    }
  }, [currentRole, coupleId]);

  useEffect(() => {
    if (!currentRole) return;
    const q = query(collection(db, 'couples', coupleId, NOTIFICATIONS_COL), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const mine = all.filter(n => !n.targetRole || n.targetRole === currentRole);
      setNotifications(mine);

      // Verificăm dacă sunt documente adăugate recent (doar după load-ul inițial)
      // (Afișarea notificărilor se face acum exclusiv prin push-notifications plugin configurat în capacitor.config.json pentru a evita dublarea lor)
      if (!isInitialLoad.current && Capacitor.isNativePlatform()) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            // Nu mai programăm notificare locală aici, se va ocupa Capacitor Push Notifications
            // să afișeze notificarea trimisă de Firebase Cloud Function!
          }
        });
      }

      isInitialLoad.current = false;
    });
    return () => unsubscribe();
  }, [currentRole]);

  const addNotification = async (title, body, sender, customTargetRole) => {
    const targetRole = customTargetRole || (sender === 'his' ? 'her' : 'his');
    await addDoc(collection(db, 'couples', coupleId, NOTIFICATIONS_COL), {
      title,
      body,
      sender,
      targetRole, // cui ii este destinata
      readBy: [],
      timestamp: new Date().toISOString()
    });
  };

  const markAsRead = async (id, role) => {
    const dRef = doc(db, 'couples', coupleId, NOTIFICATIONS_COL, id);
    const dSnap = await getDoc(dRef);
    if (dSnap.exists()) {
      const currentReaders = dSnap.data().readBy || [];
      if (!currentReaders.includes(role)) {
        await updateDoc(dRef, { readBy: [...currentReaders, role] });
      }
    }
  };

  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, NOTIFICATIONS_COL, id));
  };

  return { notifications, addNotification, markAsRead, deleteNotification };
}

// ==========================================
// Hook: Profiles
// ==========================================
export function useProfiles(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role || role === 'admin' || !coupleId) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'couples', coupleId, PROFILES_COL, role), (d) => {
      if (d.exists()) setProfile({ id: d.id, ...d.data() });
      else setProfile(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  const updateProfile = async (data) => {
    const promises = [
      setDoc(doc(db, 'couples', coupleId, PROFILES_COL, role), data, { merge: true })
    ];
    
    // Sincronizare anniversaryDate către partener
    if (data.anniversaryDate !== undefined) {
      const partnerRole = role === 'his' ? 'her' : 'his';
      promises.push(
        setDoc(doc(db, 'couples', coupleId, PROFILES_COL, partnerRole), { anniversaryDate: data.anniversaryDate }, { merge: true })
      );
    }
    
    await Promise.all(promises);
  };

  return { profile, updateProfile, loading };
}

// ==========================================
// Hook: Memories (Cu suport pentru imagini)
// ==========================================
export function useMemories() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'couples', coupleId, MEMORIES_COL), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addMemory = async (memoryData) => {
    await addDoc(collection(db, 'couples', coupleId, MEMORIES_COL), {
      ...memoryData,
      reactions: [],
      timestamp: new Date().toISOString()
    });
  };

  const updateMemory = async (id, data) => {
    await updateDoc(doc(db, 'couples', coupleId, MEMORIES_COL, id), data);
  };

  const addReaction = async (id, reaction) => {
    const dRef = doc(db, 'couples', coupleId, MEMORIES_COL, id);
    const dSnap = await getDoc(dRef);
    if (dSnap.exists()) {
      const current = dSnap.data().reactions || [];
      await updateDoc(dRef, { reactions: [...current, reaction] });
    }
  };

  const deleteMemory = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, MEMORIES_COL, id));
  };

  return { memories, addMemory, updateMemory, addReaction, deleteMemory, loading };
}

// ==========================================
// Hook: Coupons (Definitions)
// ==========================================
export function useCoupons() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'couples', coupleId, 'couponsList'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addCoupon = async (data) => {
    await addDoc(collection(db, 'couples', coupleId, 'couponsList'), data);
  };

  const deleteCoupon = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, 'couponsList', id));
  };

  return { coupons, addCoupon, deleteCoupon, loading };
}

// ==========================================
// Hook: Wheel Items (Spinners)
// ==========================================
export function useWheelItems(wheelType) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;
 // 'food' or 'date'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wheelType) return;
    const colName = `wheel_${wheelType}`;
    const q = query(collection(db, 'couples', coupleId, colName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [wheelType]);

  const addItem = async (data) => {
    const colName = `wheel_${wheelType}`;
    await addDoc(collection(db, 'couples', coupleId, colName), data);
  };

  const deleteItem = async (id) => {
    const colName = `wheel_${wheelType}`;
    await deleteDoc(doc(db, 'couples', coupleId, colName, id));
  };

  return { items, addItem, deleteItem, loading };
}

// ==========================================
// Hook: Daily Poem (Surpriza Zilei cu Gemini AI)
// ==========================================
export function useDailyQuote(language = 'ro') {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;

    const generateDailyPoem = async () => {
      try {
        const now = new Date();
        const targetTime = new Date(now);
        if (now.getHours() < 8) {
          targetTime.setDate(targetTime.getDate() - 1);
        }

        const dateKey = targetTime.toISOString().slice(0, 10); // YYYY-MM-DD
        const langKey = language || 'ro';
        const cacheDocId = `poem_${dateKey}_${langKey}`;

        // Check cache first
        const cacheRef = doc(db, 'couples', coupleId, 'daily_poems', cacheDocId);
        const cacheSnap = await getDoc(cacheRef);

        if (cacheSnap.exists()) {
          setQuote(cacheSnap.data().poem);
          setLoading(false);
          return;
        }

        // Generate quote via public API instead of AI
        // 1. Fetch from public API
        const response = await fetch('https://dummyjson.com/quotes/random');
        if (!response.ok) throw new Error('API quote fetch failed');
        const data = await response.json();
        
        let finalQuote = `"${data.quote}"\n\n— ${data.author}`;
        
        // 2. Translate if needed using MyMemory free API
        if (langKey === 'ro') {
          try {
            const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(finalQuote)}&langpair=en|ro`;
            const tRes = await fetch(translateUrl);
            if (tRes.ok) {
              const tData = await tRes.json();
              if (tData?.responseData?.translatedText) {
                finalQuote = tData.responseData.translatedText;
              }
            }
          } catch (tErr) {
            console.error('Translation failed, falling back to EN', tErr);
          }
        }

        // Cache the quote
        await setDoc(cacheRef, {
          poem: finalQuote,
          date: dateKey,
          language: langKey,
          generatedAt: new Date().toISOString(),
        });

        setQuote(finalQuote);
      } catch (err) {
        console.error('Eroare la generarea quote-ului:', err);
        // Fallback: try to load from old daily_quotes collection
        try {
          const start = new Date(new Date().getFullYear(), 0, 0);
          const diff = new Date() - start;
          const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
          
          const q2 = query(collection(db, 'couples', coupleId, 'daily_quotes'));
          const snapshot = await getDocs(q2);
          const allQuotes = snapshot.docs.map(d => d.data());
          if (allQuotes.length > 0) {
            const indexToUse = dayOfYear % allQuotes.length;
            const found = allQuotes.find(q => q.index === indexToUse) || allQuotes[0];
            setQuote(found.text);
          } else {
            // Absolute ultimate fallback (hardcoded)
            const fallbackPoemsRO = [
              "Stelele pe cer dansează,\nCând la tine mă gândesc,\nOrice vis se luminează,\nDoar pe tine te iubesc.",
              "Ești soarele meu de dimineață,\nCe-mi aduce zâmbet și viață,\nÎn ochii tăi găsesc alinare,\nO iubire adâncă, fără hotare.",
              "Un univers întreg de am căutat,\nNimic mai scump nu aș fi aflat.\nEști liniștea din nopțile târzii,\nMotivul pentru care vreau să fiu mereu aici.",
              "Zâmbetul tău, un colț de rai,\nVocea ta, un dulce grai.\nMă pierd în tine neîncetat,\nEști tot ce mi-am dorit cu-adevărat.",
              "Prin ploaie și vânt vom păși mereu,\nCăci tu ești sufletul din mine, iar eu sunt al tău.\nO dragoste rară, un dor infinit,\nCu tine alături mă simt împlinit."
            ];
            const fallbackPoemsEN = [
              "The stars above begin to dance,\nWhen I am caught within your trance.\nEvery dream becomes so bright,\nYou are my heart, my guiding light.",
              "You are my morning's gentle sun,\nWith you, my life has just begun.\nIn your sweet eyes, I find my peace,\nA love so deep it will not cease.",
              "I searched the universe far and wide,\nBut found my treasure by your side.\nYou are the calm in every storm,\nWith you I'm safe, with you I'm warm.",
              "Your smile is like a piece of art,\nYour voice a melody for the heart.\nI lose myself in you each day,\nI love you more than words can say.",
              "Through wind and rain we'll walk as one,\nOur beautiful journey has just begun.\nA rare romance, an endless sea,\nYou are the only one for me."
            ];
            
            const list = langKey === 'en' ? fallbackPoemsEN : fallbackPoemsRO;
            setQuote(list[dayOfYear % list.length]);
          }
        } catch (fallbackErr) {
          console.error('Fallback quote failed:', fallbackErr);
          setQuote(langKey === 'en' ? "I love you endlessly. ❤️" : "Te iubesc la infinit. ❤️");
        }
      }
      setLoading(false);
    };

    generateDailyPoem();
  }, [coupleId, language]);

  return { quote, loading };
}

// ==========================================
// Hook: Custom Coupons
// ==========================================
export function useCustomCoupons() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'couples', coupleId, CUSTOM_COUPONS_COL), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.docs.forEach(docSnap => {
        const item = { id: docSnap.id, ...docSnap.data() };
        
        // Resetam cuponul zilnic daca a fost folosit in zilele anterioare
        let usedDate = item.usedAt ? new Date(item.usedAt).toDateString() : null;
        const today = new Date().toDateString();
        
        if (item.isUsed && usedDate && usedDate !== today) {
          updateDoc(doc(db, 'couples', coupleId, CUSTOM_COUPONS_COL, docSnap.id), {
            isUsed: false,
            usedAt: null,
            note: null
          });
          item.isUsed = false;
          item.usedAt = null;
          item.note = null;
        }
        
        data.push(item);
      });
      setCoupons(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [coupleId]);

  const addCoupon = async (couponData) => {
    await addDoc(collection(db, 'couples', coupleId, CUSTOM_COUPONS_COL), {
      ...couponData,
      isUsed: false,
      usedAt: null,
      note: null,
      createdAt: new Date().toISOString()
    });
  };

  const useCoupon = async (id, note) => {
    await updateDoc(doc(db, 'couples', coupleId, CUSTOM_COUPONS_COL, id), {
      isUsed: true,
      usedAt: new Date().toISOString(),
      note: note || ''
    });
  };

  const deleteCoupon = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, CUSTOM_COUPONS_COL, id));
  };

  return { coupons, addCoupon, useCoupon, deleteCoupon, loading };
}

// ==========================================
// Hook: Drawings Inbox
// ==========================================
export function useDrawings() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;

  const [drawings, setDrawings] = useState([]);

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, 'drawings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setDrawings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [coupleId]);

  const sendDrawing = async (imageData, authorRole, targetRole) => {
    await addDoc(collection(db, 'couples', coupleId, 'drawings'), {
      image: imageData,
      author: authorRole,
      target: targetRole,
      createdAt: new Date().toISOString()
    });
  };

  const deleteDrawing = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, 'drawings', id));
  };

  return { drawings, sendDrawing, deleteDrawing };
}

// ==========================================
// Hook: Unread Messages Count
// ==========================================
export function useUnreadMessagesCount(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [count, setCount] = useState(0);

  useEffect(() => {
    const partnerRole = role === 'his' ? 'her' : 'his';
    // Observăm doar mesajele trimise de partener care nu sunt citite
    const q = query(
      collection(db, 'couples', coupleId, MESSAGES_COL),
      where('sender', '==', partnerRole),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [role]);

  return count;
}

// ============== MOVIES PREFERENCES & SEARCH ==============
export const saveMoviePreference = async (role, movie, preference, coupleId) => {
  try {
    // Folosim un prefix diferit pentru watchlist vs like/dislike, 
    // ca să nu se suprascrie una pe cealaltă!
    const docPrefix = preference === 'watchlist' ? 'watchlist' : 'vote';
    const prefRef = doc(db, 'couples', coupleId, 'movie_preferences', `${role}_${docPrefix}_${movie.id}`);
    await setDoc(prefRef, {
      role,
      movieId: movie.id,
      title: movie.title || movie.name,
      poster_path: movie.poster_path,
      genres: movie.genres || [],
      preference,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving movie pref", error);
  }
};

export const removeMoviePreference = async (role, movieId, coupleId, preferenceType = 'watchlist') => {
  try {
    const docPrefix = preferenceType === 'watchlist' ? 'watchlist' : 'vote';
    const newFormatRef = doc(db, 'couples', coupleId, 'movie_preferences', `${role}_${docPrefix}_${movieId}`);
    const oldFormatRef = doc(db, 'couples', coupleId, 'movie_preferences', `${role}_${movieId}`);

    // Ștergem ambele variante ca să prindem și datele vechi
    await deleteDoc(newFormatRef);
    await deleteDoc(oldFormatRef);
  } catch (error) {
    console.error("Error removing movie pref", error);
  }
};

export function useWatchlistMovies(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [watchlistMovies, setWatchlistMovies] = useState([]);

  useEffect(() => {
    if (!role) return;
    const q = query(
      collection(db, 'couples', coupleId, 'movie_preferences'),
      where('role', '==', role),
      where('preference', '==', 'watchlist')
    );
    const unsub = onSnapshot(q, (snap) => {
      const movies = snap.docs.map(doc => ({
        id: doc.data().movieId,
        ...doc.data()
      }));
      // Sort by timestamp desc locally
      movies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setWatchlistMovies(movies);
    });
    return () => unsub();
  }, [role]);

  return watchlistMovies;
}

export function useMoviePreferences(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [likedGenres, setLikedGenres] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [dislikedIds, setDislikedIds] = useState([]);

  useEffect(() => {
    if (!role) return;
    const q = query(
      collection(db, 'couples', coupleId, 'movie_preferences'),
      where('role', '==', role)
      // scoatem where('preference', '==', 'like') pentru a aduce și dislikes
    );
    const unsub = onSnapshot(q, (snap) => {
      const allGenres = [];
      const likes = [];
      const dislikes = [];

      snap.forEach(d => {
        const data = d.data();
        if (data.preference === 'like') {
          likes.push(data.movieId);
          if (data.genres) {
            data.genres.forEach(g => allGenres.push(g.id));
          }
        } else if (data.preference === 'dislike') {
          dislikes.push(data.movieId);
        }
      });
      // Calculate top 3 genres
      const counts = allGenres.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      setLikedGenres(sorted.slice(0, 3));
      setLikedIds(likes);
      setDislikedIds(dislikes);
    });
    return () => unsub();
  }, [role]);

  return { likedGenres, likedIds, dislikedIds };
}

export function useMovieSearches(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [searches, setSearches] = useState([]);

  useEffect(() => {
    if (!role) return;
    const ref = doc(db, 'system', `searches_${role}`);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSearches(snap.data().history || []);
      } else {
        setSearches([]);
      }
    });
    return () => unsub();
  }, [role]);

  const addSearch = async (queryStr) => {
    if (!queryStr.trim()) return;
    try {
      const ref = doc(db, 'system', `searches_${role}`);
      const snap = await getDoc(ref);
      let history = snap.exists() ? snap.data().history || [] : [];
      // Remove if exists to put it at the top
      history = history.filter(s => s.toLowerCase() !== queryStr.toLowerCase());
      history.unshift(queryStr);
      if (history.length > 10) history = history.slice(0, 10); // Keep last 10
      await setDoc(ref, { history });
    } catch (e) { console.error(e); }
  };

  const removeSearch = async (queryStr) => {
    try {
      const ref = doc(db, 'system', `searches_${role}`);
      const newHistory = searches.filter(s => s !== queryStr);
      await setDoc(ref, { history: newHistory });
    } catch (e) { console.error(e); }
  };

  return { searches, addSearch, removeSearch };
}
// Hook: Chat (Private Messages)
// ==========================================
export function useChat(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [messages, setMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Ascultare mesaje
  useEffect(() => {
    const q = query(collection(db, 'couples', coupleId, MESSAGES_COL), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Ascultare Typing Status
  useEffect(() => {
    let lastPartnerTimestamp = 0;
    const dRef = doc(db, 'couples', coupleId, SYSTEM_COL, 'typing_status');
    const unsubscribe = onSnapshot(dRef, (dSnap) => {
      if (dSnap.exists()) {
        const data = dSnap.data();
        const partnerRole = role === 'his' ? 'her' : 'his';
        lastPartnerTimestamp = data[partnerRole] || 0;
        setPartnerTyping(Date.now() - lastPartnerTimestamp < 3000);
      }
    });

    const interval = setInterval(() => {
      setPartnerTyping(Date.now() - lastPartnerTimestamp < 3000);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [role, coupleId]);

  // Trimite mesaj
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    await addDoc(collection(db, 'couples', coupleId, MESSAGES_COL), {
      type: 'text',
      text: text.trim(),
      sender: role,
      timestamp: new Date().toISOString(),
      read: false,
      reaction: null
    });
  };

  // Trimite sticker
  const sendSticker = async (stickerUrl) => {
    if (!stickerUrl) return;
    await addDoc(collection(db, 'couples', coupleId, MESSAGES_COL), {
      type: 'sticker',
      stickerUrl,
      sender: role,
      timestamp: new Date().toISOString(),
      read: false,
      reaction: null
    });
  };

  // Setează isTyping
  const setTyping = async () => {
    const dRef = doc(db, 'couples', coupleId, SYSTEM_COL, 'typing_status');
    await setDoc(dRef, { [role]: Date.now() }, { merge: true });
  };

  // Marchează mesajele primite ca citite
  const markAsRead = async () => {
    const partnerRole = role === 'his' ? 'her' : 'his';
    const unreadMessages = messages.filter(m => m.sender === partnerRole && !m.read);

    if (unreadMessages.length > 0) {
      const readAt = new Date().toISOString();
      await Promise.all(
        unreadMessages.map(m => updateDoc(doc(db, 'couples', coupleId, MESSAGES_COL, m.id), {
          read: true,
          readAt: readAt
        }))
      );
    }
  };

  // Adaugă/Șterge o reacție (long press)
  const setReaction = async (messageId, emoji) => {
    const dRef = doc(db, 'couples', coupleId, MESSAGES_COL, messageId);
    await updateDoc(dRef, { reaction: emoji });
  };

  return {
    messages,
    partnerTyping,
    sendMessage,
    sendSticker,
    setTyping,
    markAsRead,
    setReaction,
    loading
  };
}

// ==========================================
// Hook: App Version Checker
// ==========================================
export function useAppVersion() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [latestVersion, setLatestVersion] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Variabila care definește versiunea locală. 
  // Schimbă aici la următorul build (ex: "1.0.1")
  // Ruleaza apoi: npm run build && npx cap sync
  // Pune in google drive noul .apk
  // Pune versiunea curenta in system.app_version in firebase
  const localVersion = "1.0.0";

  useEffect(() => {
    const dRef = doc(db, 'system', 'app_version');
    const unsubscribe = onSnapshot(dRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLatestVersion(data.version);
        setDownloadUrl(data.downloadUrl);
      }
    });
    return () => unsubscribe();
  }, []);

  return { latestVersion, downloadUrl, localVersion };
}

// ==========================================
// Hook: To-Do List (Personal)
// ==========================================
export function useTodos(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;
  const loadingAuth = auth?.isLoading;

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) return;
    const q = query(
      collection(db, 'couples', coupleId, 'todos'),
      where('role', '==', role)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodos(data);
      setLoading(false);

      // Update data for widgets
      if (Capacitor.isNativePlatform()) {
        Preferences.set({ key: 'widget_todos', value: JSON.stringify(data) })
          .then(updateWidgets)
          .catch(console.error);
      }
    }, (error) => {
      console.error("Eroare la încărcarea To-Do list:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const addTodo = async (todoData) => {
    await addDoc(collection(db, 'couples', coupleId, 'todos'), {
      ...todoData,
      role,
      isCompleted: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    });
  };

  const updateTodo = async (id, updates) => {
    await updateDoc(doc(db, 'couples', coupleId, 'todos', id), updates);
  };

  const toggleTodoStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, 'couples', coupleId, 'todos', id), {
      isCompleted: !currentStatus,
      completedAt: !currentStatus ? new Date().toISOString() : null
    });
  };

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, 'couples', coupleId, 'todos', id));
  };

  return { todos, addTodo, updateTodo, toggleTodoStatus, deleteTodo, loading };
}
