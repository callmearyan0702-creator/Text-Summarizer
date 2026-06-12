import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from huggingface_hub import InferenceClient

# All files (index.html, style.css, script.js) live in the SAME folder as app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
CORS(app)

# Get your FREE token at https://huggingface.co/settings/tokens
HF_TOKEN = os.getenv('hf_token')  # ← your token

client = InferenceClient(
    provider="hf-inference",
    api_key=HF_TOKEN,
)


def summarize_text(text):
    try:
        result = client.summarization(
            text,
            model="facebook/bart-large-cnn"
        )
        return result.summary_text, None
    except Exception as e:
        return None, str(e)


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "No text provided."}), 400
    if len(text.split()) < 30:
        return jsonify({"error": "Please provide at least 30 words for a meaningful summary."}), 400
    if len(text) > 5000:
        text = text[:5000]

    summary, error = summarize_text(text)

    if error:
        return jsonify({"error": error}), 500

    word_count_original = len(text.split())
    word_count_summary  = len(summary.split())
    reduction = round((1 - word_count_summary / word_count_original) * 100)

    return jsonify({
        "summary": summary,
        "stats": {
            "original_words": word_count_original,
            "summary_words":  word_count_summary,
            "reduction":      reduction
        }
    })


if __name__ == "__main__":
    app.run()
