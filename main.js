// Main initialization: theme toggle and setup logging
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const themeSwitch = document.getElementById('themeSwitch');
    // Load saved theme preference (optional)
    if (localStorage.getItem('chordDetectorDark') === 'true') {
      themeSwitch.checked = true;
      document.body.classList.add('dark-mode');
    }
    // Toggle dark mode
    themeSwitch.addEventListener('change', () => {
      document.body.classList.toggle('dark-mode', themeSwitch.checked);
      localStorage.setItem('chordDetectorDark', themeSwitch.checked);
    });

    console.log('Checkmark Chord Detector initialized');
  });
})();
