import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc,
} from "firebase/firestore";

// Subscribes to a Firestore collection in real time.
// If the collection is empty on first load, seeds it with the given seed data
// (useful so the app isn't blank the very first time it connects to a fresh
// Firebase project).
export function useCollection(name, seedData = []) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    const colRef = collection(db, name);

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (snap.empty && !seededRef.current && seedData.length > 0) {
          seededRef.current = true;
          seedData.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(db, name, id), rest).catch((err) =>
              console.error(`Seed write failed for ${name}:`, err)
            );
          });
          return; // onSnapshot will fire again once the seed writes land
        }
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setReady(true);
      },
      (err) => {
        console.error(`Firestore read error on "${name}":`, err);
        setReady(true);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const addItem = useCallback(
    (payload) => addDoc(collection(db, name), payload),
    [name]
  );
  const updateItem = useCallback(
    (id, payload) => updateDoc(doc(db, name, id), payload),
    [name]
  );
  const deleteItem = useCallback(
    (id) => deleteDoc(doc(db, name, id)),
    [name]
  );

  return { items, addItem, updateItem, deleteItem, ready };
}

// Subscribes to a single settings document (used for categories + budgets,
// which live together as one small config object rather than a collection).
export function useConfigDoc(defaults) {
  const [config, setConfig] = useState(defaults);
  const [ready, setReady] = useState(false);
  const seededRef = useRef(false);
  const refDoc = doc(db, "settings", "config");

  useEffect(() => {
    const unsub = onSnapshot(
      refDoc,
      (snap) => {
        if (!snap.exists() && !seededRef.current) {
          seededRef.current = true;
          setDoc(refDoc, defaults).catch((err) =>
            console.error("Seed write failed for settings/config:", err)
          );
          return;
        }
        if (snap.exists()) setConfig(snap.data());
        setReady(true);
      },
      (err) => {
        console.error("Firestore read error on settings/config:", err);
        setReady(true);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateConfig = useCallback(
    (patch) => setDoc(refDoc, patch, { merge: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { config, updateConfig, ready };
}
