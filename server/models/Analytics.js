const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    date: { type: String, unique: true, required: true }, // "YYYY-MM-DD"
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: [String], default: [] }, // hashed IPs
    totalFileSize: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    noteViews: { type: Number, default: 0 },
    fileViews: { type: Number, default: 0 },
});

module.exports = mongoose.model('Analytics', analyticsSchema);
