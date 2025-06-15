import os
import base64
import json
from api import generate_gemini_response

def analyze_wav_files():
    """
    Analyzes all WAV files in the 'steps' directory by calling the Gemini API directly.
    """
    steps_dir = "steps"

    if not os.path.exists(steps_dir):
        print(f"Directory not found: {steps_dir}")
        return

    for filename in os.listdir(steps_dir):
        if filename.endswith(".wav"):
            input_path = os.path.join(steps_dir, filename)
            output_filename = f"{os.path.splitext(filename)[0]}_analysis.json"
            output_path = os.path.join(steps_dir, output_filename)

            print(f"Processing {filename}...")

            try:
                with open(input_path, "rb") as wav_file:
                    wav_data = wav_file.read()

                # Call the Gemini API function directly
                gemini_response = generate_gemini_response(wav_data)
                
                # Parse the JSON response
                analysis_result = json.loads(gemini_response)

                with open(output_path, "w") as json_file:
                    json.dump(analysis_result, json_file, indent=4)

                print(f"Successfully created {output_filename}")

            except json.JSONDecodeError as e:
                print(f"Error decoding JSON response for {filename}: {e}")
            except Exception as e:
                print(f"An unexpected error occurred for {filename}: {e}")

if __name__ == "__main__":
    analyze_wav_files() 