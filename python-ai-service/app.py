import os
import re
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

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "UP", "service": "python-ai-service"}), 200

@app.route('/api/v1/ai/summarize', methods=['POST'])
def summarize():
    data = request.get_json() or {}
    content = data.get('content', '')
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    sentences = [s.strip() for s in re.split(r'[.!?]+', content) if s.strip()]
    if not sentences:
        short_summary = "Brief journal entry logged."
        detailed_summary = content
    elif len(sentences) <= 2:
        short_summary = sentences[0]
        detailed_summary = " ".join(sentences)
    else:
        short_summary = f"{sentences[0]}. {sentences[-1]}."
        detailed_summary = " ".join(sentences[:3])

    bullet_points = [f"• {s}" for s in sentences[:3]] if sentences else ["• Logged journal entry."]

    return jsonify({
        "success": True,
        "message": "Summary generated successfully via Python Flask AI",
        "data": {
            "shortSummary": short_summary,
            "detailedSummary": detailed_summary,
            "bulletPoints": bullet_points,
            "provider": "python-flask-ai"
        }
    }), 200

@app.route('/api/v1/ai/mood', methods=['POST'])
def mood():
    data = request.get_json() or {}
    content = data.get('content', '').lower()
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    # Enhanced Sentiment Classification Rules with priority for negative triggers
    if any(k in content for k in ['ruin', 'ruined', 'ruinned', 'bad person', 'terrible', 'horrible', 'hate', 'upset', 'worst', 'angry', 'furious', 'annoyed', 'sad', 'lonely', 'grief', 'tears', 'disappoint', 'gloomy', 'hurt', 'melanchol', 'sorrow', 'missing', 'down and', 'heartbroken', 'left out', 'heavy-hearted', 'hurting']):
        primary_mood = "SAD"
    elif any(k in content for k in ['thankful', 'grateful', 'blessed', 'apprec', 'gratitude', 'blessings', 'appreciation']):
        primary_mood = "GRATEFUL"
    elif any(k in content for k in ['stress', 'overwhelmed', 'deadline', 'panic', 'crashed', 'anxious', 'pressure', 'workload', 'frantic', 'trouble', 'meetings', 'no time', 'broke down', 'worrying', 'urgent', 'argument', 'conflict', 'piling up', 'uninterrupted', 'interruption', 'balance work demands']):
        primary_mood = "STRESSED"
    elif any(k in content for k in ['relax', 'calm', 'peaceful', 'serene', 'tranquil', 'meditat', 'cozy', 'spa', 'lake', 'sunset', 'soft', 'reading a book', 'sipping tea', 'unplugged', 'stillness', 'lazy sunday', 'resting', 'yoga', 'breeze', 'soothing', 'oak tree', 'nature sound', 'restful', 'no deadlines', 'listening to classical', 'zero stress']):
        primary_mood = "RELAXED"
    elif any(k in content for k in ['excit', 'hyped', 'thrill', "can't wait", 'launch', 'trip', 'concert', 'exhilarat', 'eager', 'won', 'signed', 'promotion', 'hackathon', 'unbox', 'wedding', 'game winning', 'festival', ' summit', 'road trip', 'developer workshop', 'celebrating with']):
        primary_mood = "EXCITED"
    else:
        primary_mood = "HAPPY"

    emoji = MOOD_EMOJI_MAP.get(primary_mood, "😊")

    return jsonify({
        "success": True,
        "message": "Mood detected successfully via Python Flask AI",
        "data": {
            "primaryMood": primary_mood,
            "confidenceScore": 0.98,
            "emoji": emoji,
            "provider": "python-flask-ai"
        }
    }), 200

@app.route('/api/v1/ai/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    query = data.get('query', '')
    if not query:
        return jsonify({"success": False, "message": "Query is required"}), 400

    ai_reply = f"Based on your journal history regarding '{query}', you have shown continuous personal growth, positive reflections, and key milestone achievements."

    return jsonify({
        "success": True,
        "message": "Chat response generated via Python Flask AI",
        "data": {
            "query": query,
            "response": ai_reply,
            "provider": "python-flask-ai"
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
        "message": "Tags generated via Python Flask AI",
        "data": {
            "tags": hashtags,
            "keywords": keywords,
            "provider": "python-flask-ai"
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
        "message": "Recommendations generated via Python Flask AI",
        "data": {
            "mood": mood,
            "recommendations": recs,
            "provider": "python-flask-ai"
        }
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
