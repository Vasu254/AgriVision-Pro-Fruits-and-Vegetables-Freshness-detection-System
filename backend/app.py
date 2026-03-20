"""
Flask Backend for Fruits & Vegetables Freshness Detection
Features: image predict, camera-frame, video quality analysis, object detection, database storage
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import json
import cv2
import tempfile
import os
import sqlite3
import uuid
import hashlib
from pathlib import Path
from datetime import datetime


app = Flask(__name__)
CORS(app)

# Paths
MODEL_PATH = '../ml-model/models/freshness_detector.h5'
CLASS_INDICES_PATH = '../ml-model/models/class_indices.json'
DB_PATH = os.path.join(os.path.dirname(__file__), 'freshness.db')
STORE_DIR = os.path.join(os.path.dirname(__file__), 'store')
os.makedirs(STORE_DIR, exist_ok=True)

# Global variables
model = None
class_names = {}
IMG_SIZE = (224, 224)

# Keywords for freshness interpretation
FRESH_KEYWORDS = ['fresh', 'good', 'ripe', 'new', 'healthy']
ROTTEN_KEYWORDS = ['rotten', 'bad', 'spoiled', 'old', 'decayed', 'moldy', 'stale']

# Known fruit & vegetable names
PRODUCE_NAMES = [
    'apple', 'banana', 'orange', 'mango', 'grape', 'strawberry', 'watermelon',
    'pineapple', 'papaya', 'pomegranate', 'guava', 'lemon', 'lime', 'peach',
    'pear', 'plum', 'cherry', 'kiwi', 'avocado', 'coconut', 'fig', 'date',
    'tomato', 'potato', 'onion', 'carrot', 'cucumber', 'capsicum', 'pepper',
    'brinjal', 'eggplant', 'spinach', 'cabbage', 'cauliflower', 'broccoli',
    'peas', 'beans', 'corn', 'garlic', 'ginger', 'radish', 'beetroot', 'lettuce'
]


# ─── DATABASE ─────────────────────────────────────────────────────

def init_db():
    """Initialize SQLite database with all tables."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Users table — for login/register
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Scan history — stores every single prediction
    c.execute('''CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_type TEXT NOT NULL,
        filename TEXT,
        predicted_class TEXT,
        is_fresh INTEGER,
        freshness_score REAL,
        confidence REAL,
        quality_grade TEXT,
        freshness_label TEXT,
        recommendation TEXT,
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Batch sessions — groups batch uploads
    c.execute('''CREATE TABLE IF NOT EXISTS batch_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_images INTEGER DEFAULT 0,
        fresh_count INTEGER DEFAULT 0,
        rotten_count INTEGER DEFAULT 0,
        avg_freshness REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Video sessions — stores video analysis results
    c.execute('''CREATE TABLE IF NOT EXISTS video_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        video_quality TEXT,
        total_frames_analyzed INTEGER DEFAULT 0,
        fresh_count INTEGER DEFAULT 0,
        rotten_count INTEGER DEFAULT 0,
        overall_freshness_percent REAL DEFAULT 0,
        video_duration TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    conn.commit()
    conn.close()
    print("Database initialized successfully!")



def hash_password(password):
    """SHA-256 hash for password storage."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


# ─── AUTH ROUTES ──────────────────────────────────────────────────

from flask import Blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    email    = (data.get('email')    or '').strip().lower()
    password =  data.get('password') or ''
    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                  (username, email, hash_password(password)))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Account created successfully'}), 201
    except sqlite3.IntegrityError as e:
        if 'username' in str(e):
            return jsonify({'error': 'Username already taken'}), 409
        return jsonify({'error': 'Email already registered'}), 409
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password =  data.get('password') or ''
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT id, username, email FROM users WHERE username=? AND password_hash=?',
                  (username, hash_password(password)))
        user = c.fetchone()
        conn.close()
        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401
        return jsonify({'user': {'id': user[0], 'username': user[1], 'email': user[2]}}), 200
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


app.register_blueprint(auth_bp, url_prefix='/auth')

# ──────────────────────────────────────────────────────────────────


def save_scan(scan_type, filename, prediction_data, thumbnail_val=None):
    """Save a scan result to the database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO scan_history
            (scan_type, filename, predicted_class, is_fresh, freshness_score,
             confidence, quality_grade, freshness_label, recommendation, thumbnail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                scan_type,
                filename or 'unknown',
                prediction_data.get('prediction', ''),
                1 if prediction_data.get('is_fresh') else 0,
                prediction_data.get('freshness_score', 0),
                prediction_data.get('confidence', 0),
                prediction_data.get('quality_grade', 'C'),
                prediction_data.get('freshness_label', ''),
                prediction_data.get('recommendation', ''),
                thumbnail_val
            ))
        scan_id = c.lastrowid
        conn.commit()
        conn.close()
        return scan_id
    except Exception as e:
        print(f"DB save error: {e}")
        return None


def save_batch_session(total, fresh, rotten, avg_fresh):
    """Save a batch session summary."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO batch_sessions
            (total_images, fresh_count, rotten_count, avg_freshness)
            VALUES (?, ?, ?, ?)''',
            (total, fresh, rotten, avg_fresh))
        session_id = c.lastrowid
        conn.commit()
        conn.close()
        return session_id
    except Exception as e:
        print(f"DB batch save error: {e}")
        return None


def save_video_session(filename, quality, total_frames, fresh, rotten, freshness_pct, duration):
    """Save a video session summary."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO video_sessions
            (filename, video_quality, total_frames_analyzed, fresh_count,
             rotten_count, overall_freshness_percent, video_duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (filename, quality, total_frames, fresh, rotten, freshness_pct, duration))
        session_id = c.lastrowid
        conn.commit()
        conn.close()
        return session_id
    except Exception as e:
        print(f"DB video save error: {e}")
        return None


# ─── MODEL ────────────────────────────────────────────────────────

def load_model():
    """Load the trained model and class indices."""
    global model, class_names
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print("Model loaded successfully!")
        ci_path = Path(CLASS_INDICES_PATH)
        if ci_path.exists():
            with open(ci_path, 'r') as f:
                class_indices = json.load(f)
                class_names = {int(v): k for k, v in class_indices.items()}
        else:
            class_names = {0: 'fresh', 1: 'rotten'}
        print(f"Class names: {class_names}")
    except Exception as e:
        print(f"Error loading model: {e}")


def preprocess_image(image_bytes):
    """Preprocess image bytes for model prediction."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image = image.resize(IMG_SIZE, Image.LANCZOS)
        img_array = np.array(image, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None


def preprocess_cv2_frame(frame):
    """Preprocess OpenCV BGR frame for model prediction."""
    try:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, IMG_SIZE)
        img_array = resized.astype(np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"Error preprocessing cv2 frame: {e}")
        return None


def interpret_prediction(predictions, names):
    """Interpret raw model predictions into freshness result."""
    predicted_idx = int(np.argmax(predictions))
    confidence = float(predictions[predicted_idx])
    predicted_class = names.get(predicted_idx, 'unknown')
    pred_lower = predicted_class.lower()
    has_fresh = any(kw in pred_lower for kw in FRESH_KEYWORDS)
    has_rotten = any(kw in pred_lower for kw in ROTTEN_KEYWORDS)

    if has_fresh and not has_rotten:
        is_fresh = True
    elif has_rotten:
        is_fresh = False
    else:
        is_fresh = (predicted_idx == 0)

    return {
        'predicted_class': predicted_class,
        'predicted_class_idx': predicted_idx,
        'confidence': confidence,
        'is_fresh': is_fresh,
        'uncertain': confidence < 0.60
    }


def get_fresh_class_idx():
    """Find the index of the 'fresh' class."""
    for idx, name in class_names.items():
        if any(kw in name.lower() for kw in FRESH_KEYWORDS):
            return idx
    return 0


def compute_freshness_score(raw_predictions):
    """Compute freshness score as percentage (0-100)."""
    return float(raw_predictions[get_fresh_class_idx()]) * 100


def build_prediction_response(raw_predictions):
    """Build full prediction response dict from raw model output."""
    result = interpret_prediction(raw_predictions, class_names)
    freshness_score = compute_freshness_score(raw_predictions)
    all_preds = {class_names.get(i, f'class_{i}'): float(raw_predictions[i])
                 for i in range(len(raw_predictions))}
    return {
        'prediction': result['predicted_class'],
        'confidence': result['confidence'],
        'is_fresh': result['is_fresh'],
        'uncertain': result['uncertain'],
        'freshness_score': round(freshness_score, 2),
        'all_predictions': all_preds,
        'recommendation': get_recommendation(result['is_fresh'], result['confidence'], result['uncertain']),
        'freshness_label': get_freshness_label(freshness_score),
        'quality_grade': get_quality_grade(freshness_score)
    }


def get_freshness_label(score):
    if score >= 85: return "Excellent"
    if score >= 70: return "Good"
    if score >= 55: return "Fair"
    if score >= 40: return "Poor"
    return "Very Poor"


def get_quality_grade(score):
    if score >= 85: return "A"
    if score >= 70: return "B"
    if score >= 55: return "C"
    if score >= 40: return "D"
    return "F"


def get_recommendation(is_fresh, confidence, uncertain=False):
    if uncertain:
        return "The image quality or angle makes it difficult to determine freshness. Please try again with a clearer image."
    if is_fresh:
        if confidence > 0.90:
            return "Excellent quality! This produce is very fresh and safe to consume."
        if confidence > 0.75:
            return "This produce is fresh and good to consume. Best eaten within a few days."
        return "The produce appears fresh but inspect carefully before consuming."
    if confidence > 0.90:
        return "This produce is definitely spoiled. Do NOT consume - discard immediately."
    if confidence > 0.75:
        return "This produce appears rotten. It is not safe for consumption."
    return "The produce quality is questionable. Inspect thoroughly before use or discard to be safe."


def analyze_video_quality(cap):
    """Analyze a video for overall quality."""
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    sample_rate = max(1, total_frames // 30)

    sharpness_scores = []
    brightness_scores = []
    prev_gray = None
    motion_diffs = []

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % sample_rate == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness_scores.append(lap_var)
            brightness_scores.append(float(np.mean(gray)))
            if prev_gray is not None:
                diff = cv2.absdiff(gray, prev_gray)
                motion_diffs.append(float(np.mean(diff)))
            prev_gray = gray
        frame_idx += 1

    if not sharpness_scores:
        return 'Bad', {'error': 'Could not read video frames'}

    avg_sharpness = float(np.mean(sharpness_scores))
    avg_brightness = float(np.mean(brightness_scores))
    avg_motion = float(np.mean(motion_diffs)) if motion_diffs else 0.0

    sharp_ok = avg_sharpness > 80
    bright_ok = 40 < avg_brightness < 220
    stable_ok = avg_motion < 30

    score = sum([sharp_ok, bright_ok, stable_ok])
    quality = 'Good' if score >= 2 else 'Bad'

    return quality, {
        'avg_sharpness': round(avg_sharpness, 2),
        'avg_brightness': round(avg_brightness, 2),
        'avg_motion': round(avg_motion, 2),
        'total_frames': total_frames,
        'fps': round(fps, 2),
        'sharpness_ok': sharp_ok,
        'brightness_ok': bright_ok,
        'stability_ok': stable_ok,
        'quality_score': f"{score}/3"
    }


# ─── Routes ──────────────────────────────────────────────────────

@app.route('/')
def home():
    return jsonify({
        'message': 'Fruits & Vegetables Freshness Detection API',
        'version': '4.0.0',
        'status': 'running',
        'database': 'SQLite connected',
        'endpoints': ['/health', '/classes', '/predict', '/camera-frame',
                      '/batch-predict', '/video-analyze', '/video-detect',
                      '/video-detect-frames', '/db/history', '/db/stats',
                      '/db/batch-sessions', '/db/video-sessions']
    })


@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'database': 'connected',
        'classes': list(class_names.values()) if class_names else []
    })


