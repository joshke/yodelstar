import os
import json
import base64
import logging
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app with static folder for React build
app = Flask(__name__, static_folder='../static', static_url_path='')
CORS(app)  # Enable CORS for all routes

logger.info("Flask app initialized with CORS enabled")

# Get the Gemini API key from environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Define the yodel analysis schema
yodel_analysis_schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Yodel Analysis",
    "description": "A schema for analyzing yodeling performances from a video / audio source.",
    "type": "object",
    "properties": {
        "yodelAnalysis": {
            "type": "object",
            "description": "The root object containing the yodel analysis.",
            "properties": {
                "video / audioSource": {
                    "type": "string",
                    "description": "The time range in the video / audio source that was analyzed.",
                    "pattern": "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$",
                },
                "totalYodelSyllables": {
                    "type": "integer",
                    "description": "The total count of yodel syllables in the analyzed segment.",
                    "minimum": 0,
                },
                "phrases": {
                    "type": "array",
                    "description": "A list of distinct yodeling phrases identified in the segment.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "phraseNumber": {
                                "type": "integer",
                                "description": "A sequential identifier for the phrase.",
                                "minimum": 1,
                            },
                            "startTime": {
                                "type": "string",
                                "description": "The start time of the phrase in MM:SS.s format.",
                                "pattern": "^\\d{2}:\\d{2}\\.\\d+$",
                            },
                            "endTime": {
                                "type": "string",
                                "description": "The end time of the phrase in MM:SS.s format.",
                                "pattern": "^\\d{2}:\\d{2}\\.\\d+$",
                            },
                            "yodelSyllablesInPhrase": {
                                "type": "integer",
                                "description": "The count of yodel syllables within this specific phrase.",
                                "minimum": 0,
                            },
                            "events": {
                                "type": "array",
                                "description": "A sequence of vocal events within the phrase.",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "timestamp": {
                                            "type": "string",
                                            "description": "The precise time of the event in MM:SS.s format.",
                                            "pattern": "^\\d{2}:\\d{2}\\.\\d+$",
                                        },
                                        "type": {
                                            "type": "string",
                                            "description": "The type of vocal event.",
                                            "enum": ["headVoice", "chestVoice", "yodelBreak"],
                                        },
                                        "description": {
                                            "type": "string",
                                            "description": "A textual description of the vocal event.",
                                        },
                                        "syllable": {
                                            "type": "string",
                                            "description": "The phonetic syllable associated with the event.",
                                        },
                                        "pitch": {
                                            "type": "object",
                                            "description": "The musical pitch of the event.",
                                            "properties": {
                                                "note": {
                                                    "type": "string",
                                                    "description": "The musical note (e.g., A, B, C#).",
                                                    "pattern": "^[A-G](?:#|b)?$",
                                                },
                                                "octave": {
                                                    "type": "integer",
                                                    "description": "The octave number for the note.",
                                                },
                                            },
                                            "required": ["note", "octave"],
                                        },
                                    },
                                    "required": [
                                        "timestamp",
                                        "type",
                                        "description",
                                        "syllable",
                                        "pitch",
                                    ],
                                },
                            },
                            "notes": {
                                "type": "string",
                                "description": "General notes or observations about the phrase.",
                            },
                        },
                        "required": [
                            "phraseNumber",
                            "startTime",
                            "endTime",
                            "yodelSyllablesInPhrase",
                            "events",
                            "notes",
                        ],
                    },
                },
            },
            "required": ["video / audioSource", "totalYodelSyllables", "phrases"],
        }
    },
    "required": ["yodelAnalysis"],
}

