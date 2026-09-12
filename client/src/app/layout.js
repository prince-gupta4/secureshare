import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DevProvider } from '@/components/DevAuth';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'SecureStore — Instant Notes & File Sharing',
  description: 'Create syncable notes and share files instantly via short links and QR codes. No login required.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Apply saved theme BEFORE React hydrates — prevents dark-mode flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var t = localStorage.getItem('securestore-theme') || 'light';
                document.documentElement.setAttribute('data-theme', t);
              } catch (e) {}
            })();
          `,
        }} />
      </head>
      <body>
        <ThemeProvider>
          <DevProvider>
            <Navbar />
            <main>{children}</main>
            <footer className="footer">
              © {new Date().getFullYear()} SecureStore — Fast, private, no-login sharing.
            </footer>
          </DevProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}