@app.route('/classes')
def get_classes():
    return jsonify({'class_names': class_names, 'num_classes': len(class_names)})


@app.route('/predict', methods=['POST'])
def predict():
    """Image upload freshness prediction — saves to DB."""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded. Please train the model first.'}), 500
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        image_file = request.files['image']
        image_bytes = image_file.read()
        processed = preprocess_image(image_bytes)
        if processed is None:
            return jsonify({'error': 'Error processing image'}), 400
        raw = model.predict(processed, verbose=0)[0]
        response = build_prediction_response(raw)

        # Save to store
        ext = os.path.splitext(image_file.filename)[1] or '.jpg'
        store_filename = f"{uuid.uuid4().hex}{ext}"
        with open(os.path.join(STORE_DIR, store_filename), 'wb') as f:
            f.write(image_bytes)

        scan_id = save_scan('image_upload', image_file.filename, response, store_filename)
        response['scan_id'] = scan_id

        return jsonify(response)
    except Exception as e:
        return jsonify({'error': f'Prediction error: {str(e)}'}), 500


@app.route('/camera-frame', methods=['POST'])
def camera_frame():
    """Webcam base64 frame freshness prediction — saves to DB."""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        processed = preprocess_image(image_bytes)
        if processed is None:
            return jsonify({'error': 'Error processing image frame'}), 400
        raw = model.predict(processed, verbose=0)[0]
        response = build_prediction_response(raw)

        # Save to store
        store_filename = f"camera_{uuid.uuid4().hex}.jpg"
        with open(os.path.join(STORE_DIR, store_filename), 'wb') as f:
            f.write(image_bytes)

        scan_id = save_scan('camera', 'camera_frame', response, store_filename)
        response['scan_id'] = scan_id

        return jsonify(response)
    except Exception as e:
        return jsonify({'error': f'Camera prediction error: {str(e)}'}), 500


