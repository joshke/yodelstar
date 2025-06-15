# 🧠✨ Yodelstar API Backend ✨🧠
### *The Brain Behind the Yodeling Magic!* 🎤

```
     ╔══════════════════════════════════════╗
     ║    🤖 POWERED BY GEMINI AI 🤖        ║
     ║   Advanced Yodel Analysis Engine     ║
     ╚══════════════════════════════════════╝
```

[![Flask](https://img.shields.io/badge/Flask-2.3.2-000000?style=flat&logo=flask)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python)](https://python.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Powered-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Gunicorn](https://img.shields.io/badge/Gunicorn-WSGI-499848?style=flat)](https://gunicorn.org/)

> 🧠 *"The smartest yodel analysis brain in the universe!"* 🧠

Welcome to the **Yodelstar API Backend** - a powerful Flask application that combines Google Gemini AI with advanced audio processing to deliver the most sophisticated yodeling analysis experience ever created! 🌟

## 🎯 WHAT DOES THE API DO? 🎯

### 🎤 **Core Capabilities**
- 🧠 **AI-Powered Analysis** - Uses Google Gemini to understand yodeling patterns
- 🎵 **Audio Processing** - Handles WAV file encoding, decoding, and analysis
- 🆚 **Performance Comparison** - Compares user performances against reference tracks
- ⏱️ **Precise Timing** - Millisecond-accurate event detection
- 🎼 **Musical Intelligence** - Identifies pitches, notes, and yodel breaks
- 📊 **Detailed Metrics** - Comprehensive performance scoring and feedback

### 🏗️ **Architecture Overview**
```
🧠 Yodelstar API Architecture 🧠
├── 🌶️ Flask Web Server
│   ├── CORS-enabled endpoints
│   ├── JSON request/response handling
│   └── Error handling & validation
├── 🤖 Gemini AI Integration
│   ├── Audio analysis prompts
│   ├── Structured response parsing
│   └── Performance comparison logic
├── 🎵 Audio Processing Pipeline
│   ├── Base64 encoding/decoding
│   ├── WAV file validation
│   └── Audio format conversion
└── 📁 File Management System
    ├── WAV file storage
    ├── Analysis JSON generation
    └── Frontend asset preparation
```

## 🚀 QUICK SETUP GUIDE 🚀

### 🎯 **Prerequisites**
- **Python 3.8+** installed
- **pip** package manager
- **Google Gemini API key** ([Get one here](https://makersuite.google.com/app/apikey))

### 🔧 **Installation Steps**

1. **📁 Navigate to API Directory:**
   ```bash
   cd api
   ```

2. **🐍 Install Dependencies:**
   ```bash
   pip install -r ../requirements.txt
   ```
   
   **Dependencies installed:**
   - `Flask==2.3.2` - Web framework
   - `google-generativeai==0.4.0` - Gemini AI integration
   - `flask-cors==4.0.0` - Cross-origin resource sharing
   - `gunicorn==21.2.0` - Production WSGI server
   - `python-dotenv==1.0.0` - Environment variable management

3. **🔑 Set Up Environment Variables:**
   ```bash
   # Create .env file in the api directory
   echo "GEMINI_API_KEY=your_super_secret_api_key_here" > .env
   ```
   
   **🌟 Pro Tip:** Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. **🎵 Prepare Audio Files:**
   Follow the [WAV Files Setup](#-wav-files-setup-) section below!

5. **🚀 Launch the Server:**
   ```bash
   # Development server with auto-reload
   python -m gunicorn api:app --bind 0.0.0.0:8000 --reload
   
   # Or simple Flask development server
   python api.py
   ```

**🎉 Your API will be live at `http://localhost:8000`!**

## 🎵 WAV FILES SETUP 🎵

### 🚨 **Why No WAV Files in Git?**
Due to copyright restrictions, we can't include yodel WAV files in the repository. But setting them up is super easy! 💪

### 📁 **Step-by-Step Setup:**

1. **🎤 Obtain Yodel WAV Files:**
   - Find royalty-free yodel performances or record your own
   - Name them sequentially: `1.wav`, `2.wav`, `3.wav`, etc.
   - **Recommended specs:** 44.1kHz sample rate, 16-bit depth
   - **Length:** 2-6 seconds work best for analysis

2. **📂 Place Files in Steps Directory:**
   ```bash
   # Copy your WAV files to the steps directory
   cp your_yodel_files/*.wav steps/
   ```

3. **🧠 Generate Analysis Files:**
   ```bash
   # Run the analysis script to create JSON files
   python analyze_steps.py
   ```
   
   This creates `1_analysis.json`, `2_analysis.json`, etc. with AI-generated analysis data!

4. **💅 Copy to Frontend (if using frontend):**
   ```bash
   # Copy both WAV and JSON files to frontend
   cp steps/*.wav ../yodelstar-app/public/steps/
   cp steps/*_analysis.json ../yodelstar-app/public/steps/
   ```

### 📁 **Expected Directory Structure:**
```
api/steps/
├── 1.wav                    # Your first yodel file
├── 1_analysis.json         # AI-generated analysis
├── 2.wav                    # Second yodel file
├── 2_analysis.json         # Its analysis
├── 3.wav                    # Third yodel file
└── 3_analysis.json         # Its analysis
```

### 🎪 **Pro Tips for WAV Files:**
- 🎵 **Quality Matters:** Use clear, high-quality recordings
- 🎤 **Pure Yodeling:** Works better than mixed vocals or music
- ⏱️ **Sweet Spot Length:** 2-6 seconds optimal for detailed analysis
- 📊 **Consistent Format:** Stick to WAV format for best results

## 🎤 API ENDPOINTS REFERENCE 🎤

### 🎵 **POST /analyze-yodel**
**Transform your yodel into detailed analysis data!**

#### Request Format:
```http
POST /analyze-yodel
Content-Type: application/json

{
  "wav_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA..."
}
```

#### Parameters:
- **`wav_base64`** (string, required): Base64-encoded WAV file data

#### Response Format:
```json
{
  "yodelAnalysis": {
    "totalYodelSyllables": 42,
    "phrases": [
      {
        "phraseNumber": 1,
        "startTime": "00:01.200",
        "endTime": "00:03.800",
        "events": [
          {
            "timestamp": "00:01.500",
            "type": "yodelBreak",
            "syllable": "yo",
            "pitch": {
              "note": "C",
              "octave": 4,
              "frequency": 261.63
            },
            "description": "Strong yodel break with clear pitch transition"
          }
        ]
      }
    ],
    "overallAssessment": "Excellent yodeling technique with clear pitch transitions",
    "technicalNotes": "Strong breath control and precise pitch accuracy"
  }
}
```

#### Error Responses:
```json
// Missing WAV data
{"error": "No base64 encoded wav file part"}

// Invalid base64 encoding
{"error": "Invalid base64 encoding"}

// Gemini API error
{"error": "Analysis failed: [specific error message]"}
```

### 🆚 **POST /compare-yodel**
**Compare your performance against reference tracks!**

#### Request Format:
```http
POST /compare-yodel
Content-Type: application/json

{
  "original_wav_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
  "user_wav_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA..."
}
```

#### Parameters:
- **`original_wav_base64`** (string, required): Reference performance (base64)
- **`user_wav_base64`** (string, required): User's performance (base64)

#### Response Format:
```json
{
  "comparison": {
    "overallScore": 85,
    "breakdown": {
      "pitchAccuracy": 90,
      "timing": 80,
      "yodelTechnique": 85,
      "breathControl": 88
    },
    "feedback": "Excellent pitch accuracy! Work on timing consistency.",
    "improvements": [
      "Focus on maintaining steady rhythm",
      "Practice breath control between phrases"
    ],
    "strengths": [
      "Clear pitch transitions",
      "Strong yodel breaks"
    ]
  }
}
```

## 🔧 TECHNICAL DETAILS 🔧

### 🤖 **Gemini AI Integration**

The API uses Google's Gemini AI model for sophisticated audio analysis:

```python
# Example of how we prompt Gemini for analysis
prompt = f"""
Analyze this yodeling performance and provide detailed feedback.
Focus on:
- Yodel breaks and pitch transitions
- Timing and rhythm accuracy
- Technical execution
- Overall performance quality

Audio data: [base64 encoded WAV]

Respond in structured JSON format with detailed analysis.
"""
```

### 🎵 **Audio Processing Pipeline**

1. **Input Validation:** Verify base64 encoding and WAV format
2. **Decoding:** Convert base64 to binary WAV data
3. **AI Analysis:** Send to Gemini for intelligent processing
4. **Response Parsing:** Structure AI response into JSON format
5. **Error Handling:** Graceful failure with informative messages

### 🌐 **CORS Configuration**

The API is configured to accept requests from frontend applications:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enables cross-origin requests
```

### 🔒 **Security Considerations**

- **API Key Protection:** Gemini API key stored in environment variables
- **Input Validation:** All inputs validated before processing
- **Error Sanitization:** Error messages don't expose internal details
- **Rate Limiting:** Consider implementing for production use

## 🧪 TESTING THE API 🧪

### 🍎 **macOS/Linux Testing:**
```bash
# Test with a sample WAV file
base64 -i sample_yodel.wav > encoded.txt

# Send to analyze endpoint
curl -X POST http://localhost:8000/analyze-yodel \
  -H "Content-Type: application/json" \
  -d '{"wav_base64": "'$(cat encoded.txt)'"}'
```

### 🪟 **Windows Testing:**
```powershell
# Encode WAV file
[Convert]::ToBase64String([IO.File]::ReadAllBytes("sample_yodel.wav")) > encoded.txt

# Send to API (using curl or Invoke-RestMethod)
curl -X POST http://localhost:8000/analyze-yodel -H "Content-Type: application/json" -d '{\"wav_base64\": \"'$(Get-Content encoded.txt)'\"}'
```

### 🎯 **Quick Health Check:**
```bash
# Test if server is running
curl http://localhost:8000/analyze-yodel -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'

# Expected: {"error":"No base64 encoded wav file part"}
```

## 🐛 TROUBLESHOOTING 🐛

### Common Issues:

#### 🔑 **"API key not found" Error:**
- Ensure `.env` file exists in the `api/` directory
- Verify `GEMINI_API_KEY` is set correctly
- Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

#### 🎵 **"Invalid base64 encoding" Error:**
- Verify WAV file is properly encoded
- Check for newlines or extra characters in base64 string
- Ensure WAV file is valid format

#### 🌐 **CORS Issues:**
- Verify `flask-cors` is installed
- Check frontend is making requests to correct port (8000)
- Ensure `CORS(app)` is called in `api.py`

#### 🤖 **Gemini API Errors:**
- Check internet connection
- Verify API key has proper permissions
- Monitor API usage quotas

### 📊 **Performance Optimization:**

- **File Size:** Keep WAV files under 10MB for faster processing
- **Concurrent Requests:** Consider implementing request queuing for high load
- **Caching:** Cache analysis results for identical audio files
- **Monitoring:** Log response times and error rates

## 🔄 DEVELOPMENT WORKFLOW 🔄

### 🧪 **Local Development:**
```bash
# Start with auto-reload for development
python -m gunicorn api:app --bind 0.0.0.0:8000 --reload

# Or use Flask development server
export FLASK_ENV=development
python api.py
```

### 🚀 **Production Deployment:**
```bash
# Production server with multiple workers
gunicorn api:app --bind 0.0.0.0:8000 --workers 4

# With logging
gunicorn api:app --bind 0.0.0.0:8000 --workers 4 --access-logfile access.log --error-logfile error.log
```

### 📝 **Adding New Endpoints:**

1. Define route in `api.py`
2. Add input validation
3. Implement core logic
4. Add error handling
5. Update this documentation
6. Test thoroughly

## 🎊 CONTRIBUTING TO THE API 🎊

### 🎯 **Areas for Improvement:**
- 🎵 **Audio Format Support:** Add MP3, FLAC support
- 🧠 **Analysis Features:** More detailed pitch analysis
- 🔒 **Security:** Rate limiting, authentication
- 📊 **Monitoring:** Health checks, metrics
- 🧪 **Testing:** Unit tests, integration tests

### 🔧 **Development Setup:**
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
python -m pytest tests/

# Code formatting
black api.py analyze_steps.py

# Linting
flake8 api.py analyze_steps.py
```

## 📞 API SUPPORT 📞

- 🐛 **Bug Reports:** Include request/response examples
- 💡 **Feature Requests:** Describe use case and expected behavior
- 🤝 **Integration Help:** We love helping developers integrate!
- 📖 **Documentation:** Help us improve these docs

## 🎉 READY TO ANALYZE YODELS! 🎉

```
    🧠 Your Yodelstar API is ready to rock! 🧠
         Powered by Gemini AI magic!
              ♪♫♪ Let's analyze some yodels! ♪♫♪
```

**The brain of Yodelstar is now fully operational and ready to turn yodels into pure data magic!** 🎤✨🌟

---
*Made with 💖, 🧠, and lots of AI magic by the Yodelstar API team!* 