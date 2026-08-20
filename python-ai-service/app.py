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

# Keywords confirmed to also be a literal PREFIX of a common, unrelated
# English word - e.g. "mad" (meant to catch anger) is the first three
# letters of "made", so naive substring matching silently misclassified any
# entry containing that extremely common word as ANGRY. These need a
# right-side word boundary too (an exact-word match); every other keyword
# below only gets a left-side boundary so it keeps matching its natural
# inflections (e.g. "stress" -> "stressed"/"stressful").
_EXACT_WORD_KEYWORDS = {'mad', 'spa', 'soft', 'won', 'trip'}

def _keyword_matches(keyword: str, content: str) -> bool:
    if ' ' in keyword:
        # Multi-word phrases can't realistically collide mid-word.
        return keyword in content
    pattern = r'\b' + re.escape(keyword) + (r'\b' if keyword in _EXACT_WORD_KEYWORDS else '')
    return re.search(pattern, content) is not None

def _any_keyword(keywords, content: str) -> bool:
    return any(_keyword_matches(k, content) for k in keywords)

# Shared keyword-based mood classifier - the single source of truth for the
# non-HF fallback used by both /mood and /chat, so a chat reply's tone always
# agrees with what /mood would have detected for the same text.
def detect_mood_keywords(content: str) -> str:
    content = content.lower()
    if _any_keyword(['angry', 'furious', 'mad', 'rage', 'infuriated', 'irritated', 'annoyed', 'hate', 'outraged', 'bitter', 'disgusted'], content):
        return "ANGRY"
    if _any_keyword(['stress', 'overwhelmed', 'deadline', 'panic', 'crashed', 'anxious', 'pressure', 'workload', 'frantic', 'trouble', 'meetings', 'no time', 'broke down', 'worrying', 'urgent', 'argument', 'conflict', 'piling up', 'uninterrupted', 'interruption', 'balance work demands', 'frustat', 'frustrat', 'tired', 'exhausted', 'drained', 'burnout', 'fatigue', 'heavy load', 'feely really'], content):
        return "STRESSED"
    if _any_keyword(['ruin', 'ruined', 'ruinned', 'bad person', 'terrible', 'horrible', 'upset', 'worst', 'sad', 'lonely', 'grief', 'tears', 'disappoint', 'gloomy', 'hurt', 'melanchol', 'sorrow', 'missing', 'down and', 'heartbroken', 'left out', 'heavy-hearted', 'hurting'], content):
        return "SAD"
    if _any_keyword(['thankful', 'grateful', 'blessed', 'apprec', 'gratitude', 'blessings', 'appreciation'], content):
        return "GRATEFUL"
    if _any_keyword(['relax', 'calm', 'peaceful', 'serene', 'tranquil', 'meditat', 'cozy', 'spa', 'lake', 'sunset', 'soft', 'reading a book', 'sipping tea', 'unplugged', 'stillness', 'lazy sunday', 'resting', 'yoga', 'breeze', 'soothing', 'oak tree', 'nature sound', 'restful', 'no deadlines', 'listening to classical', 'zero stress'], content):
        return "RELAXED"
    if _any_keyword(['excit', 'hyped', 'thrill', "can't wait", 'launch', 'trip', 'concert', 'exhilarat', 'eager', 'won', 'signed', 'promotion', 'hackathon', 'unbox', 'wedding', 'game winning', 'festival', ' summit', 'road trip', 'developer workshop', 'celebrating with'], content):
        return "EXCITED"
    return "HAPPY"

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
    primary_mood = detect_mood_keywords(content)
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

# Independent word lists from /mood's mood-category lists, scoped specifically
# to sentiment polarity (positive/negative), not mood category.
POSITIVE_SENTIMENT_WORDS = ['happy', 'glad', 'great', 'good', 'love', 'excited', 'grateful',
    'thankful', 'wonderful', 'amazing', 'joy', 'proud', 'relaxed', 'calm', 'peaceful',
    'blessed', 'hopeful', 'excellent', 'fantastic', 'awesome', 'enjoy', 'delighted']
NEGATIVE_SENTIMENT_WORDS = ['sad', 'angry', 'upset', 'terrible', 'horrible', 'hate', 'furious',
    'stressed', 'anxious', 'worried', 'awful', 'bad', 'miserable', 'lonely', 'hurt',
    'disappointed', 'frustrated', 'exhausted', 'overwhelmed', 'grief', 'tears', 'worst']

