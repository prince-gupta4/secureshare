const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { deleteFromCloudinary } = require('../utils/cloudinary');

const fileSchema = new mongoose.Schema({
    slug: { type: String, unique: true, required: true, index: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    cloudinaryUrl: { type: String, default: null },
    cloudinaryPublicId: { type: String, default: null },
    fileSize: { type: Number, required: true },
    downloads: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

// TTL index — MongoDB automatically deletes docs when expiresAt is reached
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Shared cleanup helper — removes local file + Cloudinary asset for a doc.
 * Safe to call multiple times; swallows individual errors.
 */
async function cleanupFileAssets(fileDoc) {
    try {
        const fullPath = path.resolve(__dirname, '..', fileDoc.filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error('Local file cleanup error:', err.message);
    }
    try {
        if (fileDoc.cloudinaryPublicId) {
            await deleteFromCloudinary(fileDoc.cloudinaryPublicId);
        }
    } catch (err) {
        console.error('Cloudinary cleanup error:', err.message);
    }
}

// Document delete: doc.deleteOne()
fileSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        await cleanupFileAssets(this);
        next();
    } catch (err) {
        console.error('File cleanup error:', err.message);
        next();
    }
});

// Query delete: File.deleteOne({ slug }) / File.findOneAndDelete(...)
fileSchema.pre('deleteOne', { document: false, query: true }, async function (next) {
    try {
        const filter = this.getFilter();
        const docs = await this.model.find(filter);
        await Promise.all(docs.map(cleanupFileAssets));
        next();
    } catch (err) {
        console.error('Query delete cleanup error:', err.message);
        next();
    }
});

fileSchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) await cleanupFileAssets(doc);
        next();
    } catch (err) {
        console.error('findOneAndDelete cleanup error:', err.message);
        next();
    }
});

module.exports = mongoose.model('File', fileSchema);