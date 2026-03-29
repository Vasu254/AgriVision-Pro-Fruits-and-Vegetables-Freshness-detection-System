import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import './Detect.css';

const FRESHNESS_COLORS = {
    fresh: { bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.4)', text: '#00e676', glow: '0 0 30px rgba(0,230,118,0.2)' },
    rotten: { bg: 'rgba(255,23,68,0.12)', border: 'rgba(255,23,68,0.4)', text: '#ff1744', glow: '0 0 30px rgba(255,23,68,0.2)' },
    uncertain: { bg: 'rgba(255,109,0,0.12)', border: 'rgba(255,109,0,0.4)', text: '#ff6d00', glow: '0 0 30px rgba(255,109,0,0.2)' },
};

const GRADE_COLORS = { A: '#00e676', B: '#69f0ae', C: '#ffeb3b', D: '#ff9100', F: '#ff1744' };

function FreshnessResult({ prediction, imagePreview, onReset }) {
    const status = prediction.uncertain ? 'uncertain' : (prediction.is_fresh ? 'fresh' : 'rotten');
    const colors = FRESHNESS_COLORS[status];
    const score = prediction.freshness_score ?? 50;
    const grade = prediction.quality_grade ?? 'C';
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (score / 100) * circumference;

    const getStatusEmoji = () => {
        if (prediction.uncertain) return '⚠️';
        return prediction.is_fresh ? '✅' : '🚫';
    };

    const getStatusLabel = () => {
        if (prediction.uncertain) return 'Uncertain';
        return prediction.is_fresh ? 'Fresh' : 'Rotten';
    };

    return (
        <div className="result-container">
            <div className="result-image-panel">
                <img src={imagePreview} alt="Analyzed" className="result-image" />
                <div className="result-image-overlay">
                    <span className="result-status-badge" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, boxShadow: colors.glow }}>
                        {getStatusEmoji()} {getStatusLabel()}
                    </span>
                </div>
            </div>

            <div className="result-details">
                {/* Freshness Score Ring */}
                <div className="score-section">
                    <div className="score-ring-wrap">
                        <svg className="score-ring" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle
                                cx="60" cy="60" r="54" fill="none"
                                stroke={colors.text}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                            />
                        </svg>
                        <div className="score-center" style={{ color: colors.text }}>
                            <div className="score-value">{Math.round(score)}%</div>
                            <div className="score-sub">Fresh</div>
                        </div>
                    </div>

                    <div className="score-info">
                        <div className="quality-grade" style={{ color: GRADE_COLORS[grade] ?? '#fff', borderColor: GRADE_COLORS[grade] ?? '#fff' }}>
                            Grade <strong>{grade}</strong>
                        </div>
                        <div className="freshness-label">{prediction.freshness_label}</div>
                        <div className="confidence-chip">
                            Confidence: <strong>{(prediction.confidence * 100).toFixed(1)}%</strong>
                        </div>
                    </div>
                </div>

                {/* Freshness Bar */}
                <div className="freshness-bar-section">
                    <div className="freshness-bar-label">
                        <span>Rotten</span><span>Fresh</span>
                    </div>
                    <div className="freshness-bar-track">
                        <div
                            className="freshness-bar-fill"
                            style={{ width: `${score}%`, background: `linear-gradient(90deg, #ff1744, #ffeb3b, #00e676)` }}
                        />
                        <div className="freshness-bar-thumb" style={{ left: `${score}%` }} />
                    </div>
                </div>

                {/* Recommendation */}
                <div className="recommendation-card" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                    <h4 style={{ color: colors.text }}>Recommendation</h4>
                    <p>{prediction.recommendation}</p>
                </div>

                {/* All Predictions */}
                {prediction.all_predictions && (
                    <div className="all-preds">
                        <h4>Class Probabilities</h4>
                        {Object.entries(prediction.all_predictions).map(([cls, prob]) => (
                            <div key={cls} className="pred-row">
                                <span className="pred-label">{cls}</span>
                                <div className="pred-bar-track">
                                    <div className="pred-bar-fill" style={{ width: `${(prob * 100).toFixed(1)}%` }} />
                                </div>
                                <span className="pred-pct">{(prob * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn-primary reset-btn" onClick={onReset}>
                    🔄 Analyze Another
                </button>
            </div>
        </div>
    );
}

export default function Detect({ apiUrl }) {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageUpload = useCallback(async (file) => {
        setLoading(true);
        setError(null);
        setPrediction(null);

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${apiUrl}/predict`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setPrediction(data);
        } catch (err) {
            setError(err.message || 'Failed to connect. Make sure the backend server is running on port 5000.');
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    const onDrop = useCallback((files) => {
        if (files[0]) handleImageUpload(files[0]);
    }, [handleImageUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp'] }, multiple: false,
    });

    const handleReset = () => { setPrediction(null); setImagePreview(null); setError(null); };

    return (
        <div className="detect-page page-wrapper">
            <div className="container">
                <div className="page-header">
                    <div className="section-tag">FRESHNESS DETECTOR</div>
                    <h1 className="section-title">Analyze Your Produce</h1>
                    <p className="section-desc">Upload a clear photo of any fruit or vegetable to get an instant AI-powered freshness assessment.</p>
                </div>

                {!imagePreview && !loading ? (
                    <div className="upload-area">
                        <div {...getRootProps()} className={`dropzone-area ${isDragActive ? 'drag-active' : ''}`}>
                            <input {...getInputProps()} />
                            <div className="drop-inner">
                                <div className="drop-icon">{isDragActive ? '📂' : '📤'}</div>
                                <h3 className="drop-title">{isDragActive ? 'Drop it here!' : 'Drop your image here'}</h3>
                                <p className="drop-hint">or click to browse files</p>
                                <p className="drop-formats">JPG, PNG, WEBP, BMP supported</p>
                                <button className="btn-primary" type="button">Choose Image</button>
                            </div>
                        </div>
                        <div className="produce-examples">
                            <p className="examples-label">Works great with:</p>
                            <div className="examples-list">
                                {['🍎 Apple', '🍌 Banana', '🥕 Carrot', '🍅 Tomato', '🥦 Broccoli', '🍊 Orange', '🥑 Avocado', '🫑 Pepper'].map(item => (
                                    <span key={item} className="example-chip">{item}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="loading-overlay">
                        <div className="ai-loading">
                            <div className="ai-spinner" />
                            <h3>Analyzing Image...</h3>
                            <p>AI is processing your produce photo</p>
                            <div className="loading-dots"><span /><span /><span /></div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <div className="error-card">
                            <span className="error-icon">⚠️</span>
                            <div>
                                <h3>Analysis Failed</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                        <button className="btn-outline" onClick={handleReset}>Try Again</button>
                    </div>
                ) : (
                    <FreshnessResult prediction={prediction} imagePreview={imagePreview} onReset={handleReset} />
                )}
            </div>
        </div>
    );
}
