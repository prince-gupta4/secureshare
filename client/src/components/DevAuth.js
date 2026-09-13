'use client';

import { createContext, useContext, useState } from 'react';

const DevContext = createContext({
    devAuthenticated: false,
    devToken: null,
    devLogin: () => { },
    devLogout: () => { },
});

const TOKEN_KEY = 'securestore-dev-token';

function readStoredToken() {
    if (typeof window === 'undefined') return null;
    try {
        const match = document.cookie.match(new RegExp('(^| )securestore-dev-token=([^;]+)'));
        if (match) return match[2];
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function DevProvider({ children }) {
    const [devToken, setDevToken] = useState(readStoredToken);

    const devLogin = (token) => {
        setDevToken(token);
        try {
            localStorage.setItem(TOKEN_KEY, token);
            document.cookie = `securestore-dev-token=${token}; path=/; max-age=604800;`;
        } catch { /* ignore */ }
    };

    const devLogout = () => {
        setDevToken(null);
        try {
            localStorage.removeItem(TOKEN_KEY);
            document.cookie = `securestore-dev-token=; path=/; max-age=0;`;
        } catch { /* ignore */ }
    };

    const value = {
        devAuthenticated: !!devToken,
        devToken,
        devLogin,
        devLogout,
    };

    return <DevContext.Provider value={value}>{children}</DevContext.Provider>;
}

export const useDev = () => useContext(DevContext);

export function devAuthHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}