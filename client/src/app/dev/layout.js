'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDev } from '@/components/DevAuth';

const PROTECTED = ['/dev/log', '/dev/contact', '/dev/analytics'];

export default function DevLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { devAuthenticated, devLogout } = useDev();
    const [ready, setReady] = useState(false);

    const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));

    // On mount only: reveal real content. Before that, server and client
    // render the same loading shell → no hydration mismatch.
    useEffect(() => {
        setReady(true);
        if (isProtected && !devAuthenticated) {
            router.replace('/dev/login');
        }
    }, [devAuthenticated, isProtected, router]);

    // Consistent SSR + initial client render
    if (!ready) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <p className="text-muted">Loading…</p>
            </div>
        );
    }

    // Login page renders without the dev toolbar
    if (pathname === '/dev/login') {
        return children;
    }

    if (isProtected && !devAuthenticated) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <p className="text-muted">Redirecting…</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="dev-toolbar">
                <Link href="/dev/log" className="btn btn-ghost btn-sm">📊 Log</Link>
                <Link href="/dev/contact" className="btn btn-ghost btn-sm">👥 Contact</Link>
                <Link href="/dev/analytics" className="btn btn-ghost btn-sm">📈 Analytics</Link>
                <button className="btn btn-ghost btn-sm" onClick={devLogout}>🚪 Logout</button>
            </div>
            {children}
        </div>
    );
}