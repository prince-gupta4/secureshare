'use client';

import { useState } from 'react';

import api from '@/utils/api';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            await api.post('/contacts', form);
            setSent(true);
            setForm({ name: '', email: '', message: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Network error. Please try again later.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="container-sm">
            <div className="page-header">
                <h1>Contact Us</h1>
                <p>Have a question or feedback? We&apos;d love to hear from you.</p>
            </div>

            <div className="contact-form card">
                {sent ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3>Message Sent!</h3>
                        <p className="text-muted text-sm mt-1">
                            ✅ We usually reply within <strong>24 hours</strong>.
                        </p>
                        <p className="text-muted text-sm">
                            Thank you for reaching out — we'll get back to you soon.
                        </p>
                        <button className="btn btn-secondary mt-2" onClick={() => setSent(false)}>
                            Send Another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                className="input"
                                required
                                placeholder="Your name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                className="input"
                                type="email"
                                required
                                placeholder="your@email.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                className="textarea"
                                required
                                placeholder="What's on your mind?"
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                            />
                        </div>
                        {error && (
                            <div className="alert alert-error text-sm mb-2">{error}</div>
                        )}
                        <button className="btn btn-primary btn-lg w-full" type="submit" disabled={sending}>
                            {sending ? '⏳ Sending...' : '📧 Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