# Define the yodel comparison schema
yodel_comparison_schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Yodel Comparison",
    "description": "A schema for comparing two yodeling performances.",
    "type": "object",
    "properties": {
        "yodelComparison": {
            "type": "object",
            "description": "The root object containing the yodel comparison analysis.",
            "properties": {
                "overallScore": {
                    "type": "number",
                    "description": "Overall performance score from 0-100.",
                    "minimum": 0,
                    "maximum": 100
                },
                "metrics": {
                    "type": "object",
                    "description": "Detailed comparison metrics.",
                    "properties": {
                        "pitchAccuracy": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 0, "maximum": 100},
                                "averageDeviationCents": {"type": "number"},
                                "description": {"type": "string"}
                            },
                            "required": ["score", "averageDeviationCents", "description"]
                        },
                        "timingAccuracy": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 0, "maximum": 100},
                                "averageDeviationMs": {"type": "number"},
                                "description": {"type": "string"}
                            },
                            "required": ["score", "averageDeviationMs", "description"]
                        },
                        "yodelBreakQuality": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 0, "maximum": 100},
                                "smoothnessRating": {"type": "string", "enum": ["excellent", "good", "fair", "poor"]},
                                "description": {"type": "string"}
                            },
                            "required": ["score", "smoothnessRating", "description"]
                        },
                        "syllableAccuracy": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 0, "maximum": 100},
                                "matchedSyllables": {"type": "integer", "minimum": 0},
                                "totalSyllables": {"type": "integer", "minimum": 0},
                                "description": {"type": "string"}
                            },
                            "required": ["score", "matchedSyllables", "totalSyllables", "description"]
                        },
                        "rhythmConsistency": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number", "minimum": 0, "maximum": 100},
                                "tempoVariation": {"type": "number"},
                                "description": {"type": "string"}
                            },
                            "required": ["score", "tempoVariation", "description"]
                        }
                    },
                    "required": ["pitchAccuracy", "timingAccuracy", "yodelBreakQuality", "syllableAccuracy", "rhythmConsistency"]
                },
                "feedback": {
                    "type": "object",
                    "description": "Detailed feedback for improvement.",
                    "properties": {
                        "strengths": {
                            "type": "array",
                            "description": "Areas where the user performed well.",
                            "items": {"type": "string"}
                        },
                        "areasForImprovement": {
                            "type": "array",
                            "description": "Specific areas that need work.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "area": {"type": "string"},
                                    "suggestion": {"type": "string"},
                                    "priority": {"type": "string", "enum": ["high", "medium", "low"]}
                                },
                                "required": ["area", "suggestion", "priority"]
                            }
                        },
                        "practiceRecommendations": {
                            "type": "array",
                            "description": "Specific exercises or techniques to practice.",
                            "items": {"type": "string"}
                        },
                        "overallFeedback": {
                            "type": "string",
                            "description": "General encouraging feedback and summary. Limit this to 160 characters."
                        }
                    },
                    "required": ["strengths", "areasForImprovement", "practiceRecommendations", "overallFeedback"]
                }
            },
            "required": ["overallScore", "metrics", "feedback"]
        }
    },
    "required": ["yodelComparison"]
}


def convert_json_schema_to_genai_schema(json_schema: dict) -> types.Schema:
    """
    Converts a JSON schema dictionary to a google.generativeai.types.Schema object.
    """
    type_mapping = {
        "string": types.Type.STRING,
        "integer": types.Type.INTEGER,
        "number": types.Type.NUMBER,
        "boolean": types.Type.BOOLEAN,
        "object": types.Type.OBJECT,
        "array": types.Type.ARRAY,
    }

    genai_schema_args = {}

    schema_type = json_schema.get("type")
    if schema_type and schema_type in type_mapping:
        genai_schema_args["type"] = type_mapping[schema_type]

    if "description" in json_schema:
        genai_schema_args["description"] = json_schema["description"]

    if "enum" in json_schema:
        genai_schema_args["enum"] = json_schema["enum"]

    if "properties" in json_schema:
        genai_schema_args["properties"] = {
            k: convert_json_schema_to_genai_schema(v)
            for k, v in json_schema["properties"].items()
        }

    if "items" in json_schema:
        genai_schema_args["items"] = convert_json_schema_to_genai_schema(json_schema["items"])

    if "required" in json_schema:
        genai_schema_args["required"] = json_schema["required"]

    return types.Schema(**genai_schema_args)