@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Batch image freshness prediction — saves session to DB."""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        if 'images' not in request.files:
            return jsonify({'error': 'No images provided'}), 400
        results = []
        fresh_total = 0
        rotten_total = 0
        score_sum = 0
        for image_file in request.files.getlist('images'):
            try:
                image_bytes = image_file.read()
                processed = preprocess_image(image_bytes)
                if processed is not None:
                    raw = model.predict(processed, verbose=0)[0]
                    resp = build_prediction_response(raw)
                    resp['filename'] = image_file.filename

                    # Save to store
                    ext = os.path.splitext(image_file.filename)[1] or '.jpg'
                    store_filename = f"batch_{uuid.uuid4().hex}{ext}"
                    with open(os.path.join(STORE_DIR, store_filename), 'wb') as f:
                        f.write(image_bytes)

                    results.append(resp)
                    if resp.get('is_fresh'):
                        fresh_total += 1
                    else:
                        rotten_total += 1
                    score_sum += resp.get('freshness_score', 0)
                    save_scan('batch', image_file.filename, resp, store_filename)
                else:
                    results.append({'filename': image_file.filename, 'error': 'Failed to process image'})
            except Exception as e:
                results.append({'filename': image_file.filename, 'error': str(e)})

        total = fresh_total + rotten_total
        avg_fresh = round(score_sum / total, 2) if total > 0 else 0
        session_id = save_batch_session(total, fresh_total, rotten_total, avg_fresh)

        return jsonify({
            'results': results,
            'total': len(results),
            'session_id': session_id,
            'summary': {
                'fresh_count': fresh_total,
                'rotten_count': rotten_total,
                'avg_freshness': avg_fresh
            }
        })
    except Exception as e:
        return jsonify({'error': f'Batch prediction error: {str(e)}'}), 500


@app.route('/video-analyze', methods=['POST'])
def video_analyze():
    """Analyze uploaded video for quality."""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video_file = request.files['video']
        suffix = Path(video_file.filename).suffix or '.mp4'

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            video_file.save(tmp_path)

        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                return jsonify({'error': 'Could not open video file'}), 400
            quality, metrics = analyze_video_quality(cap)
            cap.release()
        finally:
            os.unlink(tmp_path)

        return jsonify({
            'quality': quality,
            'quality_label': '✅ Good Quality' if quality == 'Good' else '❌ Poor Quality',
            'metrics': metrics,
            'message': (
                'Video is clear, well-lit, and stable — great for produce analysis.'
                if quality == 'Good' else
                'Video has issues (blur, poor lighting, or instability). Try recording in better conditions.'
            )
        })

    except Exception as e:
        print(f"Video analyze error: {e}")
        return jsonify({'error': f'Video analysis error: {str(e)}'}), 500


@app.route('/video-detect', methods=['POST'])
def video_detect():
    """Detect and count fresh/rotten produce in uploaded video — saves to DB."""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded. Please train the model first.'}), 500
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video_file = request.files['video']
        suffix = Path(video_file.filename).suffix or '.mp4'

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            video_file.save(tmp_path)

        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                return jsonify({'error': 'Could not open video file'}), 400
            quality, metrics = analyze_video_quality(cap)
            cap.release()

            cap2 = cv2.VideoCapture(tmp_path)
            total_frames = int(cap2.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap2.get(cv2.CAP_PROP_FPS) or 25
            max_frames = 20
            sample_rate = max(1, total_frames // max_frames)

            fresh_count = 0
            rotten_count = 0
            frames_analyzed = 0
            fresh_scores = []
            detected = []
            frame_idx = 0

            while True:
                ret, frame = cap2.read()
                if not ret:
                    break
                if frame_idx % sample_rate == 0 and frames_analyzed < max_frames:
                    processed = preprocess_cv2_frame(frame)
                    if processed is not None:
                        raw = model.predict(processed, verbose=0)[0]
                        result = interpret_prediction(raw, class_names)
                        fs = compute_freshness_score(raw)
                        fresh_scores.append(fs)
                        if result['is_fresh']:
                            fresh_count += 1
                        else:
                            rotten_count += 1
                        frames_analyzed += 1
                frame_idx += 1

            cap2.release()
        finally:
            os.unlink(tmp_path)

        avg_fresh_score = float(np.mean(fresh_scores)) if fresh_scores else 50.0
        total_detections = fresh_count + rotten_count
        overall_fresh_pct = round((fresh_count / total_detections * 100) if total_detections > 0 else 0, 1)

        if fresh_count > 0:
            detected.append({
                'name': 'Fresh Produce', 'status': 'Fresh', 'count': fresh_count,
                'freshness_score': round(avg_fresh_score, 1), 'icon': '🟢',
                'grade': get_quality_grade(avg_fresh_score)
            })
        if rotten_count > 0:
            detected.append({
                'name': 'Rotten Produce', 'status': 'Rotten', 'count': rotten_count,
                'freshness_score': round(avg_fresh_score, 1), 'icon': '🔴',
                'grade': get_quality_grade(avg_fresh_score)
            })

        # Save to DB
        duration = f"{round(total_frames / fps, 1)}s"
        save_video_session(video_file.filename, quality, frames_analyzed,
                          fresh_count, rotten_count, overall_fresh_pct, duration)

        return jsonify({
            'quality': quality,
            'quality_metrics': metrics,
            'detected_items': detected,
            'summary': {
                'total_frames_analyzed': frames_analyzed,
                'fresh_frames': fresh_count,
                'rotten_frames': rotten_count,
                'overall_freshness_percent': overall_fresh_pct,
                'total_detections': total_detections
            }
        })

    except Exception as e:
        print(f"Video detect error: {e}")
        return jsonify({'error': f'Video detection error: {str(e)}'}), 500


@app.route('/video-detect-frames', methods=['POST'])
def video_detect_frames():
    """Frame-by-frame detection with thumbnails — saves to DB."""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded. Please train the model first.'}), 500
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video_file = request.files['video']
        suffix = Path(video_file.filename).suffix or '.mp4'

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            video_file.save(tmp_path)

        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                return jsonify({'error': 'Could not open video file'}), 400

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 25
            max_frames = 30
            sample_rate = max(1, total_frames // max_frames)

            frame_results = []
            fresh_count = 0
            rotten_count = 0
            frames_analyzed = 0
            frame_idx = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx % sample_rate == 0 and frames_analyzed < max_frames:
                    processed = preprocess_cv2_frame(frame)
                    if processed is not None:
                        raw = model.predict(processed, verbose=0)[0]
                        result = interpret_prediction(raw, class_names)
                        fs = compute_freshness_score(raw)

                        thumb = cv2.resize(frame, (160, 120))
                        _, buffer = cv2.imencode('.jpg', thumb, [cv2.IMWRITE_JPEG_QUALITY, 70])
                        thumb_b64 = base64.b64encode(buffer).decode('utf-8')

                        is_fresh = result['is_fresh']
                        if is_fresh:
                            fresh_count += 1
                        else:
                            rotten_count += 1
                        frames_analyzed += 1

                        timestamp_sec = round(frame_idx / fps, 1)

                        frame_results.append({
                            'frame_number': frames_analyzed,
                            'frame_idx': frame_idx,
                            'timestamp': f"{timestamp_sec}s",
                            'thumbnail': f"data:image/jpeg;base64,{thumb_b64}",
                            'verdict': 'GOOD' if is_fresh else 'BAD',
                            'is_fresh': is_fresh,
                            'freshness_score': round(fs, 1),
                            'confidence': round(result['confidence'] * 100, 1),
                            'grade': get_quality_grade(fs),
                            'label': get_freshness_label(fs),
                            'predicted_class': result['predicted_class'],
                        })

                        # Save frame thumbnail to store
                        store_fname = f"frame_{uuid.uuid4().hex}.jpg"
                        cv2.imwrite(os.path.join(STORE_DIR, store_fname), thumb)

                        save_scan('video_frame', video_file.filename, {
                            'prediction': result['predicted_class'],
                            'is_fresh': is_fresh,
                            'freshness_score': round(fs, 1),
                            'confidence': result['confidence'],
                            'quality_grade': get_quality_grade(fs),
                            'freshness_label': get_freshness_label(fs),
                            'recommendation': ''
                        }, store_fname)

                frame_idx += 1

            cap.release()
        finally:
            os.unlink(tmp_path)

        total_detected = fresh_count + rotten_count
        overall_fresh_pct = round((fresh_count / total_detected * 100) if total_detected > 0 else 0, 1)
        duration = f"{round(total_frames / fps, 1)}s"

        # Save video session
        save_video_session(video_file.filename, 'Analyzed', frames_analyzed,
                          fresh_count, rotten_count, overall_fresh_pct, duration)

        return jsonify({
            'frame_results': frame_results,
            'summary': {
                'total_frames_in_video': total_frames,
                'total_frames_analyzed': frames_analyzed,
                'fresh_count': fresh_count,
                'rotten_count': rotten_count,
                'total_detected': total_detected,
                'overall_freshness_percent': overall_fresh_pct,
                'fps': round(fps, 1),
                'video_duration': duration,
            }
        })

    except Exception as e:
        print(f"Video detect frames error: {e}")
        return jsonify({'error': f'Video frame detection error: {str(e)}'}), 500


# ─── DATABASE API ROUTES ─────────────────────────────────────────

@app.route('/db/history')
def db_history():
    """Get scan history with optional filters."""
    try:
        scan_type = request.args.get('type', None)
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        if scan_type:
            c.execute('''SELECT id, scan_type, filename, predicted_class, is_fresh,
                        freshness_score, confidence, quality_grade, freshness_label,
                        recommendation, thumbnail, created_at
                        FROM scan_history WHERE scan_type = ?
                        ORDER BY created_at DESC LIMIT ? OFFSET ?''',
                     (scan_type, limit, offset))
        else:
            c.execute('''SELECT id, scan_type, filename, predicted_class, is_fresh,
                        freshness_score, confidence, quality_grade, freshness_label,
                        recommendation, thumbnail, created_at
                        FROM scan_history
                        ORDER BY created_at DESC LIMIT ? OFFSET ?''',
                     (limit, offset))

        rows = [dict(r) for r in c.fetchall()]

        # Get total count
        if scan_type:
            c.execute('SELECT COUNT(*) FROM scan_history WHERE scan_type = ?', (scan_type,))
        else:
            c.execute('SELECT COUNT(*) FROM scan_history')
        total = c.fetchone()[0]

        conn.close()
        return jsonify({'history': rows, 'total': total, 'limit': limit, 'offset': offset})
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500


@app.route('/db/stats')
def db_stats():
    """Get overall statistics from the database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        # Total scans
        c.execute('SELECT COUNT(*) FROM scan_history')
        total_scans = c.fetchone()[0]

        # Fresh vs rotten
        c.execute('SELECT COUNT(*) FROM scan_history WHERE is_fresh = 1')
        total_fresh = c.fetchone()[0]
        c.execute('SELECT COUNT(*) FROM scan_history WHERE is_fresh = 0')
        total_rotten = c.fetchone()[0]

        # Average freshness
        c.execute('SELECT AVG(freshness_score) FROM scan_history')
        avg_freshness = c.fetchone()[0] or 0

        # By scan type
        c.execute('''SELECT scan_type, COUNT(*) as count,
                    SUM(CASE WHEN is_fresh = 1 THEN 1 ELSE 0 END) as fresh,
                    SUM(CASE WHEN is_fresh = 0 THEN 1 ELSE 0 END) as rotten,
                    AVG(freshness_score) as avg_score
                    FROM scan_history GROUP BY scan_type''')
        by_type = [{'type': r[0], 'count': r[1], 'fresh': r[2],
                    'rotten': r[3], 'avg_score': round(r[4] or 0, 1)} for r in c.fetchall()]

        # Grade distribution
        c.execute('''SELECT quality_grade, COUNT(*) as count
                    FROM scan_history GROUP BY quality_grade ORDER BY quality_grade''')
        grades = {r[0]: r[1] for r in c.fetchall()}

        # Recent scans (last 10)
        c.execute('''SELECT id, scan_type, filename, is_fresh, freshness_score,
                    quality_grade, created_at FROM scan_history
                    ORDER BY created_at DESC LIMIT 10''')
        recent = [dict(zip(['id', 'scan_type', 'filename', 'is_fresh',
                           'freshness_score', 'quality_grade', 'created_at'], r))
                 for r in c.fetchall()]

        # Batch sessions
        c.execute('SELECT COUNT(*) FROM batch_sessions')
        total_batches = c.fetchone()[0]

        # Video sessions
        c.execute('SELECT COUNT(*) FROM video_sessions')
        total_videos = c.fetchone()[0]

        # Today's scans
        c.execute("SELECT COUNT(*) FROM scan_history WHERE date(created_at) = date('now')")
        today_scans = c.fetchone()[0]

        conn.close()

        return jsonify({
            'total_scans': total_scans,
            'total_fresh': total_fresh,
            'total_rotten': total_rotten,
            'freshness_rate': round((total_fresh / total_scans * 100) if total_scans > 0 else 0, 1),
            'avg_freshness_score': round(avg_freshness, 1),
            'by_scan_type': by_type,
            'grade_distribution': grades,
            'recent_scans': recent,
            'total_batch_sessions': total_batches,
            'total_video_sessions': total_videos,
            'today_scans': today_scans
        })
    except Exception as e:
        return jsonify({'error': f'Stats error: {str(e)}'}), 500


