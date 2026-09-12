'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDev } from '@/components/DevAuth';
import { devAuthHeaders } from '@/components/DevAuth';

import api from '@/utils/api';
const PAGE_SIZE = 10;

function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString();
}

export default function DevContactPage() {
    const { devToken } = useDev();
    const [contacts, setContacts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(false);

    const offsetRef = useRef(0);

    const fetchPage = useCallback(async (offset, append) => {
        try {
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(offset));

            const res = await api.get(`/dev/contacts?${params}`, {
                headers: devAuthHeaders(devToken),
            });
            const data = res.data;
            setContacts(append ? [...contacts, ...data.contacts] : data.contacts);
            setTotal(data.total);
            setHasMore(data.hasMore);
            offsetRef.current = offset + data.contacts.length;
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [devToken, contacts]);

    useEffect(() => {
        fetchPage(0, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [devToken]);

    const loadMore = () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        fetchPage(offsetRef.current, true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this contact message?')) return;
        try {
            await api.delete(`/dev/contacts/${id}`, {
                headers: devAuthHeaders(devToken),
            });
            // Refresh current view
            setContacts(contacts.filter((c) => c._id !== id));
            setTotal(total - 1);
        } catch { /* ignore */ }
    };

    if (loading) {
        return (
            <div className="container">
                <p className="text-muted">Loading contacts...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="dev-page-header">
                <div>
                    <h1>👥 Contact Messages</h1>
                    <p className="text-muted text-sm">
                        {total} message{total !== 1 ? 's' : ''} received
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-error text-sm mb-2">{error}</div>}

            {contacts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="text-muted">No contact messages yet.</p>
                </div>
            ) : (
                <div className="dev-contacts">
                    {contacts.map((c) => (
                        <div className="card dev-contact-card" key={c._id}>
                            <div className="dev-contact-head">
                                <div>
                                    <div className="dev-contact-name">{c.name}</div>
                                    <a
                                        href={`mailto:${c.email}`}
                                        className="dev-contact-email"
                                    >
                                        {c.email}
                                    </a>
                                </div>
                                <div className="dev-contact-actions">
                                    <span className="text-muted text-sm">{fmtTime(c.createdAt)}</span>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(c._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <p className="dev-contact-msg">{c.message}</p>
                        </div>
                    ))}
                </div>
            )}

            {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
}