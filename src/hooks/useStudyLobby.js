import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { updateWidgets } from '../utils/widgetUpdater';
import { useGlobalAuth } from '../contexts/AuthContext';

const STUDY_LOBBY_COL = 'study_lobby';
const STUDY_TASKS_COL = 'study_tasks';

const BONSAI_STAGES = [
  { id: 'seed',      label: 'studyLobby.stageSeed',           minXP: 0,    emoji: '🌱' },
  { id: 'sprout',    label: 'studyLobby.stageSprout',         minXP: 51,   emoji: '🌿' },
  { id: 'bush',      label: 'studyLobby.stageBush',           minXP: 201,  emoji: '🪴' },
  { id: 'tree',      label: 'studyLobby.stageTree',           minXP: 501,  emoji: '🌲' },
  { id: 'blossom',   label: 'studyLobby.stageBlossom',        minXP: 1001, emoji: '🌸' },
  { id: 'legendary', label: 'studyLobby.stageLegendary',      minXP: 2001, emoji: '✨' }
];

function getBonsaiStage(xp) {
  let stage = BONSAI_STAGES[0];
  for (const s of BONSAI_STAGES) {
    if (xp >= s.minXP) stage = s;
  }
  return stage;
}

function getNextStage(xp) {
  for (const s of BONSAI_STAGES) {
    if (xp < s.minXP) return s;
  }
  return null; // Max stage
}

