const { log } = require('../utils/logger');

/**
 * Request logging middleware
 * Captures: method, route, IP, user-agent, device info, status, duration, errors
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Capture the original end function to log response details
    const originalSend = res.send;

    res.send = function (body) {
        const duration = Date.now() - startTime;
        const userAgent = req.get('User-Agent') || 'unknown';

        // Parse device info from user-agent
        let device = 'unknown';
        let browser = 'unknown';
        let os = 'unknown';

        if (userAgent) {
            // Detect OS
            if (userAgent.includes('Windows')) os = 'Windows';
            else if (userAgent.includes('Mac OS')) os = 'macOS';
            else if (userAgent.includes('Android')) os = 'Android';
            else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
            else if (userAgent.includes('Linux')) os = 'Linux';

            // Detect browser
            if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
            else if (userAgent.includes('Firefox')) browser = 'Firefox';
            else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
            else if (userAgent.includes('Edg')) browser = 'Edge';
            else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

            // Detect device type
            if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) device = 'Mobile';
            else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) device = 'Tablet';
            else device = 'Desktop';
        }

        const logEntry = {
            level: res.statusCode >= 400 ? 'ERROR' : 'INFO',
            method: req.method,
            route: req.originalUrl || req.url,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent,
            device,
            browser,
            os,
            referer: req.get('Referer') || null,
            host: req.get('Host') || null,
            contentType: req.get('Content-Type') || null,
            accept: req.get('Accept') || null,
            body: req.method !== 'GET' && req.body ? JSON.stringify(req.body).slice(0, 500) : null,
        };

        // Add error info if status code is an error
        if (res.statusCode >= 400) {
            try {
                const parsed = typeof body === 'string' ? JSON.parse(body) : body;
                logEntry.error = parsed?.error || parsed?.message || 'Unknown error';
            } catch {
                logEntry.error = typeof body === 'string' ? body.slice(0, 200) : 'Unknown error';
            }
        }

        log(logEntry);

        // Call the original send
        originalSend.call(this, body);
    };

    next();
}

module.exports = { requestLogger };