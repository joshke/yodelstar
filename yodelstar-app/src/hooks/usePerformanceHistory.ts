import { useState, useEffect, useCallback } from 'react';

interface YodelComparisonData {
  overallScore: number;
  pitchAccuracy: {
    score: number;
    deviation: number;
    description: string;
  };
  timingAccuracy: {
    score: number;
    deviation: number;
    description: string;
  };
  syllableAccuracy: {
    score: number;
    matchedSyllables: number;
    totalSyllables: number;
    description: string;
  };
  rhythmConsistency: {
    score: number;
    tempoVariation: number;
    description: string;
  };
  feedback: {
    strengths: string[];
    areasForImprovement: Array<{
      area: string;
      priority: 'high' | 'medium' | 'low';
      suggestion: string;
    }>;
    practiceRecommendations: string[];
    overallFeedback: string;
  };
}

interface PerformanceRecord {
  id: string;
  timestamp: number;
  data: YodelComparisonData;
  songTitle?: string;
}

interface PerformanceStats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  improvementTrend: number; // Percentage improvement over last 5 attempts
  strongestMetric: string;
  weakestMetric: string;
}

export const usePerformanceHistory = () => {
  const [history, setHistory] = useState<PerformanceRecord[]>([]);
  const [currentResult, setCurrentResult] = useState<YodelComparisonData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('yodel-performance-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (error) {
        console.error('Error loading performance history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('yodel-performance-history', JSON.stringify(history));
    }
  }, [history]);

  const addPerformanceResult = useCallback((data: YodelComparisonData, songTitle?: string) => {
    const newRecord: PerformanceRecord = {
      id: `performance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      data,
      songTitle
    };

    setHistory(prev => [newRecord, ...prev].slice(0, 50)); // Keep only last 50 records
    setCurrentResult(data);
    setIsVisible(true);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('yodel-performance-history');
  }, []);

  const hideResults = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showResults = useCallback(() => {
    setIsVisible(true);
  }, []);

  const getPerformanceStats = useCallback((): PerformanceStats | null => {
    if (history.length === 0) return null;

    const scores = history.map(record => record.data.overallScore);
    const totalAttempts = history.length;
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
    const bestScore = Math.max(...scores);

    // Calculate improvement trend (last 5 vs previous 5)
    let improvementTrend = 0;
    if (history.length >= 10) {
      const recent5 = scores.slice(0, 5);
      const previous5 = scores.slice(5, 10);
      const recentAvg = recent5.reduce((sum, score) => sum + score, 0) / 5;
      const previousAvg = previous5.reduce((sum, score) => sum + score, 0) / 5;
      improvementTrend = ((recentAvg - previousAvg) / previousAvg) * 100;
    }

    // Find strongest and weakest metrics
    const metricAverages = {
      pitch: history.reduce((sum, record) => sum + record.data.pitchAccuracy.score, 0) / totalAttempts,
      timing: history.reduce((sum, record) => sum + record.data.timingAccuracy.score, 0) / totalAttempts,
      syllables: history.reduce((sum, record) => sum + record.data.syllableAccuracy.score, 0) / totalAttempts,
      rhythm: history.reduce((sum, record) => sum + record.data.rhythmConsistency.score, 0) / totalAttempts,
    };

    const sortedMetrics = Object.entries(metricAverages).sort(([,a], [,b]) => b - a);
    const strongestMetric = sortedMetrics[0][0];
    const weakestMetric = sortedMetrics[sortedMetrics.length - 1][0];

    return {
      totalAttempts,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore,
      improvementTrend: Math.round(improvementTrend * 10) / 10,
      strongestMetric,
      weakestMetric
    };
  }, [history]);

  const getRecentResults = useCallback((count: number = 10) => {
    return history.slice(0, count);
  }, [history]);

  return {
    history,
    currentResult,
    isVisible,
    addPerformanceResult,
    clearHistory,
    hideResults,
    showResults,
    getPerformanceStats,
    getRecentResults
  };
}; 