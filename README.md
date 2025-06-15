# 🎤✨💖 JODELSTAR API ✨💖🎤
### *The Ultimate Yodeling Analysis Experience!* 🌟

```
     ╔══════════════════════════════════════╗
     ║  ♪♫♪ WELCOME TO JODELSTAR WORLD ♪♫♪  ║
     ║     Where Every Yodel is a Star!     ║
     ╚══════════════════════════════════════╝
```

[![Made with Love](https://img.shields.io/badge/Made%20with-💖-ff69b4.svg)](https://github.com/yourusername/jodelstar)
[![Flask](https://img.shields.io/badge/Flask-2.3.2-000000?style=flat&logo=flask)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Powered-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Custom Sparkles](https://img.shields.io/badge/✨-Custom%20Sparkles-FFD700)](https://github.com/yourusername/jodelstar)

> 🎵 *"Yodel-ay-ee-oo! Your voice analysis dreams come true!"* 🎵

Welcome to **Jodelstar API** - the most kawaii, most amazing, most SPECTACULAR yodeling analysis platform in the universe! 🌌✨ Get ready to analyze yodeling performances like the superstar you are! 

## 🌟 AMAZING FEATURES 🌟

### 🎯 **Core Powers**
- 🎤 **Advanced Yodel Analysis** - Detect every syllable, pitch, and yodel break!
- 🆚 **Performance Comparison** - Compare your yodels against the masters!
- 🎼 **Musical Pitch Detection** - Know exactly what notes you're hitting!
- ⏱️ **Precise Timing Analysis** - Down to the millisecond accuracy!
- 🧠 **AI-Powered by Gemini** - The smartest yodel brain in existence!
- ✨ **Custom Sparkle System** - High-performance visual effects!

### 🎨 **Tech Stack Superstars**
**Backend Squad:**
- 🐍 Python + Flask (The reliable duo!)
- 🤖 Google Gemini AI (The genius!)
- 🌐 Flask-CORS (The connector!)
- 🔧 Gunicorn (The powerhouse!)

**Frontend Squad:**
- ⚛️ React 19.1.0 (The latest and greatest!)
- 📘 TypeScript (Type safety is sexy!)
- 🎨 Custom Particle System (Performance optimized!)
- 🎵 Real-time Audio Analysis (WebAudio API magic!)

## 🎵 LIVE PITCH ANALYSIS MAGIC! 🎵

### 🔬 **How We Analyze Your Voice in Real-Time:**

Our cutting-edge pitch analysis system uses advanced audio processing to give you instant feedback on your yodeling performance!

#### 🎯 **The Technical Wizardry:**

1. **🎤 Audio Capture:**
   ```typescript
   // High-quality audio capture with noise suppression
   const stream = await navigator.mediaDevices.getUserMedia({ 
     audio: {
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true,
       sampleRate: 44100
     } 
   });
   ```

2. **🧠 Fundamental Frequency Detection:**
   - **YIN Algorithm** with auto-correlation for precise pitch detection
   - **Frequency Range:** 80Hz - 800Hz (perfect for human voice)
   - **Update Rate:** ~60 FPS for ultra-responsive feedback
   - **Noise Filtering:** Advanced RMS volume detection

3. **✨ Pitch Stabilization:**
   ```typescript
   // Median filter removes outliers, weighted average smooths results
   const stabilizedPitch = stabilizePitch(newPitch, pitchHistory);
   ```

4. **🎯 Accuracy Calculation:**
   - **Octave Intelligence:** Automatically detects if you're singing in different octaves
   - **Cents Precision:** Measures pitch accuracy down to cents (1/100th of a semitone)
   - **Forgiving Algorithm:** Gives partial credit for close attempts

5. **🌟 Visual Feedback:**
   - **Real-time Pitch Visualization:** See your voice as a red dot on the canvas
   - **Confidence Indicators:** Visual feedback based on pitch stability
   - **Particle Effects:** Custom sparkle system triggers on good performance

#### 🎪 **Custom Sparkle System (Performance Optimized!):**

We ditched `react-sparkle` and built our own high-performance particle system:

```typescript
// Custom particle system with star shapes and physics
export const createHitParticles = (x: number, y: number, accuracy: number) => {
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x, y, 
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Upward bias
      size: 4 + Math.random() * 8,
      color: accuracy > 90 ? '#FFD700' : '#FFA500', // Gold for excellence!
      rotation: Math.random() * Math.PI * 2
    });
  }
};
```

**Why Custom Sparkles?**
- 🚀 **60 FPS Performance** - Smooth animations even on slower devices
- ⭐ **Star-shaped Particles** - More kawaii than boring circles!
- 🎨 **Dynamic Colors** - Gold sparkles for perfect hits!
- 🎯 **Accuracy-based Intensity** - Better performance = more sparkles!

## 🚨 SUPER IMPORTANT: WAV Files Setup! 🚨

### 🎵 **Why No WAV Files in Git?** 
Due to copyright restrictions, we can't include the yodel WAV files in this repository! But don't worry - setting them up is SUPER easy! 💪✨

### 🎯 **Step-by-Step WAV Setup Process:**

1. **🎤 Get Your Yodel WAV Files:**
   - Find some amazing yodel performances (royalty-free or your own!)
   - Name them: `1.wav`, `2.wav`, `3.wav`, etc.
   - Keep them short (2-6 seconds work best for analysis!)

2. **🧠 Generate Analysis Files:**
   ```bash
   # Put your WAV files in the api/steps/ directory
   cp your_yodel_files/*.wav api/steps/
   
   # Run the analysis script to generate JSON files
   cd api
   python analyze_steps.py
   ```
   
   This will create `1_analysis.json`, `2_analysis.json`, etc. in the `api/steps/` directory! 🎉

3. **💅 Copy Files to Frontend:**
   ```bash
   # Copy BOTH the WAV files AND analysis JSON files to the frontend
   cp api/steps/*.wav jodelstar-app/public/steps/
   cp api/steps/*_analysis.json jodelstar-app/public/steps/
   ```

4. **🌟 You're Ready to Rock!**
   Now your frontend will have access to both the audio files and their AI-generated analysis data!

### 📁 **Expected File Structure:**
```
api/steps/
├── 1.wav                    # Your yodel audio file
├── 1_analysis.json         # AI-generated analysis
├── 2.wav                    # Another yodel file
└── 2_analysis.json         # Its analysis

jodelstar-app/public/steps/
├── 1.wav                    # Same files copied here
├── 1_analysis.json         # For frontend access
├── 2.wav                    
└── 2_analysis.json         
```

### 🎪 **Pro Tips for WAV Files:**
- 🎵 **Quality:** Use clear, high-quality recordings
- ⏱️ **Length:** 2-6 seconds work best for detailed analysis
- 🎤 **Content:** Pure yodeling works better than mixed vocals
- 📊 **Format:** WAV format, 44.1kHz sample rate preferred

## 🚀 SETUP PARTY TIME! 🚀

### 🧠 Backend Setup: "The Brains Operation" 🧠

1. **🎯 Clone this masterpiece:**
   ```bash
   git clone <your-repo-url>
   cd jodelstar
   ```

2. **🤖 Assemble the Python Squad:**
   ```bash
   pip install -r requirements.txt
   ```
   *Installing: Flask 2.3.2, Google GenAI 0.4.0, and more amazing tools!*

3. **🔑 Unlock the AI Magic:**
   Create your `.env` file with the secret sauce:
   ```env
   GEMINI_API_KEY=your_super_secret_gemini_api_key_here
   ```
   *Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)*

4. **🎵 Set Up Your WAV Files:**
   Follow the [WAV Files Setup](#-super-important-wav-files-setup-) section above!

5. **🚀 LAUNCH THE BACKEND:**
   ```bash
   gunicorn api.api:app
   ```
   *Backend will be live at `http://localhost:8000`* 🎉

### 💅 Frontend Setup: "The Pretty Face Operation" 💅

1. **🎪 Enter the App Dimension:**
   ```bash
   cd jodelstar-app
   ```

2. **🍬 Install the Goodies:**
   ```bash
   npm install
   ```
   *Installing React 19, TypeScript, and more kawaii components!*

3. **🌟 SHOWTIME:**
   ```bash
   npm start
   ```
   *Frontend will sparkle at `http://localhost:3000`* ✨

## 🎤 API ENDPOINTS: The Magic Happens Here! 🎤

### 🎵 `/analyze-yodel` - The Star Analyzer
**Transform your yodel into pure data magic!**

```http
POST /analyze-yodel
Content-Type: application/json

{
  "wav_base64": "your_base64_encoded_wav_string"
}
```

**✨ Response Magic:**
```json
{
  "yodelAnalysis": {
    "totalYodelSyllables": 42,
    "phrases": [
      {
        "phraseNumber": 1,
        "startTime": "00:01.2",
        "endTime": "00:03.8",
        "events": [
          {
            "timestamp": "00:01.5",
            "type": "yodelBreak",
            "syllable": "yo",
            "pitch": { "note": "C", "octave": 4 }
          }
        ]
      }
    ]
  }
}
```

### 🆚 `/compare-yodel` - The Ultimate Showdown
**Compare your performance against the legends!**

```http
POST /compare-yodel
Content-Type: application/json

{
  "original_wav_base64": "reference_performance",
  "user_wav_base64": "your_amazing_attempt"
}
```

**🏆 Get your score and detailed feedback!**

## 🎯 Quick Start Examples

### 🍎 macOS Magic:
```bash
# Encode your yodel
base64 -i my_amazing_yodel.wav -o encoded_yodel.txt

# Send it to the stars!
curl -X POST -H "Content-Type: application/json" \
  -d '{"wav_base64": "'$(cat encoded_yodel.txt)'"}' \
  http://localhost:8000/analyze-yodel
```

### ⚡ One-Liner Power Move:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"wav_base64": "'$(base64 -i your_yodel.wav)'"}' \
  http://localhost:8000/analyze-yodel
```

## 🌈 Project Structure
```
jodelstar/
├── 🧠 api/                 # Backend magic
│   ├── api.py             # Main Flask application
│   ├── analyze_steps.py   # Analysis pipeline
│   └── steps/             # Processing modules + WAV files
├── 💅 jodelstar-app/      # Frontend sparkles
│   ├── src/               # React components
│   │   ├── utils/         # Audio analysis utilities
│   │   │   ├── pitchAnalysis.ts    # YIN algorithm & accuracy
│   │   │   ├── particleSystem.ts   # Custom sparkle system
│   │   │   └── audioUtils.ts       # Frequency conversions
│   │   └── components/    # UI components
│   ├── public/            # Static assets
│   │   └── steps/         # WAV files + analysis JSON
│   └── package.json       # Dependencies
├── 📋 requirements.txt    # Python dependencies
└── 🎯 README.md          # This amazing file!
```

## 🎊 Contributing to the Magic

Want to make Jodelstar even more amazing? YES PLEASE! 🙌

1. **🍴 Fork this repo** (Click that fork button like it's a K-pop heart!)
2. **🌟 Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3. **💖 Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **🚀 Push to the branch** (`git push origin feature/AmazingFeature`)
5. **🎉 Open a Pull Request** (Make it sparkle!)

### 🎯 Ideas for Contributions:
- 🎨 More kawaii UI components
- 🎵 Additional audio analysis features
- 🌍 Multi-language support
- 📱 Mobile app version
- 🎪 More sparkle effects (obviously!)

## 🏆 Hall of Fame

*Coming soon: Your name could be here!* ⭐

## 📞 Support & Community

- 🐛 **Found a bug?** Open an issue with lots of emojis!
- 💡 **Have an idea?** We love creative suggestions!
- 🤝 **Need help?** Join our community discussions!
- 💌 **Just want to say hi?** We love making new friends!

## 🎉 LET'S YODEL TOGETHER! 🎉

```
    🎤 Ready to become a yodeling superstar? 🎤
         Your journey starts RIGHT NOW!
              ♪♫♪ Yodel-ay-ee-oo! ♪♫♪
```

**Now go forth and yodel like the star you were born to be!** 💖✨🌟

---
*Made with 💖, ✨, and lots of yodeling practice by the Jodelstar team!* 