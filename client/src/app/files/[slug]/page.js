'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = '/api';

function trackView(type) {
    try {
        fetch(`${API}/analytics/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
            keepalive: true,
        });
    } catch { /* fire-and-forget */ }
}

function trackDownload(fileSize) {
    try {
        fetch(`${API}/analytics/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileSize: fileSize || 0 }),
            keepalive: true,
        });
    } catch { /* fire-and-forget */ }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

export default function FileDownloadPage() {
    const { slug } = useParams();
    const [fileMeta, setFileMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const res = await fetch(`${API}/files/${slug}`);
                if (!res.ok) {
                    setNotFound(true);
                    return;
                }
                const data = await res.json();
                setFileMeta(data);
                trackView('file');
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [slug]);

    const handleDownload = () => {
        trackDownload(fileMeta.fileSize);
        window.open(`${API}/files/${slug}/download`, '_blank');
    };

    if (loading) {
        return (
            <div className="download-page">
                <p className="text-muted">Loading...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="download-page">
                <div className="download-card">
                    <div className="download-icon">❌</div>
                    <h2>File Not Found</h2>
                    <p className="download-meta">This file may have expired or the link is invalid.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="download-page">
            <div className="download-card">
                <div className="download-icon">📁</div>
                <h2>{fileMeta.originalName}</h2>
                <p className="download-meta">
                    {formatSize(fileMeta.fileSize)} • {fileMeta.downloads} download{fileMeta.downloads !== 1 ? 's' : ''}
                    <br />
                    Expires: {new Date(fileMeta.expiresAt).toLocaleString()}
                </p>
                <button className="btn btn-primary btn-lg w-full" onClick={handleDownload}>
                    ⬇️ Download File
                </button>
            </div>
        </div>
    );
}
