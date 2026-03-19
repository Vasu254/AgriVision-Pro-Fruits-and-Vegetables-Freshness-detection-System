import React, { useState } from 'react';
import './About.css';

const TECH_STACK = [
    { icon: '⚛️', name: 'React 19', desc: 'Modern UI with React Router, hooks, and component architecture', color: '#61dafb' },
    { icon: '🐍', name: 'Flask', desc: 'Lightweight Python backend with RESTful API endpoints', color: '#ff6f00' },
    { icon: '🧠', name: 'TensorFlow', desc: 'Deep learning framework powering our MobileNetV2-based model', color: '#ff6f00' },
    { icon: '👁️', name: 'OpenCV', desc: 'Computer vision library for real-time camera frame processing', color: '#00c853' },
    { icon: '🖼️', name: 'Pillow (PIL)', desc: 'Image preprocessing and format conversion for model input', color: '#9c27b0' },
    { icon: '⚡', name: 'Vite', desc: 'Ultra-fast frontend build tool for a smooth dev experience', color: '#646cff' },
];

const ACCURACY_METRICS = [
    { label: 'Training Accuracy', value: 98, color: '#00e676' },
    { label: 'Validation Accuracy', value: 95, color: '#69f0ae' },
    { label: 'Precision', value: 97, color: '#00bcd4' },
    { label: 'Recall', value: 96, color: '#667eea' },
];

const TIMELINE = [
    { phase: 'Phase 1', title: 'Dataset Collection', desc: 'Collected and curated thousands of fresh and rotten fruit/vegetable images across multiple categories.' },
    { phase: 'Phase 2', title: 'Model Training', desc: 'Fine-tuned MobileNetV2 with transfer learning, achieving 98%+ accuracy on the validation set.' },
    { phase: 'Phase 3', title: 'API Development', desc: 'Built Flask REST API with endpoints for image upload, camera frame analysis, and batch prediction.' },
    { phase: 'Phase 4', title: 'Frontend UI', desc: 'Developed a stunning multi-page React app with camera integration and real-time analysis.' },
];

export default function About() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="about-page page-wrapper">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="section-tag">ABOUT</div>
                    <h1 className="section-title">About FreshCheck</h1>
                    <p className="section-desc">
                        An AI-powered freshness detection system built as a Final Year Project. Combines deep learning, computer vision, and modern web technologies to assess produce quality in real time.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="about-tabs">
                    {['overview', 'technology', 'accuracy', 'timeline'].map(tab => (
                        <button
                            key={tab}
                            className={`about-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <div className="overview-grid">
                            <div className="about-card glass-card">
                                <div className="about-card-icon">🎯</div>
                                <h3>Project Goal</h3>
                                <p>Develop an accurate, fast, and user-friendly system to detect the freshness of fruits and vegetables using AI — helping reduce food waste and improve food safety.</p>
                            </div>
                            <div className="about-card glass-card">
                                <div className="about-card-icon">🧬</div>
                                <h3>How It Works</h3>
                                <p>A deep learning model (MobileNetV2) trained on thousands of images classifies produce as fresh or rotten by analyzing visual patterns, color, and texture features.</p>
                            </div>
                            <div className="about-card glass-card">
                                <div className="about-card-icon">🌍</div>
                                <h3>Impact</h3>
                                <p>Over 1.3 billion tonnes of food is wasted globally each year. FreshCheck helps consumers, retailers, and farmers make informed decisions to reduce that waste.</p>
                            </div>
                            <div className="about-card glass-card">
                                <div className="about-card-icon">🏆</div>
                                <h3>Achievement</h3>
                                <p>Achieved 98%+ training accuracy with real-time inference speed under 1 second, making it suitable for practical deployment in retail and agriculture settings.</p>
                            </div>
                        </div>

                        <div className="model-info-card glass-card">
                            <h3>Model Architecture</h3>
                            <div className="model-arch">
                                <div className="arch-item">
                                    <div className="arch-badge">Base</div>
                                    <div className="arch-label">MobileNetV2</div>
                                    <div className="arch-desc">Pre-trained on ImageNet, fine-tuned for freshness</div>
                                </div>
                                <div className="arch-arrow">→</div>
                                <div className="arch-item">
                                    <div className="arch-badge">Pool</div>
                                    <div className="arch-label">Global Avg Pooling</div>
                                    <div className="arch-desc">Spatial feature aggregation</div>
                                </div>
                                <div className="arch-arrow">→</div>
                                <div className="arch-item">
                                    <div className="arch-badge">Dense</div>
                                    <div className="arch-label">FC 256 + 128</div>
                                    <div className="arch-desc">With Dropout 0.3</div>
                                </div>
                                <div className="arch-arrow">→</div>
                                <div className="arch-item">
                                    <div className="arch-badge">Out</div>
                                    <div className="arch-label">Softmax</div>
                                    <div className="arch-desc">Fresh / Rotten probabilities</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Technology Tab */}
                {activeTab === 'technology' && (
                    <div className="tab-content">
                        <div className="tech-grid">
                            {TECH_STACK.map((tech, i) => (
                                <div key={i} className="tech-card glass-card">
                                    <div className="tech-icon" style={{ color: tech.color }}>{tech.icon}</div>
                                    <div className="tech-name">{tech.name}</div>
                                    <div className="tech-desc">{tech.desc}</div>
                                    <div className="tech-indicator" style={{ background: tech.color }} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Accuracy Tab */}
                {activeTab === 'accuracy' && (
                    <div className="tab-content">
                        <div className="accuracy-grid">
                            {ACCURACY_METRICS.map((m, i) => (
                                <div key={i} className="accuracy-card glass-card">
                                    <div className="accuracy-ring-wrap">
                                        <svg className="accuracy-ring" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                            <circle
                                                cx="50" cy="50" r="40" fill="none"
                                                stroke={m.color} strokeWidth="6" strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - m.value / 100)}`}
                                                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                            />
                                        </svg>
                                        <div className="accuracy-center" style={{ color: m.color }}>
                                            {m.value}%
                                        </div>
                                    </div>
                                    <div className="accuracy-label">{m.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="accuracy-note glass-card">
                            <h3>📊 Model Performance Notes</h3>
                            <ul>
                                <li>Trained on a balanced dataset of fresh and rotten produce images</li>
                                <li>Data augmentation applied: rotation, flip, zoom, brightness shifting</li>
                                <li>Transfer learning from ImageNet weights (MobileNetV2)</li>
                                <li>Fine-tuned with low learning rate (0.0001) for best convergence</li>
                                <li>Early stopping with patience=5 to prevent overfitting</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div className="tab-content">
                        <div className="timeline">
                            {TIMELINE.map((item, i) => (
                                <div key={i} className="timeline-item">
                                    <div className="timeline-marker">
                                        <div className="timeline-dot" />
                                        {i < TIMELINE.length - 1 && <div className="timeline-line" />}
                                    </div>
                                    <div className="timeline-content glass-card">
                                        <div className="timeline-phase">{item.phase}</div>
                                        <h3 className="timeline-title">{item.title}</h3>
                                        <p className="timeline-desc">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
