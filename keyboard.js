// Keyboard Renderer: draw piano keyboard and highlight active notes
(() => {
  const canvas = document.getElementById('keyboardCanvas');
  const ctx = canvas.getContext('2d');
  const WHITE_KEY_WIDTH = 40;
  const WHITE_KEY_HEIGHT = 200;
  const BLACK_KEY_WIDTH = 24;
  const BLACK_KEY_HEIGHT = 120;
  const FIRST_MIDI_NOTE = 21; // A0
  const LAST_MIDI_NOTE = 108; // C8

  // Generate white keys with x positions
  const WHITE_SEMITONES = [0,2,4,5,7,9,11];
  const BLACK_SEMITONES = [1,3,6,8,10];
  const whiteKeys = [];
  let whiteIndex = 0;
  for (let note = FIRST_MIDI_NOTE; note <= LAST_MIDI_NOTE; note++) {
    if (WHITE_SEMITONES.includes(note % 12)) {
      whiteKeys.push({ note, x: whiteIndex * WHITE_KEY_WIDTH });
      whiteIndex++;
    }
  }
  const totalWhite = whiteIndex;

  // Set canvas size
  canvas.width = totalWhite * WHITE_KEY_WIDTH;
  canvas.height = WHITE_KEY_HEIGHT;

  // Precompute black keys with positions
  const blackKeys = [];
  for (let note = FIRST_MIDI_NOTE; note <= LAST_MIDI_NOTE; note++) {
    if (BLACK_SEMITONES.includes(note % 12)) {
      // Find the white key just before this black key
      const idx = whiteKeys.findIndex(k => k.note > note) - 1;
      if (idx >= 0) {
        const { x } = whiteKeys[idx];
        const bx = x + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
        blackKeys.push({ note, x: bx });
      }
    }
  }

  const activeNotes = new Set();

  // Draw the base keyboard
  function drawKeyboard() {
    // White keys
    whiteKeys.forEach(k => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(k.x, 0, WHITE_KEY_WIDTH, WHITE_KEY_HEIGHT);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(k.x, 0, WHITE_KEY_WIDTH, WHITE_KEY_HEIGHT);
    });
    // Black keys
    blackKeys.forEach(k => {
      ctx.fillStyle = '#000';
      ctx.fillRect(k.x, 0, BLACK_KEY_WIDTH, BLACK_KEY_HEIGHT);
    });
  }

  // Highlight active notes
  function drawHighlights() {
    // Draw translucent overlays
    activeNotes.forEach(note => {
      // Check in white keys
      const white = whiteKeys.find(k => k.note === note);
      if (white) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(white.x, 0, WHITE_KEY_WIDTH, WHITE_KEY_HEIGHT);
        return;
      }
      // Check in black keys
      const black = blackKeys.find(k => k.note === note);
      if (black) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(black.x, 0, BLACK_KEY_WIDTH, BLACK_KEY_HEIGHT);
      }
    });
  }

  // Redraw keyboard and highlights
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKeyboard();
    drawHighlights();
  }

  // Subscribe to MIDI events
  window.onNoteOn(note => {
    activeNotes.add(note);
    render();
  });
  window.onNoteOff(note => {
    if (note === 'reset') {
      activeNotes.clear();
    } else {
      activeNotes.delete(note);
    }
    render();
  });

  // Initial draw
  document.addEventListener('DOMContentLoaded', render);
})();
