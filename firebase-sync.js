// firebase-sync.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// ←– paste in your config here:
const firebaseConfig = {
  apiKey: "AIzaSyBjLMo-wPGEGYcxj4O5NFW2DP-mrA-8EYY",
  authDomain: "checkmark-chord-detector.firebaseapp.com",
  databaseURL: "https://checkmark-chord-detector-default-rtdb.firebaseio.com",
  projectId: "checkmark-chord-detector",
  storageBucket: "checkmark-chord-detector.firebasestorage.app",
  messagingSenderId: "117276696296",
  appId: "1:117276696296:web:6c6172874bc90dc94ab35d",
  measurementId: "G-NXVRWBJ2HM"
};

// initialize
const app      = initializeApp(firebaseConfig);
const database = getDatabase(app);
const params   = new URLSearchParams(window.location.search);
const session  = params.get("session") || "default";
const notesRef = ref(database, `sessions/${session}/notes`);

window.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Monkey-patch your existing updateActiveNotes
  if (typeof window.updateActiveNotes !== "function") {
    console.warn("[firebase-sync] updateActiveNotes() not found on window");
  } else {
    const origUpdate = window.updateActiveNotes.bind(window);
    window.updateActiveNotes = (note, on) => {
      origUpdate(note, on);
      // push to Firebase
      set(notesRef, { notes: Array.from(window.activeNotes) });
    };
  }

  // 2️⃣ Listen for remote changes
  onValue(notesRef, snap => {
    const data = snap.val()?.notes;
    if (Array.isArray(data)) {
      window.activeNotes = new Set(data);
      if (typeof window.render === "function") window.render();
    }
  });
});
