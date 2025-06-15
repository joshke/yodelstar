import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Import utilities
import { 
  timeToSeconds, 
  noteToFrequency, 
  frequencyToY, 
  frequencyToNote, 
  getCentsFromNote
} from '../utils/audioUtils';
import { 
  calculatePoints, 
  calculateAccuracy, 
  stabilizePitch, 
  calculateConfidence, 
  findFundamentalFreq 
} from '../utils/pitchAnalysis';
import { 
  Particle, 
  createHitParticles, 
  drawStar, 
  updateParticles,
  createSparkleParticles 
} from '../utils/particleSystem';
import { 
  YodelAnalysis, 
  getCurrentTargetEvent 
} from '../utils/yodelAnalysis';
import { useSparkles } from '../hooks/useSparkles';

interface KaraokeVisualizerProps {
  analysisData: YodelAnalysis;
  audioUrl: string;
  onRecordingComplete?: (audioBlob: Blob) => void;
}

const KaraokeVisualizer: React.FC<KaraokeVisualizerProps> = ({ 
  analysisData, 
  audioUrl,
  onRecordingComplete 
}) => {
  const [sessionState, setSessionState] = useState<'idle' | 'listening' | 'preparing' | 'recording'>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentNote, setCurrentNote] = useState('');
  const [cents, setCents] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [pitchConfidence, setPitchConfidence] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  // Use custom sparkles hook
  const { showSparkles, sparkleIntensity, triggerSparkles } = useSparkles();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const drawAnimationFrameRef = useRef<number | undefined>(undefined);
  const pitchHistoryRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const lastHitTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStateRef = useRef<'idle' | 'listening' | 'preparing' | 'recording'>('idle');

  // Update sessionStateRef whenever sessionState changes
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  // Memoized functions for performance
  const getCurrentTargetEventMemo = useMemo(() => 
    (time: number) => getCurrentTargetEvent(time, analysisData), 
    [analysisData]
  );

  const createHitParticlesMemo = useCallback((x: number, y: number, accuracy: number) => {
    const newParticles = createHitParticles(x, y, accuracy);
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const findFundamentalFreqMemo = useCallback((buffer: Float32Array, sampleRate: number): number => {
    const frequency = findFundamentalFreq(buffer, sampleRate);
    // Set volume level for visual feedback
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    setVolumeLevel(rms * 100);
    return frequency;
  }, []);

  const stabilizePitchMemo = useCallback((newPitch: number): number => {
    return stabilizePitch(newPitch, pitchHistoryRef.current);
  }, []);

  const adjustPitchToTargetOctave = useCallback((pitch: number, targetFreq: number): number => {
    // If either value is invalid, return original pitch
    if (pitch <= 0 || targetFreq <= 0) return pitch;

    let adjusted = pitch;
    // Bring pitch within +/- 50% of the target frequency
    while (adjusted < targetFreq / 1.5) {
      adjusted *= 2;
    }
    while (adjusted > targetFreq * 1.5) {
      adjusted /= 2;
    }
    return adjusted;
  }, []);

  const stopRecording = useCallback(() => {
    console.log('🛑 stopRecording called', {
      sessionState,
      isRecording: isRecordingRef.current,
      audioCurrentTime: audioPlayerRef.current?.currentTime,
      audioDuration: audioPlayerRef.current?.duration,
      stackTrace: new Error().stack
    });

    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
    setSessionState('idle');
    setCountdown(null);

    // First, set recording ref to false to immediately stop animation loop
    isRecordingRef.current = false;
    
    // Then set state to false for UI updates
    // This is handled by setSessionState('idle')
    
    // Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current.volume = 1.0; // Reset volume to full
    }
    
    // Stop animation frame (for both listening and recording)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    
    // Stop MediaRecorder first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }
    
    // Stop all media stream tracks
    if (sourceNodeRef.current && sourceNodeRef.current.mediaStream) {
      sourceNodeRef.current.mediaStream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
    }
    
    // Disconnect audio nodes
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting source node:', error);
      }
      sourceNodeRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.error('Error closing audio context:', error);
      }
      audioContextRef.current = null;
    }
    
    // Reset MediaRecorder reference
    mediaRecorderRef.current = null;
    
    // Reset all state
    setCurrentPitch(0);
    setCurrentNote('');
    setCurrentTime(0);
    setAudioDuration(0);
    setPitchConfidence(0);
    setVolumeLevel(0);
    
    // Clear pitch history
    pitchHistoryRef.current = [];
  }, [onRecordingComplete]);

  const startRecordingAndPlayback = async () => {
    setSessionState('recording');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Set up audio context for pitch detection
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserNodeRef.current = audioContextRef.current.createAnalyser();
      // Reduce the analyser buffer size so that each analysis window is shorter
      // This lowers the inherent latency between singing and visual feedback
      analyserNodeRef.current.fftSize = 1024; // ~23 ms window @ 44.1 kHz ➜ faster response
      // Lower smoothing so that new values propagate to the UI quicker
      analyserNodeRef.current.smoothingTimeConstant = 0.3;
      
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current.connect(analyserNodeRef.current);
      
      // Set up MediaRecorder for audio capture
      audioChunksRef.current = [];
      
      // Check if MediaRecorder is supported and choose appropriate MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeType || 'audio/webm' 
        });
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
      
      try {
        mediaRecorderRef.current.start();
      } catch (error) {
        console.error('Error starting MediaRecorder:', error);
        throw error;
      }
      
      // Play the backing track silently to sync visualization
      if (audioPlayerRef.current) {
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current.volume = 0.0; // Mute backing track
        
        try {
          await waitForAudioReady();
          console.log('🎤 Starting backing track for recording...');
          
          const playPromise = audioPlayerRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('🎤 Backing track started for recording, duration:', audioPlayerRef.current?.duration);
            }).catch(error => {
              console.error('Backing track playback failed:', error);
            });
          }
        } catch (error) {
          console.error('Error preparing backing track:', error);
        }
      }

      pitchHistoryRef.current = [];
      startTimeRef.current = Date.now();
      lastHitTimeRef.current = 0;
      isRecordingRef.current = true;
      // setIsRecording(true); // Replaced with sessionState
      animationFrameRef.current = requestAnimationFrame(processAudio);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow microphone access.");
      setSessionState('idle'); // Reset on error
    }
  };

  const startListeningPhase = async () => {
    setSessionState('listening');
    
    // Play the reference audio for listening
    if (audioPlayerRef.current) {
      console.log('🎧 Before reset - audio state:', {
        currentTime: audioPlayerRef.current.currentTime,
        duration: audioPlayerRef.current.duration,
        ended: audioPlayerRef.current.ended,
        paused: audioPlayerRef.current.paused,
        readyState: audioPlayerRef.current.readyState
      });
      
      audioPlayerRef.current.currentTime = 0;
      
      console.log('🎧 After reset - audio state:', {
        currentTime: audioPlayerRef.current.currentTime,
        duration: audioPlayerRef.current.duration,
        ended: audioPlayerRef.current.ended,
        paused: audioPlayerRef.current.paused
      });
      
      try {
        await waitForAudioReady();
        console.log('🎧 Starting reference audio playback for listening...');
        
        // Ensure full volume for listening phase
        audioPlayerRef.current.volume = 1.0;
        
        const playPromise = audioPlayerRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('🎧 Reference audio playback started, duration:', audioPlayerRef.current?.duration);
            // Start timing for the visualization
            startTimeRef.current = Date.now();
            animationFrameRef.current = requestAnimationFrame(updateListeningTime);
          }).catch(error => {
            console.error('Reference audio playback failed:', error);
          });
        }
      } catch (error) {
        console.error('Error preparing reference audio:', error);
      }
    }
  };

  const updateListeningTime = () => {
    if (sessionStateRef.current === 'listening' && audioPlayerRef.current && !audioPlayerRef.current.ended) {
      // Use the actual audio currentTime for accuracy
      const audioCurrentTime = audioPlayerRef.current.currentTime;
      setCurrentTime(audioCurrentTime);
      
      // Debug logging every second
      if (Math.floor(audioCurrentTime) % 1 === 0 && audioCurrentTime % 1 < 0.1) {
        console.log('🎧 Listening progress:', {
          currentTime: audioCurrentTime.toFixed(2),
          duration: audioDuration,
          percentage: audioDuration > 0 ? ((audioCurrentTime / audioDuration) * 100).toFixed(1) + '%' : '0%',
          sessionState: sessionStateRef.current,
          audioEnded: audioPlayerRef.current.ended
        });
      }
      
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(updateListeningTime);
    }
  };

  // Helper function extracted for reuse
  const waitForAudioReady = () => {
    return new Promise<void>((resolve, reject) => {
      const audio = audioPlayerRef.current;
      if (!audio) {
        reject(new Error('Audio element not available'));
        return;
      }

      console.log('🔍 Checking audio readiness:', {
        readyState: audio.readyState, 
        duration: audio.duration,
        src: audio.src
      });
      
      // If audio is already ready, resolve immediately
      if (audio.readyState >= 3 && !isNaN(audio.duration) && audio.duration > 0) {
        console.log('✅ Audio already ready, duration:', audio.duration);
        setAudioDuration(audio.duration); // Update duration state
        resolve();
        return;
      }

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Audio loading timeout after 10 seconds');
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('error', onError);
        resolve(); // Resolve anyway to continue
      }, 10000);

      const onCanPlay = () => {
        console.log('🎵 Audio canplay event, duration:', audio.duration);
        if (!isNaN(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration); // Update duration state
          clearTimeout(timeoutId);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadedmetadata', onLoadedMetadata);
          audio.removeEventListener('error', onError);
          resolve();
        }
      };

      const onLoadedMetadata = () => {
        console.log('📊 Audio metadata loaded, duration:', audio.duration);
        if (!isNaN(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration); // Update duration state
          clearTimeout(timeoutId);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadedmetadata', onLoadedMetadata);
          audio.removeEventListener('error', onError);
          resolve();
        }
      };

      const onError = (e: Event) => {
        console.error('❌ Audio loading error:', e);
        clearTimeout(timeoutId);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('error', onError);
        reject(new Error('Audio failed to load'));
      };

      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('error', onError);
      
      // Force load if needed
      console.log('🔄 Forcing audio load...');
      audio.load();
    });
  };

  const handleStartPreparation = useCallback(() => {
    setSessionState('preparing');
    setCountdown(3);
  }, []);
  
  useEffect(() => {
    if (sessionState === 'preparing' && countdown !== null) {
      if (countdown > 0) {
        countdownTimerRef.current = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        // Countdown is 0, start recording after a brief "Go!" message
        countdownTimerRef.current = setTimeout(() => {
          startRecordingAndPlayback();
        }, 500);
      }
    }
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [sessionState, countdown, handleStartPreparation]);

  // Enhanced audio processing with better feedback
  const processAudio = () => {
    // Check if we have the necessary audio nodes (don't check isRecording here due to async state)
    if (!analyserNodeRef.current || !audioContextRef.current) {
      return;
    }
    
    if (analyserNodeRef.current && audioContextRef.current) {
        const buffer = new Float32Array(analyserNodeRef.current.fftSize);
        analyserNodeRef.current.getFloatTimeDomainData(buffer);

        // Update current time (use the audio player clock if available for tighter sync)
        const elapsed = audioPlayerRef.current ? audioPlayerRef.current.currentTime : (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);

        // Log timing info occasionally
        if (Math.floor(elapsed) % 10 === 0 && elapsed % 1 < 0.1) {
          const audioPlayer = audioPlayerRef.current;
          console.log('🎯 Processing audio at elapsed time:', {
            elapsedTime: elapsed.toFixed(2),
            audioCurrentTime: audioPlayer?.currentTime?.toFixed(2),
            audioDuration: audioPlayer?.duration,
            isRecording: isRecordingRef.current
          });
        }

        const fundamentalFreq = findFundamentalFreqMemo(buffer, audioContextRef.current.sampleRate);
        
        if (fundamentalFreq > 0) {
            const stabilizedPitch = stabilizePitchMemo(fundamentalFreq);
            const confidence = calculateConfidence(stabilizedPitch, buffer);
            setPitchConfidence(confidence);

            if (confidence > 20) { // Lower threshold for detection
                // Get the current target event once so we can reuse it for accuracy & display
                const targetEvent = getCurrentTargetEventMemo(elapsed);

                // ----- Accuracy & scoring use the raw (stabilised) pitch -----
                if (targetEvent && targetEvent.pitch) {
                    const targetFreq = noteToFrequency(targetEvent.pitch.note, targetEvent.pitch.octave);
                    const accuracy = calculateAccuracy(stabilizedPitch, targetFreq);

                    // Much lower threshold and add cooldown to prevent too many particles
                    const now = Date.now();
                    if (accuracy > 40 && now - lastHitTimeRef.current > 100) { // Lowered from 60 to 40
                        const points = calculatePoints(accuracy, confidence, streak);
                        setScore(prev => prev + points);
                        setStreak(prev => prev + 1);
                        lastHitTimeRef.current = now;

                        // Trigger sparkles for good accuracy
                        triggerSparkles(accuracy);

                        const canvas = canvasRef.current;
                        if (canvas) {
                            const pixelsPerSec = audioDuration > 0 ? canvas.width / audioDuration : 60;
                            const timeX = elapsed * pixelsPerSec;
                            const targetY = frequencyToY(targetFreq, canvas.height);
                            createHitParticlesMemo(timeX, targetY, accuracy);
                        }
                    } else if (accuracy <= 30) {
                        setStreak(0);
                    }
                }

                // ----- Display values are octave-adjusted so the dot lines up visually -----
                let displayPitch = stabilizedPitch;
                if (targetEvent && targetEvent.pitch) {
                    const targetFreq = noteToFrequency(targetEvent.pitch.note, targetEvent.pitch.octave);
                    displayPitch = adjustPitchToTargetOctave(stabilizedPitch, targetFreq);
                }

                const displayNote = frequencyToNote(displayPitch);
                const displayCents = getCentsFromNote(displayPitch);

                setCurrentPitch(displayPitch);
                setCurrentNote(displayNote);
                setCents(displayCents);
            }
        } else {
            setCurrentPitch(0);
            setCurrentNote('');
            setCents(0);
            setPitchConfidence(0);
        }
    }
    
    // Only continue animation if still recording (use ref for immediate check)
    if (isRecordingRef.current) {
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }
  };

  // The original startRecording function is now split into handleStartPreparation and startRecordingAndPlayback

  // Add sparkles to particle system when needed
  useEffect(() => {
    if (showSparkles && sessionState === 'recording') {
      const canvas = canvasRef.current;
      if (canvas) {
        const sparkles = createSparkleParticles(canvas.width, canvas.height, sparkleIntensity);
        setParticles(prev => [...prev, ...sparkles]);
      }
    }
  }, [showSparkles, sparkleIntensity, sessionState]);

  // Enhanced particle animation with star shapes
  const hasParticles = particles.length > 0;
  useEffect(() => {
    if (!hasParticles) return;
    
    const interval = setInterval(() => {
      setParticles(prev => updateParticles(prev));
    }, 16); // ~60 FPS
    
    return () => clearInterval(interval);
  }, [hasParticles]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    if (!audioPlayer) return;

    const handleAudioEnd = () => {
      console.log('🎵 Audio ended event fired', {
        currentTime: audioPlayer.currentTime,
        duration: audioPlayer.duration,
        ended: audioPlayer.ended,
        sessionState
      });
      
      if (sessionState === 'listening') {
        // Transition from listening to "Your Turn" preparation
        console.log('🎧 Reference audio finished - transitioning to "Your Turn"');
        handleStartPreparation();
      } else if (sessionState === 'recording' && isRecordingRef.current) {
        // Stop recording when backing track ends
        console.log('🎤 Backing track ended - stopping recording');
        stopRecording();
      }
    };

    const handleAudioError = (e: Event) => {
      console.error('❌ Audio error:', e);
    };

    const handleAudioLoadedData = () => {
      console.log('📀 Audio loaded, duration:', audioPlayer.duration);
      if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
        setAudioDuration(audioPlayer.duration);
      }
    };

    const handleAudioPlay = () => {
      console.log('▶️ Audio play event, duration:', audioPlayer.duration);
    };

    const handleAudioPause = () => {
      console.log('⏸️ Audio pause event at time:', audioPlayer.currentTime);
    };

    const handleAudioTimeUpdate = () => {
      // Log occasionally to avoid spam
      if (Math.floor(audioPlayer.currentTime) % 5 === 0 && audioPlayer.currentTime % 1 < 0.1) {
        console.log('⏱️ Audio time update:', {
          currentTime: audioPlayer.currentTime.toFixed(2),
          duration: audioPlayer.duration,
          percentage: ((audioPlayer.currentTime / audioPlayer.duration) * 100).toFixed(1) + '%'
        });
      }
    };

    audioPlayer.addEventListener('ended', handleAudioEnd);
    audioPlayer.addEventListener('error', handleAudioError);
    audioPlayer.addEventListener('loadeddata', handleAudioLoadedData);
    audioPlayer.addEventListener('play', handleAudioPlay);
    audioPlayer.addEventListener('pause', handleAudioPause);
    audioPlayer.addEventListener('timeupdate', handleAudioTimeUpdate);

    return () => {
      audioPlayer.removeEventListener('ended', handleAudioEnd);
      audioPlayer.removeEventListener('error', handleAudioError);
      audioPlayer.removeEventListener('loadeddata', handleAudioLoadedData);
      audioPlayer.removeEventListener('play', handleAudioPlay);
      audioPlayer.removeEventListener('pause', handleAudioPause);
      audioPlayer.removeEventListener('timeupdate', handleAudioTimeUpdate);
    };
  }, [sessionState, stopRecording, handleStartPreparation]);

  // Add a backup timer to check audio progress - only stop when audio actually ends
  useEffect(() => {
    if (sessionState !== 'recording') return;

    const checkAudioProgress = () => {
      const audioPlayer = audioPlayerRef.current;
      if (audioPlayer) {
        console.log('Audio status:', {
          paused: audioPlayer.paused,
          ended: audioPlayer.ended,
          currentTime: audioPlayer.currentTime,
          duration: audioPlayer.duration,
          readyState: audioPlayer.readyState
        });
        
        // Only stop when audio actually ends, not before
        if (audioPlayer.ended || (audioPlayer.duration > 0 && audioPlayer.currentTime >= audioPlayer.duration)) {
          console.log('Audio actually ended - stopping recording');
          if (isRecordingRef.current) {
            stopRecording();
          }
        }
      }
    };

    const interval = setInterval(checkAudioProgress, 500); // Check every 500ms (less frequent)

    return () => clearInterval(interval);
  }, [sessionState, stopRecording]);

  // Memoized drawing calculations
  const drawingData = useMemo(() => {
    const frequencies = [100, 200, 300, 400, 500, 600, 800, 1000];
    return {
      frequencies,
      frequencyYPositions: frequencies.map(freq => ({
        freq,
        y: frequencyToY(freq, 400) // Using fixed height for memoization
      }))
    };
  }, []);

  // Helper to draw rounded rectangles on the canvas
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    const r = Math.min(radius, height / 2, width / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };

  // --- Enhanced Drawing on Canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        const width = canvas.width;
        const height = canvas.height;

        // Save the current state
        ctx.save();
        
        // Use globalCompositeOperation to clear more efficiently
        ctx.globalCompositeOperation = 'copy';
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

        // Draw frequency grid lines
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        drawingData.frequencyYPositions.forEach(({ freq, y: baseY }) => {
            const y = frequencyToY(freq, height); // Recalculate for actual canvas height
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
         //   ctx.fillText(`${freq}Hz`, 5, y - 5);
        });

        // Draw analysis data with proper pitch positioning
        analysisData.phrases.forEach(phrase => {
            phrase.events.forEach((event, index) => {
                if (!event.pitch) return;
                
                const nextEvent = phrase.events[index + 1];
                const startTime = timeToSeconds(event.timestamp);
                const endTime = nextEvent ? timeToSeconds(nextEvent.timestamp) : timeToSeconds(phrase.endTime);
                
                const frequency = noteToFrequency(event.pitch.note, event.pitch.octave);

                // Dynamic horizontal scaling so the entire audio fits the canvas width
                const pixelsPerSec = audioDuration > 0 ? width / audioDuration : 60;
                const x = startTime * pixelsPerSec;
                const y = frequencyToY(frequency, height);
                const w = (endTime - startTime) * pixelsPerSec;

                // Customize bar appearance
                const barHeight = 30; // Increased height for better visibility
                const barRadius = 10;
                
                // Color based on voice type - only differentiate between chest and head voice
                ctx.fillStyle = event.type === 'headVoice' ? 'rgba(173, 216, 230, 0.8)' : 
                               'rgba(240, 128, 128, 0.8)';
                
                // Draw rounded bar instead of sharp rectangle
                drawRoundedRect(ctx, x, y - barHeight / 2, w, barHeight, barRadius);

                // Draw syllable text inside the bar (if available)
                if (event.syllable) {
                  ctx.fillStyle = '#000';
                  ctx.font = 'bold 16px Arial'; // Slightly larger font to match bigger bar
                  ctx.textBaseline = 'middle';
                  ctx.textAlign = 'left';
                  ctx.fillText(event.syllable, x + 8, y);
                }
            });
        });

        // Draw current time indicator
        if (sessionState === 'recording' || sessionState === 'listening') {
            const pixelsPerSec = audioDuration > 0 ? width / audioDuration : 60;
            const timeX = currentTime * pixelsPerSec;
            ctx.strokeStyle = sessionState === 'recording' ? 'red' : 'blue';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(timeX, 0);
            ctx.lineTo(timeX, height);
            ctx.stroke();
        }

        // Draw current user pitch with enhanced visualization
        if (sessionState === 'recording' && currentPitch > 0) {
            const userPitchY = frequencyToY(currentPitch, height);
            const pixelsPerSec = audioDuration > 0 ? width / audioDuration : 60;
            const timeX = currentTime * pixelsPerSec;
            
            // Draw pitch trail
            ctx.strokeStyle = `rgba(255, 0, 0, ${pitchConfidence / 100})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(timeX, userPitchY, 8 + (pitchConfidence / 20), 0, 2 * Math.PI);
            ctx.stroke();
            
            // Draw center dot
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(timeX, userPitchY, 5, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw particles as stars
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            drawStar(ctx, p.x, p.y, p.size, p.rotation);
            ctx.globalAlpha = 1.0;
        });

        // Restore the saved state
        ctx.restore();

        // Schedule the next frame and keep a reference so we can cancel it
        drawAnimationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup: cancel any pending draw frame to prevent multiple loops accumulating
    return () => {
      if (drawAnimationFrameRef.current !== undefined) {
        cancelAnimationFrame(drawAnimationFrameRef.current);
      }
    };
  }, [sessionState, currentPitch, currentTime, particles, analysisData, currentNote, pitchConfidence, drawingData.frequencyYPositions, getCurrentTargetEventMemo, audioDuration]);

  const buttonText = () => {
    if (sessionState === 'listening') return 'Listening...';
    if (sessionState === 'preparing') return 'Get Ready...';
    if (sessionState === 'recording') return 'Stop Recording';
    return 'Start';
  }

  const handleButtonClick = () => {
    if (sessionState === 'idle') {
      startListeningPhase();
    } else if (sessionState === 'recording') {
      stopRecording();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
       {/* Legend */}
       <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '30px',
        marginTop: '15px',
        padding: '10px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '15px',
            backgroundColor: 'rgba(240, 128, 128, 0.8)',
            borderRadius: '5px'
          }}></div>
          <span>Chest Voice</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '15px',
            backgroundColor: 'rgba(173, 216, 230, 0.8)',
            borderRadius: '5px'
          }}></div>
          <span>Head Voice</span>
        </div>
        {sessionState === 'recording' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '15px',
              height: '15px',
              backgroundColor: 'red',
              borderRadius: '50%'
            }}></div>
            <span>Your Voice</span>
          </div>
        )}
      </div>


      {sessionState === 'preparing' && countdown !== null && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          zIndex: 10,
          borderRadius: '15px'
        }}>
          {true && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎤</div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px' }}>
                YOUR TURN!
              </div>
            </>
          )}
          <div style={{ fontSize: '8rem', fontWeight: 'bold' }}>
            {countdown > 0 ? countdown : 'Go!'}
          </div>
        </div>
      )}

      {/* Sparkles for good performance during recording */}
      {/* Removed the Sparkle component that was causing white flashing */}
      
      <audio 
        ref={audioPlayerRef} 
        src={audioUrl} 
        preload="auto"
        crossOrigin="anonymous"
        controls={false}
        style={{ display: 'none' }}
      />
  
      <div style={{
        position: 'relative',
        width: '100%',
        height: '300px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '15px',
        overflow: 'hidden',
        isolation: 'isolate',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}>
        <canvas 
          ref={canvasRef} 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%',
            willChange: 'contents',
            transform: 'translateZ(0)'
          }}
        />
      </div>
      
   
      <div style={{ 
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button 
          onClick={handleButtonClick}
          disabled={sessionState === 'preparing' || sessionState === 'listening'}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '25px',
            border: 'none',
            background: sessionState === 'recording' 
              ? 'linear-gradient(135deg, #ff4757, #ff3742)' 
              : sessionState === 'listening' || sessionState === 'preparing'
              ? 'linear-gradient(135deg, #a4b0be, #747d8c)'
              : 'linear-gradient(135deg, #5f27cd, #341f97)',
            color: 'white',
            cursor: sessionState === 'preparing' || sessionState === 'listening' ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            transform: sessionState === 'preparing' || sessionState === 'listening' ? 'none' : 'scale(1)',
            opacity: sessionState === 'preparing' || sessionState === 'listening' ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (sessionState !== 'preparing' && sessionState !== 'listening') {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (sessionState !== 'preparing' && sessionState !== 'listening') {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }
          }}
        >
          {buttonText()}
        </button>
      </div>
      <div style={{ display: 'none' }}>
        <p>Score: {score}</p>
        <p>Streak: {streak}</p>
        <p>Current Note: {currentNote} ({Math.round(currentPitch)} Hz)</p>
        <p>Cents off: {cents}</p>
        {sessionState === 'recording' && currentPitch > 0 && (() => {
          const target = getCurrentTargetEventMemo(currentTime);
          if (target && target.pitch) {
            const targetFreq = noteToFrequency(target.pitch.note, target.pitch.octave);
            const accuracy = calculateAccuracy(currentPitch, targetFreq);
            return (
              <p style={{ 
                color: accuracy > 80 ? 'green' : accuracy > 60 ? 'orange' : 'red',
                fontWeight: 'bold'
              }}>
                Accuracy: {accuracy.toFixed(0)}%
              </p>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
};

export default KaraokeVisualizer; 