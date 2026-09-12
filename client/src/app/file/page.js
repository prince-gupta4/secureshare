'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import api from '@/utils/api';

function trackView(type) {
    try {
        api.post('/analytics/view', { type });
    } catch { /* fire-and-forget */ }
}

function trackDownload(fileSize) {
    try {
        api.post('/analytics/download', { fileSize: fileSize || 0 });
    } catch { /* fire-and-forget */ }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

export default function FileDownloadPage() {
    return (
        <Suspense fallback={
            <div className="download-page">
                <p className="text-muted">Loading file route...</p>
            </div>
        }>
            <FileDownloadContent />
        </Suspense>
    );
}

function FileDownloadContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get('id');
    const [fileMeta, setFileMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const res = await api.get(`/files/${slug}`);
                setFileMeta(res.data);
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
        const BASE_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';
        window.open(`${BASE_API}/files/${slug}/download`, '_blank');
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
