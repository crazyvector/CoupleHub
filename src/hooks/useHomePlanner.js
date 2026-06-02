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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, HOME_ITEMS_COL), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching home items:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addItem = async (itemData) => {
    await addDoc(collection(db, HOME_ITEMS_COL), {
      createdAt: serverTimestamp(),
      likes: { his: null, her: null },
      comments: [],
      ...itemData
    });
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, HOME_ITEMS_COL, id));
  };

  const updateItem = async (id, data) => {
    await updateDoc(doc(db, HOME_ITEMS_COL, id), data);
  };

  const setItemLike = async (id, role, isLiked) => {
    // isLiked can be true (aprob), false (resping), or null (pending)
    await updateDoc(doc(db, HOME_ITEMS_COL, id), {
      [`likes.${role}`]: isLiked
    });
  };

  const addComment = async (id, role, text) => {
    const newComment = {
      sender: role,
      text,
      timestamp: Date.now()
    };
    await updateDoc(doc(db, HOME_ITEMS_COL, id), {
      comments: arrayUnion(newComment)
    });
  };

  return { items, addItem, deleteItem, updateItem, setItemLike, addComment, loading };
}
