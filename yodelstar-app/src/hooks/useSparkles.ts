import { useState, useRef, useCallback, useEffect } from 'react';

export const useSparkles = () => {
  const [showSparkles, setShowSparkles] = useState(false);
  const [sparkleIntensity, setSparkleIntensity] = useState(0);
  const sparkleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSparkles = useCallback((accuracy: number) => {
    if (accuracy > 80) {
      setShowSparkles(true);
      setSparkleIntensity(accuracy);
      
      // Clear existing timeout
      if (sparkleTimeoutRef.current) {
        clearTimeout(sparkleTimeoutRef.current);
      }
      
      // Hide sparkles after a short duration
      sparkleTimeoutRef.current = setTimeout(() => {
        setShowSparkles(false);
        setSparkleIntensity(0);
      }, 1000);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sparkleTimeoutRef.current) {
        clearTimeout(sparkleTimeoutRef.current);
      }
    };
  }, []);

  return {
    showSparkles,
    sparkleIntensity,
    triggerSparkles
  };
}; 