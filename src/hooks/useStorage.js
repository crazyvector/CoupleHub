import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useGlobalAuth } from '../contexts/AuthContext';

const MAX_STORAGE_BYTES = 1073741824; // 1GB

export function useStorage() {
  const { t } = useLanguage();
  const { coupleId } = useGlobalAuth();
  const storage = getStorage();
  const [isUploading, setIsUploading] = useState(false);

  const checkStorageLimit = async (fileSize) => {
    if (!coupleId) return false;
    const coupleRef = doc(db, 'couples', coupleId);
    const snap = await getDoc(coupleRef);
    const currentUsage = snap.exists() ? (snap.data().storageBytes || 0) : 0;
    
    if (currentUsage + fileSize > MAX_STORAGE_BYTES) {
      alert(t('alerts.storageLimit'));
      return false;
    }
    return true;
  };

  const uploadFile = async (file, path) => {
    if (!coupleId) return null;
    
    // Check limits
    const allowed = await checkStorageLimit(file.size);
    if (!allowed) return null;

    setIsUploading(true);
    try {
      const fullPath = `couples/${coupleId}/${path}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fullPath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update couple's storage counter
      const coupleRef = doc(db, 'couples', coupleId);
      await setDoc(coupleRef, { storageBytes: increment(file.size) }, { merge: true });

      setIsUploading(false);
      return { url: downloadURL, path: fullPath, size: file.size };
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      return null;
    }
  };

  const removeFile = async (path, fileSize) => {
    if (!coupleId || !path) return;
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);

      // Decrement storage counter
      const coupleRef = doc(db, 'couples', coupleId);
      await updateDoc(coupleRef, { storageBytes: increment(-fileSize) });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const [storageBytes, setStorageBytes] = useState(0);

  useEffect(() => {
    if (!coupleId) return;
    import('firebase/firestore').then(({ onSnapshot }) => {
      const unsub = onSnapshot(doc(db, 'couples', coupleId), (d) => {
        if (d.exists()) {
          setStorageBytes(d.data().storageBytes || 0);
        }
      });
      return () => unsub();
    });
  }, [coupleId]);

  return { uploadFile, removeFile, isUploading, storageBytes };
}
