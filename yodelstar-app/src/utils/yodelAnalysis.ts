import { timeToSeconds } from './audioUtils';

// Define types for the analysis data
export interface PitchInfo {
  note: string;
  octave: number;
}

export interface YodelEvent {
  timestamp: string;
  type: 'headVoice' | 'chestVoice' | 'yodelSyllable' | 'yodelBreak';
  description: string;
  syllable?: string;
  pitch?: PitchInfo;
}

export interface YodelPhrase {
  phraseNumber: number;
  startTime: string;
  endTime: string;
  yodelSyllablesInPhrase: number;
  events: YodelEvent[];
  notes?: string;
}

export interface YodelAnalysis {
  videoSource: string;
  totalYodelSyllables: number;
  phrases: YodelPhrase[];
}

// Get current target event with wider time window
export const getCurrentTargetEvent = (time: number, analysisData: YodelAnalysis): YodelEvent | null => {
  for (const phrase of analysisData.phrases) {
    for (const event of phrase.events) {
      const eventTime = timeToSeconds(event.timestamp);
      // Much wider time window for easier hitting
      if (Math.abs(time - eventTime) < 2.0 && event.pitch) { // Increased from 1.0 to 2.0 seconds
        return event;
      }
    }
  }
  return null;
}; 