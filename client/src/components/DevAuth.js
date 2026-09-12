'use client';

import { createContext, useContext, useState } from 'react';

const DevContext = createContext({
    devAuthenticated: false,
    devToken: null,
    devLogin: () => {},
    devLogout: () => {},
});

const TOKEN_KEY = 'securestore-dev-token';

function readStoredToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function DevProvider({ children }) {
    const [devToken, setDevToken] = useState(readStoredToken);

    const devLogin = (token) => {
        setDevToken(token);
        try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
    };

    const devLogout = () => {
        setDevToken(null);
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
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