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
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const colName = role ? `moods_${role}` : 'moods_unknown';

  useEffect(() => {
    if (!role) { setLoading(false); return; }
    const q = query(collection(db, colName), orderBy('timestamp', 'desc'));
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
    await addDoc(collection(db, colName), {
      ...moodData,
      timestamp: new Date().toISOString()
    });
  };

  const clearMoods = async () => {
    const snapshot = await getDocs(query(collection(db, colName)));
    const batch = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(batch);
  };

  const deleteMood = async (id) => {
    await deleteDoc(doc(db, colName, id));
  };

  return { moods, addMood, clearMoods, deleteMood, loading };
}

// ==========================================
// Hook: Diary (Specific per rol)
// ==========================================
export function useDiary(role) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 'diary_her' sau 'diary_his'
  const colName = role ? `diary_${role}` : 'diary_unknown';

  useEffect(() => {
    if (!role) { setLoading(false); return; }
    const q = query(collection(db, colName), orderBy('timestamp', 'desc'));
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
    await addDoc(collection(db, colName), {
      encrypted: encryptedContent,
      preview,
      wordCount,
      timestamp: new Date().toISOString()
    });
  };

  const deleteEntry = async (id) => {
    await deleteDoc(doc(db, colName, id));
  };

  return { entries, addEntry, deleteEntry, loading };
}

// ==========================================
// Hook: Events (Calendar)
// ==========================================
export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, EVENTS_COL), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Punem ...doc.data() primul pentru ca id: doc.id sa suprascrie orice 'id' salvat din greseala in document
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setEvents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addEvent = async (eventData) => {
    // Nu salvam field-ul 'id' in interiorul bazei de date
    const { id, ...dataToSave } = eventData;
    await addDoc(collection(db, EVENTS_COL), {
      ...dataToSave,
      createdAt: new Date().toISOString()
    });
  };

  const deleteEvent = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, EVENTS_COL, id));
  };

  const updateEvent = async (id, eventData) => {
    const { id: _id, ...dataWithoutId } = eventData;
    if (!id) return;
    await setDoc(doc(db, EVENTS_COL, id), {
      ...dataWithoutId,
      updatedAt: new Date().toISOString()
    });
  };

  return { events, addEvent, deleteEvent, updateEvent, loading };
}

