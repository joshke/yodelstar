import React, { useState } from 'react';
import PerformanceResults from './PerformanceResults';

const PerformanceDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  // Sample performance data for demonstration
  const sampleData = {
    overallScore: 87,
    pitchAccuracy: {
      score: 92,
      deviation: 15.3,
      description: "Excellent pitch control with minor deviations in the higher register. Your intonation is very stable throughout most of the performance."
    },
    timingAccuracy: {
      score: 84,
      deviation: 45.2,
      description: "Good timing overall with some rushing in the faster passages. Work on maintaining steady tempo during yodel breaks."
    },

    syllableAccuracy: {
      score: 78,
      matchedSyllables: 23,
      totalSyllables: 28,
      description: "Most syllables are clearly articulated. Focus on the 'lei' and 'du' syllables for better clarity."
    },
    rhythmConsistency: {
      score: 91,
      tempoVariation: 8.5,
      description: "Excellent rhythm consistency throughout the performance. Your internal pulse is very steady."
    },
    feedback: {
      strengths: [
        "Outstanding pitch accuracy in the middle register",
        "Excellent breath control and support",
        "Very musical phrasing and expression",
        "Strong rhythm and timing foundation"
      ],
      areasForImprovement: [
        {
          area: "High register intonation",
          priority: "medium" as const,
          suggestion: "Practice scales and arpeggios in the upper register to improve pitch stability"
        },
        {
          area: "Syllable articulation",
          priority: "high" as const,
          suggestion: "Work on consonant clarity, especially in fast yodel passages"
        },
        {
          area: "Tempo consistency in transitions",
          priority: "low" as const,
          suggestion: "Use a metronome when practicing yodel breaks to maintain steady tempo"
        }
      ],
      practiceRecommendations: [
        "Practice with a tuner for 10 minutes daily to improve pitch accuracy",
        "Work on lip trills and tongue twisters for better articulation",
        "Record yourself singing and listen back for timing issues",
        "Practice yodel breaks slowly, then gradually increase tempo",
        "Focus on breath support exercises to maintain consistency"
      ],
      overallFeedback: "This is a very strong yodel performance! You demonstrate excellent technical control and musicality. Your pitch accuracy and rhythm are particularly impressive. With some focused work on syllable clarity and high register stability, you'll be ready for more advanced yodeling techniques. Keep up the great work!"
    }
  };

  const excellentData = {
    overallScore: 96,
    pitchAccuracy: {
      score: 98,
      deviation: 5.1,
      description: "Exceptional pitch accuracy throughout the entire range. Your intonation is virtually perfect."
    },
    timingAccuracy: {
      score: 95,
      deviation: 12.3,
      description: "Outstanding timing precision. You maintain perfect tempo even through complex yodel passages."
    },

    syllableAccuracy: {
      score: 94,
      matchedSyllables: 27,
      totalSyllables: 28,
      description: "Crystal clear articulation with excellent consonant and vowel definition."
    },
    rhythmConsistency: {
      score: 95,
      tempoVariation: 3.2,
      description: "Rock-solid rhythm with minimal tempo variation. Your internal metronome is exceptional."
    },
    feedback: {
      strengths: [
        "Perfect pitch accuracy across all registers",
        "Flawless yodel break technique",
        "Exceptional rhythmic precision",
        "Outstanding musical expression and style",
        "Professional-level breath control"
      ],
      areasForImprovement: [
        {
          area: "Dynamic contrast",
          priority: "low" as const,
          suggestion: "Experiment with more dramatic volume changes for added musical interest"
        }
      ],
      practiceRecommendations: [
        "Continue regular practice to maintain this exceptional level",
        "Explore more complex yodeling repertoire",
        "Consider performance opportunities to share your talent",
        "Work on dynamic expression and musical interpretation"
      ],
      overallFeedback: "🏆 EXCEPTIONAL PERFORMANCE! 🏆 This is truly masterful yodeling that demonstrates professional-level technique and artistry. Your control, precision, and musicality are outstanding. You've achieved a level of excellence that few reach. Consider this a benchmark performance - you should be very proud of this achievement!"
    }
  };

  const [currentDemo, setCurrentDemo] = useState<'good' | 'excellent'>('good');

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎭 Performance Results</h2>
      <p>This demo showcases the PerformanceResults component with different score levels.</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setShowDemo(!showDemo)}
          style={{
            padding: '12px 24px',
            backgroundColor: showDemo ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showDemo ? 'Hide Demo' : 'Show Demo'}
        </button>
        
        {showDemo && (
          <>
            <button 
              onClick={() => setCurrentDemo('good')}
              style={{
                padding: '12px 24px',
                backgroundColor: currentDemo === 'good' ? '#2196F3' : '#e0e0e0',
                color: currentDemo === 'good' ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Good Performance (87%)
            </button>
            
            <button 
              onClick={() => setCurrentDemo('excellent')}
              style={{
                padding: '12px 24px',
                backgroundColor: currentDemo === 'excellent' ? '#FF9800' : '#e0e0e0',
                color: currentDemo === 'excellent' ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Excellent Performance (96%)
            </button>
          </>
        )}
      </div>

      <PerformanceResults 
        data={showDemo ? (currentDemo === 'excellent' ? excellentData : sampleData) : null}
        isVisible={showDemo}
      />
      
      {showDemo && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '10px',
          border: '2px dashed #ccc'
        }}>
          <h3>🔧 Component Features Demonstrated:</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Animated Circular Progress:</strong> Watch the circles fill up with smooth animations</li>
            <li><strong>Color-coded Scores:</strong> Different colors for different performance levels</li>
            <li><strong>Interactive Metrics:</strong> Click on individual metric circles to see detailed tips</li>
            <li><strong>Expandable Details:</strong> Toggle detailed feedback with the "Show Details" button</li>
            <li><strong>Priority-based Improvements:</strong> Color-coded improvement areas (High/Medium/Low priority)</li>
            <li><strong>Responsive Design:</strong> Adapts to different screen sizes</li>
            <li><strong>Performance Grades:</strong> A+ to D grading system with encouraging messages</li>
            <li><strong>Rich Feedback:</strong> Comprehensive strengths, improvements, and practice recommendations</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PerformanceDemo; 