def generate_gemini_response(wav_data):
    """
    Generates a response from the Gemini API based on the provided WAV file data.
    """
    logger.info(f"Starting Gemini analysis - Audio data size: {len(wav_data)} bytes")
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini client initialized successfully")
        
        prompt = f"""
        Analyze the provided audio recording of a yodeling performance and extract the following information in JSON format. The JSON output must strictly adhere to the following schema:

        ```json
        {json.dumps(yodel_analysis_schema, indent=2)}
        ```
        """

        # Create audio part using the correct method
        audio_part = types.Part(
            inline_data=types.Blob(
                mime_type='audio/wav',
                data=wav_data
            )
        )
        logger.info("Audio part created for Gemini API")

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                    audio_part
                ]
            )
        ]

        model = "gemini-2.5-pro-preview-06-05"
        logger.info(f"Using model: {model}")
        
        gemini_analysis_schema = convert_json_schema_to_genai_schema(yodel_analysis_schema)
        
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=gemini_analysis_schema,
            thinking_config=types.ThinkingConfig(
                thinking_budget=8192,
            )
        )

        logger.info("Sending request to Gemini API...")
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )
        
        logger.info(f"Gemini API response received - Length: {len(response.text)} characters")
        return response.text
        
    except Exception as e:
        logger.error(f"Error in generate_gemini_response: {str(e)}", exc_info=True)
        raise


