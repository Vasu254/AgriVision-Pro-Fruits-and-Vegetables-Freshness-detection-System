import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Camera.css';

/**
 * Camera page with:
 * - Fixed video rendering (onLoadedMetadata + explicit play)
 * - 360° rotation slider + preset angles
 * - Motion detection: auto-captures when movement stops
 * - Live analysis every 1.5s with low-latency loop
 * - Factory/Conveyor-style live counters & sorting log
 * - Zoom control, Flip camera
 */
export default function Camera({ apiUrl }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const motionCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const liveIntervalRef = useRef(null);
    const motionIntervalRef = useRef(null);
    const prevFrameRef = useRef(null);
    const motionCooldownRef = useRef(false);

    const [cameraOn, setCameraOn] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [capturedImage, setCapturedImage] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [liveMode, setLiveMode] = useState(false);
    const [motionDetect, setMotionDetect] = useState(false);
    const [facingMode, setFacingMode] = useState('user');
    const [zoom, setZoom] = useState(1);
    const [motionLevel, setMotionLevel] = useState(0);
    const [statusMsg, setStatusMsg] = useState('');

    // ── Factory/Conveyor counters ──────────────────────────────────
    const [freshCount, setFreshCount] = useState(0);
    const [rottenCount, setRottenCount] = useState(0);
    const [totalScanned, setTotalScanned] = useState(0);
    const [conveyorLog, setConveyorLog] = useState([]); // {id, thumb, verdict, confidence, time, is_fresh}
    const [flashColor, setFlashColor] = useState(null); // 'green' | 'red' | null

    // ── Camera start/stop ─────────────────────────────────────────
    const startCamera = useCallback(async () => {
        setError(null);
        setVideoReady(false);
        try {
            let stream = null;
            // Try with facingMode first, fallback to basic video constraint
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });
            } catch (e1) {
                console.warn('FacingMode failed, trying basic video...', e1);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                        audio: false,
                    });
                } catch (e2) {
                    console.warn('HD failed, trying basic...', e2);
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                }
            }
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraOn(true);
            setCapturedImage(null);
            setPrediction(null);
            setStatusMsg('Camera starting...');
        } catch (err) {
            console.error('Camera error:', err);
            setError('Failed to access camera. Please allow camera permissions in your browser and ensure no other app is using the camera.');
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        clearInterval(liveIntervalRef.current);
        clearInterval(motionIntervalRef.current);
        prevFrameRef.current = null;
        setCameraOn(false);
        setVideoReady(false);
        setLiveMode(false);
        setMotionDetect(false);
        setMotionLevel(0);
        setStatusMsg('');
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    // Attach stream to video element when it mounts
    useEffect(() => {
        if (cameraOn && videoRef.current && streamRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraOn]);

    // ── Video element ready handler (KEY FIX) ─────────────────────
    const handleVideoReady = useCallback(() => {
        const video = videoRef.current;
        if (!video || videoReady) return; // avoid double-fire
        // Use a small delay to let the element settle
        const tryPlay = () => {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setVideoReady(true);
                    setStatusMsg('Camera ready — point at produce');
                }).catch(err => {
                    console.warn('Play attempt failed, retrying...', err);
                    setTimeout(() => {
                        video.play().then(() => {
                            setVideoReady(true);
                            setStatusMsg('Camera ready — point at produce');
                        }).catch(e => {
                            // Last resort — just show the feed anyway since autoPlay might work
                            console.error('Play retry failed:', e);
                            setVideoReady(true);
                            setStatusMsg('Camera ready (autoplay) — point at produce');
                        });
                    }, 800);
                });
            } else {
                // play() returned undefined (old browsers), just assume it worked
                setVideoReady(true);
                setStatusMsg('Camera ready — point at produce');
            }
        };
        setTimeout(tryPlay, 200);
    }, [videoReady]);

    // ── Frame capture util ────────────────────────────────────────
    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return null;
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.drawImage(video, -w / 2, -h / 2, w, h);
        ctx.restore();
        return canvas.toDataURL('image/jpeg', 0.85);
    }, [rotation, zoom]);

    // ── Analyze frame via backend ─────────────────────────────────
    const analyzeFrame = useCallback(async (dataUrl, addToConveyor = false) => {
        if (!dataUrl) return;
        setAnalyzing(true);
        try {
            const res = await fetch(`${apiUrl}/camera-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPrediction(data);

            // Update factory counters
            if (addToConveyor || liveMode) {
                setTotalScanned(prev => prev + 1);
                if (data.is_fresh) {
                    setFreshCount(prev => prev + 1);
                } else {
                    setRottenCount(prev => prev + 1);
                }

                // Flash effect
                setFlashColor(data.is_fresh ? 'green' : 'red');
                setTimeout(() => setFlashColor(null), 400);

                // Add to conveyor log
                const logEntry = {
                    id: Date.now(),
                    thumb: dataUrl,
                    verdict: data.is_fresh ? 'GOOD ✅' : 'BAD 🚫',
                    is_fresh: data.is_fresh,
                    confidence: Math.round((data.confidence || 0) * 100),
                    freshness_score: Math.round(data.freshness_score ?? 50),
                    grade: data.quality_grade || 'C',
                    time: new Date().toLocaleTimeString(),
                };
                setConveyorLog(prev => [logEntry, ...prev].slice(0, 50));
            }
        } catch (err) {
            if (!liveMode) setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    }, [apiUrl, liveMode]);

    // ── Manual capture ────────────────────────────────────────────
    const handleCapture = async () => {
        const dataUrl = captureFrame();
        if (dataUrl) {
            setCapturedImage(dataUrl);
            setLoading(true);
            await analyzeFrame(dataUrl, true);
            setLoading(false);
        }
    };

    // ── Live analysis mode ────────────────────────────────────────
    const toggleLiveMode = () => {
        if (!liveMode) {
            setLiveMode(true);
            liveIntervalRef.current = setInterval(async () => {
                const dataUrl = captureFrame();
                if (dataUrl) await analyzeFrame(dataUrl, true);
            }, 1500);
        } else {
            clearInterval(liveIntervalRef.current);
            setLiveMode(false);
        }
    };

    // ── Motion detection ──────────────────────────────────────────
    const computeMotion = useCallback((video) => {
        const mc = motionCanvasRef.current;
        if (!mc || video.readyState < 2) return 0;
        const W = 160, H = 120;
        mc.width = W;
        mc.height = H;
        const ctx = mc.getContext('2d');
        ctx.drawImage(video, 0, 0, W, H);
        const imageData = ctx.getImageData(0, 0, W, H);
        const pixels = imageData.data;
        const gray = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) {
            gray[i] = Math.round(0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2]);
        }
        if (!prevFrameRef.current) {
            prevFrameRef.current = gray;
            return 0;
        }
        let diffSum = 0;
        for (let i = 0; i < gray.length; i++) {
            diffSum += Math.abs(gray[i] - prevFrameRef.current[i]);
        }
        prevFrameRef.current = gray;
        return diffSum / gray.length;
    }, []);

    const startMotionDetect = useCallback(() => {
        setMotionDetect(true);
        setStatusMsg('Move your hand/fruit — auto-capture when stable');
        let stableFrames = 0;
        motionIntervalRef.current = setInterval(() => {
            const video = videoRef.current;
            if (!video) return;
            const diff = computeMotion(video);
            const level = Math.min(100, Math.round((diff / 30) * 100));
            setMotionLevel(level);
            const MOTION_THRESHOLD = 8;
            const STABLE_FRAMES_NEEDED = 5;
            if (diff < MOTION_THRESHOLD) {
                stableFrames++;
                setStatusMsg(`Stabilizing... ${stableFrames}/${STABLE_FRAMES_NEEDED}`);
                if (stableFrames >= STABLE_FRAMES_NEEDED && !motionCooldownRef.current) {
                    motionCooldownRef.current = true;
                    stableFrames = 0;
                    setStatusMsg('📸 Auto-capturing stable frame!');
                    const dataUrl = captureFrame();
                    if (dataUrl) {
                        setCapturedImage(dataUrl);
                        analyzeFrame(dataUrl, true);
                    }
                    setTimeout(() => {
                        motionCooldownRef.current = false;
                        setStatusMsg('Move to re-capture, or hold still for next capture');
                    }, 3000);
                }
            } else {
                stableFrames = 0;
                motionCooldownRef.current = false;
                setStatusMsg('Motion detected — hold still to capture');
            }
        }, 100);
    }, [computeMotion, captureFrame, analyzeFrame]);

    const stopMotionDetect = useCallback(() => {
        clearInterval(motionIntervalRef.current);
        setMotionDetect(false);
        setMotionLevel(0);
        setStatusMsg('');
        prevFrameRef.current = null;
    }, []);

    const toggleMotionDetect = () => {
        if (motionDetect) stopMotionDetect();
        else startMotionDetect();
    };

    // ── Flip camera ───────────────────────────────────────────────
    const handleFlipCamera = () => {
        stopCamera();
        setFacingMode(f => f === 'environment' ? 'user' : 'environment');
    };

    useEffect(() => {
        if (facingMode && cameraOn) startCamera();
    }, [facingMode]);

    // ── Reset counters ────────────────────────────────────────────
    const resetCounters = () => {
        setFreshCount(0);
        setRottenCount(0);
        setTotalScanned(0);
        setConveyorLog([]);
    };

    // ── UI helpers ────────────────────────────────────────────────
    const getStatusColor = () => {
        if (!prediction) return '#667eea';
        if (prediction.uncertain) return '#ff6d00';
        return prediction.is_fresh ? '#00e676' : '#ff1744';
    };

    const getStatusText = () => {
        if (!prediction) return null;
        if (prediction.uncertain) return '⚠️ Uncertain';
        return prediction.is_fresh ? '✅ GOOD – FRESH' : '🚫 BAD – ROTTEN';
    };

    const freshPercent = totalScanned > 0 ? Math.round((freshCount / totalScanned) * 100) : 0;
    const rottenPercent = totalScanned > 0 ? Math.round((rottenCount / totalScanned) * 100) : 0;

    return (
        <div className="camera-page page-wrapper">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="section-tag">LIVE CAMERA</div>
                    <h1 className="section-title">🏭 Smart Sorting Camera</h1>
                    <p className="section-desc">
                        Live freshness detection with factory-style counting. Point at produce to classify and count Good vs Bad items.
                    </p>
                </div>

                {/* Factory Counter Dashboard */}
                {totalScanned > 0 && (
                    <div className="factory-dashboard">
                        <div className="counter-card total-card">
                            <div className="counter-icon">📊</div>
                            <div className="counter-value">{totalScanned}</div>
                            <div className="counter-label">Total Scanned</div>
                        </div>
                        <div className="counter-card fresh-card">
                            <div className="counter-icon">✅</div>
                            <div className="counter-value">{freshCount}</div>
                            <div className="counter-label">Good (Fresh)</div>
                            <div className="counter-pct">{freshPercent}%</div>
                        </div>
                        <div className="counter-card rotten-card">
                            <div className="counter-icon">🚫</div>
                            <div className="counter-value">{rottenCount}</div>
                            <div className="counter-label">Bad (Rotten)</div>
                            <div className="counter-pct">{rottenPercent}%</div>
                        </div>
                        <div className="counter-card ratio-card">
                            <div className="counter-icon">📈</div>
                            <div className="ratio-bar-wrap">
                                <div className="ratio-bar-fill ratio-fresh" style={{ width: `${freshPercent}%` }} />
                                <div className="ratio-bar-fill ratio-rotten" style={{ width: `${rottenPercent}%` }} />
                            </div>
                            <div className="ratio-legend">
                                <span className="legend-fresh">🟢 {freshPercent}% Good</span>
                                <span className="legend-rotten">🔴 {rottenPercent}% Bad</span>
                            </div>
                        </div>
                        <button className="reset-counter-btn" onClick={resetCounters}>🔄 Reset Counters</button>
                    </div>
                )}

                <div className="camera-layout">
                    {/* Camera Panel */}
                    <div className="camera-panel glass-card">
                        {/* Flash effect */}
                        {flashColor && (
                            <div className={`flash-overlay flash-${flashColor}`} />
                        )}

                        {/* Status bar */}
                        {statusMsg && (
                            <div className="status-bar" style={{
                                background: motionDetect ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(102,126,234,0.3)'
                            }}>
                                {motionDetect && <span className="motion-dot blinking" />}
                                {statusMsg}
                            </div>
                        )}

                        {/* Video Feed */}
                        <div className="video-wrapper">
                            {cameraOn ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        className={`video-feed ${videoReady ? 'visible' : 'hidden-feed'}`}
                                        style={{
                                            transform: (rotation !== 0 || zoom !== 1)
                                                ? `rotate(${rotation}deg) scale(${zoom})`
                                                : undefined
                                        }}
                                        muted
                                        playsInline
                                        autoPlay
                                        onLoadedMetadata={handleVideoReady}
                                    />

                                    {/* Show loading until video is ready */}
                                    {!videoReady && (
                                        <div className="camera-loading">
                                            <div className="mini-spinner" />
                                            <p>Starting camera...</p>
                                        </div>
                                    )}

                                    {/* Motion level indicator */}
                                    {motionDetect && (
                                        <div className="motion-bar-wrap">
                                            <div className="motion-bar-label">Motion</div>
                                            <div className="motion-bar-track">
                                                <div
                                                    className="motion-bar-fill"
                                                    style={{
                                                        width: `${motionLevel}%`,
                                                        background: motionLevel > 50
                                                            ? 'linear-gradient(90deg, #ff1744, #ff6d00)'
                                                            : 'linear-gradient(90deg, #00e676, #69f0ae)'
                                                    }}
                                                />
                                            </div>
                                            <div className="motion-bar-label">{motionLevel > 20 ? '🌀 Moving' : '🎯 Stable'}</div>
                                        </div>
                                    )}

                                    {/* Live overlay */}
                                    {prediction && liveMode && (
                                        <div className="live-overlay" style={{ borderColor: getStatusColor() }}>
                                            <span style={{ color: getStatusColor(), fontSize: '1.5rem', fontWeight: 700 }}>
                                                {getStatusText()}
                                            </span>
                                            <span style={{ color: getStatusColor() }}>
                                                {Math.round(prediction.freshness_score ?? 50)}% Fresh
                                            </span>
                                        </div>
                                    )}

                                    {analyzing && (
                                        <div className="analyzing-badge">
                                            <div className="mini-spinner" /> Analyzing...
                                        </div>
                                    )}
                                </>
                            ) : capturedImage ? (
                                <img src={capturedImage} alt="Captured" className="captured-img" />
                            ) : (
                                <div className="camera-placeholder">
                                    <div className="cam-icon">📷</div>
                                    <h3>Camera Ready</h3>
                                    <p>Click "Start Camera" to begin</p>
                                    {error && <div className="cam-error">{error}</div>}
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="camera-controls">
                            {!cameraOn ? (
                                <button className="btn-primary cam-btn" onClick={startCamera}>
                                    📷 Start Camera
                                </button>
                            ) : (
                                <>
                                    <button className="cam-icon-btn" onClick={handleFlipCamera} title="Flip Camera">🔄</button>
                                    <button
                                        className={`cam-icon-btn ${motionDetect ? 'active-btn' : ''}`}
                                        onClick={toggleMotionDetect}
                                        title="Motion Auto-Capture"
                                    >
                                        🎯
                                    </button>
                                    <button className="capture-btn" onClick={handleCapture} disabled={loading}>
                                        {loading ? <div className="mini-spinner" /> : <div className="capture-dot" />}
                                    </button>
                                    <button
                                        className={`cam-icon-btn ${liveMode ? 'active-btn' : ''}`}
                                        onClick={toggleLiveMode}
                                        title={liveMode ? 'Stop Live' : 'Live Mode'}
                                    >
                                        {liveMode ? '⏹️' : '▶️'}
                                    </button>
                                    <button className="cam-icon-btn danger-btn" onClick={stopCamera} title="Stop Camera">✕</button>
                                </>
                            )}
                        </div>

                        {/* Mode badges */}
                        {cameraOn && (
                            <div className="mode-badges">
                                {liveMode && <span className="badge badge-live">🔴 LIVE SORTING</span>}
                                {motionDetect && <span className="badge badge-motion">🎯 AUTO-CAPTURE</span>}
                                {totalScanned > 0 && (
                                    <span className="badge badge-count">📦 {totalScanned} scanned</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Controls & Results Panel */}
                    <div className="controls-panel">
                        {/* Rotation */}
                        <div className="control-card glass-card">
                            <h3 className="control-title">🔁 Rotation Control</h3>
                            <div className="rotation-display">
                                <div className="rotation-dial" style={{ '--rotation': `${rotation}deg` }}>
                                    <div className="dial-indicator" />
                                    <div className="dial-center">{rotation}°</div>
                                </div>
                            </div>
                            <input
                                type="range" min={0} max={360} step={1}
                                value={rotation}
                                onChange={e => setRotation(Number(e.target.value))}
                                className="rotation-slider"
                            />
                            <div className="preset-angles">
                                {[0, 90, 180, 270, 360].map(a => (
                                    <button key={a} className={`angle-btn ${rotation === a ? 'active' : ''}`}
                                        onClick={() => setRotation(a)}>{a}°</button>
                                ))}
                            </div>
                        </div>

                        {/* Zoom */}
                        <div className="control-card glass-card">
                            <h3 className="control-title">🔎 Zoom</h3>
                            <input
                                type="range" min={0.5} max={3} step={0.1}
                                value={zoom}
                                onChange={e => setZoom(Number(e.target.value))}
                                className="rotation-slider"
                            />
                            <div className="zoom-display">{zoom.toFixed(1)}×</div>
                        </div>

                        {/* Live Mode */}
                        <div className={`live-mode-card glass-card ${liveMode ? 'live-active' : ''}`}>
                            <div className="live-header">
                                <div className={`live-dot ${liveMode ? 'blinking' : ''}`} />
                                <h3>🏭 {liveMode ? 'Live Sorting Active' : 'Factory Live Mode'}</h3>
                            </div>
                            <p>{liveMode
                                ? 'Sorting every 1.5s. Each item counted as Good or Bad.'
                                : 'Enable live sorting to auto-classify and count produce.'
                            }</p>
                            {cameraOn && (
                                <button
                                    className={`btn-primary ${liveMode ? 'btn-stop' : ''}`}
                                    onClick={toggleLiveMode}
                                    style={{ marginTop: 12, width: '100%' }}
                                >
                                    {liveMode ? '⏹ Stop Sorting' : '▶ Start Live Sorting'}
                                </button>
                            )}
                        </div>

                        {/* Result */}
                        {prediction && (
                            <div className="cam-result-card glass-card" style={{
                                border: `1px solid ${prediction.is_fresh ? 'rgba(0,230,118,0.4)' : 'rgba(255,23,68,0.4)'}`,
                                boxShadow: prediction.is_fresh ? '0 0 20px rgba(0,230,118,0.15)' : '0 0 20px rgba(255,23,68,0.15)'
                            }}>
                                <div className="cam-result-header">
                                    <span className="cam-result-emoji" style={{ fontSize: '2.5rem' }}>
                                        {prediction.uncertain ? '⚠️' : (prediction.is_fresh ? '✅' : '🚫')}
                                    </span>
                                    <div>
                                        <div className="cam-result-status" style={{ color: getStatusColor(), fontSize: '1.4rem' }}>
                                            {prediction.uncertain ? 'UNCERTAIN' : (prediction.is_fresh ? 'GOOD – FRESH' : 'BAD – ROTTEN')}
                                        </div>
                                        <div className="cam-result-grade">Grade: <strong>{prediction.quality_grade}</strong></div>
                                    </div>
                                </div>
                                <div className="cam-score-bar-wrap">
                                    <div className="cam-score-label">
                                        <span>Freshness</span>
                                        <span>{Math.round(prediction.freshness_score ?? 50)}%</span>
                                    </div>
                                    <div className="cam-score-track">
                                        <div className="cam-score-fill" style={{
                                            width: `${prediction.freshness_score ?? 50}%`,
                                            background: 'linear-gradient(90deg, #ff1744, #ffeb3b, #00e676)'
                                        }} />
                                    </div>
                                </div>
                                <p className="cam-recommendation">{prediction.recommendation}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conveyor Log */}
                {conveyorLog.length > 0 && (
                    <div className="conveyor-section">
                        <h2 className="conveyor-title">🏭 Sorting Conveyor Log</h2>
                        <div className="conveyor-log">
                            {conveyorLog.map(entry => (
                                <div
                                    key={entry.id}
                                    className={`conveyor-item ${entry.is_fresh ? 'item-fresh' : 'item-rotten'}`}
                                >
                                    <img src={entry.thumb} alt="scan" className="conveyor-thumb" />
                                    <div className="conveyor-info">
                                        <div className={`conveyor-verdict ${entry.is_fresh ? 'verdict-good' : 'verdict-bad'}`}>
                                            {entry.verdict}
                                        </div>
                                        <div className="conveyor-meta">
                                            <span>Score: {entry.freshness_score}%</span>
                                            <span>Grade: {entry.grade}</span>
                                            <span>{entry.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hidden canvases */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <canvas ref={motionCanvasRef} style={{ display: 'none' }} />
            </div>
        </div>
    );
}
