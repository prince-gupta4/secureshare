'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useDev } from '@/components/DevAuth';
import { devAuthHeaders } from '@/components/DevAuth';

const API = '/api';

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
}

export default function DevLogPage() {
    const { devToken } = useDev();
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [logFile, setLogFile] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [level, setLevel] = useState('');
    const [route, setRoute] = useState('');
    const [debouncedRoute, setDebouncedRoute] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [limit, setLimit] = useState(100);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 1500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedRoute(route);
        }, 1500);

        return () => clearTimeout(timer);
    }, [route]);

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.set('limit', String(limit));
            if (level) params.set('level', level);
            if (debouncedRoute) params.set('route', debouncedRoute);
            if (debouncedSearch) params.set('search', debouncedSearch);

            const res = await fetch(`${API}/dev/logs?${params}`, {
                headers: devAuthHeaders(devToken),
            });
            if (!res.ok) {
                setError('Failed to load logs (unauthorized or server error)');
                return;
            }
            const data = await res.json();
            setLogs(data.logs || []);
            setTotal(data.total || 0);
            setLogFile(data.logFile || '');
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [devToken, level, debouncedRoute, debouncedSearch, limit]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleClear = async () => {
        if (!confirm('Delete all log entries?')) return;
        try {
            await fetch(`${API}/dev/logs`, {
                method: 'DELETE',
                headers: devAuthHeaders(devToken),
            });
            setLogs([]);
            setTotal(0);
        } catch { /* ignore */ }
    };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `securestore-logs-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="container">
                <p className="text-muted">Loading logs...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="dev-page-header">
                <div>
                    <h1>📊 Request Logs</h1>
                    <p className="text-muted text-sm">
                        File: {total} entries
                    </p>
                </div>
                <div className="dev-actions">
                    <button className="btn btn-ghost btn-sm" onClick={exportJson}>⬇️ Export JSON</button>
                    <button className="btn btn-danger btn-sm" onClick={handleClear}>🗑️ Clear</button>
                </div>
            </div>

            <div className="dev-filters">
                <input
                    className="input"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <input
                    className="input"
                    placeholder="Route filter"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                />
                <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="">All levels</option>
                    <option value="INFO">INFO</option>
                    <option value="ERROR">ERROR</option>
                    <option value="WARN">WARN</option>
                </select>
                <select className="select" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10))}>
                    <option value="100">100</option>
                    <option value="500">500</option>
                    <option value="1000">1000</option>
                    <option value="5000">5000</option>
                </select>
            </div>

            {error && <div className="alert alert-error text-sm mb-2">{error}</div>}

            {logs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="text-muted">No log entries yet.</p>
                </div>
            ) : (
                <div className="dev-table-wrap">
                    <table className="dev-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Level</th>
                                <th>Method</th>
                                <th>Route</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>IP</th>
                                <th>Device</th>
                                <th>Browser / OS</th>
                                <th>Message / Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((entry, idx) => (
                                <tr key={idx} className={entry.level === 'ERROR' ? 'dev-row-error' : ''}>
                                    <td className="dev-time">{fmtTime(entry.timestamp)}</td>
                                    <td>
                                        <span className={`dev-badge dev-badge-${entry.level}`}>
                                            {entry.level || 'INFO'}
                                        </span>
                                    </td>
                                    <td>{entry.method || '—'}</td>
                                    <td className="dev-route">{entry.route || entry.path || '—'}</td>
                                    <td className={entry.statusCode >= 400 ? 'dev-err-text' : ''}>
                                        {entry.statusCode ?? '—'}
                                    </td>
                                    <td>{entry.duration || '—'}</td>
                                    <td>{entry.ip || '—'}</td>
                                    <td>{entry.device || '—'}</td>
                                    <td>{entry.browser || '—'}{entry.os ? ` / ${entry.os}` : ''}</td>
                                    <td className="dev-msg">
                                        {entry.error ? (
                                            <span className="dev-error-text">⚠ {entry.error}</span>
                                        ) : (
                                            entry.message || ''
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}