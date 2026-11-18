from flask import Flask, render_template, request, jsonify, session, Response
import joblib, os, csv, io
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "scamshield_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "tfidf_vectorizer.pkl")

app = Flask(__name__)
app.secret_key = os.environ.get("SCAMSHIELD_SECRET", "change-this-local-demo-secret")

model = None
tfidf = None
model_error = None
try:
    model = joblib.load(MODEL_PATH)
    tfidf = joblib.load(VECTORIZER_PATH)
except Exception as exc:
    model_error = str(exc)

def get_history():
    return session.get("history", [])

def classify(vector):
    prediction = model.predict(vector)[0]
    classes = list(getattr(model, "classes_", []))
    # Current ScamShield dataset uses 1 = Scam and 0 = Legitimate.
    if prediction in (1, "1", "Scam", "SCAM", "scam"):
        label = "SCAM"
    elif prediction in (0, "0", "Legitimate", "LEGITIMATE", "legitimate"):
        label = "LEGITIMATE"
    else:
        label = str(prediction).upper()
    confidence = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(vector)[0]
        confidence = round(float(probs[classes.index(prediction)]) * 100, 1) if prediction in classes else round(float(max(probs)) * 100, 1)
    return label, confidence

@app.route("/")
def index():
    return render_template("index.html", model_ready=(model is not None), model_error=model_error)

@app.route("/api/analyze", methods=["POST"])
def analyze():
    if model is None or tfidf is None:
        return jsonify({"error": "AI model files not found. Place both .pkl files beside server.py."}), 500
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Please enter a message to analyze."}), 400
    vector = tfidf.transform([message])
    label, confidence = classify(vector)
    terms = ["otp", "password", "urgent", "click", "claim", "winner", "prize",
             "blocked", "bank account", "verify", "reward", "free", "انعام", "مبارک", "او ٹی پی"]
    found = [term for term in terms if term in message.lower()]
    record = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "message": message,
        "prediction": label,
        "confidence": confidence,
        "keywords": found
    }
    history = get_history()
    history.insert(0, record)
    session["history"] = history[:200]
    return jsonify(record)

@app.route("/api/stats")
def stats():
    history = get_history()
    scams = sum(1 for x in history if x["prediction"] == "SCAM")
    legit = sum(1 for x in history if x["prediction"] == "LEGITIMATE")
    return jsonify({"total": len(history), "scams": scams, "legitimate": legit,
                    "scam_share": round(scams / len(history) * 100, 1) if history else 0,
                    "history": history[:8]})

@app.route("/api/history")
def history():
    return jsonify(get_history())

@app.route("/api/clear", methods=["POST"])
def clear():
    session["history"] = []
    return jsonify({"ok": True})

@app.route("/api/export")
def export():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Message", "Prediction", "Confidence", "Keyword Flags"])
    for row in get_history():
        writer.writerow([row["date"], row["message"], row["prediction"], row["confidence"], ", ".join(row["keywords"])])
    return Response(output.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=ScamShield_Report.csv"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