def generate_yodel_comparison(original_wav_data, user_wav_data, past_performances=None, user_info=None):
    """
    Generates a comparison analysis between original and user yodel performances.
    
    Args:
        original_wav_data: Binary data of the original/reference yodel performance
        user_wav_data: Binary data of the user's yodel performance
        past_performances: Optional list of past performance analyses for context
        user_info: Optional dictionary containing user information (skill level, practice time, etc.)
    """
    logger.info(f"Starting yodel comparison - Original: {len(original_wav_data)} bytes, User: {len(user_wav_data)} bytes")
    
    # Log additional context information
    if past_performances:
        logger.info(f"Including {len(past_performances)} past performances for context")
    if user_info:
        logger.info(f"Including user info: {user_info.keys() if isinstance(user_info, dict) else 'provided'}")
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini client initialized for comparison")
        
        # Build context information for the prompt
        context_info = ""
        
        if past_performances and len(past_performances) > 0:
            context_info += f"\n\nPAST PERFORMANCE CONTEXT:\n"
            context_info += f"The user has completed {len(past_performances)} previous yodeling analysis(es). Here's their performance history:\n\n"
            
            for i, past_perf in enumerate(past_performances[-5:], 1):  # Include last 5 performances
                if isinstance(past_perf, dict):
                    context_info += f"Performance #{i}:\n"
                    if 'yodelComparison' in past_perf:
                        comp_data = past_perf['yodelComparison']
                        if 'overallScore' in comp_data:
                            context_info += f"  - Overall Score: {comp_data['overallScore']}/100\n"
                        if 'metrics' in comp_data:
                            metrics = comp_data['metrics']
                            context_info += f"  - Pitch Accuracy: {metrics.get('pitchAccuracy', {}).get('score', 'N/A')}/100\n"
                            context_info += f"  - Timing Accuracy: {metrics.get('timingAccuracy', {}).get('score', 'N/A')}/100\n"
                            context_info += f"  - Yodel Break Quality: {metrics.get('yodelBreakQuality', {}).get('score', 'N/A')}/100\n"
                        if 'feedback' in comp_data and 'areasForImprovement' in comp_data['feedback']:
                            improvements = comp_data['feedback']['areasForImprovement']
                            if improvements:
                                context_info += f"  - Previous areas for improvement: {', '.join([area.get('area', '') for area in improvements[:3]])}\n"
                    elif 'overallScore' in past_perf:
                        context_info += f"  - Overall Score: {past_perf['overallScore']}/100\n"
                    context_info += "\n"
        
        if user_info:
            context_info += f"\nUSER INFORMATION:\n"
            if isinstance(user_info, dict):
                if 'experience_level' in user_info:
                    context_info += f"- Experience Level: {user_info['experience_level']}\n"
                if 'practice_frequency' in user_info:
                    context_info += f"- Practice Frequency: {user_info['practice_frequency']}\n"
                if 'goals' in user_info:
                    context_info += f"- Goals: {user_info['goals']}\n"
                if 'challenges' in user_info:
                    context_info += f"- Known Challenges: {user_info['challenges']}\n"
                if 'total_practice_time' in user_info:
                    context_info += f"- Total Practice Time: {user_info['total_practice_time']}\n"
        
        prompt = f"""
        Compare these two yodeling performances and provide a detailed analysis. The first audio file is the original/reference performance, and the second is the user's attempt. 

        {context_info}

        Based on the context above, analyze and compare the following aspects:
        1. Pitch accuracy - How well does the user match the original pitches?
        2. Timing accuracy - How well does the user match the timing of phrases and syllables?
        3. Yodel break quality - How smooth and controlled are the transitions between chest and head voice?
        4. Syllable accuracy - How well does the user match the original syllables and pronunciation?
        5. Rhythm consistency - How well does the user maintain consistent rhythm and tempo?

        IMPORTANT PERSONALIZATION GUIDELINES:
        - If this user has past performances, compare their current performance to their historical progress
        - Acknowledge improvement or areas where they may have regressed
        - Reference specific areas they've been working on based on past feedback
        - Adjust the difficulty and specificity of recommendations based on their experience level
        - Provide encouragement based on their journey and progress trends
        - If they're a beginner, focus on fundamentals; if advanced, provide more nuanced feedback
        - Consider their stated goals and challenges when providing recommendations

        Provide constructive feedback including strengths, areas for improvement, and specific practice recommendations.

       

        Be encouraging but honest in your assessment. Focus on specific, actionable feedback that will help the user improve their yodeling technique. Make the feedback personal and relevant to their journey.
        """

        # Create audio parts for both files
        original_audio_part = types.Part(
            inline_data=types.Blob(
                mime_type='audio/wav',
                data=original_wav_data
            )
        )
        
        user_audio_part = types.Part(
            inline_data=types.Blob(
                mime_type='audio/wav',
                data=user_wav_data
            )
        )
        logger.info("Audio parts created for comparison")

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                    types.Part.from_text(text="Original/Reference Performance:"),
                    original_audio_part,
                    types.Part.from_text(text="User's Performance:"),
                    user_audio_part
                ]
            )
        ]

        model = "gemini-2.5-pro-preview-06-05"
        logger.info(f"Using model for comparison: {model}")
        
        gemini_comparison_schema = convert_json_schema_to_genai_schema(yodel_comparison_schema)
        
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=gemini_comparison_schema,
            thinking_config=types.ThinkingConfig(
                thinking_budget=8192,
            )
        )

        logger.info("Sending comparison request to Gemini API...")
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )
        
        logger.info(f"Comparison response received - Length: {len(response.text)} characters")
        logger.info(f"Comparison response: {response.text}")
        return response.text
        
    except Exception as e:
        logger.error(f"Error in generate_yodel_comparison: {str(e)}", exc_info=True)
        raise


@app.route("/analyze-yodel", methods=["POST"])
def analyze_yodel():
    """
    API endpoint to analyze a yodel performance from a base64 encoded WAV file.
    """
    request_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    logger.info(f"[{request_id}] Received analyze-yodel request")
    
    try:
        if not request.json or "wav_base64" not in request.json:
            logger.warning(f"[{request_id}] Invalid request - missing wav_base64")
            return jsonify({"error": "No base64 encoded wav file part"}), 400

        wav_base64 = request.json["wav_base64"]
        logger.info(f"[{request_id}] Base64 data length: {len(wav_base64)} characters")

        # Decode the base64 string
        wav_data = base64.b64decode(wav_base64)
        logger.info(f"[{request_id}] Decoded WAV data size: {len(wav_data)} bytes")

        # Generate the analysis from Gemini
        logger.info(f"[{request_id}] Starting Gemini analysis...")
        gemini_response = generate_gemini_response(wav_data)

        # Parse the JSON response from Gemini
        logger.info(f"[{request_id}] Parsing Gemini response...")
        analysis_result = json.loads(gemini_response)
        
        logger.info(f"[{request_id}] Analysis completed successfully")
        return jsonify(analysis_result)

    except json.JSONDecodeError as e:
        logger.error(f"[{request_id}] JSON decode error: {str(e)}")
        error_details = {
            "error": "Invalid JSON response from Gemini",
            "type": "JSONDecodeError",
            "details": str(e)
        }
        return jsonify(error_details), 500
    except Exception as e:
        import traceback
        logger.error(f"[{request_id}] Unexpected error: {str(e)}", exc_info=True)
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        return jsonify(error_details), 500


