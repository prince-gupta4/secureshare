const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
    {
        content: { type: String, default: '' },
        savedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const noteSchema = new mongoose.Schema(
    {
        slug: { type: String, unique: true, required: true, index: true },
        content: { type: String, default: '' },
        language: { type: String, default: 'plaintext' },
        passwordHash: { type: String, default: null },
        versions: { type: [versionSchema], default: [] },
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Cap version history at 5 entries
noteSchema.methods.pushVersion = function () {
    this.versions.push({ content: this.content, savedAt: new Date() });
    if (this.versions.length > 5) {
        this.versions = this.versions.slice(-5);
    }
};

module.exports = mongoose.model('Note', noteSchema);
