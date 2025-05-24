// Chord Detection Module: analyzes active notes and displays chord name/info
(() => {
  let activeNotes = new Set();
  let detectTimeout = null;
  const DEBOUNCE_DELAY = 200; // fixed delay for detection

  // Chord definitions: required intervals for each type
  const chordDefinitions = {
    'maj13': [0,4,7,11,21],     // major 13th (no 9th/11th)
    '13':    [0,4,7,10,21],     // dominant 13th (no 9th/11th)
    'maj11': [0,4,7,11,17],     // major 11th
    '11':    [0,4,7,10,17],     // dominant 11th
    'maj9':  [0,4,7,11,14],     // major 9th
    '9':     [0,4,7,10,14],     // dominant 9th
    'add2':  [0,4,7,14],        // add 2nd
    'm/add2':[0,3,7,14],        // minor add 2nd
    'add4':  [0,4,7,17],        // add 4th
    'm/add4':[0,3,7,17],        // minor add 4th
    'm9':    [0,3,7,10,14],     // minor 9th
    'm7':    [0,3,7,10],        // minor 7th
    'm11':   [0,3,7,10,17],     // minor 11th
    'm13':   [0,3,7,10,21],     // minor 13th
    'dim7':  [0,3,6,9],         // diminished 7th
    'dim':   [0,3,6],           // diminished triad
    'aug':   [0,4,8],           // augmented triad
    '7':     [0,4,7,10],        // dominant 7th
    'maj7':  [0,4,7,11],        // major 7th
    'sus':   [0,2,5,7],         // sus2 & sus4
    'sus2':  [0,2,7],           // sus2
    'm':     [0,3,7],           // minor triad
    '5':     [0,7],             // 5 chord
    '':      [0,4,7]            // major triad
  };

  // Normalize to pitch classes and sort by pattern length desc
  const chordTypes = Object.entries(chordDefinitions)
    .map(([suffix, pattern]) => [suffix,
      Array.from(new Set(pattern.map(i => i % 12))).sort((a, b) => a - b)
    ])
    .sort((a, b) => b[1].length - a[1].length);

  // Note naming maps
  const defaultNames = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const flatNames = {1:'D♭',3:'E♭',6:'G♭',8:'A♭',10:'B♭'};

  // Subscribe to MIDI events
  window.onNoteOn(n => { activeNotes.add(n); scheduleDetect(); });
  window.onNoteOff(n => { activeNotes.delete(n); scheduleDetect(); });

  // Debounced chord detection
  function scheduleDetect() {
    clearTimeout(detectTimeout);
    detectTimeout = setTimeout(detectChord, DEBOUNCE_DELAY);
  }

  // Detect and display the chord
  function detectChord() {
    const displayName = document.getElementById('chordName');
    const displayInfo = document.getElementById('chordInfo');
    const notes = Array.from(activeNotes).sort((a, b) => a - b);

    if (!notes.length) {
      displayName.textContent = '--';
      displayInfo.textContent = '--';
      return;
    }

    const pcs = Array.from(new Set(notes.map(n => n % 12))).sort((a, b) => a - b);
    let matched = false;

    // 1) Try exact match for any inversion
    for (const [suffix, pattern] of chordTypes) {
      for (let root = 0; root < 12; root++) {
        const rotated = pattern
          .map(i => (i + root) % 12)
          .sort((a, b) => a - b);
        if (rotated.length === pcs.length && rotated.every((v, idx) => v === pcs[idx])) {
          matched = true;
          const isMinor = /^m(?!aj)/.test(suffix);
          const rootName = (!isMinor && flatNames[root])
            ? flatNames[root]
            : defaultNames[root];
          displayName.textContent = rootName + suffix;

          // Inversion labeling
          const lowestPc = notes[0] % 12;
          const invInterval = (lowestPc - root + 12) % 12;
          const invIdx = pattern.indexOf(invInterval);
          const invNames = [
            'Root position','1st inversion','2nd inversion',
            '3rd inversion','4th','5th','6th'
          ];
          const inversion = invNames[invIdx] || invNames[0];

          const noteList = notes.map(n =>
            defaultNames[n % 12] + (Math.floor(n / 12) - 1)
          );
          displayInfo.textContent = `${inversion} • Notes: ${noteList.join(', ')}`;
          break;
        }
      }
      if (matched) break;
    }

    // 2) Fallback: bass-root detection
    if (!matched) {
      const bassRoot = notes[0] % 12;
      for (const [suffix, pattern] of chordTypes) {
        const required = pattern.map(i => (i + bassRoot) % 12);
        if (required.every(pc => pcs.includes(pc))) {
          matched = true;
          const isMinor = /^m(?!aj)/.test(suffix);
          const rootName = (!isMinor && flatNames[bassRoot])
            ? flatNames[bassRoot]
            : defaultNames[bassRoot];
          displayName.textContent = rootName + suffix;
          displayInfo.textContent =
            `Root position • Notes: ${notes.map(n =>
               defaultNames[n % 12] + (Math.floor(n / 12) - 1)
            ).join(', ')}`;
          break;
        }
      }
    }

    // 3) No match
    if (!matched) {
      displayName.textContent = 'N.C.';
      const noteList = notes.map(n =>
        defaultNames[n % 12] + (Math.floor(n / 12) - 1)
      );
      displayInfo.textContent = `Notes: ${noteList.join(', ')}`;
    }
  }

  // Initial detection on load
  document.addEventListener('DOMContentLoaded', detectChord);
})();