// ==========================================
// Util: System State (Coupons, Scratch)
// ==========================================
export function useSystemState() {
  const [systemState, setSystemState] = useState({ coupons: {}, scratchCards: {}, customCompliments: {}, barista: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe1 = onSnapshot(doc(db, SYSTEM_COL, 'coupons'), (d) => {
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
          setDoc(doc(db, SYSTEM_COL, 'coupons'), updatedCoupons);
        }
        setSystemState(prev => ({ ...prev, coupons: updatedCoupons }));
      }
      else {
        setSystemState(prev => ({ ...prev, coupons: {} }));
      }
    });

    const unsubscribe2 = onSnapshot(doc(db, SYSTEM_COL, 'scratchCards'), (d) => {
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
          setDoc(doc(db, SYSTEM_COL, 'scratchCards'), {
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

    const unsubscribe3 = onSnapshot(doc(db, SYSTEM_COL, 'compliments'), (d) => {
      if (d.exists()) {
        setSystemState(prev => ({ ...prev, customCompliments: d.data() }));
      } else {
        setSystemState(prev => ({ ...prev, customCompliments: {} }));
      }
    });

    const unsubscribe4 = onSnapshot(doc(db, SYSTEM_COL, 'barista'), (d) => {
      if (d.exists()) {
        setSystemState(prev => ({ ...prev, barista: d.data() }));
      } else {
        setSystemState(prev => ({ ...prev, barista: {} }));
      }
    });

    return () => { unsubscribe1(); unsubscribe2(); unsubscribe3(); unsubscribe4(); };
  }, []);



  const setCouponUsed = async (couponId, note) => {
    await setDoc(doc(db, SYSTEM_COL, 'coupons'), {
      [couponId]: { usedAt: new Date().toISOString(), note }
    }, { merge: true });
  };

  const resetCoupons = async () => {
    await setDoc(doc(db, SYSTEM_COL, 'coupons'), {});
  };

  const setScratchRevealed = async (role, revealed) => {
    if (!role) {
      await setDoc(doc(db, SYSTEM_COL, 'scratchCards'), {
        his: { revealed: false, revealedAt: null },
        her: { revealed: false, revealedAt: null },
        customCard: null
      }, { merge: true });
    } else {
      await setDoc(doc(db, SYSTEM_COL, 'scratchCards'), {
        [role]: {
          revealed,
          revealedAt: revealed ? new Date().toISOString() : null
        }
      }, { merge: true });
    }
  };

  const setSystemStateDirectly = async (data) => {
    await setDoc(doc(db, SYSTEM_COL, 'coupons'), data.coupons || {});
  };

  const setCustomCompliment = async (targetRole, text) => {
    await setDoc(doc(db, SYSTEM_COL, 'compliments'), {
      [targetRole]: text
    }, { merge: true });
  };

  const incrementBaristaCount = async (role) => {
    const docRef = doc(db, SYSTEM_COL, 'barista');
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
    await setDoc(doc(db, SYSTEM_COL, 'barista'), {});
  };

  const setCustomScratchCard = async (customCard) => {
    await setDoc(doc(db, SYSTEM_COL, 'scratchCards'), {
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
  const [notifications, setNotifications] = useState([]);
  const isInitialLoad = useRef(true);
  const permissionChecked = useRef(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && !permissionChecked.current) {
      LocalNotifications.requestPermissions().then((res) => {
        permissionChecked.current = true;
      });
    }
  }, []);

  useEffect(() => {
    if (!currentRole) return;
    const q = query(collection(db, NOTIFICATIONS_COL), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const mine = all.filter(n => !n.targetRole || n.targetRole === currentRole);
      setNotifications(mine);

      // Verificăm dacă sunt documente adăugate recent (doar după load-ul inițial)
      if (!isInitialLoad.current && Capacitor.isNativePlatform()) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const target = data.targetRole || (data.sender === 'his' ? 'her' : 'his');
            if (target === currentRole && data.sender !== currentRole) {
              // Trimite notificare locală
              LocalNotifications.schedule({
                notifications: [
                  {
                    title: data.title || 'Notificare nouă',
                    body: data.body || '',
                    id: Math.floor(Math.random() * 2000000000)
                  }
                ]
              });
            }
          }
        });
      }

      isInitialLoad.current = false;
    });
    return () => unsubscribe();
  }, [currentRole]);

  const addNotification = async (title, body, sender, customTargetRole) => {
    const targetRole = customTargetRole || (sender === 'his' ? 'her' : 'his');
    await addDoc(collection(db, NOTIFICATIONS_COL), {
      title,
      body,
      sender,
      targetRole, // cui ii este destinata
      readBy: [],
      timestamp: new Date().toISOString()
    });
  };

  const markAsRead = async (id, role) => {
    const dRef = doc(db, NOTIFICATIONS_COL, id);
    const dSnap = await getDoc(dRef);
    if (dSnap.exists()) {
      const currentReaders = dSnap.data().readBy || [];
      if (!currentReaders.includes(role)) {
        await updateDoc(dRef, { readBy: [...currentReaders, role] });
      }
    }
  };

  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, NOTIFICATIONS_COL, id));
  };

  return { notifications, addNotification, markAsRead, deleteNotification };
}

