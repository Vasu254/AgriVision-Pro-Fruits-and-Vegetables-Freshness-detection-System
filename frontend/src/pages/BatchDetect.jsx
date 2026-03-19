import React, { useState, useCallback, useRef } from 'react';
import './BatchDetect.css';

const GRADE_COLORS = { A: '#00e676', B: '#69f0ae', C: '#ffeb3b', D: '#ff9100', F: '#ff1744' };

export default function BatchDetect({ apiUrl }) {
    const [files, setFiles] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all | fresh | rotten
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    // Stats
    const total = results.length;
    const freshCount = results.filter(r => r.is_fresh).length;
    const rottenCount = results.filter(r => !r.is_fresh && !r.error).length;
    const errorCount = results.filter(r => r.error).length;
    const freshPct = total > 0 ? Math.round((freshCount / (total - errorCount)) * 100) || 0 : 0;

    const handleFiles = useCallback((newFiles) => {
        const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            setError('Please select image files (JPG, PNG, WEBP, BMP)');
            return;
        }
        setFiles(prev => [...prev, ...imageFiles]);
        setError(null);
    }, []);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const clearAll = () => {
        setFiles([]);
        setResults([]);
        setError(null);
        setProgress(0);
        setFilter('all');
    };

    const analyzeAll = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setError(null);
        setResults([]);
        setProgress(0);

        const allResults = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const formData = new FormData();
                formData.append('image', file);

                const res = await fetch(`${apiUrl}/predict`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();

                if (data.error) {
                    allResults.push({
                        filename: file.name,
                        preview: URL.createObjectURL(file),
                        error: data.error,
                    });
                } else {
                    allResults.push({
                        ...data,
                        filename: file.name,
                        preview: URL.createObjectURL(file),
                    });
                }
            } catch (err) {
                allResults.push({
                    filename: file.name,
                    preview: URL.createObjectURL(file),
                    error: err.message,
                });
            }

            setProgress(Math.round(((i + 1) / files.length) * 100));
            setResults([...allResults]);
        }

        setLoading(false);
    };

    const filteredResults = results.filter(r => {
        if (filter === 'fresh') return r.is_fresh && !r.error;
        if (filter === 'rotten') return !r.is_fresh && !r.error;
        return true;
    });

    return (
        <div className="batch-page page-wrapper">
            <div className="container">
                <div className="page-header">
                    <div className="section-tag">BATCH ANALYSIS</div>
                    <h1 className="section-title">📦 Batch Freshness Counter</h1>
                    <p className="section-desc">
                        Upload multiple images at once. Count how many are Good (Fresh) vs Bad (Rotten) with detailed results.
                    </p>
                </div>

                {/* Summary Dashboard */}
                {results.length > 0 && (
                    <div className="batch-summary">
                        <div className="summary-card total-summary">
                            <div className="summary-icon">📊</div>
                            <div className="summary-value">{total}</div>
                            <div className="summary-label">Total Analyzed</div>
                        </div>
                        <div className="summary-card fresh-summary">
                            <div className="summary-icon">✅</div>
                            <div className="summary-value">{freshCount}</div>
                            <div className="summary-label">GOOD (Fresh)</div>
                        </div>
                        <div className="summary-card rotten-summary">
                            <div className="summary-icon">🚫</div>
                            <div className="summary-value">{rottenCount}</div>
                            <div className="summary-label">BAD (Rotten)</div>
                        </div>
                        <div className="summary-card pct-summary">
                            <div className="summary-icon">📈</div>
                            <div className="summary-value">{freshPct}%</div>
                            <div className="summary-label">Freshness Rate</div>
                            <div className="pct-bar">
                                <div className="pct-fill" style={{ width: `${freshPct}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="batch-layout">
                    {/* Upload Panel */}
                    <div className="upload-panel glass-card">
                        <h2 className="panel-title">📤 Upload Images</h2>

                        <div
                            className={`batch-dropzone ${dragOver ? 'drag-over' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="drop-icon">{dragOver ? '📂' : '📤'}</div>
                            <h3>{dragOver ? 'Drop images here!' : 'Drop images or click to browse'}</h3>
                            <p>JPG, PNG, WEBP, BMP — multiple files supported</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFiles(e.target.files)}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* File list */}
                        {files.length > 0 && (
                            <div className="file-list">
                                <div className="file-list-header">
                                    <span>{files.length} image{files.length > 1 ? 's' : ''} selected</span>
                                    <button className="clear-btn" onClick={clearAll}>Clear All</button>
                                </div>
                                <div className="file-chips">
                                    {files.map((f, i) => (
                                        <div key={i} className="file-chip">
                                            <span className="chip-name">{f.name}</span>
                                            <span className="chip-size">{(f.size / 1024).toFixed(0)}KB</span>
                                            <button className="chip-remove" onClick={() => removeFile(i)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && <div className="batch-error">⚠️ {error}</div>}

                        <div className="batch-actions">
                            <button
                                className="btn-primary analyze-all-btn"
                                onClick={analyzeAll}
                                disabled={files.length === 0 || loading}
                            >
                                {loading ? (
                                    <><div className="mini-spinner" /> Analyzing {progress}%</>
                                ) : (
                                    `🔍 Analyze ${files.length} Image${files.length !== 1 ? 's' : ''}`
                                )}
                            </button>
                        </div>

                        {loading && (
                            <div className="progress-wrap">
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="progress-text">{progress}% complete</div>
                            </div>
                        )}
                    </div>

                    {/* Results Panel */}
                    <div className="results-panel">
                        {results.length > 0 && (
                            <>
                                {/* Filter tabs */}
                                <div className="filter-tabs">
                                    <button
                                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                                        onClick={() => setFilter('all')}
                                    >
                                        All ({total})
                                    </button>
                                    <button
                                        className={`filter-tab tab-fresh ${filter === 'fresh' ? 'active' : ''}`}
                                        onClick={() => setFilter('fresh')}
                                    >
                                        ✅ Good ({freshCount})
                                    </button>
                                    <button
                                        className={`filter-tab tab-rotten ${filter === 'rotten' ? 'active' : ''}`}
                                        onClick={() => setFilter('rotten')}
                                    >
                                        🚫 Bad ({rottenCount})
                                    </button>
                                </div>

                                {/* Results grid */}
                                <div className="results-grid">
                                    {filteredResults.map((result, i) => (
                                        <ResultCard key={i} result={result} />
                                    ))}
                                </div>
                            </>
                        )}

                        {results.length === 0 && !loading && (
                            <div className="results-placeholder glass-card">
                                <div className="placeholder-icon">📊</div>
                                <h3>Results will appear here</h3>
                                <p>Upload images and click "Analyze" to see freshness results with Good/Bad counts.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResultCard({ result }) {
    if (result.error) {
        return (
            <div className="result-item result-error">
                <img src={result.preview} alt={result.filename} className="result-thumb" />
                <div className="result-overlay error-overlay">
                    <span className="result-badge badge-error">⚠️ Error</span>
                </div>
                <div className="result-info">
                    <div className="result-filename">{result.filename}</div>
                    <div className="result-error-msg">{result.error}</div>
                </div>
            </div>
        );
    }

    const isFresh = result.is_fresh;
    const score = Math.round(result.freshness_score ?? 50);
    const grade = result.quality_grade || 'C';
    const gradeColor = GRADE_COLORS[grade] || '#fff';

    return (
        <div className={`result-item ${isFresh ? 'item-good' : 'item-bad'}`}>
            <img src={result.preview} alt={result.filename} className="result-thumb" />
            <div className={`result-overlay ${isFresh ? 'overlay-good' : 'overlay-bad'}`}>
                <span className={`result-badge ${isFresh ? 'badge-good' : 'badge-bad'}`}>
                    {isFresh ? '✅ GOOD' : '🚫 BAD'}
                </span>
            </div>
            <div className="result-info">
                <div className="result-filename">{result.filename}</div>
                <div className="result-verdict" style={{ color: isFresh ? '#00e676' : '#ff1744' }}>
                    {isFresh ? 'Fresh' : 'Rotten'}
                </div>
                <div className="result-details-row">
                    <span className="result-score">Score: {score}%</span>
                    <span className="result-grade" style={{ color: gradeColor }}>Grade {grade}</span>
                    <span className="result-conf">
                        {Math.round((result.confidence || 0) * 100)}% sure
                    </span>
                </div>
                <div className="result-bar-track">
                    <div
                        className="result-bar-fill"
                        style={{
                            width: `${score}%`,
                            background: `linear-gradient(90deg, #ff1744, #ffeb3b, #00e676)`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
