import React, { useState, useRef } from 'react';
import './VideoAnalyzer.css';

/**
 * VideoAnalyzer page:
 * - Upload a video
 * - Frame-by-frame detection with thumbnails (like vehicle detection)
 * - Counting dashboard: total detected, good count, bad count
 * - Quality analysis
 * - Filter/sort detected frames
 */
export default function VideoAnalyzer({ apiUrl }) {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState('');
    const [frameResults, setFrameResults] = useState([]);
    const [summary, setSummary] = useState(null);
    const [qualityResult, setQualityResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [filter, setFilter] = useState('all');
    const fileInputRef = useRef(null);

    const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/avi'];

    const handleFile = (file) => {
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
            setError('Please upload a valid video file (MP4, WebM, OGG, MOV, AVI)');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            setError('File too large. Maximum size is 100MB.');
            return;
        }
        setError(null);
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setFrameResults([]);
        setSummary(null);
        setQualityResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const runAnalysis = async () => {
        if (!videoFile) return;
        setAnalyzing(true);
        setError(null);
        setProgress(10);
        setProgressMsg('Checking video quality...');

        try {
            // Step 1: Quality analysis
            const formData1 = new FormData();
            formData1.append('video', videoFile);
            setProgress(15);

            const qualityRes = await fetch(`${apiUrl}/video-analyze`, {
                method: 'POST',
                body: formData1,
            });
            const qualityData = await qualityRes.json();
            if (qualityData.error) throw new Error(qualityData.error);
            setQualityResult(qualityData);
            setProgress(35);
            setProgressMsg('Scanning frames for produce detection...');

            // Step 2: Frame-by-frame detection
            const formData2 = new FormData();
            formData2.append('video', videoFile);

            const detectRes = await fetch(`${apiUrl}/video-detect-frames`, {
                method: 'POST',
                body: formData2,
            });
            const detectData = await detectRes.json();
            if (detectData.error) throw new Error(detectData.error);

            setFrameResults(detectData.frame_results || []);
            setSummary(detectData.summary || null);
            setProgress(100);
            setProgressMsg('Analysis complete!');
        } catch (err) {
            setError(err.message || 'Analysis failed. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const resetAll = () => {
        setVideoFile(null);
        setVideoUrl(null);
        setFrameResults([]);
        setSummary(null);
        setQualityResult(null);
        setError(null);
        setProgress(0);
        setProgressMsg('');
        setFilter('all');
    };

    const filteredFrames = frameResults.filter(f => {
        if (filter === 'good') return f.is_fresh;
        if (filter === 'bad') return !f.is_fresh;
        return true;
    });

    const qualityColor = qualityResult?.quality === 'Good' ? '#00e676' : '#ff1744';
    const qualityIcon = qualityResult?.quality === 'Good' ? '✅' : '❌';

    return (
        <div className="video-page page-wrapper">
            <div className="container">
                <div className="page-header">
                    <div className="section-tag">VIDEO ANALYSIS</div>
                    <h1 className="section-title">🎥 Video Produce Scanner</h1>
                    <p className="section-desc">
                        Upload a video of fruits or vegetables. Every frame is scanned to detect and count Good vs Bad produce — like a vehicle detection system.
                    </p>
                </div>

                {/* Summary Dashboard */}
                {summary && (
                    <div className="video-summary-dashboard">
                        <div className="vsum-card total-vcard">
                            <div className="vsum-icon">🔍</div>
                            <div className="vsum-value">{summary.total_detected}</div>
                            <div className="vsum-label">Total Detected</div>
                        </div>
                        <div className="vsum-card fresh-vcard">
                            <div className="vsum-icon">✅</div>
                            <div className="vsum-value">{summary.fresh_count}</div>
                            <div className="vsum-label">GOOD (Fresh)</div>
                        </div>
                        <div className="vsum-card rotten-vcard">
                            <div className="vsum-icon">🚫</div>
                            <div className="vsum-value">{summary.rotten_count}</div>
                            <div className="vsum-label">BAD (Rotten)</div>
                        </div>
                        <div className="vsum-card pct-vcard">
                            <div className="vsum-icon">📈</div>
                            <div className="vsum-value">{summary.overall_freshness_percent}%</div>
                            <div className="vsum-label">Freshness Rate</div>
                            <div className="vpct-bar">
                                <div className="vpct-fill vpct-good" style={{ width: `${summary.overall_freshness_percent}%` }} />
                                <div className="vpct-fill vpct-bad" style={{ width: `${100 - summary.overall_freshness_percent}%` }} />
                            </div>
                        </div>
                        <div className="vsum-card info-vcard">
                            <div className="vsum-icon">📊</div>
                            <div className="vsum-meta">
                                <span>Frames analyzed: <strong>{summary.total_frames_analyzed}</strong></span>
                                <span>Duration: <strong>{summary.video_duration}</strong></span>
                                <span>FPS: <strong>{summary.fps}</strong></span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="video-layout">
                    {/* Left: Upload + Preview + Quality */}
                    <div className="video-upload-panel glass-card">
                        <h2 className="panel-title">📤 Upload Video</h2>

                        {!videoUrl ? (
                            <div
                                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="drop-icon">🎬</div>
                                <h3>Drop video here</h3>
                                <p>or click to browse</p>
                                <div className="drop-formats">MP4 · WebM · MOV · AVI · OGG (max 100MB)</div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFile(e.target.files[0])}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        ) : (
                            <div className="video-preview-wrap">
                                <video
                                    src={videoUrl}
                                    controls
                                    className="video-preview"
                                    key={videoUrl}
                                />
                                <div className="video-file-info">
                                    <span className="file-name">📄 {videoFile.name}</span>
                                    <span className="file-size">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                                </div>
                            </div>
                        )}

                        {error && <div className="video-error">⚠️ {error}</div>}

                        <div className="video-actions">
                            {videoFile && !summary && (
                                <button
                                    className="btn-primary analyze-btn"
                                    onClick={runAnalysis}
                                    disabled={analyzing}
                                >
                                    {analyzing ? (
                                        <><div className="mini-spinner" /> Scanning...</>
                                    ) : '🔍 Scan Video for Produce'}
                                </button>
                            )}
                            {videoFile && (
                                <button className="btn-secondary reset-btn" onClick={resetAll}>
                                    🔄 Reset
                                </button>
                            )}
                        </div>

                        {/* Progress bar */}
                        {analyzing && (
                            <div className="progress-wrap">
                                <div className="progress-label">
                                    <span>{progressMsg}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Quality Result */}
                        {qualityResult && (
                            <div className="quality-inline" style={{ borderColor: `${qualityColor}40` }}>
                                <span className="quality-icon">{qualityIcon}</span>
                                <div className="quality-info">
                                    <strong style={{ color: qualityColor }}>Video Quality: {qualityResult.quality}</strong>
                                    <span className="quality-msg">{qualityResult.message}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Detection Results */}
                    <div className="video-results-panel">
                        {frameResults.length > 0 ? (
                            <>
                                {/* Filter tabs */}
                                <div className="vfilter-tabs">
                                    <button
                                        className={`vfilter-tab ${filter === 'all' ? 'active' : ''}`}
                                        onClick={() => setFilter('all')}
                                    >
                                        All ({frameResults.length})
                                    </button>
                                    <button
                                        className={`vfilter-tab vtab-good ${filter === 'good' ? 'active' : ''}`}
                                        onClick={() => setFilter('good')}
                                    >
                                        ✅ Good ({summary?.fresh_count || 0})
                                    </button>
                                    <button
                                        className={`vfilter-tab vtab-bad ${filter === 'bad' ? 'active' : ''}`}
                                        onClick={() => setFilter('bad')}
                                    >
                                        🚫 Bad ({summary?.rotten_count || 0})
                                    </button>
                                </div>

                                <h3 className="detection-title">
                                    🔍 Frame-by-Frame Detection ({filteredFrames.length} frames)
                                </h3>

                                {/* Detection grid */}
                                <div className="detection-grid">
                                    {filteredFrames.map((frame, i) => (
                                        <FrameCard key={i} frame={frame} />
                                    ))}
                                </div>
                            </>
                        ) : !analyzing ? (
                            <div className="result-placeholder glass-card">
                                <div className="placeholder-icon">🔍</div>
                                <h3>Detection results will appear here</h3>
                                <p>Upload a video and click "Scan Video for Produce" to see frame-by-frame detection results.</p>
                                <ul className="features-list">
                                    <li>✅ Frame-by-frame produce scanning</li>
                                    <li>✅ Good vs Bad counting for each frame</li>
                                    <li>✅ Thumbnail preview of each detection</li>
                                    <li>✅ Freshness score, grade, and confidence</li>
                                    <li>✅ Video quality analysis</li>
                                    <li>✅ Overall summary dashboard</li>
                                </ul>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Frame detection card ──────────────────────────────────────────
function FrameCard({ frame }) {
    const isFresh = frame.is_fresh;
    const borderColor = isFresh ? '#00e676' : '#ff1744';

    return (
        <div className={`frame-card ${isFresh ? 'frame-good' : 'frame-bad'}`}>
            <div className="frame-thumb-wrap">
                <img src={frame.thumbnail} alt={`Frame ${frame.frame_number}`} className="frame-thumb" />
                <span className={`frame-badge ${isFresh ? 'fbadge-good' : 'fbadge-bad'}`}>
                    {isFresh ? '✅ GOOD' : '🚫 BAD'}
                </span>
                <span className="frame-number">#{frame.frame_number}</span>
            </div>
            <div className="frame-info">
                <div className="frame-verdict" style={{ color: borderColor }}>
                    {isFresh ? 'Fresh' : 'Rotten'}
                </div>
                <div className="frame-details">
                    <span>Score: {frame.freshness_score}%</span>
                    <span>Grade: {frame.grade}</span>
                    <span>{frame.confidence}% sure</span>
                </div>
                <div className="frame-time">⏱ {frame.timestamp}</div>
                <div className="frame-bar-track">
                    <div
                        className="frame-bar-fill"
                        style={{
                            width: `${frame.freshness_score}%`,
                            background: `linear-gradient(90deg, #ff1744, #ffeb3b, #00e676)`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
