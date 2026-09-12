'use client';

import { useState, useRef } from 'react';
import { nanoid } from 'nanoid';
import { QRCodeSVG } from 'qrcode.react';

const API = '/api';

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

export default function FilesPage() {
    const [files, setFiles] = useState([]);
    const [slug, setSlug] = useState('');
    const [lifespan, setLifespan] = useState('168'); // 7 days in hours
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const maxSize = 10 * 1024 * 1024;

    const handleFiles = (newFiles) => {
        const fileArray = Array.from(newFiles);
        const combined = [...files, ...fileArray];
        const totalBytes = combined.reduce((sum, f) => sum + f.size, 0);

        if (totalBytes > maxSize) {
            showToast('Total file size exceeds 10MB limit', 'error');
            return;
        }

        setFiles(combined);
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProgress(10);

        try {
            const JSZip = (await import('jszip')).default;
            let fileToUpload;
            let fileName;

            // Check if single .zip file uploaded
            if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
                fileToUpload = files[0];
                fileName = files[0].name;
            } else {
                // Zip all files
                const zip = new JSZip();
                for (const f of files) {
                    const buffer = await f.arrayBuffer();
                    zip.file(f.name, buffer);
                }
                setProgress(50);
                const blob = await zip.generateAsync({ type: 'blob' });
                fileName = files.length === 1 ? `${files[0].name}.zip` : 'files.zip';
                fileToUpload = new File([blob], fileName, { type: 'application/zip' });
            }

            setProgress(70);

            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('slug', slug.trim() || nanoid(8));
            formData.append('lifespan', lifespan);

            const res = await fetch(`${API}/files/upload`, { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok) {
                setProgress(100);
                setResult(data);
                setFiles([]);
                setSlug('');
            } else {
                showToast(data.error || 'Upload failed', 'error');
                setProgress(0);
            }
        } catch (err) {
            showToast('Upload failed: ' + err.message, 'error');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const shareUrl = result
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/files/${result.slug}`
        : '';

    return (
        <div className="container-sm">
            <div className="page-header">
                <h1>📦 File Transfer</h1>
                <p>Upload files up to 10MB. Multiple files are zipped automatically.</p>
            </div>

            {result ? (
                <div className="card" style={{ textAlign: 'center' }}>
                    <div className="download-icon">✅</div>
                    <h2>Upload Successful!</h2>
                    <p className="text-muted text-sm mb-2">
                        {result.originalName} • {formatSize(result.fileSize)}
                    </p>
                    <p className="text-muted text-sm mb-2">
                        Expires: {new Date(result.expiresAt).toLocaleString()}
                    </p>

                    <label>Shareable Link</label>
                    <div className="flex gap-1 mb-2">
                        <input className="input" value={shareUrl} readOnly />
                        <button className="btn btn-primary btn-sm" onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            showToast('Link copied!');
                        }}>Copy</button>
                    </div>

                    <div className="qr-container">
                        <QRCodeSVG value={shareUrl} size={180} />
                    </div>

                    <button className="btn btn-primary w-full mt-2" onClick={() => {
                        const svg = document.querySelector('.qr-container svg');
                        if (!svg) return;
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () => {
                            canvas.width = 256;
                            canvas.height = 256;
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, 256, 256);
                            const link = document.createElement('a');
                            link.download = `securestore-qr-${result.slug}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                            showToast('QR downloaded!');
                        };
                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                    }}>📥 Download QR</button>

                    <button className="btn btn-secondary mt-2 w-full" onClick={() => {
                        setResult(null);
                        setProgress(0);
                    }}>Upload Another</button>
                </div>
            ) : (
                <div className="card">
                    {/* Dropzone */}
                    <div
                        className={`dropzone ${dragActive ? 'active' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="dropzone-icon">{dragActive ? '📥' : '📁'}</div>
                        <p>
                            Drag & drop files here, or <span className="browse-link">browse</span>
                        </p>
                        <p className="text-sm text-muted mt-1">Max total size: 10MB</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <>
                            <ul className="file-list">
                                {files.map((f, i) => (
                                    <li key={i} className="file-item">
                                        <span className="file-item-name">{f.name}</span>
                                        <span className="file-item-size">{formatSize(f.size)}</span>
                                        <button className="file-item-remove" onClick={() => removeFile(i)}>✕</button>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-muted mt-1">
                                Total: {formatSize(totalSize)} / {formatSize(maxSize)}
                            </p>
                        </>
                    )}

                    {/* Options */}
                    <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <label>Custom URL (optional)</label>
                            <input
                                className="input"
                                placeholder="my-file-link"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <label>Lifespan</label>
                            <select className="select" value={lifespan} onChange={(e) => setLifespan(e.target.value)}>
                                <option value="1">1 Hour</option>
                                <option value="24">24 Hours</option>
                                <option value="168">7 Days (Default)</option>
                            </select>
                        </div>
                    </div>

                    {/* Progress */}
                    {uploading && (
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        className="btn btn-primary btn-lg w-full mt-3"
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                    >
                        {uploading ? '⏳ Uploading...' : `📤 Upload${files.length > 1 ? ` & Zip (${files.length} files)` : ''}`}
                    </button>
                </div>
            )}

            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
                </div>
            )}
        </div>
    );
}