// ==========================================
// Hook: Study Lobby (Bonsai + Timer + Presence)
// ==========================================
export function useStudyLobby(role) {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;

  const [lobbyData, setLobbyData] = useState({
    bonsaiXP: 0,
    bonsaiStage: 'seed',
    sessionsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  // Advanced Timer State
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [totalCycles, setTotalCycles] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Timer state (local per user, not synced)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); // 'work' or 'break'
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedSecondsRef = useRef(25 * 60);

  // Presence
  const [presence, setPresence] = useState({ his: null, her: null });

  // Listen to lobby document
  useEffect(() => {
    if (!coupleId) return;
    const docRef = doc(db, 'couples', coupleId, STUDY_LOBBY_COL, 'shared');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setLobbyData(snapshot.data());
      } else {
        // Initialize if doesn't exist
        setDoc(docRef, {
          bonsaiXP: 0,
          bonsaiStage: 'seed',
          sessionsCompleted: 0,
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [coupleId]);

  // Listen to presence
  useEffect(() => {
    if (!coupleId) return;
    const presRef = doc(db, 'couples', coupleId, STUDY_LOBBY_COL, 'presence');
    const unsubscribe = onSnapshot(presRef, (snapshot) => {
      if (snapshot.exists()) {
        setPresence(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // Heartbeat presence (every 30s)
  useEffect(() => {
    if (!role) return;

    const updatePresence = async (online) => {
      const presRef = doc(db, STUDY_LOBBY_DOC, 'presence');
      await setDoc(presRef, {
        [role]: {
          online,
          lastSeen: Date.now(),
          currentTask: null,
        }
      }, { merge: true });
    };

    updatePresence(true);
    const interval = setInterval(() => updatePresence(true), 10000);

    // On unmount, set offline
    return () => {
      clearInterval(interval);
      updatePresence(false);
    };
  }, [role]);

  // Timer tick using wall-clock time for accuracy
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      pausedSecondsRef.current = timerSeconds;

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = pausedSecondsRef.current - elapsed;

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setTimerSeconds(0);
          handleTimerComplete();
        } else {
          setTimerSeconds(remaining);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode]);

  // Sync state for Native Widgets
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const widgetState = {
        isRunning,
        timerMode,
        remainingSeconds: timerSeconds,
        targetEndTime: isRunning ? Date.now() + timerSeconds * 1000 : null,
        currentCycle,
        totalCycles
      };
      Preferences.set({ key: 'widget_pomodoro', value: JSON.stringify(widgetState) })
        .then(updateWidgets)
        .catch(console.error);
    }
  }, [isRunning, timerMode, currentCycle, totalCycles, sessionCompleted]);

  const handleTimerComplete = async () => {
    if (timerMode === 'work') {
      // Work session completed → add XP
      const partnerRole = role === 'his' ? 'her' : 'his';
      const partnerOnline = presence[partnerRole]?.online &&
        (Date.now() - (presence[partnerRole]?.lastSeen || 0)) < 60000;
      
      const minutesStudied = Math.round(workDuration / 60);
      const xpGain = Math.round(minutesStudied * (partnerOnline ? 1.5 : 1));

      const lobbyRef = doc(db, STUDY_LOBBY_DOC, 'shared');
      const newXP = (lobbyData.bonsaiXP || 0) + xpGain;
      const newStage = getBonsaiStage(newXP);

      await updateDoc(lobbyRef, {
        bonsaiXP: newXP,
        bonsaiStage: newStage.id,
        sessionsCompleted: (lobbyData.sessionsCompleted || 0) + 1,
      });

      // Check cycles
      if (currentCycle >= totalCycles) {
        setSessionCompleted(true);
        setTimerMode('break');
        setTimerSeconds(0);
        setIsRunning(false);
      } else {
        setTimerMode('break');
        setTimerSeconds(breakDuration);
        setIsRunning(true);
      }
    } else {
      // Break completed → back to work
      if (!sessionCompleted) {
        setCurrentCycle(prev => prev + 1);
        setTimerMode('work');
        setTimerSeconds(workDuration);
        setIsRunning(true);
      }
    }
  };

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  
  const resetTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerMode('work');
    setTimerSeconds(workDuration);
    setCurrentCycle(1);
    setSessionCompleted(false);
  };

  const skipToBreak = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentCycle >= totalCycles) {
      setSessionCompleted(true);
      setTimerMode('break');
      setTimerSeconds(0);
    } else {
      setTimerMode('break');
      setTimerSeconds(breakDuration);
    }
  };

  const skipToWork = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!sessionCompleted) {
      setCurrentCycle(prev => prev + 1);
    }
    setTimerMode('work');
    setTimerSeconds(workDuration);
  };

  const updateWorkDuration = (val) => {
    setWorkDuration(val);
    if (!isRunning && timerMode === 'work') setTimerSeconds(val);
  };

  const updateBreakDuration = (val) => {
    setBreakDuration(val);
    if (!isRunning && timerMode === 'break') setTimerSeconds(val);
  };

  const applyPreset = (work, brk) => {
    setWorkDuration(work);
    setBreakDuration(brk);
    if (!isRunning) {
      if (timerMode === 'work') setTimerSeconds(work);
      else setTimerSeconds(brk);
    }
  };

  // Update current task in presence
  const setCurrentTask = async (taskTitle) => {
    if (!coupleId) return;
    const presRef = doc(db, 'couples', coupleId, STUDY_LOBBY_COL, 'presence');
    await setDoc(presRef, {
      [role]: {
        online: true,
        lastSeen: Date.now(),
        currentTask: taskTitle || null,
      }
    }, { merge: true });
  };

  const currentStage = getBonsaiStage(lobbyData.bonsaiXP || 0);
  const nextStage = getNextStage(lobbyData.bonsaiXP || 0);

  return {
    // Bonsai
    bonsaiXP: lobbyData.bonsaiXP || 0,
    bonsaiStage: currentStage,
    nextStage,
    sessionsCompleted: lobbyData.sessionsCompleted || 0,
    bonsaiStages: BONSAI_STAGES,

    // Timer
    timerSeconds,
    isRunning,
    timerMode,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipToWork,

    // Presence
    presence,
    setCurrentTask,
    
    // Config
    workDuration, setWorkDuration: updateWorkDuration,
    breakDuration, setBreakDuration: updateBreakDuration,
    totalCycles, setTotalCycles,
    currentCycle, sessionCompleted,
    applyPreset,

    loading,
  };
}

// ==========================================
// Hook: Study Tasks
// ==========================================
export function useStudyTasks() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, STUDY_TASKS_COL), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [coupleId]);

  const addTask = async (taskData) => {
    if (!coupleId) return;
    await addDoc(collection(db, 'couples', coupleId, STUDY_TASKS_COL), {
      ...taskData,
      createdAt: serverTimestamp(),
    });
  };

  const updateTask = async (id, data) => {
    if (!coupleId) return;
    await updateDoc(doc(db, 'couples', coupleId, STUDY_TASKS_COL, id), data);
  };

  const deleteTask = async (id) => {
    if (!coupleId) return;
    await deleteDoc(doc(db, 'couples', coupleId, STUDY_TASKS_COL, id));
  };

  return { tasks, addTask, updateTask, deleteTask, loading };
}

export { BONSAI_STAGES, getBonsaiStage, getNextStage };
