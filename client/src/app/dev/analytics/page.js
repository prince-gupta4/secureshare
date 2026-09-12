'use client';

import { useEffect, useState } from 'react';
import { useDev } from '@/components/DevAuth';
import { devAuthHeaders } from '@/components/DevAuth';

const API = '/api';

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

export default function DevAnalyticsPage() {
    const { devToken } = useDev();
    const [data, setData] = useState(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API}/dev/analytics?days=${days}`, {
                headers: devAuthHeaders(devToken),
            });
            if (!res.ok) {
                setError('Failed to load analytics (unauthorized or server error)');
                return;
            }
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [devToken, days]);

    if (loading) {
        return (
            <div className="container">
                <p className="text-muted">Loading analytics...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="container">
                <div className="alert alert-error text-sm">{error || 'No data'}</div>
            </div>
        );
    }

    const totals = data.totals;
    const allTime = data.allTime;

    const maxSeriesView = Math.max(1, ...data.series.map((s) => s.totalViews));

    return (
        <div className="container">
            <div className="dev-page-header">
                <div>
                    <h1>📈 Analytics</h1>
                    <p className="text-muted text-sm">
                        Track views, visitors, downloads, and data transferred.
                    </p>
                </div>
                <div>
                    <select className="select" value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))}>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last 365 days</option>
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-error text-sm mb-2">{error}</div>}

            {/* All-time totals */}
            <div className="dev-stats">
                <div className="card dev-stat-card">
                    <div className="dev-stat-label">Total Views</div>
                    <div className="dev-stat-value">{allTime.totalViews}</div>
                </div>
                <div className="card dev-stat-card">
                    <div className="dev-stat-label">Unique Visitors</div>
                    <div className="dev-stat-value">{allTime.uniqueVisitors}</div>
                </div>
                <div className="card dev-stat-card">
                    <div className="dev-stat-label">Total Downloads</div>
                    <div className="dev-stat-value">{allTime.totalDownloads}</div>
                </div>
                <div className="card dev-stat-card">
                    <div className="dev-stat-label">Data Transferred</div>
                    <div className="dev-stat-value">{formatBytes(allTime.totalFileSize)}</div>
                </div>
                <div className="card dev-stat-card">
                    <div className="dev-stat-label">Note Views</div>
                    <div className="dev-stat-value">{allTime.noteViews}</div>
                </div>
                <div className="card dev-stat-card">
                    <div className="dev-stat-label">File Views</div>
                    <div className="dev-stat-value">{allTime.fileViews}</div>
                </div>
            </div>

            {/* Window totals */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Window Summary ({data.windowDays} days)</h3>
                <div className="dev-stats">
                    <div className="dev-stat-card">
                        <div className="dev-stat-label">Views</div>
                        <div className="dev-stat-value">{totals.totalViews}</div>
                    </div>
                    <div className="dev-stat-card">
                        <div className="dev-stat-label">Visitors</div>
                        <div className="dev-stat-value">{totals.uniqueVisitors}</div>
                    </div>
                    <div className="dev-stat-card">
                        <div className="dev-stat-label">Downloads</div>
                        <div className="dev-stat-value">{totals.totalDownloads}</div>
                    </div>
                    <div className="dev-stat-card">
                        <div className="dev-stat-label">Data</div>
                        <div className="dev-stat-value">{formatBytes(totals.totalFileSize)}</div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            {data.series.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Daily Views</h3>
                    <div className="dev-chart">
                        {data.series.map((s) => {
                            const heightPct = Math.round((s.totalViews / maxSeriesView) * 100);
                            return (
                                <div className="dev-chart-bar-col" key={s.date}>
                                    <div
                                        className="dev-chart-bar"
                                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                                        title={`${s.date}: ${s.totalViews} views`}
                                    />
                                    <div className="dev-chart-x">{s.date.slice(5)}</div>
                                    <div className="dev-chart-y">{s.totalViews}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Daily table */}
            <div className="card" style={{ marginTop: '1.5rem', padding: 0 }}>
                <div style={{ padding: '1rem 1.25rem' }}>
                    <h3 style={{ margin: 0 }}>Daily Breakdown</h3>
                </div>
                {data.series.length === 0 ? (
                    <p className="text-muted" style={{ padding: '1.25rem' }}>
                        No analytics recorded yet.
                    </p>
                ) : (
                    <div className="dev-table-wrap">
                        <table className="dev-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Views</th>
                                    <th>Visitors</th>
                                    <th>Downloads</th>
                                    <th>Data</th>
                                    <th>Note Views</th>
                                    <th>File Views</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...data.series].reverse().map((s) => (
                                    <tr key={s.date}>
                                        <td className="dev-time">{s.date}</td>
                                        <td>{s.totalViews}</td>
                                        <td>{s.uniqueVisitors}</td>
                                        <td>{s.totalDownloads}</td>
                                        <td>{formatBytes(s.totalFileSize)}</td>
                                        <td>{s.noteViews}</td>
                                        <td>{s.fileViews}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}