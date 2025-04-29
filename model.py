import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Feature list we expect
FEATURE_KEYS = [
    "average_score",
    "average_comments",
    "post_engagement",
    "subreddit_diversity",
    "comment_activity",
    "interactions_with_others",
    "post_count_analyzed"
]

# Initialize scaler and model
scaler = StandardScaler()
model = LogisticRegression()

def preprocess_features(user_data: dict):
    """Extract and scale features from user data"""
    features = [
        user_data.get("average_score", 0),
        user_data.get("average_comments", 0),
        user_data.get("post_engagement", 0),
        user_data.get("subreddit_diversity", 0),
        user_data.get("comment_activity", 0),
        user_data.get("interactions_with_others", 0),
        user_data.get("post_count_analyzed", 0)
    ]
    return np.array(features).reshape(1, -1)

def train_dummy_model():
    """Train a dummy model because real churn labels are unavailable"""
    # Randomly generate fake training data
    X = np.random.rand(500, len(FEATURE_KEYS)) * 10
    y = np.random.randint(0, 2, size=(500,))  # 0 = active, 1 = churn risk

    # Scale and split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    # Fit scaler and model
    global scaler, model
    scaler.fit(X_train)
    X_train_scaled = scaler.transform(X_train)

    model.fit(X_train_scaled, y_train)

    # Optionally save model and scaler
    joblib.dump(scaler, "scaler.pkl")
    joblib.dump(model, "churn_model.pkl")

def load_model():
    """Load model and scaler"""
    global scaler, model
    scaler = joblib.load("scaler.pkl")
    model = joblib.load("churn_model.pkl")

def predict_churn(user_data: dict) -> dict:
    """Predict churn risk based on extracted user data"""
    features = preprocess_features(user_data)
    features_scaled = scaler.transform(features)

    prediction = model.predict(features_scaled)[0]
    probability = model.predict_proba(features_scaled)[0][1]  # probability of churn

    return {
        "prediction": int(prediction),
        "risk_score": round(float(probability) * 100, 2)  # Percentage
    }

# Train dummy model at startup (only if model doesn't exist)
try:
    load_model()
except Exception:
    train_dummy_model()