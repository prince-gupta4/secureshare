'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);

    const router = useRouter();
    const createNewNote = () => {
        const slug = nanoid(6);
        router.push(`/${slug}`);
    };

    return (
        <nav className="navbar">
            <Link href="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                SecureStore
            </Link>

            {/* Hamburger toggle — visible < 640px */}
            <button
                className="navbar-hamburger"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
            >
                {menuOpen ? '✕' : '☰'}
            </button>

            {/* Desktop links + Mobile dropdown */}
            <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                <button href="/" onClick={() => { setMenuOpen(false); createNewNote() }}>Notes</button>
                <Link href="/files" onClick={() => setMenuOpen(false)}>Files</Link>
                <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
                <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
                <Link href="/dev/login" onClick={() => setMenuOpen(false)} className="navbar-dev">🛠️ Dev</Link>
                <button className="theme-toggle" onClick={() => { toggleTheme(); setMenuOpen(false); }} title="Toggle theme">
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>
        </nav>
    );
}