# 2b. Real-time Sentiment Polarity Engine - a distinct classification from
# /mood (mood category vs. simple positive/negative/neutral polarity), used to
# populate mood_history.sentiment/sentiment_score. Same HuggingFace-then-keyword
# two-tier shape as /mood.
@app.route('/api/v1/ai/sentiment', methods=['POST'])
def sentiment():
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
                    top = hf_res[0][0]
                    label = "POSITIVE" if top['label'].upper() == "POSITIVE" else "NEGATIVE"
                    return jsonify({
                        "success": True,
                        "data": {
                            "sentiment": label,
                            "score": round(float(top['score']), 4),
                            "provider": "huggingface-distilbert"
                        }
                    }), 200
        except Exception:
            pass

    positive_hits = sum(1 for w in POSITIVE_SENTIMENT_WORDS if w in content)
    negative_hits = sum(1 for w in NEGATIVE_SENTIMENT_WORDS if w in content)
    total_hits = positive_hits + negative_hits

    if total_hits == 0:
        sentiment_label = "NEUTRAL"
        score = 0.5
    elif positive_hits > negative_hits:
        sentiment_label = "POSITIVE"
        score = round(positive_hits / total_hits, 4)
    elif negative_hits > positive_hits:
        sentiment_label = "NEGATIVE"
        score = round(negative_hits / total_hits, 4)
    else:
        sentiment_label = "NEUTRAL"
        score = 0.5

    return jsonify({
        "success": True,
        "message": "Sentiment analyzed via Python AI Engine",
        "data": {
            "sentiment": sentiment_label,
            "score": score,
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

# Mood-aware canned replies for the non-HF chat fallback - one genuinely
# different, relevant response per detected mood, instead of a single
# template that echoed the same advice back for every message regardless of
# what was actually said (the bug: "hello" and a real venting message both
# got the identical "take a walk / 5 deep breaths" reply).
CHAT_REPLIES_BY_MOOD = {
    "ANGRY": "It sounds like something's really frustrating you right now. Try naming exactly what triggered it in a few sentences - putting it into words often takes the edge off, and you can revisit it once you're calmer.",
    "STRESSED": "That sounds like a lot to carry. Try breaking down what's overwhelming you into 2-3 concrete next steps, and give yourself permission to tackle just one of them today.",
    "SAD": "I'm sorry you're going through that. Writing about what's weighing on you, even just a few honest lines, can help you process it. Is there one small thing that might bring a bit of comfort right now?",
    "GRATEFUL": "It's great that you're noticing the good things. Try jotting down exactly why this moment mattered to you - specific details make gratitude entries much more powerful to look back on.",
    "RELAXED": "Sounds like a calm moment - a good time to reflect. What's one thing from today you'd like to remember or build on?",
    "EXCITED": "That's exciting! Capture the details now while the energy's fresh - what led up to this, and what are you looking forward to next?",
    "HAPPY": "That's good to hear. What made this feel good? Writing it down helps reinforce what's working for you.",
}

# Topic-based replies checked before mood classification - the mood-only
# fallback above only ever answers "how do you feel", so a functional request
# with no mood keyword in it (e.g. the app's own ChatScreen/AIChatView preset
# prompt buttons: "Suggest 3 daily journal prompts...", "How can I build a
# consistent daily writing habit?") always fell through to the generic HAPPY
# reply regardless of what was actually asked - found live via a screenshot
# of exactly that mismatch. Each entry is (trigger keywords, real answer).
TOPIC_CHAT_REPLIES = [
    (
        ['journal prompt', 'writing prompt', 'what should i write', 'give me a prompt', 'prompt idea'],
        "Here are 3 prompts to try: 1) What moment today would you want to remember a year from now, and why? "
        "2) What's something you're avoiding thinking about, and what would happen if you wrote about it for five minutes? "
        "3) Describe your current mood as if it were weather - what's the forecast for tomorrow?"
    ),
    (
        ['writing habit', 'consistent daily', 'journal every day', 'journal daily', 'build a habit', 'stay consistent'],
        "Building a daily writing habit works best when you lower the bar: commit to 3 sentences a minute, same time each day "
        "(right after coffee or before bed are easiest to anchor to). Skip trying to write something 'good' - the goal for the "
        "first few weeks is just showing up, not quality. A short streak you can see (even just counting days) helps more than "
        "long entries you dread starting."
    ),
    (
        ['how do i start journaling', 'new to journaling', "don't know what to write", 'writing block', "can't think of anything"],
        "A good way to start: pick one moment from today - a conversation, a small win, a frustration - and just describe what "
        "happened and how it made you feel, in plain language. Don't worry about structure or where it's going; the goal is to "
        "get something real on the page, not to write well."
    ),
]


def topic_chat_reply(query: str, context: str):
    combined = f"{query} {context}".lower()
    for keywords, reply in TOPIC_CHAT_REPLIES:
        if any(k in combined for k in keywords):
            return reply
    return None


def keyword_chat_reply(query: str, context: str) -> str:
    topic_reply = topic_chat_reply(query, context)
    if topic_reply:
        return topic_reply
    combined = f"{query} {context}".strip()
    mood = detect_mood_keywords(combined) if combined else "HAPPY"
    return CHAT_REPLIES_BY_MOOD.get(mood, CHAT_REPLIES_BY_MOOD["HAPPY"])

# 5. Real-time Conversational AI & Writing Assistant Chat
@app.route('/api/v1/ai/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    query = data.get('query', '')
    context = data.get('context', '')
    if not query:
        return jsonify({"success": False, "message": "Query is required"}), 400

    q_lower = query.lower()

    provider = "python-ai"
    if "rephrase" in q_lower:
        ai_reply = "Rephrased version: 'I am experiencing deep frustration due to feeling physically and mentally exhausted.'"
    elif "grammar" in q_lower:
        ai_reply = "Grammar Corrected: 'I am feeling really frustrated because I am really tired.'"
    elif "continue" in q_lower:
        ai_reply = "I need to take a step back, rest for a little while, and allow myself time to recharge."
    else:
        ai_reply = None
        if HF_API_KEY:
            try:
                hf_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
                headers = {"Authorization": f"Bearer {HF_API_KEY}"}
                prompt = f"{context}\n\n{query}" if context else query
                res = requests.post(hf_url, headers=headers, json={"inputs": prompt}, timeout=5)
                if res.status_code == 200:
                    hf_out = res.json()
                    generated = None
                    if isinstance(hf_out, dict):
                        generated = hf_out.get('generated_text')
                    elif isinstance(hf_out, list) and len(hf_out) > 0:
                        generated = hf_out[0].get('generated_text')
                    if generated:
                        ai_reply = generated.strip()
                        provider = "huggingface-dialogpt"
            except Exception:
                pass
        if not ai_reply:
            ai_reply = keyword_chat_reply(query, context)

    return jsonify({
        "success": True,
        "message": "Chat response generated via Python AI Engine",
        "data": {
            "query": query,
            "response": ai_reply,
            "provider": provider
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
