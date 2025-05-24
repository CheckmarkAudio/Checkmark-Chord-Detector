// firebase-sync.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// ←– your chord-detector Firebase config
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

// initialize Firebase
const app      = initializeApp(firebaseConfig);
const database = getDatabase(app);
const params   = new URLSearchParams(window.location.search);
const session  = params.get("session") || "default";
const notesRef = ref(database, `sessions/${session}/notes`);

window.addEventListener("DOMContentLoaded", () => {
  // — wrap the original MIDI callbacks so they also write to Firebase
  if (typeof window.onNoteOn === "function" && typeof window.onNoteOff === "function") {
    // keep references to the originals
    const origOn  = window.onNoteOn;
    const origOff = window.onNoteOff;

    // override onNoteOn and onNoteOff
    window.onNoteOn = cb => origOn(n => {
      cb(n);  // your chord detector sees the note
      set(notesRef, { notes: Array.from(window.activeNotes) });
    });

    window.onNoteOff = cb => origOff(n => {
      cb(n);  // your chord detector removes the note
      set(notesRef, { notes: Array.from(window.activeNotes) });
    });
  } else {
    console.warn("[firebase-sync] MIDI hooks not found—make sure onNoteOn/Off are globals");
  }

  // — subscribe to remote changes and re-render
  onValue(notesRef, snap => {
    const data = snap.val()?.notes;
    if (Array.isArray(data)) {
      window.activeNotes = new Set(data);
      if (typeof window.render === "function") window.render();
    }
  });
});