@app.route("/compare-yodel", methods=["POST"])
def compare_yodel():
    """
    API endpoint to compare two yodel performances and provide detailed feedback.
    Expects original_wav_base64 and user_wav_base64 in the request JSON.
    Optional: past_performances (list) and user_info (dict) for personalized feedback.
    
    Expected JSON format:
    {
        "original_wav_base64": "base64_encoded_wav_data",
        "user_wav_base64": "base64_encoded_wav_data",
        "past_performances": [  // Optional - array of past comparison results
            {
                "yodelComparison": {
                    "overallScore": 85,
                    "metrics": { ... },
                    "feedback": { ... }
                }
            }
        ],
        "user_info": {  // Optional - user context information
            "experience_level": "intermediate",
            "practice_frequency": "3 times per week",
            "goals": "Improve yodel breaks and pitch accuracy",
            "challenges": "Difficulty with high notes",
            "total_practice_time": "6 months"
        }
    }
    """
    request_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    logger.info(f"[{request_id}] Received compare-yodel request")
    
    try:
        if not request.json:
            logger.warning(f"[{request_id}] Invalid request - no JSON data")
            return jsonify({"error": "No JSON data provided"}), 400
        
        if "original_wav_base64" not in request.json:
            logger.warning(f"[{request_id}] Invalid request - missing original_wav_base64")
            return jsonify({"error": "No original_wav_base64 provided"}), 400
            
        if "user_wav_base64" not in request.json:
            logger.warning(f"[{request_id}] Invalid request - missing user_wav_base64")
            return jsonify({"error": "No user_wav_base64 provided"}), 400

        original_wav_base64 = request.json["original_wav_base64"]
        user_wav_base64 = request.json["user_wav_base64"]
        
        # Optional parameters for enhanced personalization
        past_performances = request.json.get("past_performances", None)
        user_info = request.json.get("user_info", None)
        
        logger.info(f"[{request_id}] Original base64 length: {len(original_wav_base64)} characters")
        logger.info(f"[{request_id}] User base64 length: {len(user_wav_base64)} characters")
        
        # Log additional context parameters
        if past_performances:
            logger.info(f"[{request_id}] Past performances provided: {len(past_performances)} entries")
        if user_info:
            logger.info(f"[{request_id}] User info provided: {list(user_info.keys()) if isinstance(user_info, dict) else 'non-dict format'}")

        # Decode the base64 strings
        logger.info(f"[{request_id}] Decoding base64 data...")
        original_wav_data = base64.b64decode(original_wav_base64)
        user_wav_data = base64.b64decode(user_wav_base64)
        
        logger.info(f"[{request_id}] Original WAV size: {len(original_wav_data)} bytes")
        logger.info(f"[{request_id}] User WAV size: {len(user_wav_data)} bytes")

        # Generate the comparison analysis from Gemini with enhanced context
        logger.info(f"[{request_id}] Starting comparison analysis...")
        gemini_response = generate_yodel_comparison(
            original_wav_data, 
            user_wav_data, 
            past_performances=past_performances,
            user_info=user_info
        )

        # Parse the JSON response from Gemini
        logger.info(f"[{request_id}] Parsing comparison response...")
        comparison_result = json.loads(gemini_response)
        
        logger.info(f"[{request_id}] Comparison completed successfully")
        return jsonify(comparison_result)

    except json.JSONDecodeError as e:
        logger.error(f"[{request_id}] JSON decode error in comparison: {str(e)}")
        error_details = {
            "error": "Invalid JSON response from Gemini",
            "type": "JSONDecodeError",
            "details": str(e)
        }
        return jsonify(error_details), 500
    except Exception as e:
        import traceback
        logger.error(f"[{request_id}] Unexpected error in comparison: {str(e)}", exc_info=True)
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        return jsonify(error_details), 500


