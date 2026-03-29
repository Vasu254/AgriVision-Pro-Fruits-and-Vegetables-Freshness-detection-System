import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const STATS = [
    { value: '98%', label: 'Detection Accuracy', icon: '🎯' },
    { value: '50+', label: 'Fruit & Veg Types', icon: '🥝' },
    { value: '<1s', label: 'Analysis Speed', icon: '⚡' },
    { value: '360°', label: 'Camera Coverage', icon: '📷' },
];

const FEATURES = [
    {
        icon: '📤',
        title: 'Image Upload',
        desc: 'Drag & drop or click to upload any fruit or vegetable image. Get instant freshness analysis powered by AI.',
        color: '#667eea',
    },
    {
        icon: '📷',
        title: '360° Camera',
        desc: 'Use your webcam with full 360° rotation control to capture and analyze produce from every angle.',
        color: '#00b09b',
    },
    {
        icon: '🧠',
        title: 'AI Analysis',
        desc: 'Advanced deep learning model detects freshness with high accuracy, giving you confidence scores and quality grades.',
        color: '#f093fb',
    },
    {
        icon: '📊',
        title: 'Detailed Report',
        desc: 'Get comprehensive freshness scores, quality grades (A-F), and actionable recommendations instantly.',
        color: '#ff6d00',
    },
];

const STEPS = [
    { step: '01', title: 'Upload or Capture', desc: 'Upload an image or use your camera to capture the fruit or vegetable.' },
    { step: '02', title: 'AI Processing', desc: 'Our AI model analyzes texture, color, and patterns to assess freshness.' },
    { step: '03', title: 'Get Results', desc: 'Receive detailed freshness score, quality grade, and recommendations.' },
];

const PRODUCE_ITEMS = [
    { emoji: '🍎', name: 'Apple' },
    { emoji: '🍌', name: 'Banana' },
    { emoji: '🍊', name: 'Orange' },
    { emoji: '🥕', name: 'Carrot' },
    { emoji: '🍅', name: 'Tomato' },
    { emoji: '🥦', name: 'Broccoli' },
    { emoji: '🍇', name: 'Grapes' },
    { emoji: '🥑', name: 'Avocado' },
    { emoji: '🫑', name: 'Pepper' },
    { emoji: '🍋', name: 'Lemon' },
];

export default function Home({ apiUrl }) {
    const [modelStatus, setModelStatus] = useState(null);

    useEffect(() => {
        fetch(`${apiUrl}/health`)
            .then(r => r.json())
            .then(d => setModelStatus(d))
            .catch(() => setModelStatus({ status: 'offline' }));
    }, [apiUrl]);

    return (
        <div className="home-page page-wrapper">
            {/* HERO */}
            <section className="hero-section">
                <div className="hero-bg-orb orb-1" />
                <div className="hero-bg-orb orb-2" />
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="pulse-dot" />
                            {modelStatus?.model_loaded
                                ? '🟢 AI Model Online & Ready'
                                : '🔴 Backend Offline — Start Flask Server'}
                        </div>
                        <h1 className="hero-title">
                            Detect Freshness<br />
                            <span className="gradient-text">with AI Precision</span>
                        </h1>
                        <p className="hero-desc">
                            Upload any fruit or vegetable image — our deep learning model
                            analyzes it in under a second to give you a detailed freshness
                            score and quality grade.
                        </p>
                        <div className="hero-actions">
                            <Link to="/detect" className="btn-primary">
                                🔍 Analyze Image
                            </Link>
                            <Link to="/camera" className="btn-outline">
                                📷 Open Camera
                            </Link>
                        </div>

                        {/* Produce Ticker */}
                        <div className="produce-ticker">
                            <div className="ticker-track">
                                {[...PRODUCE_ITEMS, ...PRODUCE_ITEMS].map((item, i) => (
                                    <div key={i} className="ticker-item">
                                        <span>{item.emoji}</span>
                                        <span className="ticker-name">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {STATS.map((stat, i) => (
                            <div key={i} className="stat-card glass-card">
                                <div className="stat-icon">{stat.icon}</div>
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-tag">CAPABILITIES</div>
                        <h2 className="section-title">Everything You Need</h2>
                        <p className="section-desc">
                            Powerful tools to assess the quality of your produce with real-time AI.
                        </p>
                    </div>
                    <div className="features-grid">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="feature-card glass-card">
                                <div className="feature-icon-wrap" style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                                    <span style={{ fontSize: '1.8rem' }}>{f.icon}</span>
                                </div>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-tag">HOW IT WORKS</div>
                        <h2 className="section-title">Three Simple Steps</h2>
                        <p className="section-desc">Get your freshness analysis in seconds.</p>
                    </div>
                    <div className="steps-container">
                        {STEPS.map((s, i) => (
                            <div key={i} className="step-item">
                                <div className="step-number">{s.step}</div>
                                <div className="step-line" style={{ display: i < STEPS.length - 1 ? 'block' : 'none' }} />
                                <div className="step-content glass-card">
                                    <h3>{s.title}</h3>
                                    <p>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card glass-card">
                        <div className="cta-glow" />
                        <h2 className="cta-title">Ready to Check Your Produce?</h2>
                        <p className="cta-desc">Upload an image or open your camera to get started instantly.</p>
                        <div className="cta-actions">
                            <Link to="/detect" className="btn-primary">Get Started Free →</Link>
                            <Link to="/about" className="btn-outline">Learn More</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="home-footer">
                <div className="container">
                    <p>© 2025 FreshCheck — AI-Powered Freshness Detection | Built with TensorFlow & React</p>
                </div>
            </footer>
        </div>
    );
}
