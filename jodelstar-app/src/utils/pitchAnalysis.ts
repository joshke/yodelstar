import { areFrequenciesRelated } from './audioUtils';

// Score calculation
export const calculatePoints = (accuracy: number, confidence: number, streak: number): number => {
  let basePoints = Math.round(accuracy * 10); // 0-1000 Punkte
  
  // Confidence-Bonus
  if (confidence > 70) basePoints *= 1.2;
  else if (confidence > 50) basePoints *= 1.1;
  
  // Streak-Bonus
  const streakMultiplier = 1 + (streak * 0.1); // 10% pro Streak
  basePoints *= streakMultiplier;
  
  // Accuracy-Bonus
  if (accuracy > 95) basePoints *= 1.5; // Perfect hit
  else if (accuracy > 85) basePoints *= 1.3; // Great hit
  else if (accuracy > 75) basePoints *= 1.2; // Good hit
  
  return Math.round(basePoints);
};

// Enhanced accuracy calculation with more tolerance
export const calculateAccuracy = (userFreq: number, targetFreq: number): number => {
  if (targetFreq === 0) return 0;
  
  // First check if user is singing in a different octave
  if (areFrequenciesRelated(userFreq, targetFreq)) {
    // If singing in different octave, give partial credit
    const ratio = userFreq / targetFreq;
    const octaveRatios = [0.25, 0.5, 1, 2, 4];
    
    for (const targetRatio of octaveRatios) {
      if (Math.abs(ratio - targetRatio) < targetRatio * 0.1) {
        if (targetRatio === 1) {
          // Same octave - use normal calculation
          break;
        } else {
          // Different octave - give 70% base accuracy
         // console.log(`Octave match detected: ${userFreq.toFixed(1)}Hz vs ${targetFreq.toFixed(1)}Hz`);
          return 70;
        }
      }
    }
  }
  
  // Calculate cents difference
  const cents = 1200 * Math.log2(userFreq / targetFreq);
  
  // Very forgiving accuracy calculation
  // Within 100 cents (1 semitone) = 100% accuracy
  // Every 50 cents beyond that = -10% accuracy
  let accuracy = 100;
  const absCents = Math.abs(cents);
  
  if (absCents <= 100) {
    accuracy = 100;
  } else if (absCents <= 200) {
    accuracy = 100 - ((absCents - 100) * 0.2); // Very gradual decrease
  } else if (absCents <= 400) {
    accuracy = 80 - ((absCents - 200) * 0.1); // Even slower decrease
  } else {
    accuracy = Math.max(0, 60 - ((absCents - 400) * 0.05)); // Minimum 60% if somewhat close
  }
  
  //console.log(`Pitch comparison: User ${userFreq.toFixed(1)}Hz vs Target ${targetFreq.toFixed(1)}Hz = ${accuracy.toFixed(0)}% (${absCents.toFixed(0)} cents)`);
  
  return accuracy;
};

// Enhanced pitch stabilization with median filter
export const stabilizePitch = (newPitch: number, pitchHistory: number[]): number => {
  pitchHistory.push(newPitch);
  if (pitchHistory.length > 5) {
    pitchHistory.shift();
  }
  
  // Use median filter to remove outliers
  const sorted = [...pitchHistory].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // If the new pitch is too far from median, use median instead
  if (Math.abs(newPitch - median) > median * 0.1) {
    return median;
  }
  
  // Weighted average with more weight on recent values
  let weightedSum = 0;
  let totalWeight = 0;
  pitchHistory.forEach((pitch, index) => {
    const weight = Math.pow(2, index); // Exponential weighting
    weightedSum += pitch * weight;
    totalWeight += weight;
  });
  
  return weightedSum / totalWeight;
};

// Enhanced confidence calculation
export const calculateConfidence = (pitch: number, buffer: Float32Array): number => {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);

  let confidence = 0;
  
  // Volume confidence (0-40 points)
  const volumeConfidence = Math.min(40, rms * 8000);
  confidence += volumeConfidence;
  
  // Pitch stability confidence (0-60 points)
  if (buffer.length >= 3) {
    const recent = Array.from(buffer).slice(-3);
    const mean = recent.reduce((a, b) => a + b) / recent.length;
    const variance = recent.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / recent.length;
    const stabilityConfidence = Math.max(0, 60 - Math.sqrt(variance));
    confidence += stabilityConfidence;
  }
  
  return Math.min(100, Math.max(0, confidence));
};

// Improved YIN algorithm with auto-correlation
export const findFundamentalFreq = (buffer: Float32Array, sampleRate: number): number => {
  const SIZE = buffer.length;
  const threshold = 0.2; // Slightly higher threshold for better accuracy
  
  // Calculate RMS for volume detection
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  
  // Increased minimum volume threshold
  if (rms < 0.01) {
    return -1;
  }
  
  // Auto-correlation based approach
  const correlations = new Float32Array(SIZE / 2);
  
  for (let lag = 0; lag < SIZE / 2; lag++) {
    let sum = 0;
    for (let i = 0; i < SIZE / 2; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    correlations[lag] = sum;
  }
  
  // Find the first peak after the initial decline
  let firstPeak = 0;
  for (let i = 20; i < SIZE / 2 - 1; i++) { // Start from 20 to avoid very high frequencies
    if (correlations[i] > correlations[i - 1] && correlations[i] > correlations[i + 1]) {
      if (correlations[i] > threshold * correlations[0]) {
        firstPeak = i;
        break;
      }
    }
  }
  
  if (firstPeak > 0) {
    // Parabolic interpolation for more accurate frequency
    const y1 = correlations[firstPeak - 1];
    const y2 = correlations[firstPeak];
    const y3 = correlations[firstPeak + 1];
    
    const x0 = (y3 - y1) / (2 * (2 * y2 - y1 - y3));
    const betterPeak = firstPeak + x0;
    
    const frequency = sampleRate / betterPeak;
    
    // Reasonable frequency range for human voice
    if (frequency >= 80 && frequency <= 800) {
      return frequency;
    }
  }
  
  return -1;
}; 