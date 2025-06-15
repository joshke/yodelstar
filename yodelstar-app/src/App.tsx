import React, { useEffect, useState } from "react";
import "./App.css";
import KaraokeVisualizer from "./components/KaraokeVisualizer";
import PerformanceResults from "./components/PerformanceResults";
import { usePerformanceHistory } from "./hooks/usePerformanceHistory";

interface YodelAnalysisData {
  yodelAnalysis: {
    videoSource: string;
    totalYodelSyllables: number;
    phrases: Array<{
      phraseNumber: number;
      startTime: string;
      endTime: string;
      yodelSyllablesInPhrase: number;
      events: Array<{
        timestamp: string;
        type: "headVoice" | "chestVoice" | "yodelSyllable" | "yodelBreak";
        description: string;
        syllable?: string;
        pitch?: {
          note: string;
          octave: number;
        };
      }>;
    }>;
  };
}

interface YodelComparisonData {
  yodelComparison: {
    overallScore: number;
    metrics: {
      pitchAccuracy: {
        score: number;
        averageDeviationCents: number;
        description: string;
      };
      timingAccuracy: {
        score: number;
        averageDeviationMs: number;
        description: string;
      };
      yodelBreakQuality: {
        score: number;
        smoothnessRating: "excellent" | "good" | "fair" | "poor";
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
    };
    feedback: {
      strengths: string[];
      areasForImprovement: Array<{
        area: string;
        suggestion: string;
        priority: "high" | "medium" | "low";
      }>;
      practiceRecommendations: string[];
      overallFeedback: string;
    };
  };
}

function App() {
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [analysisData, setAnalysisData] = useState<YodelAnalysisData | null>(
    null
  );
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Use performance history hook
  const {
    currentResult,
    isVisible: showResults,
    addPerformanceResult,
    getPerformanceStats,
    getRecentResults,
    hideResults,
  } = usePerformanceHistory();

  const availableSteps = [1, 2];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.95) {
        createSparkle(e.pageX, e.pageY);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const createSparkle = (x: number, y: number) => {
    const sparkle = document.createElement("div");
    sparkle.style.position = "fixed";
    sparkle.style.left = x + "px";
    sparkle.style.top = y + "px";
    sparkle.style.width = "4px";
    sparkle.style.height = "4px";
    sparkle.style.background = "#fff";
    sparkle.style.borderRadius = "50%";
    sparkle.style.pointerEvents = "none";
    sparkle.style.zIndex = "1000";
    sparkle.style.animation = "sparkleAnim 1s ease-out forwards";

    document.body.appendChild(sparkle);

    setTimeout(() => {
      sparkle.remove();
    }, 1000);
  };

  // Transform API response to PerformanceResults format
  const transformComparisonData = (apiData: YodelComparisonData) => {
    const metrics = apiData.yodelComparison.metrics;

    return {
      overallScore: apiData.yodelComparison.overallScore,
      pitchAccuracy: {
        score: metrics.pitchAccuracy.score,
        deviation: metrics.pitchAccuracy.averageDeviationCents,
        description: metrics.pitchAccuracy.description,
      },
      timingAccuracy: {
        score: metrics.timingAccuracy.score,
        deviation: metrics.timingAccuracy.averageDeviationMs,
        description: metrics.timingAccuracy.description,
      },
      syllableAccuracy: {
        score: metrics.syllableAccuracy.score,
        matchedSyllables: metrics.syllableAccuracy.matchedSyllables,
        totalSyllables: metrics.syllableAccuracy.totalSyllables,
        description: metrics.syllableAccuracy.description,
      },
      rhythmConsistency: {
        score: metrics.rhythmConsistency.score,
        tempoVariation: metrics.rhythmConsistency.tempoVariation,
        description: metrics.rhythmConsistency.description,
      },
      feedback: apiData.yodelComparison.feedback,
    };
  };

  useEffect(() => {
    const loadStepData = async () => {
      setLoading(true);
      setError(null);
      setComparisonError(null);

      try {
        // Load analysis data
        const analysisResponse = await fetch(
          `/steps/${selectedStep}_analysis.json`
        );
        if (!analysisResponse.ok) {
          throw new Error(
            `Failed to load analysis for step ${selectedStep}: ${analysisResponse.status}`
          );
        }
        const data: YodelAnalysisData = await analysisResponse.json();
        setAnalysisData(data);

        // Set audio URL
        const audioPath = `/steps/${selectedStep}.wav`;
        setAudioUrl(audioPath);
      } catch (err) {
        console.error("Error loading step data:", err);
        setError(`Failed to load data for step ${selectedStep}`);
      } finally {
        setLoading(false);
      }
    };

    loadStepData();
  }, [selectedStep]);

  // Function to convert audio blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Function to fetch original audio as base64
  const fetchOriginalAudioAsBase64 = async (
    audioPath: string
  ): Promise<string> => {
    console.log("🔄 Fetching original audio from:", audioPath);
    const response = await fetch(audioPath);
    console.log("📡 Original audio fetch response:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch original audio: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();
    console.log("📊 Original audio blob:", {
      size: blob.size,
      type: blob.type,
    });

    return await blobToBase64(blob);
  };

  // Helper function to create a fetch request with timeout
  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 120000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
      }
      throw error;
    }
  };

  // Helper function to implement retry logic
  const retryWithBackoff = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === maxRetries) {
          console.error(`❌ All ${maxRetries} attempts failed`);
          throw lastError;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };

  // Function to call the compare-yodel API
  const compareYodelPerformance = async (userAudioBlob: Blob) => {
    console.log("🎤 Starting yodel comparison process...");
    console.log("📊 User audio blob:", {
      size: userAudioBlob.size,
      type: userAudioBlob.type,
    });

    setIsComparing(true);
    setComparisonError(null);

    try {
      console.log("🔄 Converting user audio to base64...");
      const userAudioBase64 = await blobToBase64(userAudioBlob);
      console.log("✅ User audio converted:", {
        base64Length: userAudioBase64.length,
        sizeEstimate: `${Math.round(userAudioBase64.length * 0.75)} bytes`,
      });

      console.log("🔄 Fetching original audio...", audioUrl);
      const originalAudioBase64 = await fetchOriginalAudioAsBase64(audioUrl);
      console.log("✅ Original audio fetched:", {
        base64Length: originalAudioBase64.length,
        sizeEstimate: `${Math.round(originalAudioBase64.length * 0.75)} bytes`,
      });

      // Prepare past performances data for enhanced feedback
      const recentPerformances = getRecentResults(10); // Get last 10 performances
      const pastPerformances = recentPerformances.map((record) => ({
        yodelComparison: {
          overallScore: record.data.overallScore,
          metrics: {
            pitchAccuracy: {
              score: record.data.pitchAccuracy.score,
              averageDeviationCents: record.data.pitchAccuracy.deviation,
              description: record.data.pitchAccuracy.description,
            },
            timingAccuracy: {
              score: record.data.timingAccuracy.score,
              averageDeviationMs: record.data.timingAccuracy.deviation,
              description: record.data.timingAccuracy.description,
            },
            yodelBreakQuality: {
              score: 85, // Default value since we don't have this in our current data structure
              smoothnessRating: "good" as const,
              description: "Yodel break quality assessment",
            },
            syllableAccuracy: {
              score: record.data.syllableAccuracy.score,
              matchedSyllables: record.data.syllableAccuracy.matchedSyllables,
              totalSyllables: record.data.syllableAccuracy.totalSyllables,
              description: record.data.syllableAccuracy.description,
            },
            rhythmConsistency: {
              score: record.data.rhythmConsistency.score,
              tempoVariation: record.data.rhythmConsistency.tempoVariation,
              description: record.data.rhythmConsistency.description,
            },
          },
          feedback: record.data.feedback,
        },
        timestamp: record.timestamp,
        songTitle: record.songTitle,
      }));

      // Prepare user info based on performance stats
      const performanceStats = getPerformanceStats();
      const userInfo = {
        experience_level: performanceStats
          ? performanceStats.averageScore >= 85
            ? "advanced"
            : performanceStats.averageScore >= 70
            ? "intermediate"
            : "beginner"
          : "beginner",
        practice_frequency: performanceStats
          ? performanceStats.totalAttempts >= 20
            ? "daily"
            : performanceStats.totalAttempts >= 10
            ? "3-4 times per week"
            : performanceStats.totalAttempts >= 5
            ? "1-2 times per week"
            : "just started"
          : "just started",
        total_practice_time: performanceStats
          ? `${performanceStats.totalAttempts} previous attempts`
          : "first attempt",
        goals: "Improve overall yodeling technique and accuracy",
        challenges: performanceStats?.weakestMetric
          ? `Working on ${performanceStats.weakestMetric} accuracy`
          : "Learning the basics",
      };

      console.log("📈 Including performance context:", {
        pastPerformancesCount: pastPerformances.length,
        userExperienceLevel: userInfo.experience_level,
        totalAttempts: performanceStats?.totalAttempts || 0,
      });

      const requestPayload = {
        original_wav_base64: originalAudioBase64,
        user_wav_base64: userAudioBase64,
        past_performances:
          pastPerformances.length > 0 ? pastPerformances : undefined,
        user_info: userInfo,
      };

      // Call the API with retry mechanism and extended timeout
      console.log("🚀 Calling compare-yodel API with retry mechanism...");
      const comparisonResult: YodelComparisonData = await retryWithBackoff(async () => {
        const response = await fetchWithTimeout("/compare-yodel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        }, 120000); // 2 minute timeout

        console.log("📡 API Response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error Response:", errorText);
          throw new Error(`API call failed: ${response.status} - ${errorText}`);
        }

        console.log("🔄 Parsing API response...");
        const result: YodelComparisonData = await response.json();
        console.log("✅ Comparison result received:", {
          overallScore: result.yodelComparison?.overallScore,
          hasMetrics: !!result.yodelComparison?.metrics,
          hasFeedback: !!result.yodelComparison?.feedback,
        });

        return result;
      }, 3, 2000); // 3 retries with 2 second base delay

      // Transform and add to performance history
      console.log("RESULT", comparisonResult);
      const transformedData = transformComparisonData(comparisonResult);
      addPerformanceResult(transformedData, `Step ${selectedStep}`);

      console.log("🎉 Comparison process completed successfully!");
    } catch (err) {
      console.error("❌ Error comparing yodel performance:", err);
      console.error("📋 Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      // Provide more specific error messages
      let errorMessage = "Unknown error occurred";
      if (err instanceof Error) {
        if (err.message.includes("timed out")) {
          errorMessage = "Request timed out. The server may be busy. Please try again.";
        } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (err.message.includes("500")) {
          errorMessage = "Server error. Please try again in a moment.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setComparisonError(errorMessage);
    } finally {
      setIsComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="App app">
        <div className="page-decorations">
          {/* Floating Trees */}
          <svg
            className="floating-tree tree-1"
            width="100"
            height="120"
            viewBox="0 0 100 120"
          >
            <rect
              x="45"
              y="85"
              width="10"
              height="30"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="80"
              rx="30"
              ry="25"
              fill="#228B22"
              stroke="#006400"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="60"
              rx="25"
              ry="22"
              fill="#32CD32"
              stroke="#228B22"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="40"
              rx="18"
              ry="18"
              fill="#7CFC00"
              stroke="#32CD32"
              strokeWidth="2"
            />
            <circle cx="42" cy="55" r="4" fill="#ADFF2F" opacity="0.8" />
            <circle cx="60" cy="70" r="3" fill="#ADFF2F" opacity="0.8" />
          </svg>

          <svg
            className="floating-tree tree-2"
            width="90"
            height="110"
            viewBox="0 0 90 110"
          >
            <rect
              x="40"
              y="80"
              width="10"
              height="25"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="45"
              cy="75"
              rx="28"
              ry="23"
              fill="#FF69B4"
              stroke="#FF1493"
              strokeWidth="2"
            />
            <ellipse
              cx="45"
              cy="55"
              rx="22"
              ry="20"
              fill="#FFB6C1"
              stroke="#FF69B4"
              strokeWidth="2"
            />
            <ellipse
              cx="45"
              cy="38"
              rx="16"
              ry="16"
              fill="#FFC0CB"
              stroke="#FFB6C1"
              strokeWidth="2"
            />
            <circle cx="38" cy="50" r="3" fill="#FFCCCB" opacity="0.8" />
            <circle cx="55" cy="65" r="4" fill="#FFCCCB" opacity="0.8" />
          </svg>

          <svg
            className="floating-tree tree-3"
            width="85"
            height="105"
            viewBox="0 0 85 105"
          >
            <rect
              x="37"
              y="75"
              width="10"
              height="25"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="42"
              cy="70"
              rx="26"
              ry="22"
              fill="#9370DB"
              stroke="#6A0DAD"
              strokeWidth="2"
            />
            <ellipse
              cx="42"
              cy="52"
              rx="20"
              ry="18"
              fill="#BA55D3"
              stroke="#9370DB"
              strokeWidth="2"
            />
            <ellipse
              cx="42"
              cy="36"
              rx="15"
              ry="15"
              fill="#DDA0DD"
              stroke="#BA55D3"
              strokeWidth="2"
            />
            <circle cx="35" cy="48" r="3" fill="#E6E6FA" opacity="0.8" />
            <circle cx="50" cy="60" r="4" fill="#E6E6FA" opacity="0.8" />
          </svg>

          <svg
            className="floating-tree tree-4"
            width="95"
            height="115"
            viewBox="0 0 95 115"
          >
            <rect
              x="42"
              y="85"
              width="10"
              height="28"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="47"
              cy="80"
              rx="29"
              ry="24"
              fill="#FF8C00"
              stroke="#FF4500"
              strokeWidth="2"
            />
            <ellipse
              cx="47"
              cy="58"
              rx="23"
              ry="21"
              fill="#FFA500"
              stroke="#FF8C00"
              strokeWidth="2"
            />
            <ellipse
              cx="47"
              cy="39"
              rx="17"
              ry="17"
              fill="#FFD700"
              stroke="#FFA500"
              strokeWidth="2"
            />
            <circle cx="40" cy="53" r="4" fill="#FFFFE0" opacity="0.8" />
            <circle cx="56" cy="68" r="3" fill="#FFFFE0" opacity="0.8" />
          </svg>

          {/* Floating Clouds */}
          <svg
            className="floating-cloud cloud-1"
            width="80"
            height="40"
            viewBox="0 0 80 40"
          >
            <ellipse
              cx="20"
              cy="25"
              rx="12"
              ry="8"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="35"
              cy="20"
              rx="16"
              ry="10"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="50"
              cy="23"
              rx="14"
              ry="9"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="65"
              cy="27"
              rx="10"
              ry="7"
              fill="white"
              opacity="0.9"
            />
          </svg>

          <svg
            className="floating-cloud cloud-2"
            width="70"
            height="35"
            viewBox="0 0 70 35"
          >
            <ellipse
              cx="15"
              cy="22"
              rx="10"
              ry="7"
              fill="white"
              opacity="0.8"
            />
            <ellipse
              cx="28"
              cy="18"
              rx="14"
              ry="9"
              fill="white"
              opacity="0.8"
            />
            <ellipse
              cx="42"
              cy="21"
              rx="12"
              ry="8"
              fill="white"
              opacity="0.8"
            />
            <ellipse cx="55" cy="24" rx="9" ry="6" fill="white" opacity="0.8" />
          </svg>

          <svg
            className="floating-cloud cloud-3"
            width="75"
            height="38"
            viewBox="0 0 75 38"
          >
            <ellipse
              cx="18"
              cy="24"
              rx="11"
              ry="8"
              fill="white"
              opacity="0.85"
            />
            <ellipse
              cx="32"
              cy="19"
              rx="15"
              ry="10"
              fill="white"
              opacity="0.85"
            />
            <ellipse
              cx="47"
              cy="22"
              rx="13"
              ry="9"
              fill="white"
              opacity="0.85"
            />
            <ellipse
              cx="60"
              cy="26"
              rx="10"
              ry="7"
              fill="white"
              opacity="0.85"
            />
          </svg>

          <svg
            className="floating-cloud cloud-4"
            width="65"
            height="32"
            viewBox="0 0 65 32"
          >
            <ellipse cx="14" cy="20" rx="9" ry="6" fill="white" opacity="0.8" />
            <ellipse
              cx="26"
              cy="16"
              rx="12"
              ry="8"
              fill="white"
              opacity="0.8"
            />
            <ellipse
              cx="38"
              cy="19"
              rx="11"
              ry="7"
              fill="white"
              opacity="0.8"
            />
            <ellipse cx="50" cy="22" rx="8" ry="6" fill="white" opacity="0.8" />
          </svg>

          <svg
            className="floating-cloud cloud-5"
            width="60"
            height="30"
            viewBox="0 0 60 30"
          >
            <ellipse cx="12" cy="18" rx="8" ry="6" fill="white" opacity="0.9" />
            <ellipse
              cx="23"
              cy="15"
              rx="11"
              ry="7"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="34"
              cy="17"
              rx="10"
              ry="6"
              fill="white"
              opacity="0.9"
            />
            <ellipse cx="45" cy="20" rx="7" ry="5" fill="white" opacity="0.9" />
          </svg>

          {/* Musical Notes */}
          <div className="music-note note-1">♪</div>
          <div className="music-note note-2">♫</div>
          <div className="music-note note-3">♪</div>
          <div className="music-note note-4">♬</div>
          <div className="music-note note-5">♫</div>

          {/* Stars */}
          <div className="star-decoration star-1">★</div>
          <div className="star-decoration star-2">✦</div>
          <div className="star-decoration star-3">★</div>
          <div className="star-decoration star-4">✧</div>
          {/* Background Images */}
          <img
            className="bg-image baum-image"
            src="/images/baum.png"
            alt="Baum"
          />
          <img
            className="bg-image berg-image"
            src="/images/berg.png"
            alt="Berg"
          />
          <img
            className="bg-image fuchs-image"
            src="/images/fuchs.png"
            alt="Fuchs"
          />
        </div>

        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <main className="container">
          <p>Loading analysis data for step {selectedStep}...</p>
        </main>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="App app">
        <div className="page-decorations">
          {/* Floating Trees */}
          <svg
            className="floating-tree tree-1"
            width="100"
            height="120"
            viewBox="0 0 100 120"
          >
            <rect
              x="45"
              y="85"
              width="10"
              height="30"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="80"
              rx="30"
              ry="25"
              fill="#228B22"
              stroke="#006400"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="60"
              rx="25"
              ry="22"
              fill="#32CD32"
              stroke="#228B22"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="40"
              rx="18"
              ry="18"
              fill="#7CFC00"
              stroke="#32CD32"
              strokeWidth="2"
            />
            <circle cx="42" cy="55" r="4" fill="#ADFF2F" opacity="0.8" />
            <circle cx="60" cy="70" r="3" fill="#ADFF2F" opacity="0.8" />
          </svg>

          <svg
            className="floating-tree tree-2"
            width="90"
            height="110"
            viewBox="0 0 90 110"
          >
            <rect
              x="40"
              y="80"
              width="10"
              height="25"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="45"
              cy="75"
              rx="28"
              ry="23"
              fill="#FF69B4"
              stroke="#FF1493"
              strokeWidth="2"
            />
            <ellipse
              cx="45"
              cy="55"
              rx="22"
              ry="20"
              fill="#FFB6C1"
              stroke="#FF69B4"
              strokeWidth="2"
            />
            <ellipse
              cx="45"
              cy="38"
              rx="16"
              ry="16"
              fill="#FFC0CB"
              stroke="#FFB6C1"
              strokeWidth="2"
            />
            <circle cx="38" cy="50" r="3" fill="#FFCCCB" opacity="0.8" />
            <circle cx="55" cy="65" r="4" fill="#FFCCCB" opacity="0.8" />
          </svg>

          <svg
            className="floating-tree tree-3"
            width="85"
            height="105"
            viewBox="0 0 85 105"
          >
            <rect
              x="37"
              y="75"
              width="10"
              height="25"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="42"
              cy="70"
              rx="26"
              ry="22"
              fill="#9370DB"
              stroke="#6A0DAD"
              strokeWidth="2"
            />
            <ellipse
              cx="42"
              cy="52"
              rx="20"
              ry="18"
              fill="#BA55D3"
              stroke="#9370DB"
              strokeWidth="2"
            />
            <ellipse
              cx="42"
              cy="36"
              rx="15"
              ry="15"
              fill="#DDA0DD"
              stroke="#BA55D3"
              strokeWidth="2"
            />
            <circle cx="35" cy="48" r="3" fill="#E6E6FA" opacity="0.8" />
            <circle cx="50" cy="60" r="4" fill="#E6E6FA" opacity="0.8" />
          </svg>

          <svg
            className="floating-tree tree-4"
            width="95"
            height="115"
            viewBox="0 0 95 115"
          >
            <rect
              x="42"
              y="85"
              width="10"
              height="28"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
            />
            <ellipse
              cx="47"
              cy="80"
              rx="29"
              ry="24"
              fill="#FF8C00"
              stroke="#FF4500"
              strokeWidth="2"
            />
            <ellipse
              cx="47"
              cy="58"
              rx="23"
              ry="21"
              fill="#FFA500"
              stroke="#FF8C00"
              strokeWidth="2"
            />
            <ellipse
              cx="47"
              cy="39"
              rx="17"
              ry="17"
              fill="#FFD700"
              stroke="#FFA500"
              strokeWidth="2"
            />
            <circle cx="40" cy="53" r="4" fill="#FFFFE0" opacity="0.8" />
            <circle cx="56" cy="68" r="3" fill="#FFFFE0" opacity="0.8" />
          </svg>

          {/* Floating Clouds */}
          <svg
            className="floating-cloud cloud-1"
            width="80"
            height="40"
            viewBox="0 0 80 40"
          >
            <ellipse
              cx="20"
              cy="25"
              rx="12"
              ry="8"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="35"
              cy="20"
              rx="16"
              ry="10"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="50"
              cy="23"
              rx="14"
              ry="9"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="65"
              cy="27"
              rx="10"
              ry="7"
              fill="white"
              opacity="0.9"
            />
          </svg>

          <svg
            className="floating-cloud cloud-2"
            width="70"
            height="35"
            viewBox="0 0 70 35"
          >
            <ellipse
              cx="15"
              cy="22"
              rx="10"
              ry="7"
              fill="white"
              opacity="0.8"
            />
            <ellipse
              cx="28"
              cy="18"
              rx="14"
              ry="9"
              fill="white"
              opacity="0.8"
            />
            <ellipse
              cx="42"
              cy="21"
              rx="12"
              ry="8"
              fill="white"
              opacity="0.8"
            />
            <ellipse cx="55" cy="24" rx="9" ry="6" fill="white" opacity="0.8" />
          </svg>

          <svg
            className="floating-cloud cloud-3"
            width="75"
            height="38"
            viewBox="0 0 75 38"
          >
            <ellipse
              cx="18"
              cy="24"
              rx="11"
              ry="8"
              fill="white"
              opacity="0.85"
            />
            <ellipse
              cx="32"
              cy="19"
              rx="15"
              ry="10"
              fill="white"
              opacity="0.85"
            />
            <ellipse
              cx="47"
              cy="22"
              rx="13"
              ry="9"
              fill="white"
              opacity="0.85"
            />
            <ellipse
              cx="60"
              cy="26"
              rx="10"
              ry="7"
              fill="white"
              opacity="0.85"
            />
          </svg>

          <svg
            className="floating-cloud cloud-4"
            width="65"
            height="32"
            viewBox="0 0 65 32"
          >
            <ellipse cx="14" cy="20" rx="9" ry="6" fill="white" opacity="0.8" />
            <ellipse
              cx="26"
              cy="16"
              rx="12"
              ry="8"
              fill="white"
              opacity="0.8"
            />
            <ellipse
              cx="38"
              cy="19"
              rx="11"
              ry="7"
              fill="white"
              opacity="0.8"
            />
            <ellipse cx="50" cy="22" rx="8" ry="6" fill="white" opacity="0.8" />
          </svg>

          <svg
            className="floating-cloud cloud-5"
            width="60"
            height="30"
            viewBox="0 0 60 30"
          >
            <ellipse cx="12" cy="18" rx="8" ry="6" fill="white" opacity="0.9" />
            <ellipse
              cx="23"
              cy="15"
              rx="11"
              ry="7"
              fill="white"
              opacity="0.9"
            />
            <ellipse
              cx="34"
              cy="17"
              rx="10"
              ry="6"
              fill="white"
              opacity="0.9"
            />
            <ellipse cx="45" cy="20" rx="7" ry="5" fill="white" opacity="0.9" />
          </svg>

          {/* Musical Notes */}
          <div className="music-note note-1">♪</div>
          <div className="music-note note-2">♫</div>
          <div className="music-note note-3">♪</div>
          <div className="music-note note-4">♬</div>
          <div className="music-note note-5">♫</div>

          {/* Stars */}
          <div className="star-decoration star-1">★</div>
          <div className="star-decoration star-2">✦</div>
          <div className="star-decoration star-3">★</div>
          <div className="star-decoration star-4">✧</div>
          {/* Background Images */}
          <img
            className="bg-image baum-image"
            src="/images/baum.png"
            alt="Baum"
          />
          <img
            className="bg-image berg-image"
            src="/images/berg.png"
            alt="Berg"
          />
          <img
            className="bg-image fuchs-image"
            src="/images/fuchs.png"
            alt="Fuchs"
          />
        </div>

        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <div className="container">
          <div className="header">
            <h1 className="title">YODELSTAR</h1>
          </div>
          <main>
            <p>Error: {error || "No analysis data available"}</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="App app">
      <div className="page-decorations">
        {/* Floating Trees */}
        <svg
          className="floating-tree tree-1"
          width="100"
          height="120"
          viewBox="0 0 100 120"
        >
          <rect
            x="45"
            y="85"
            width="10"
            height="30"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          <ellipse
            cx="50"
            cy="80"
            rx="30"
            ry="25"
            fill="#228B22"
            stroke="#006400"
            strokeWidth="2"
          />
          <ellipse
            cx="50"
            cy="60"
            rx="25"
            ry="22"
            fill="#32CD32"
            stroke="#228B22"
            strokeWidth="2"
          />
          <ellipse
            cx="50"
            cy="40"
            rx="18"
            ry="18"
            fill="#7CFC00"
            stroke="#32CD32"
            strokeWidth="2"
          />
          <circle cx="42" cy="55" r="4" fill="#ADFF2F" opacity="0.8" />
          <circle cx="60" cy="70" r="3" fill="#ADFF2F" opacity="0.8" />
        </svg>

        <svg
          className="floating-tree tree-2"
          width="90"
          height="110"
          viewBox="0 0 90 110"
        >
          <rect
            x="40"
            y="80"
            width="10"
            height="25"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          <ellipse
            cx="45"
            cy="75"
            rx="28"
            ry="23"
            fill="#FF69B4"
            stroke="#FF1493"
            strokeWidth="2"
          />
          <ellipse
            cx="45"
            cy="55"
            rx="22"
            ry="20"
            fill="#FFB6C1"
            stroke="#FF69B4"
            strokeWidth="2"
          />
          <ellipse
            cx="45"
            cy="38"
            rx="16"
            ry="16"
            fill="#FFC0CB"
            stroke="#FFB6C1"
            strokeWidth="2"
          />
          <circle cx="38" cy="50" r="3" fill="#FFCCCB" opacity="0.8" />
          <circle cx="55" cy="65" r="4" fill="#FFCCCB" opacity="0.8" />
        </svg>

        <svg
          className="floating-tree tree-3"
          width="85"
          height="105"
          viewBox="0 0 85 105"
        >
          <rect
            x="37"
            y="75"
            width="10"
            height="25"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          <ellipse
            cx="42"
            cy="70"
            rx="26"
            ry="22"
            fill="#9370DB"
            stroke="#6A0DAD"
            strokeWidth="2"
          />
          <ellipse
            cx="42"
            cy="52"
            rx="20"
            ry="18"
            fill="#BA55D3"
            stroke="#9370DB"
            strokeWidth="2"
          />
          <ellipse
            cx="42"
            cy="36"
            rx="15"
            ry="15"
            fill="#DDA0DD"
            stroke="#BA55D3"
            strokeWidth="2"
          />
          <circle cx="35" cy="48" r="3" fill="#E6E6FA" opacity="0.8" />
          <circle cx="50" cy="60" r="4" fill="#E6E6FA" opacity="0.8" />
        </svg>

        <svg
          className="floating-tree tree-4"
          width="95"
          height="115"
          viewBox="0 0 95 115"
        >
          <rect
            x="42"
            y="85"
            width="10"
            height="28"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          <ellipse
            cx="47"
            cy="80"
            rx="29"
            ry="24"
            fill="#FF8C00"
            stroke="#FF4500"
            strokeWidth="2"
          />
          <ellipse
            cx="47"
            cy="58"
            rx="23"
            ry="21"
            fill="#FFA500"
            stroke="#FF8C00"
            strokeWidth="2"
          />
          <ellipse
            cx="47"
            cy="39"
            rx="17"
            ry="17"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <circle cx="40" cy="53" r="4" fill="#FFFFE0" opacity="0.8" />
          <circle cx="56" cy="68" r="3" fill="#FFFFE0" opacity="0.8" />
        </svg>

        {/* Floating Clouds */}
        <svg
          className="floating-cloud cloud-1"
          width="80"
          height="40"
          viewBox="0 0 80 40"
        >
          <ellipse cx="20" cy="25" rx="12" ry="8" fill="white" opacity="0.9" />
          <ellipse cx="35" cy="20" rx="16" ry="10" fill="white" opacity="0.9" />
          <ellipse cx="50" cy="23" rx="14" ry="9" fill="white" opacity="0.9" />
          <ellipse cx="65" cy="27" rx="10" ry="7" fill="white" opacity="0.9" />
        </svg>

        <svg
          className="floating-cloud cloud-2"
          width="70"
          height="35"
          viewBox="0 0 70 35"
        >
          <ellipse cx="15" cy="22" rx="10" ry="7" fill="white" opacity="0.8" />
          <ellipse cx="28" cy="18" rx="14" ry="9" fill="white" opacity="0.8" />
          <ellipse cx="42" cy="21" rx="12" ry="8" fill="white" opacity="0.8" />
          <ellipse cx="55" cy="24" rx="9" ry="6" fill="white" opacity="0.8" />
        </svg>

        <svg
          className="floating-cloud cloud-3"
          width="75"
          height="38"
          viewBox="0 0 75 38"
        >
          <ellipse cx="18" cy="24" rx="11" ry="8" fill="white" opacity="0.85" />
          <ellipse
            cx="32"
            cy="19"
            rx="15"
            ry="10"
            fill="white"
            opacity="0.85"
          />
          <ellipse cx="47" cy="22" rx="13" ry="9" fill="white" opacity="0.85" />
          <ellipse cx="60" cy="26" rx="10" ry="7" fill="white" opacity="0.85" />
        </svg>

        <svg
          className="floating-cloud cloud-4"
          width="65"
          height="32"
          viewBox="0 0 65 32"
        >
          <ellipse cx="14" cy="20" rx="9" ry="6" fill="white" opacity="0.8" />
          <ellipse cx="26" cy="16" rx="12" ry="8" fill="white" opacity="0.8" />
          <ellipse cx="38" cy="19" rx="11" ry="7" fill="white" opacity="0.8" />
          <ellipse cx="50" cy="22" rx="8" ry="6" fill="white" opacity="0.8" />
        </svg>

        <svg
          className="floating-cloud cloud-5"
          width="60"
          height="30"
          viewBox="0 0 60 30"
        >
          <ellipse cx="12" cy="18" rx="8" ry="6" fill="white" opacity="0.9" />
          <ellipse cx="23" cy="15" rx="11" ry="7" fill="white" opacity="0.9" />
          <ellipse cx="34" cy="17" rx="10" ry="6" fill="white" opacity="0.9" />
          <ellipse cx="45" cy="20" rx="7" ry="5" fill="white" opacity="0.9" />
        </svg>

        {/* Musical Notes */}
        <div className="music-note note-1">♪</div>
        <div className="music-note note-2">♫</div>
        <div className="music-note note-3">♪</div>
        <div className="music-note note-4">♬</div>
        <div className="music-note note-5">♫</div>

        {/* Stars */}
        <div className="star-decoration star-1">★</div>
        <div className="star-decoration star-2">✦</div>
        <div className="star-decoration star-3">★</div>
        <div className="star-decoration star-4">✧</div>
        {/* Background Images */}
        <img
          className="bg-image baum-image"
          src="/images/baum.png"
          alt="Baum"
        />
        <img
          className="bg-image berg-image"
          src="/images/berg.png"
          alt="Berg"
        />
        <img
          className="bg-image fuchs-image"
          src="/images/fuchs.png"
          alt="Fuchs"
        />
      </div>

      <div className="bg-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      <div className="container">
        <div className="header">
          <h1 className="title">YODELSTAR</h1>
        </div>
        <div className="play-area">
          <div className="character-section glow">
            <img
              src="/images/takeo_ischi.png"
              alt="Anime Character"
              className="character-image"
            />

            <div className="level-indicator">LEVEL {selectedStep}</div>
          </div>

          <div className="lyrics-section glow">
            {!isComparing && !showResults && (
              <KaraokeVisualizer
                analysisData={analysisData.yodelAnalysis}
                audioUrl={audioUrl}
                onRecordingComplete={compareYodelPerformance}
              />
            )}

            {/* Comparison Results Section */}
            {isComparing && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <img
                  src="/images/Salamandar-Video-Lederhosen-Cl-unscreen.gif"
                  alt="Analyzing performance..."
                  style={{
                    width: "440px",
                    height: "auto",
                    borderRadius: "8px",
                  }}
                />
                <h3 style={{ margin: 0 }}>Analyzing Your Performance...</h3>
              </div>
            )}

            {comparisonError && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  border: "1px solid #ff0000",
                  borderRadius: "8px",
                  backgroundColor: "#ffe6e6",
                }}
              >
                <h3>Comparison Error</h3>
                <p>{comparisonError}</p>
              </div>
            )}

            {/* New Performance Results Component */}
            <PerformanceResults data={currentResult} isVisible={showResults} />

            {/* Navigation buttons */}
            <div
              style={{
                position: "relative",
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => {
                  const prevStep = Math.max(1, selectedStep - 1);
                  if (prevStep !== selectedStep) {
                    hideResults();
                    setSelectedStep(prevStep);
                  }
                }}
                disabled={selectedStep <= 1}
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    selectedStep <= 1
                      ? "rgba(204, 204, 204, 0.3)"
                      : "rgba(76, 175, 80, 0.3)",
                  color:
                    selectedStep <= 1
                      ? "rgba(102, 102, 102, 0.6)"
                      : "rgba(255, 255, 255, 0.8)",
                  border:
                    selectedStep <= 1
                      ? "1px solid rgba(204, 204, 204, 0.4)"
                      : "1px solid rgba(76, 175, 80, 0.4)",
                  borderRadius: "4px",
                  cursor: selectedStep <= 1 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "normal",
                  backdropFilter: "blur(4px)",
                }}
              >
                Previous
              </button>

              {/* Retry button - only show when results are visible */}
              {showResults && (
                <button
                  onClick={() => {
                    hideResults();
                  }}
                  style={{
                    backgroundColor: "#61dafb",
                    color: "#282c34",
                    border: "none",
                    padding: "12px 24px",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginTop: "0px",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#21a1f1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#61dafb";
                  }}
                >
                  🔄 Retry
                </button>
              )}

              <button
                onClick={() => {
                  const nextStep = Math.min(
                    availableSteps.length,
                    selectedStep + 1
                  );
                  if (nextStep !== selectedStep) {
                    hideResults();
                    setSelectedStep(nextStep);
                  }
                }}
                disabled={selectedStep >= availableSteps.length}
                style={{
                  padding: "6px 12px",
                 backgroundColor:'green',
                  color:'white',
                 
                  borderRadius: "4px",
                  cursor:
                    selectedStep >= availableSteps.length
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "14px",
                  fontWeight: "normal",
                  backdropFilter: "blur(4px)",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
