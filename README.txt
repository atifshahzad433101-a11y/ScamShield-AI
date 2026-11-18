SCAMSHIELD AI — PREMIUM DASHBOARD STARTER

1. Extract this ZIP into your existing ScamShield project folder.
2. Keep these two existing model files in the SAME folder as server.py:
   - scamshield_model.pkl
   - tfidf_vectorizer.pkl
3. Activate your existing virtual environment in VS Code:
   & "D:\ScamShield_Environment\Scripts\Activate.ps1"
4. Install dependencies:
   python -m pip install -r requirements.txt
5. Start the dashboard:
   python server.py
6. Open this address in your browser:
   http://127.0.0.1:5000

IMPORTANT:
- This package does not include or replace your trained .pkl model files.
- It uses your existing Logistic Regression + TF-IDF model.
- The dashboard history is stored in the Flask browser session and is temporary.
- This is a local research prototype, not a production security service.
- Do not enter real OTPs, passwords, bank details or private messages.
- Chart.js and Google Fonts are loaded from online CDNs, so those visual assets need internet access.
