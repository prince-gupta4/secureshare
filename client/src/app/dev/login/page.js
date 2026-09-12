'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDev } from '@/components/DevAuth';

const API = '/api';

export default function DevLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { devLogin } = useDev();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/dev/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Invalid password');
                return;
            }
            devLogin(data.token);
            router.push('/dev/log');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-sm">
            <div className="page-header">
                <h1>🛠️ Developer Console</h1>
                <p>Authenticated access to logs, contacts, and analytics.</p>
            </div>

            <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                        <label htmlFor="dev-password">Dev Password</label>
                        <input
                            id="dev-password"
                            className="input"
                            type="password"
                            placeholder="Enter dev password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {error && (
                        <div className="alert alert-error text-sm mb-2">{error}</div>
                    )}
                    <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                        {loading ? '⏳ Checking...' : '🔐 Unlock Console'}
                    </button>
                </form>
            </div>
        </div>
    );
}