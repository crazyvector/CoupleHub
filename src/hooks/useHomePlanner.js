import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { useGlobalAuth } from '../contexts/AuthContext';

const HOME_ITEMS_COL = 'home_items';

/**
 * Schema for an item:
 * {
 *   id: string,
 *   title: string,
 *   link: string (optional),
 *   imageUrl: string (optional),
 *   price: string (optional),
 *   room: string (e.g. 'bucatarie'),
 *   tags: string[] (e.g. ['mobila', 'tehnologie']),
 *   addedBy: 'his' | 'her',
 *   likes: { his: boolean|null, her: boolean|null },
 *   comments: [ { sender: 'his', text: '...', timestamp: Date.now() } ],
 *   createdAt: timestamp
 * }
 */

export function useHomeItems() {
  const auth = useGlobalAuth();
  const coupleId = auth?.coupleId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, HOME_ITEMS_COL), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching home items:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [coupleId]);

  const addItem = async (itemData) => {
    if (!coupleId) return;
    await addDoc(collection(db, 'couples', coupleId, HOME_ITEMS_COL), {
      createdAt: serverTimestamp(),
      likes: { his: null, her: null },
      comments: [],
      ...itemData
    });
  };

  const deleteItem = async (id) => {
    if (!coupleId) return;
    await deleteDoc(doc(db, 'couples', coupleId, HOME_ITEMS_COL, id));
  };

  const updateItem = async (id, data) => {
    if (!coupleId) return;
    await updateDoc(doc(db, 'couples', coupleId, HOME_ITEMS_COL, id), data);
  };

  const setItemLike = async (id, role, isLiked) => {
    if (!coupleId) return;
    // isLiked can be true (aprob), false (resping), or null (pending)
    await updateDoc(doc(db, 'couples', coupleId, HOME_ITEMS_COL, id), {
      [`likes.${role}`]: isLiked
    });
  };

  const addComment = async (id, role, text) => {
    if (!coupleId) return;
    const newComment = {
      sender: role,
      text,
      timestamp: Date.now()
    };
    await updateDoc(doc(db, 'couples', coupleId, HOME_ITEMS_COL, id), {
      comments: arrayUnion(newComment)
    });
  };

  return { items, addItem, deleteItem, updateItem, setItemLike, addComment, loading };
}
