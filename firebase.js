// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCFhMLKVGJY6-CJISNV25-EA2AvHbeMQPQ",
  authDomain: "family-expense-tracker-260cc.firebaseapp.com",
  databaseURL: "https://family-expense-tracker-260cc-default-rtdb.firebaseio.com",
  projectId: "family-expense-tracker-260cc",
  storageBucket: "family-expense-tracker-260cc.firebasestorage.app",
  messagingSenderId: "588760750864",
  appId: "1:588760750864:web:c32952f8a1cb0b2a2da395",
  measurementId: "G-FEYHZWY7RK",
};

const app = initializeApp(firebaseConfig);

// Firestore (document-based database) — recommended for most apps
export const db = getFirestore(app);

// Realtime Database (agar aap yeh use karna chahte hain instead)
export const rtdb = getDatabase(app);

export default app;