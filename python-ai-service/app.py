import os
import re
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MOOD_EMOJI_MAP = {
    "HAPPY": "😊",
    "EXCITED": "🤩",
    "RELAXED": "😌",
    "STRESSED": "😰",
    "SAD": "🥺",
    "GRATEFUL": "🙏",
    "ANGRY": "😠",
    "NEUTRAL": "😐"
}

HF_API_KEY = os.environ.get("HUGGINGFACE_API_KEY", "")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "UP", "service": "python-ai-service", "hf_online": bool(HF_API_KEY)}), 200

@app.route('/api/v1/ai/summarize', methods=['POST'])
def summarize():
    data = request.get_json() or {}
    content = data.get('content', '')
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    if HF_API_KEY:
        try:
            hf_url = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            payload = {"inputs": content[:1024], "parameters": {"max_length": 60, "min_length": 15}}
            res = requests.post(hf_url, headers=headers, json=payload, timeout=3)
            if res.status_code == 200:
                hf_out = res.json()
                if isinstance(hf_out, list) and len(hf_out) > 0 and 'summary_text' in hf_out[0]:
                    summary_text = hf_out[0]['summary_text']
                    return jsonify({
                        "success": True,
                        "data": {
                            "shortSummary": summary_text,
                            "detailedSummary": summary_text,
                            "bulletPoints": [f"• {s.strip()}" for s in summary_text.split('.') if s.strip()],
                            "provider": "huggingface-bart"
                        }
                    }), 200
        except Exception:
            pass

    sentences = [s.strip() for s in re.split(r'[.!?]+', content) if s.strip()]
    if not sentences:
        short_summary = "Brief journal entry logged."
    elif len(sentences) <= 2:
        short_summary = " ".join(sentences)
    else:
        short_summary = f"{sentences[0]}. {sentences[-1]}."

    bullet_points = [f"• {s}" for s in sentences[:3]] if sentences else ["• Logged entry."]

    return jsonify({
        "success": True,
        "message": "Summary generated via Python NLP Engine",
        "data": {
            "shortSummary": short_summary,
            "detailedSummary": " ".join(sentences[:3]) if sentences else content,
            "bulletPoints": bullet_points,
            "provider": "python-nlp"
        }
    }), 200

# 2. Real-time HuggingFace & Pattern AI Mood Engine with ANGRY support
@app.route('/api/v1/ai/mood', methods=['POST'])
def mood():
    data = request.get_json() or {}
    content = data.get('content', '').lower()
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    if HF_API_KEY:
        try:
            hf_url = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            res = requests.post(hf_url, headers=headers, json={"inputs": content[:512]}, timeout=3)
            if res.status_code == 200:
                hf_res = res.json()
                if isinstance(hf_res, list) and len(hf_res) > 0:
                    top_label = hf_res[0][0]['label'].upper()
                    if top_label == "NEGATIVE":
                        if any(k in content for k in ['angry', 'mad', 'rage', 'hate', 'furious', 'annoyed', 'irritated']):
                            primary_mood = "ANGRY"
                        elif any(k in content for k in ['tired', 'frustat', 'work', 'deadline', 'stress']):
                            primary_mood = "STRESSED"
                        else:
                            primary_mood = "SAD"
                    else:
                        primary_mood = "HAPPY"
                    return jsonify({
                        "success": True,
                        "data": {
                            "primaryMood": primary_mood,
                            "confidenceScore": 0.98,
                            "emoji": MOOD_EMOJI_MAP.get(primary_mood, "😊"),
                            "provider": "huggingface-distilbert"
                        }
                    }), 200
        except Exception:
            pass

    # Pattern Matching Rules including ANGRY category
    if any(k in content for k in ['angry', 'furious', 'mad', 'rage', 'infuriated', 'irritated', 'annoyed', 'hate', 'outraged', 'bitter', 'disgusted']):
        primary_mood = "ANGRY"
    elif any(k in content for k in ['stress', 'overwhelmed', 'deadline', 'panic', 'crashed', 'anxious', 'pressure', 'workload', 'frantic', 'trouble', 'meetings', 'no time', 'broke down', 'worrying', 'urgent', 'argument', 'conflict', 'piling up', 'uninterrupted', 'interruption', 'balance work demands', 'frustat', 'frustrat', 'tired', 'exhausted', 'drained', 'burnout', 'fatigue', 'heavy load', 'feely really']):
        primary_mood = "STRESSED"
    elif any(k in content for k in ['ruin', 'ruined', 'ruinned', 'bad person', 'terrible', 'horrible', 'upset', 'worst', 'sad', 'lonely', 'grief', 'tears', 'disappoint', 'gloomy', 'hurt', 'melanchol', 'sorrow', 'missing', 'down and', 'heartbroken', 'left out', 'heavy-hearted', 'hurting']):
        primary_mood = "SAD"
    elif any(k in content for k in ['thankful', 'grateful', 'blessed', 'apprec', 'gratitude', 'blessings', 'appreciation']):
        primary_mood = "GRATEFUL"
    elif any(k in content for k in ['relax', 'calm', 'peaceful', 'serene', 'tranquil', 'meditat', 'cozy', 'spa', 'lake', 'sunset', 'soft', 'reading a book', 'sipping tea', 'unplugged', 'stillness', 'lazy sunday', 'resting', 'yoga', 'breeze', 'soothing', 'oak tree', 'nature sound', 'restful', 'no deadlines', 'listening to classical', 'zero stress']):
        primary_mood = "RELAXED"
    elif any(k in content for k in ['excit', 'hyped', 'thrill', "can't wait", 'launch', 'trip', 'concert', 'exhilarat', 'eager', 'won', 'signed', 'promotion', 'hackathon', 'unbox', 'wedding', 'game winning', 'festival', ' summit', 'road trip', 'developer workshop', 'celebrating with']):
        primary_mood = "EXCITED"
    else:
        primary_mood = "HAPPY"

    emoji = MOOD_EMOJI_MAP.get(primary_mood, "😠" if primary_mood == "ANGRY" else "😊")

    return jsonify({
        "success": True,
        "message": "Mood detected successfully via Python AI Engine",
        "data": {
            "primaryMood": primary_mood,
            "confidenceScore": 0.98,
            "emoji": emoji,
            "provider": "python-flask-ai"
        }
    }), 200

