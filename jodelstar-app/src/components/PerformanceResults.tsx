import React, { useState, useEffect } from 'react';
import './PerformanceResults.css';

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

interface PerformanceResultsProps {
  data: YodelComparisonData | null;
  isVisible: boolean;
}

interface CircularProgressProps {
  score: number;
  size: number;
  strokeWidth: number;
  label: string;
  subtitle?: string;
  animated?: boolean;
  onClick?: () => void;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  size,
  strokeWidth,
  label,
  subtitle,
  animated = true,
  onClick
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedScore(score);
    }
  }, [score, animated]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10B981'; // Emerald-500 - Excellent
    if (score >= 80) return '#3B82F6'; // Blue-500 - Great
    if (score >= 70) return '#8B5CF6'; // Violet-500 - Good
    if (score >= 60) return '#F59E0B'; // Amber-500 - Fair
    return '#EF4444'; // Red-500 - Needs improvement
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
  };

  return (
    <div 
      className={`circular-progress ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="progress-ring">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getScoreColor(score)} stopOpacity="0.8" />
            <stop offset="100%" stopColor={getScoreColor(score)} stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${label})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-circle"
          style={{
            transition: animated ? 'stroke-dashoffset 2s ease-in-out' : 'none',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
      </svg>
      
      <div className="progress-content">
        <div className="score-value" style={{ color: getScoreColor(score) }}>
          {Math.round(animatedScore)}
        </div>
       
        <div className="score-label">{label}</div>
        {subtitle && <div className="score-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

const PerformanceResults: React.FC<PerformanceResultsProps> = ({ data, isVisible }) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  if (!data || !isVisible) {
    return null;
  }

  const metrics = [
    {
      key: 'pitch',
      label: 'Pitch',
      score: data.pitchAccuracy.score,
      subtitle: `±${data.pitchAccuracy.deviation} cents`,
      details: {
        title: 'Pitch Accuracy',
        description: data.pitchAccuracy.description,
        value: `${data.pitchAccuracy.deviation} cents deviation`,
        tips: ['Practice with a tuner', 'Work on ear training', 'Focus on breath support']
      }
    },
    {
      key: 'timing',
      label: 'Timing',
      score: data.timingAccuracy.score,
      subtitle: `±${data.timingAccuracy.deviation}ms`,
      details: {
        title: 'Timing Accuracy',
        description: data.timingAccuracy.description,
        value: `${data.timingAccuracy.deviation}ms deviation`,
        tips: ['Practice with metronome', 'Count beats aloud', 'Record and analyze timing']
      }
    },
    {
      key: 'syllables',
      label: 'Syllables',
      score: data.syllableAccuracy.score,
      subtitle: `${data.syllableAccuracy.matchedSyllables}/${data.syllableAccuracy.totalSyllables}`,
      details: {
        title: 'Syllable Accuracy',
        description: data.syllableAccuracy.description,
        value: `${data.syllableAccuracy.matchedSyllables} of ${data.syllableAccuracy.totalSyllables} syllables matched`,
        tips: ['Practice pronunciation', 'Listen to original carefully', 'Work on articulation']
      }
    },
    {
      key: 'rhythm',
      label: 'Rhythm',
      score: data.rhythmConsistency.score,
      subtitle: `${data.rhythmConsistency.tempoVariation}% variation`,
      details: {
        title: 'Rhythm Consistency',
        description: data.rhythmConsistency.description,
        value: `${data.rhythmConsistency.tempoVariation}% tempo variation`,
        tips: ['Use metronome practice', 'Tap foot while singing', 'Practice rhythm patterns']
      }
    }
  ];

  const handleMetricClick = (key: string) => {
    setExpandedMetric(expandedMetric === key ? null : key);
  };

  const getOverallGrade = (score: number): string => {
    if (score >= 95) return 'Exceptional! 🌟';
    if (score >= 90) return 'Excellent! 🎉';
    if (score >= 80) return 'Great Job! 👏';
    if (score >= 70) return 'Good Work! 👍';
    if (score >= 60) return 'Keep Practicing! 💪';
    return 'Room for Growth! 📈';
  };

  return (
    <div className={`performance-results ${isVisible ? 'visible' : ''}`}>
      <div className="results-header">
        <h2>Performance</h2>
        <button 
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="overall-score-section">
        <CircularProgress
          score={data.overallScore}
          size={200}
          strokeWidth={12}
          label="Overall Score"
          subtitle={getOverallGrade(data.overallScore)}
          animated={true}
        />
      </div>

      <div className="overall-feedback-section">
        <div className="overall-feedback-card">
          <h3>📝 Overall Assessment</h3>
          <p className="overall-feedback-text">{data.feedback.overallFeedback}</p>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.key} className="metric-item">
            <CircularProgress
              score={metric.score}
              size={120}
              strokeWidth={8}
              label={metric.label}
              animated={true}
              onClick={() => handleMetricClick(metric.key)}
            />
            
            {expandedMetric === metric.key && (
              <div className="metric-details">
                <h4>{metric.details.title}</h4>
                <p className="metric-description">{metric.details.description}</p>
                <div className="metric-value">{metric.details.value}</div>
                <div className="metric-tips">
                  <h5>💡 Tips for Improvement:</h5>
                  <ul>
                    {metric.details.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showDetails && (
        <div className="detailed-feedback">
          <div className="feedback-section">
            <h3>🎯 Strengths</h3>
            <ul className="strengths-list">
              {data.feedback.strengths.map((strength, index) => (
                <li key={index} className="strength-item">{strength}</li>
              ))}
            </ul>
          </div>

          <div className="feedback-section">
            <h3>📈 Areas for Improvement</h3>
            <div className="improvements-list">
              {data.feedback.areasForImprovement.map((area, index) => (
                <div key={index} className={`improvement-item priority-${area.priority}`}>
                  <div className="improvement-header">
                    <span className="improvement-area">{area.area}</span>
                    <span className={`priority-badge priority-${area.priority}`}>
                      {area.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="improvement-suggestion">{area.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="feedback-section">
            <h3>🎵 Practice Recommendations</h3>
            <ul className="recommendations-list">
              {data.feedback.practiceRecommendations.map((recommendation, index) => (
                <li key={index} className="recommendation-item">{recommendation}</li>
              ))}
            </ul>
          </div>


        </div>
      )}
    </div>
  );
};

export default PerformanceResults; 