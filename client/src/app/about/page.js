export default function AboutPage() {
    return (
        <div className="container-sm">
            <div className="page-header">
                <h1>About SecureStore</h1>
                <p>
                    Fast, private, no-login text and file sharing — built for simplicity.
                </p>
            </div>

            <div className="about-grid">
                <div className="card">
                    <h3>🎯 Our Mission</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        SecureStore was built to make sharing text and files as effortless as possible.
                        No accounts, no tracking — just instant sharing through short links and QR codes.
                    </p>
                </div>
                <div className="card">
                    <h3>🔒 Privacy First</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        We don&apos;t collect personal information. Files expire automatically, and notes
                        can be password-protected. Your data is yours.
                    </p>
                </div>
                <div className="card">
                    <h3>⚡ How It Works</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        Create a note and it gets a unique URL. Edit from any device — changes sync
                        in real-time. Upload files and get an instant shareable link with a QR code.
                    </p>
                </div>
                <div className="card">
                    <h3>🛠️ Technology</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        Built with Next.js and Express.js, with MongoDB for data persistence.
                        CodeMirror-powered editor with syntax highlighting for developers.
                    </p>
                </div>
            </div>
        </div>
    );
}