// ==========================================
// Hook: Profiles
// ==========================================
export function useProfiles(role) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role || role === 'admin') {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, PROFILES_COL, role), (d) => {
      if (d.exists()) setProfile({ id: d.id, ...d.data() });
      else setProfile(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  const updateProfile = async (data) => {
    await setDoc(doc(db, PROFILES_COL, role), data, { merge: true });
  };

  return { profile, updateProfile, loading };
}

// ==========================================
// Hook: Memories (Cu suport pentru imagini)
// ==========================================
export function useMemories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, MEMORIES_COL), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addMemory = async (memoryData) => {
    await addDoc(collection(db, MEMORIES_COL), {
      ...memoryData,
      reactions: [],
      timestamp: new Date().toISOString()
    });
  };

  const updateMemory = async (id, data) => {
    await updateDoc(doc(db, MEMORIES_COL, id), data);
  };

  const addReaction = async (id, reaction) => {
    const dRef = doc(db, MEMORIES_COL, id);
    const dSnap = await getDoc(dRef);
    if (dSnap.exists()) {
      const current = dSnap.data().reactions || [];
      await updateDoc(dRef, { reactions: [...current, reaction] });
    }
  };

  const deleteMemory = async (id) => {
    await deleteDoc(doc(db, MEMORIES_COL, id));
  };

  return { memories, addMemory, updateMemory, addReaction, deleteMemory, loading };
}

// ==========================================
// Hook: Coupons (Definitions)
// ==========================================
export function useCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'couponsList'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addCoupon = async (data) => {
    await addDoc(collection(db, 'couponsList'), data);
  };

  const deleteCoupon = async (id) => {
    await deleteDoc(doc(db, 'couponsList', id));
  };

  return { coupons, addCoupon, deleteCoupon, loading };
}

// ==========================================
// Hook: Wheel Items (Spinners)
// ==========================================
export function useWheelItems(wheelType) { // 'food' or 'date'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wheelType) return;
    const colName = `wheel_${wheelType}`;
    const q = query(collection(db, colName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [wheelType]);

  const addItem = async (data) => {
    const colName = `wheel_${wheelType}`;
    await addDoc(collection(db, colName), data);
  };

  const deleteItem = async (id) => {
    const colName = `wheel_${wheelType}`;
    await deleteDoc(doc(db, colName, id));
  };

  return { items, addItem, deleteItem, loading };
}

// ==========================================
// Hook: Daily Quote (Surpriza Zilei cu citate din DB)
// ==========================================
export function useDailyQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const now = new Date();
        const targetTime = new Date(now);
        // Dacă e înainte de ora 8:00 dimineața, folosim citatul de ieri
        if (now.getHours() < 8) {
          targetTime.setDate(targetTime.getDate() - 1);
        }

        const start = new Date(targetTime.getFullYear(), 0, 0);
        const diff = targetTime - start;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        // 100 citate în baza de date
        const quoteIndex = dayOfYear % 100;

        const q = query(collection(db, 'daily_quotes'));
        const snapshot = await getDocs(q);
        const allQuotes = snapshot.docs.map(d => d.data());

        if (allQuotes.length > 0) {
          const indexToUse = dayOfYear % allQuotes.length;
          const found = allQuotes.find(q => q.index === indexToUse) || allQuotes[0];
          setQuote(found.text);
        }
      } catch (err) {
        console.error("Eroare la preluarea citatului:", err);
      }
      setLoading(false);
    };

    fetchQuote();
  }, []);

  return { quote, loading };
}

// ==========================================
// Hook: Custom Coupons
// ==========================================
export function useCustomCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, CUSTOM_COUPONS_COL), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => {
        const item = { id: docSnap.id, ...docSnap.data() };
        if (item.isUsed && item.usedAt) {
          const usedDate = new Date(item.usedAt).toDateString();
          if (usedDate !== new Date().toDateString()) {
            // S-a folosit în altă zi, deci se resetează azi!
            updateDoc(doc(db, CUSTOM_COUPONS_COL, docSnap.id), { isUsed: false, usedAt: null, note: null });
            item.isUsed = false;
          }
        }
        return item;
      });
      setCoupons(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addCoupon = async (couponData) => {
    await addDoc(collection(db, CUSTOM_COUPONS_COL), {
      ...couponData,
      isUsed: false,
      usedAt: null,
      note: null,
      createdAt: new Date().toISOString()
    });
  };

  const useCoupon = async (id, note) => {
    await updateDoc(doc(db, CUSTOM_COUPONS_COL, id), {
      isUsed: true,
      usedAt: new Date().toISOString(),
      note: note || ''
    });
  };

  const deleteCoupon = async (id) => {
    await deleteDoc(doc(db, CUSTOM_COUPONS_COL, id));
  };

  return { coupons, addCoupon, useCoupon, deleteCoupon, loading };
}

