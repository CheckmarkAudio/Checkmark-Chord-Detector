// MIDI module: initialize Web MIDI, populate device selector, and broadcast note on/off
(() => {
  let midiAccess = null;
  let selectedInput = null;
  const noteOnCallbacks = [];
  const noteOffCallbacks = [];

  function initMIDI() {
    if (!navigator.requestMIDIAccess) {
      alert('Web MIDI API not supported in this browser.');
      return;
    }
    navigator.requestMIDIAccess()
      .then(onMIDISuccess, onMIDIFailure);

    // Reset button handler
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
      noteOffCallbacks.forEach(cb => cb('reset'));
    });
  }

  function onMIDISuccess(access) {
    midiAccess = access;
    const deviceSelect = document.getElementById('midiDevice');
    deviceSelect.innerHTML = '';

    // Populate inputs dropdown
    const inputs = Array.from(midiAccess.inputs.values());
    inputs.forEach(input => {
      const option = document.createElement('option');
      option.value = input.id;
      option.textContent = input.name || input.manufacturer || 'MIDI Device';
      deviceSelect.appendChild(option);
    });

    // Listen for selection changes
    deviceSelect.addEventListener('change', () => {
      if (selectedInput) selectedInput.onmidimessage = null;
      selectedInput = midiAccess.inputs.get(deviceSelect.value);
      if (selectedInput) selectedInput.onmidimessage = handleMIDIMessage;
    });

    // Auto-select first device if available
    if (inputs.length) {
      deviceSelect.value = inputs[0].id;
      selectedInput = inputs[0];
      selectedInput.onmidimessage = handleMIDIMessage;
    }
  }

  function onMIDIFailure(err) {
    console.error('MIDI init failed:', err);
    alert('Could not access your MIDI devices.');
  }

  function handleMIDIMessage(event) {
    const [status, note, velocity] = event.data;
    const command = status & 0xf0;
    // Note on
    if (command === 0x90 && velocity > 0) {
      noteOnCallbacks.forEach(cb => cb(note));
    }
    // Note off (or note on with zero velocity)
    else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      noteOffCallbacks.forEach(cb => cb(note));
    }
  }

  // Public API
  window.onNoteOn = cb => noteOnCallbacks.push(cb);
  window.onNoteOff = cb => noteOffCallbacks.push(cb);

  // Auto-init when DOM loaded
  document.addEventListener('DOMContentLoaded', initMIDI);
})();
