'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { nanoid } from 'nanoid';
import { useTheme } from '@/components/ThemeProvider';

import api from '@/utils/api';

function trackView(type) {
    try {
        api.post('/analytics/view', { type });
    } catch { /* fire-and-forget */ }
}

export default function NotePage() {
    return (
        <Suspense fallback={
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <p className="text-muted">Loading note instance...</p>
            </div>
        }>
            <NoteContent />
        </Suspense>
    );
}

function NoteContent() {
    const params = useParams();
    const slug = params.slug;
    const router = useRouter();
    const { theme } = useTheme();
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const lastSavedContent = useRef('');
    const isDirty = useRef(false);

    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Added error state
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [unsaved, setUnsaved] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [password, setPassword] = useState('');
    const [language, setLanguage] = useState('plaintext');

    // Modals
    const [showShare, setShowShare] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showMigrate, setShowMigrate] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [versions, setVersions] = useState([]);
    const [newSlug, setNewSlug] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Fetch Note ────────────────────────────
    useEffect(() => {
        const fetchNote = async () => {
            try {
                // Reset error state on new fetch
                setError(null);
                const res = await api.get(`/notes/${slug}`);
                const data = res.data;
                setContent(data.content || '');
                lastSavedContent.current = data.content || '';
                setIsLocked(data.isPasswordProtected);
                setLanguage(data.language || 'plaintext');
                trackView('note');
            } catch (err) {
                console.error('Failed to fetch note:', err);
                // Extract error message from API response or use a default message
                setError(err.response?.data?.error || 'Failed to load the note. It may not exist or the server is down.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchNote();
    }, [slug]);

    // ── Initialize CodeMirror ─────────────────
    useEffect(() => {
        if (isLoading || error || (isLocked && !isUnlocked)) return;

        let destroyed = false;

        const initEditor = async () => {
            const { EditorView, basicSetup } = await import('codemirror');
            const { EditorState } = await import('@codemirror/state');
            const { oneDark } = await import('@codemirror/theme-one-dark');

            if (destroyed || !editorRef.current) return;

            // Clear previous editor
            editorRef.current.innerHTML = '';

            const currentTheme = document.documentElement.getAttribute('data-theme');

            const extensions = [
                basicSetup,
                EditorView.lineWrapping,
                ...(currentTheme === 'dark' ? [oneDark] : []),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newContent = update.state.doc.toString();
                        setContent(newContent);
                        isDirty.current = true;
                        setUnsaved(true);
                    }
                }),
                EditorState.languageData.of(() => [{ spellcheck: true }]),
            ];

            // Add language extension
            try {
                if (language === 'javascript' || language === 'js') {
                    const { javascript } = await import('@codemirror/lang-javascript');
                    extensions.push(javascript());
                } else if (language === 'python' || language === 'py') {
                    const { python } = await import('@codemirror/lang-python');
                    extensions.push(python());
                } else if (language === 'html') {
                    const { html } = await import('@codemirror/lang-html');
                    extensions.push(html());
                } else if (language === 'css') {
                    const { css } = await import('@codemirror/lang-css');
                    extensions.push(css());
                } else if (language === 'json') {
                    const { json } = await import('@codemirror/lang-json');
                    extensions.push(json());
                } else if (language === 'markdown' || language === 'md') {
                    const { markdown } = await import('@codemirror/lang-markdown');
                    extensions.push(markdown());
                }
            } catch (e) {
                console.warn('Language extension not available:', language);
            }

            const state = EditorState.create({
                doc: content,
                extensions,
            });

            const view = new EditorView({
                state,
                parent: editorRef.current,
            });

            viewRef.current = view;
        };

        initEditor();

        return () => {
            destroyed = true;
            if (viewRef.current) {
                viewRef.current.destroy();
                viewRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, error, isLocked, isUnlocked, language, theme]);

    // ── Manual Save ───────────────────────────
    const handleSave = useCallback(async () => {
        if (saving) return;
        setSaving(true);
        try {
            const currentContent = viewRef.current
                ? viewRef.current.state.doc.toString()
                : content;
            await api.put(`/notes/${slug}`, { content: currentContent, language });
            lastSavedContent.current = currentContent;
            isDirty.current = false;
            setUnsaved(false);
            showToast('Saved!');
        } catch (err) {
            console.error('Save failed:', err);
            showToast('Save failed', 'error');
        } finally {
            setSaving(false);
        }
    }, [slug, content, language, saving]);

    // ── Get Latest ────────────────────────────
    const handleGetLatest = useCallback(async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const res = await api.get(`/notes/${slug}`);
            const data = res.data;
            const remoteContent = data.content || '';
            lastSavedContent.current = remoteContent;
            setContent(remoteContent);
            setUnsaved(false);
            isDirty.current = false;
            if (viewRef.current) {
                const currentDoc = viewRef.current.state.doc.toString();
                if (currentDoc !== remoteContent) {
                    viewRef.current.dispatch({
                        changes: {
                            from: 0,
                            to: currentDoc.length,
                            insert: remoteContent,
                        },
                    });
                }
            }
            showToast('Updated with latest version!');
        } catch (err) {
            showToast('Failed to get latest', 'error');
        } finally {
            setRefreshing(false);
        }
    }, [slug, refreshing]);

    // ── Ctrl+S keyboard shortcut ──────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // ── Password Verify ───────────────────────
    const handleVerifyPassword = async () => {
        try {
            const res = await api.post(`/notes/${slug}/verify`, { password });
            const data = res.data;
            if (data.unlocked) {
                setIsUnlocked(true);
                setPassword('');
            } else {
                showToast('Incorrect password', 'error');
            }
        } catch {
            showToast('Failed to verify password', 'error');
        }
    };

    // ── Set Password ──────────────────────────
    const handleSetPassword = async () => {
        try {
            const body = { password: newPassword || null };
            if (isLocked) body.currentPassword = currentPassword;

            const res = await api.post(`/notes/${slug}/password`, body);
            const data = res.data;
            setIsLocked(data.isPasswordProtected);
            setShowPassword(false);
            setNewPassword('');
            setCurrentPassword('');
            showToast(data.isPasswordProtected ? 'Password set!' : 'Password removed!');
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to set password', 'error');
        }
    };

    // ── Migrate Slug ──────────────────────────
    const handleMigrate = async () => {
        if (!newSlug.trim()) return;
        try {
            const res = await api.put(`/notes/${slug}/migrate`, { newSlug: newSlug.trim() });
            const data = res.data;
            showToast('URL changed!');
            router.push(`/${data.newSlug}`);
            setShowMigrate(false);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to migrate', 'error');
        }
    };

    // ── Version History ───────────────────────
    const loadVersions = async () => {
        try {
            const res = await api.get(`/notes/${slug}/versions`);
            const data = res.data;
            setVersions(data.versions || []);
            setShowVersions(true);
        } catch {
            showToast('Failed to load versions', 'error');
        }
    };

    const restoreVersion = (versionContent) => {
        setContent(versionContent);
        if (viewRef.current) {
            const currentDoc = viewRef.current.state.doc.toString();
            viewRef.current.dispatch({
                changes: { from: 0, to: currentDoc.length, insert: versionContent },
            });
        }
        setUnsaved(true);
        isDirty.current = true;
        setShowVersions(false);
        showToast('Version restored — click Save to keep it.');
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    if (isLoading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <p className="text-muted">Loading note...</p>
            </div>
        );
    }

    // ── Error View ────────────────────────────
    if (error) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: 'var(--error-color, #dc3545)', marginBottom: '1rem' }}>⚠️ Error</h3>
                    <p className="text-muted">{error}</p>
                </div>
                <button className="btn btn-primary" onClick={() => router.push('/')}>
                    Go back home
                </button>
            </div>
        );
    }

    // ── Locked View ───────────────────────────
    if (isLocked && !isUnlocked) {
        return (
            <div className="container">
                <div className="toolbar">
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/')}>
                        ✏️ New Note
                    </button>
                </div>
                <div className="editor-wrapper">
                    <div className="lock-overlay">
                        <div className="lock-icon">🔒</div>
                        <h3>This note is password-protected</h3>
                        <p>Enter the password to unlock editing capabilities.</p>
                        <div className="lock-form">
                            <input
                                className="input"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                            />
                            <button className="btn btn-primary" onClick={handleVerifyPassword}>
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-group">
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        const s = nanoid(6);
                        router.push(`/${s}`);
                    }}>
                        ✏️ New
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowMigrate(true)}>
                        🔗 URL
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowShare(true)}>
                        📤 Share
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowPassword(true)}>
                        {isLocked ? '🔓 Pwd' : '🔒 Lock'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={loadVersions}>
                        📜 History
                    </button>
                </div>

                <div className="divider" />

                <div className="toolbar-group editor-actions">
                    <select
                        className="select toolbar-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="plaintext">Plain Text</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                    </select>

                    <button
                        className="btn btn-ghost btn-sm toolbar-action"
                        onClick={handleGetLatest}
                        disabled={refreshing}
                        title="Get latest from server"
                    >
                        <span className="action-icon">
                            {refreshing ? '⏳' : '🔄'}
                        </span>
                        <span className="btn-label">Latest</span>
                    </button>

                    <button
                        className={`btn btn-sm toolbar-action ${unsaved ? 'btn-primary' : 'btn-ghost'
                            }`}
                        onClick={handleSave}
                        disabled={saving}
                        title="Save (Ctrl+S)"
                    >
                        <span className="action-icon">
                            {saving ? '⏳' : '💾'}
                        </span>
                        <span className="btn-label">Save</span>
                    </button>
                </div>

                <span className={`save-indicator ${saving ? 'saving' : unsaved ? 'dirty' : ''}`}>
                    <span className="dot" />
                    {saving ? 'Saving...' : unsaved ? 'Unsaved' : 'Saved'}
                </span>
            </div>

            {/* Editor */}
            <div className="editor-wrapper">
                <div ref={editorRef} spellCheck="true" />
            </div>

            {/* ── Share Modal ─────────────────── */}
            {showShare && (
                <div className="modal-overlay" onClick={() => setShowShare(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>📤 Share this note</h3>
                        <label>Shareable Link</label>
                        <div className="flex gap-1">
                            <input className="input" value={shareUrl} readOnly />
                            <button className="btn btn-primary btn-sm" onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                showToast('Link copied!');
                            }}>
                                Copy
                            </button>
                        </div>
                        <div className="qr-container">
                            <QRCodeSVG value={shareUrl} size={180} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowShare(false)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => {
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
                                    link.download = `securestore-qr-${slug}.png`;
                                    link.href = canvas.toDataURL('image/png');
                                    link.click();
                                    showToast('QR downloaded!');
                                };
                                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                            }}>
                                📥 Download QR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Password Modal ──────────────── */}
            {showPassword && (
                <div className="modal-overlay" onClick={() => setShowPassword(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{isLocked ? '🔓 Change / Remove Password' : '🔒 Set Password'}</h3>
                        {isLocked && (
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>{isLocked ? 'New Password (leave empty to remove)' : 'Password'}</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="Enter password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowPassword(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSetPassword}>
                                {isLocked ? (newPassword ? 'Update' : 'Remove') : 'Set Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Migrate Modal ───────────────── */}
            {showMigrate && (
                <div className="modal-overlay" onClick={() => setShowMigrate(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>🔗 Change URL</h3>
                        <p className="text-sm text-muted mb-2">
                            Current: <strong>/{slug}</strong>
                        </p>
                        <div className="form-group">
                            <label>New URL slug</label>
                            <input
                                className="input"
                                placeholder="my-custom-url"
                                value={newSlug}
                                onChange={(e) => setNewSlug(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleMigrate()}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowMigrate(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleMigrate}>
                                Migrate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Version History Modal ────────── */}
            {showVersions && (
                <div className="modal-overlay" onClick={() => setShowVersions(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>📜 Version History</h3>
                        {versions.length === 0 ? (
                            <p className="text-muted text-sm">No saved versions yet.</p>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {versions.slice().reverse().map((v, i) => (
                                    <div key={i} className="file-item">
                                        <div>
                                            <div className="file-item-name">Version {versions.length - i}</div>
                                            <div className="file-item-size">
                                                {new Date(v.savedAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => restoreVersion(v.content)}>
                                            Restore
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowVersions(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ────────────────────────── */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
                </div>
            )}
        </div>
    );
}