// ==========================================
// Hook: Unread Messages Count
// ==========================================
export function useUnreadMessagesCount(role) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const partnerRole = role === 'his' ? 'her' : 'his';
    // Observăm doar mesajele trimise de partener care nu sunt citite
    const q = query(
      collection(db, MESSAGES_COL),
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
// Hook: Chat (Private Messages)
// ==========================================
export function useChat(role) {
  const [messages, setMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Ascultare mesaje
  useEffect(() => {
    const q = query(collection(db, MESSAGES_COL), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Ascultare Typing Status
  useEffect(() => {
    const dRef = doc(db, SYSTEM_COL, 'typing_status');
    const unsubscribe = onSnapshot(dRef, (dSnap) => {
      if (dSnap.exists()) {
        const data = dSnap.data();
        const partnerRole = role === 'his' ? 'her' : 'his';
        const partnerTimestamp = data[partnerRole] || 0;
        // Consideram typing activ doar daca a tastat in ultimele 3 secunde
        setPartnerTyping(Date.now() - partnerTimestamp < 3000);
      }
    });
    return () => unsubscribe();
  }, [role]);

  // Trimite mesaj
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    await addDoc(collection(db, MESSAGES_COL), {
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
    await addDoc(collection(db, MESSAGES_COL), {
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
    const dRef = doc(db, SYSTEM_COL, 'typing_status');
    await setDoc(dRef, { [role]: Date.now() }, { merge: true });
  };

  // Marchează mesajele primite ca citite
  const markAsRead = async () => {
    const partnerRole = role === 'his' ? 'her' : 'his';
    const unreadMessages = messages.filter(m => m.sender === partnerRole && !m.read);

    if (unreadMessages.length > 0) {
      const readAt = new Date().toISOString();
      await Promise.all(
        unreadMessages.map(m => updateDoc(doc(db, MESSAGES_COL, m.id), {
          read: true,
          readAt: readAt
        }))
      );
    }
  };

  // Adaugă/Șterge o reacție (long press)
  const setReaction = async (messageId, emoji) => {
    const dRef = doc(db, MESSAGES_COL, messageId);
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
  const [latestVersion, setLatestVersion] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Variabila care definește versiunea locală. 
  // Schimbă aici la următorul build (ex: "1.0.1")
  // Ruleaza apoi: npm run build && npx cap sync
  // Pune in google drive noul .apk
  // Pune versiunea curenta in system.app_version in firebase
  const localVersion = "1.0.8";

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
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) return;
    const q = query(
      collection(db, 'todos'),
      where('role', '==', role)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodos(data);
      setLoading(false);
    }, (error) => {
      console.error("Eroare la încărcarea To-Do list:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const addTodo = async (todoData) => {
    await addDoc(collection(db, 'todos'), {
      ...todoData,
      role,
      isCompleted: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    });
  };

  const updateTodo = async (id, updates) => {
    await updateDoc(doc(db, 'todos', id), updates);
  };

  const toggleTodoStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, 'todos', id), {
      isCompleted: !currentStatus,
      completedAt: !currentStatus ? new Date().toISOString() : null
    });
  };

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, 'todos', id));
  };

  return { todos, addTodo, updateTodo, toggleTodoStatus, deleteTodo, loading };
}
