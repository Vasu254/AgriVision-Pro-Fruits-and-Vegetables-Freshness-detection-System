import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';

/**
 * Dashboard page — shows database stats, scan history, and session logs.
 */
export default function Dashboard({ apiUrl }) {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [batchSessions, setBatchSessions] = useState([]);
    const [videoSessions, setVideoSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historyFilter, setHistoryFilter] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, histRes, batchRes, videoRes] = await Promise.all([
                fetch(`${apiUrl}/db/stats`),
                fetch(`${apiUrl}/db/history?limit=30${historyFilter ? `&type=${historyFilter}` : ''}`),
                fetch(`${apiUrl}/db/batch-sessions`),
                fetch(`${apiUrl}/db/video-sessions`),
            ]);
            const statsData = await statsRes.json();
            const histData = await histRes.json();
            const batchData = await batchRes.json();
            const videoData = await videoRes.json();

            if (statsData.error) throw new Error(statsData.error);
            setStats(statsData);
            setHistory(histData.history || []);
            setHistoryTotal(histData.total || 0);
            setBatchSessions(batchData.sessions || []);
            setVideoSessions(videoData.sessions || []);
        } catch (err) {
            setError(err.message || 'Failed to load database');
        } finally {
            setLoading(false);
        }
    }, [apiUrl, historyFilter]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleClearDB = async () => {
        if (!window.confirm('Are you sure you want to clear ALL database records? This cannot be undone.')) return;
        try {
            await fetch(`${apiUrl}/db/clear`, { method: 'POST' });
            loadData();
        } catch (e) {
            setError('Failed to clear database');
        }
    };

    const GRADE_COLORS = { A: '#00e676', B: '#69f0ae', C: '#ffeb3b', D: '#ff9100', F: '#ff1744' };

    if (loading) {
        return (
            <div className="dashboard-page page-wrapper">
                <div className="container">
                    <div className="db-loading">
                        <div className="db-spinner" />
                        <p>Loading database...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page page-wrapper">
            <div className="container">
                <div className="page-header">
                    <div className="section-tag">DATABASE</div>
                    <h1 className="section-title">📊 Analytics Dashboard</h1>
                    <p className="section-desc">
                        All scan history, statistics, and session data stored in the database.
                    </p>
                </div>

                {error && <div className="db-error">⚠️ {error}</div>}

                {/* Stats Overview Cards */}
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card sc-total">
                            <div className="sc-icon">📊</div>
                            <div className="sc-value">{stats.total_scans}</div>
                            <div className="sc-label">Total Scans</div>
                        </div>
                        <div className="stat-card sc-fresh">
                            <div className="sc-icon">✅</div>
                            <div className="sc-value">{stats.total_fresh}</div>
                            <div className="sc-label">Fresh (Good)</div>
                        </div>
                        <div className="stat-card sc-rotten">
                            <div className="sc-icon">🚫</div>
                            <div className="sc-value">{stats.total_rotten}</div>
                            <div className="sc-label">Rotten (Bad)</div>
                        </div>
                        <div className="stat-card sc-rate">
                            <div className="sc-icon">📈</div>
                            <div className="sc-value">{stats.freshness_rate}%</div>
                            <div className="sc-label">Freshness Rate</div>
                        </div>
                        <div className="stat-card sc-avg">
                            <div className="sc-icon">🎯</div>
                            <div className="sc-value">{stats.avg_freshness_score}</div>
                            <div className="sc-label">Avg Score</div>
                        </div>
                        <div className="stat-card sc-today">
                            <div className="sc-icon">📅</div>
                            <div className="sc-value">{stats.today_scans}</div>
                            <div className="sc-label">Today's Scans</div>
                        </div>
                    </div>
                )}

                {/* Freshness Rate Bar */}
                {stats && stats.total_scans > 0 && (
                    <div className="rate-bar-section glass-card">
                        <h3>Overall Freshness Distribution</h3>
                        <div className="rate-bar">
                            <div className="rate-fill rate-good" style={{ width: `${stats.freshness_rate}%` }}>
                                {stats.freshness_rate > 10 && `${stats.freshness_rate}% Good`}
                            </div>
                            <div className="rate-fill rate-bad" style={{ width: `${100 - stats.freshness_rate}%` }}>
                                {(100 - stats.freshness_rate) > 10 && `${(100 - stats.freshness_rate).toFixed(1)}% Bad`}
                            </div>
                        </div>

                        {/* Grade Distribution */}
                        {stats.grade_distribution && Object.keys(stats.grade_distribution).length > 0 && (
                            <div className="grade-dist">
                                <h4>Grade Distribution</h4>
                                <div className="grade-pills">
                                    {Object.entries(stats.grade_distribution).map(([grade, count]) => (
                                        <div key={grade} className="grade-pill" style={{
                                            borderColor: `${GRADE_COLORS[grade] || '#fff'}60`,
                                            color: GRADE_COLORS[grade] || '#fff'
                                        }}>
                                            <strong>{grade}</strong>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* By Scan Type */}
                        {stats.by_scan_type && stats.by_scan_type.length > 0 && (
                            <div className="type-breakdown">
                                <h4>By Scan Type</h4>
                                <div className="type-grid">
                                    {stats.by_scan_type.map(t => (
                                        <div key={t.type} className="type-item">
                                            <div className="type-name">{t.type}</div>
                                            <div className="type-counts">
                                                <span className="tc-total">{t.count} scans</span>
                                                <span className="tc-fresh">✅ {t.fresh}</span>
                                                <span className="tc-rotten">🚫 {t.rotten}</span>
                                                <span className="tc-score">Avg: {t.avg_score}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="db-tabs">
                    <button className={`db-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}>📋 Scan History</button>
                    <button className={`db-tab ${activeTab === 'batches' ? 'active' : ''}`}
                        onClick={() => setActiveTab('batches')}>📦 Batch Sessions ({batchSessions.length})</button>
                    <button className={`db-tab ${activeTab === 'videos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('videos')}>🎥 Video Sessions ({videoSessions.length})</button>
                </div>

                {/* Scan History Tab */}
                {activeTab === 'overview' && (
                    <div className="history-section">
                        <div className="history-header">
                            <h3>Scan History ({historyTotal} records)</h3>
                            <div className="history-filters">
                                <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
                                    className="filter-select">
                                    <option value="">All Types</option>
                                    <option value="image_upload">Image Upload</option>
                                    <option value="camera">Camera</option>
                                    <option value="batch">Batch</option>
                                    <option value="video_frame">Video Frame</option>
                                </select>
                                <button className="refresh-btn" onClick={loadData}>🔄 Refresh</button>
                            </div>
                        </div>

                        <div className="history-table-wrap">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Type</th>
                                        <th>File</th>
                                        <th>Result</th>
                                        <th>Score</th>
                                        <th>Grade</th>
                                        <th>Confidence</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(row => (
                                        <tr key={row.id} className={row.is_fresh ? 'row-fresh' : 'row-rotten'}>
                                            <td className="td-id">#{row.id}</td>
                                            <td><span className="type-badge">{row.scan_type}</span></td>
                                            <td className="td-file">{row.filename || '-'}</td>
                                            <td>
                                                <span className={`verdict-chip ${row.is_fresh ? 'vc-good' : 'vc-bad'}`}>
                                                    {row.is_fresh ? '✅ GOOD' : '🚫 BAD'}
                                                </span>
                                            </td>
                                            <td>{row.freshness_score?.toFixed(1)}%</td>
                                            <td><span style={{ color: GRADE_COLORS[row.quality_grade] }}>{row.quality_grade}</span></td>
                                            <td>{(row.confidence * 100).toFixed(0)}%</td>
                                            <td className="td-time">{new Date(row.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {history.length === 0 && (
                                <div className="empty-table">No scan records yet. Start analyzing produce!</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Batch Sessions Tab */}
                {activeTab === 'batches' && (
                    <div className="sessions-section">
                        <h3>Batch Upload Sessions</h3>
                        <div className="sessions-grid">
                            {batchSessions.map(s => (
                                <div key={s.id} className="session-card glass-card">
                                    <div className="session-header">
                                        <span className="session-id">📦 Batch #{s.id}</span>
                                        <span className="session-time">{new Date(s.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="session-stats">
                                        <div className="ss-item"><span>Total</span><strong>{s.total_images}</strong></div>
                                        <div className="ss-item ss-fresh"><span>Fresh</span><strong>{s.fresh_count}</strong></div>
                                        <div className="ss-item ss-rotten"><span>Rotten</span><strong>{s.rotten_count}</strong></div>
                                        <div className="ss-item"><span>Avg Score</span><strong>{s.avg_freshness}%</strong></div>
                                    </div>
                                </div>
                            ))}
                            {batchSessions.length === 0 && (
                                <div className="empty-table">No batch sessions yet.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Video Sessions Tab */}
                {activeTab === 'videos' && (
                    <div className="sessions-section">
                        <h3>Video Analysis Sessions</h3>
                        <div className="sessions-grid">
                            {videoSessions.map(s => (
                                <div key={s.id} className="session-card glass-card">
                                    <div className="session-header">
                                        <span className="session-id">🎥 Video #{s.id}</span>
                                        <span className="session-time">{new Date(s.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="session-file">{s.filename}</div>
                                    <div className="session-stats">
                                        <div className="ss-item"><span>Frames</span><strong>{s.total_frames_analyzed}</strong></div>
                                        <div className="ss-item ss-fresh"><span>Fresh</span><strong>{s.fresh_count}</strong></div>
                                        <div className="ss-item ss-rotten"><span>Rotten</span><strong>{s.rotten_count}</strong></div>
                                        <div className="ss-item"><span>Fresh %</span><strong>{s.overall_freshness_percent}%</strong></div>
                                        <div className="ss-item"><span>Duration</span><strong>{s.video_duration}</strong></div>
                                    </div>
                                </div>
                            ))}
                            {videoSessions.length === 0 && (
                                <div className="empty-table">No video sessions yet.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="db-actions">
                    <button className="btn-primary" onClick={loadData}>🔄 Refresh Data</button>
                    <button className="btn-danger" onClick={handleClearDB}>🗑️ Clear Database</button>
                </div>
            </div>
        </div>
    );
}
