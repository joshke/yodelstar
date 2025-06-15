// Audio processing utilities

// Helper function to convert time string (MM:SS.ms) to seconds
export const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(/[:.]/);
  if (parts.length === 2) { // SS.ms
    return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 10;
  } else if (parts.length === 3) { // MM:SS.ms
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 10;
  }
  return 0;
};

// Helper function to convert note and octave to frequency
export const noteToFrequency = (note: string, octave: number): number => {
  const A4 = 440;
  const noteOffsets: { [key: string]: number } = {
    'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4,
    'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2
  };
  
  const semitoneOffset = noteOffsets[note] + (octave - 4) * 12;
  const frequency = A4 * Math.pow(2, semitoneOffset / 12);
  
  // Log the target frequencies for debugging
  //console.log(`Target: ${note}${octave} = ${frequency.toFixed(1)} Hz`);
  
  return frequency;
};

// Helper function to get Y position based on frequency
export const frequencyToY = (frequency: number, canvasHeight: number): number => {
  // Map frequency range (80Hz - 1000Hz) to canvas height
  const minFreq = 80;
  const maxFreq = 1000;
  const normalizedFreq = Math.log(frequency / minFreq) / Math.log(maxFreq / minFreq);
  return canvasHeight - (normalizedFreq * canvasHeight * 0.8) - canvasHeight * 0.1;
};

// Helper function to check if frequencies are close (for octave errors)
export const areFrequenciesRelated = (freq1: number, freq2: number): boolean => {
  // Check if one frequency is an octave of the other (within 10% tolerance)
  const ratio = freq1 / freq2;
  const octaveRatios = [0.25, 0.5, 1, 2, 4]; // ±2 octaves
  
  for (const targetRatio of octaveRatios) {
    if (Math.abs(ratio - targetRatio) < targetRatio * 0.1) {
      return true;
    }
  }
  return false;
};

// Frequenz zu Note
export const frequencyToNote = (frequency: number): string => {
  const A4 = 440;
  if (frequency <= 0) return '';
  const C0 = A4 * Math.pow(2, -4.75);
  const h = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(h / 12);
  const n = h % 12;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames[n] + octave;
};

// Cents-Abweichung
export const getCentsFromNote = (frequency: number): number => {
  if (frequency <= 0) return 0;
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const h = 12 * Math.log2(frequency / C0);
  const nearestSemitone = Math.round(h);
  return Math.round((h - nearestSemitone) * 100);
}; 