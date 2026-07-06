let currentAudio = null;
let currentStopCallback = null;

export function playPreview(url, onEnded) {
  stopCurrent();

  const audio = new Audio(url);
  currentAudio = audio;
  currentStopCallback = onEnded;

  audio.addEventListener('ended', () => {
    if (onEnded) onEnded();
    if (currentAudio === audio) currentAudio = null;
  });

  audio.play();
  return audio;
}

export function stopCurrent() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentStopCallback) currentStopCallback();
  }
  currentAudio = null;
  currentStopCallback = null;
}
