'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => { } });

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    // Apply saved theme immediately on mount (no FOUC guard needed — inline script in layout.js handles pre-hydration)
    useEffect(() => {
        const saved = localStorage.getItem('securestore-theme') || 'light';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('securestore-theme', next);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
