export function playRingtone() {
  if (typeof window === "undefined") return;
  // Browser Audio context
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (frequency: number, startTime: number, duration: number) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start(audioCtx.currentTime + startTime);
    oscillator.stop(audioCtx.currentTime + startTime + duration);
  };

  // Play a simple "ding dong" notification sound
  playTone(880, 0, 0.4); // A5
  playTone(659.25, 0.4, 0.6); // E5
}