@app.route("/mock-compare-yodel", methods=["GET"])
def mock_compare_yodel():
    """
    Returns a mock yodel comparison response for development and testing.
    """
    request_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    logger.info(f"[{request_id}] Received mock-compare-yodel request")
    
    mock_response = {
        "yodelComparison": {
            "overallScore": 78.5,
            "metrics": {
                "pitchAccuracy": {
                    "score": 82,
                    "averageDeviationCents": 15.5,
                    "description": "Good pitch matching on most phrases, with some noticeable deviation on higher notes."
                },
                "timingAccuracy": {
                    "score": 75,
                    "averageDeviationMs": 80,
                    "description": "Generally good timing, but a tendency to rush the start of yodel breaks."
                },
                "yodelBreakQuality": {
                    "score": 72,
                    "smoothnessRating": "good",
                    "description": "The breaks between chest and head voice are mostly clean, but a few were abrupt."
                },
                "syllableAccuracy": {
                    "score": 88,
                    "matchedSyllables": 42,
                    "totalSyllables": 48,
                    "description": "High accuracy in syllable pronunciation, matching the original closely."
                },
                "rhythmConsistency": {
                    "score": 77,
                    "tempoVariation": 3.5,
                    "description": "Consistent rhythm throughout the performance, with minor tempo fluctuations."
                }
            },
            "feedback": {
                "strengths": [
                    "Excellent syllable clarity and pronunciation.",
                    "Strong and confident vocal projection.",
                    "Good rhythmic sense throughout the piece."
                ],
                "areasForImprovement": [
                    {
                        "area": "Yodel Break Smoothness",
                        "suggestion": "Practice slow, deliberate transitions between chest and head voice. Focus on relaxing your larynx.",
                        "priority": "high"
                    },
                    {
                        "area": "Pitch Accuracy on High Notes",
                        "suggestion": "Use sirens and pitch slides to warm up your upper register before practicing the piece.",
                        "priority": "medium"
                    },
                    {
                        "area": "Timing at Phrase Endings",
                        "suggestion": "Pay close attention to the original recording's phrasing, especially how notes are held at the end of phrases.",
                        "priority": "low"
                    }
                ],
                "practiceRecommendations": [
                    "Practice 'siren' exercises daily to improve vocal range and break smoothness.",
                    "Record yourself and listen back, comparing specifically to the original's timing.",
                    "Isolate the difficult high-pitched phrases and practice them at a slower tempo."
                ],
                "overallFeedback": "Great job! You have a solid foundation. Focusing on smoothing out your breaks will take your yodeling to the next level. Keep up the great work!"
            }
        }
    }
    logger.info(f"[{request_id}] Returning mock comparison response.")
    return jsonify(mock_response)


# Health check endpoint for Docker/Cloud deployment
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for container orchestration"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": bool(GEMINI_API_KEY)
    }), 200

# Serve React app
@app.route('/')
def serve_react_app():
    """Serve the React application"""
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        logger.error(f"Error serving React app: {str(e)}")
        return jsonify({"error": "Frontend not available"}), 404

# Serve static files for React app
@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files for the React application"""
    try:
        return send_from_directory(app.static_folder, path)
    except Exception as e:
        # If file not found, serve React app (for client-side routing)
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e2:
            logger.error(f"Error serving static file {path}: {str(e2)}")
            return jsonify({"error": "File not found"}), 404

if __name__ == "__main__":
    logger.info("Starting Flask application on port 5002")
    logger.info(f"Gemini API key configured: {'Yes' if GEMINI_API_KEY else 'No'}")
    app.run(debug=True, port=5002)
