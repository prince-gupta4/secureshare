const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logsDir, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log an entry to the log file
 * @param {Object} entry - Log entry object
 */
function log(entry) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        ...entry,
    };

    const line = JSON.stringify(logEntry) + '\n';

    // Append to log file (create if doesn't exist)
    fs.appendFileSync(logFile, line, 'utf8');

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
        const level = entry.level || 'INFO';

        console.log(
            `[${timestamp}] [${level}] ${entry.method} ${entry.route} ${entry.statusCode} - ${entry.duration}`
        );
    }
}

/**
 * Read logs from the file
 * @param {number} limit - Number of logs to return (most recent)
 * @returns {Array} Array of log entries
 */
function readLogs(limit = 200) {
    try {
        if (!fs.existsSync(logFile)) {
            return [];
        }

        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);

        // Parse each line as JSON
        const logs = lines
            .map((line) => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        // Return most recent logs
        return logs.slice(-limit).reverse();
    } catch (err) {
        console.error('Failed to read logs:', err.message);
        return [];
    }
}

/**
 * Clear all logs
 */
function clearLogs() {
    try {
        fs.writeFileSync(logFile, '', 'utf8');
        return true;
    } catch (err) {
        console.error('Failed to clear logs:', err.message);
        return false;
    }
}

module.exports = { log, readLogs, clearLogs, logFile };