@app.route('/db/batch-sessions')
def db_batch_sessions():
    """Get batch session history."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM batch_sessions ORDER BY created_at DESC LIMIT 50')
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        return jsonify({'sessions': rows})
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500


@app.route('/db/video-sessions')
def db_video_sessions():
    """Get video session history."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM video_sessions ORDER BY created_at DESC LIMIT 50')
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        return jsonify({'sessions': rows})
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500


@app.route('/store/<path:filename>')
def serve_store(filename):
    """Serve stored images from the store directory."""
    return send_from_directory(STORE_DIR, filename)


@app.route('/db/history/<int:scan_id>', methods=['DELETE'])
def db_delete_scan(scan_id):
    """Delete a single scan record and its stored image."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT thumbnail FROM scan_history WHERE id = ?', (scan_id,))
        row = c.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Record not found'}), 404
        # Delete image file from store
        if row['thumbnail']:
            img_path = os.path.join(STORE_DIR, row['thumbnail'])
            if os.path.exists(img_path):
                os.remove(img_path)
        c.execute('DELETE FROM scan_history WHERE id = ?', (scan_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': f'Scan #{scan_id} deleted successfully'})
    except Exception as e:
        return jsonify({'error': f'Delete error: {str(e)}'}), 500


@app.route('/db/clear', methods=['POST'])
def db_clear():
    """Clear all database records and stored images."""
    try:
        # Clear store folder
        for f in os.listdir(STORE_DIR):
            fpath = os.path.join(STORE_DIR, f)
            if os.path.isfile(fpath):
                os.remove(fpath)
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM scan_history')
        c.execute('DELETE FROM batch_sessions')
        c.execute('DELETE FROM video_sessions')
        conn.commit()
        conn.close()
        return jsonify({'message': 'Database and stored images cleared successfully'})
    except Exception as e:
        return jsonify({'error': f'Clear error: {str(e)}'}), 500


# ─── CONTACT FORM ENDPOINT ───────────────────────────────────────

@app.route('/contact', methods=['POST'])
def contact():
    """Receive contact form submissions and send email notification."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip() or 'No Subject'
        message = data.get('message', '').strip()

        if not name or not email or not message:
            return jsonify({'error': 'Name, email, and message are required'}), 400

        # Store in database
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('''CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )''')
            c.execute('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
                      (name, email, subject, message))
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"DB contact save error: {db_err}")

        # Send email notification
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            RECIPIENT_EMAIL = 'agrifreshpro@gmail.com'

            msg = MIMEMultipart()
            msg['From'] = email
            msg['To'] = RECIPIENT_EMAIL
            msg['Subject'] = f'[AgriVision Contact] {subject}'

            body = f"""
New Contact Form Submission from AgriVision Pro
{'='*50}

Name: {name}
Email: {email}
Subject: {subject}

Message:
{message}

{'='*50}
Sent from AgriVision Pro Contact Form
            """.strip()

            msg.attach(MIMEText(body, 'plain'))

            # Using Gmail SMTP
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            # Note: For Gmail, you need an App Password.
            # Set environment variables SMTP_EMAIL and SMTP_PASSWORD
            smtp_email = os.environ.get('SMTP_EMAIL', '')
            smtp_password = os.environ.get('SMTP_PASSWORD', '')

            if smtp_email and smtp_password:
                server.login(smtp_email, smtp_password)
                server.sendmail(smtp_email, RECIPIENT_EMAIL, msg.as_string())
                server.quit()
                print(f"Email sent to {RECIPIENT_EMAIL}")
            else:
                print(f"SMTP credentials not configured. Message stored in DB only.")
                print(f"To enable email: set SMTP_EMAIL and SMTP_PASSWORD environment variables")
        except Exception as email_err:
            print(f"Email send error (message still saved to DB): {email_err}")

        return jsonify({
            'success': True,
            'message': 'Your message has been received! We will get back to you within 24 hours.'
        })

    except Exception as e:
        print(f"Contact form error: {e}")
        return jsonify({'error': f'Failed to process contact form: {str(e)}'}), 500


if __name__ == '__main__':
    print("=" * 70)
    print("FRUITS & VEGETABLES FRESHNESS DETECTION - BACKEND SERVER v4.0")
    print("=" * 70)
    init_db()
    load_model()
    print(f"\nDatabase: {DB_PATH}")
    print("Starting server on http://localhost:5000")
    print("=" * 70)
    app.run(host='0.0.0.0', port=5000, debug=True)