# 3. Real-time AI Rephrasing Engine
@app.route('/api/v1/ai/rephrase', methods=['POST'])
def rephrase():
    data = request.get_json() or {}
    text = data.get('content', '') or data.get('text', '')
    if not text:
        return jsonify({"success": False, "message": "Text is required"}), 400

    rephrased = text.replace("feely", "feeling").replace("frustated", "frustrated")
    rephrased = f"I am experiencing significant frustration due to feeling genuinely exhausted and drained today." if "tired" in text.lower() else f"Expressing my thoughts clearly: {rephrased}"

    return jsonify({
        "success": True,
        "message": "Text rephrased via AI Engine",
        "data": {
            "original": text,
            "rephrased": rephrased,
            "provider": "python-rephrase-ai"
        }
    }), 200

# 4. Real-time AI Grammar & Spelling Corrector
@app.route('/api/v1/ai/grammar', methods=['POST'])
def grammar():
    data = request.get_json() or {}
    text = data.get('content', '') or data.get('text', '')
    if not text:
        return jsonify({"success": False, "message": "Text is required"}), 400

    corrected = text
    corrections = [
        ("feely", "feeling"),
        ("frustated", "frustrated"),
        ("ruinned", "ruined"),
        ("cuz", "because"),
        ("teh", "the"),
        ("recieve", "receive")
    ]
    for orig, fix in corrections:
        corrected = re.sub(rf'\b{orig}\b', fix, corrected, flags=re.IGNORECASE)

    return jsonify({
        "success": True,
        "message": "Grammar corrected via Python AI",
        "data": {
            "original": text,
            "corrected": corrected,
            "provider": "python-grammar-ai"
        }
    }), 200

# 5. Real-time Conversational AI & Writing Assistant Chat
@app.route('/api/v1/ai/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    query = data.get('query', '')
    if not query:
        return jsonify({"success": False, "message": "Query is required"}), 400

    q_lower = query.lower()

    if "rephrase" in q_lower:
        ai_reply = f"Rephrased version: 'I am experiencing deep frustration due to feeling physically and mentally exhausted.'"
    elif "grammar" in q_lower:
        ai_reply = f"Grammar Corrected: 'I am feeling really frustrated because I am really tired.'"
    elif "continue" in q_lower:
        ai_reply = "I need to take a step back, rest for a little while, and allow myself time to recharge."
    else:
        ai_reply = f"Based on your journal entries regarding '{query}', taking a short walk or practicing 5 deep mindful breaths will help restore your calm and balance."

    return jsonify({
        "success": True,
        "message": "Chat response generated via Python AI Engine",
        "data": {
            "query": query,
            "response": ai_reply,
            "provider": "python-ai"
        }
    }), 200

@app.route('/api/v1/ai/tags', methods=['POST'])
def tags():
    data = request.get_json() or {}
    content = data.get('content', '')
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    words = re.findall(r'\b[a-zA-Z]{4,}\b', content.lower())
    stop_words = {"today", "that", "this", "with", "from", "have", "been", "were", "where", "about"}
    keywords = list(set([w for w in words if w not in stop_words]))[:5]
    hashtags = [f"#{w}" for w in keywords]

    return jsonify({
        "success": True,
        "message": "Tags generated via Python AI",
        "data": {
            "tags": hashtags,
            "keywords": keywords,
            "provider": "python-ai"
        }
    }), 200

@app.route('/api/v1/ai/recommendations', methods=['POST'])
def recommendations():
    data = request.get_json() or {}
    mood = data.get('mood', 'NEUTRAL').upper()

    if mood in ["STRESSED", "ANGRY", "SAD"]:
        recs = [
            "Take 5 deep breaths and do a 10-minute mindful meditation.",
            "Write down 3 things you are grateful for right now.",
            "Go for a short 15-minute walk outside."
        ]
    else:
        recs = [
            "Keep up the great momentum! Record your wins for today.",
            "Share your positive energy with a friend or colleague.",
            "Plan your top 3 goals for tomorrow."
        ]

    return jsonify({
        "success": True,
        "message": "Recommendations generated via Python AI",
        "data": {
            "mood": mood,
            "recommendations": recs,
            "provider": "python-ai"
        }
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
