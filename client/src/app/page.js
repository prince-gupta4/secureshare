'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  const createNewNote = () => {
    const slug = nanoid(6);
    router.push(`/${slug}`);
  };

  return (
    <div className="container">
      <section className="hero">
        <h1>Share Notes & Files Instantly</h1>
        <p>
          Create real-time editable notes and transfer files through short links.
          No sign-up needed — just paste and share.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={createNewNote}>
            ✏️ New Note
          </button>
          <Link href="/files" className="btn btn-secondary btn-lg">
            📁 Transfer Files
          </Link>
        </div>
      </section>

      <section className="features container">
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Syncable Notepad</h3>
          <p>
            Real-time auto-save with version history. Open the same URL on any device
            and your notes stay in sync.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3>Ephemeral File Transfer</h3>
          <p>
            Upload files up to 10MB, auto-zip multiple files, and share via custom links
            with configurable expiry.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Password Protection</h3>
          <p>
            Lock notes with a password. Visitors see read-only until they
            enter the correct password to unlock editing.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>QR Code Sharing</h3>
          <p>
            Every note and file gets a shareable link with a QR code you can scan from
            any device.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💻</div>
          <h3>Syntax Highlighting</h3>
          <p>
            CodeMirror-powered editor with line numbers and highlighting for popular
            programming languages.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⏱️</div>
          <h3>Auto-Expire Files</h3>
          <p>
            Set file lifespan to 1 hour, 24 hours, or 7 days. Files are automatically
            cleaned up when they expire.
          </p>
        </div>
      </section>
    </div>
  );
}
