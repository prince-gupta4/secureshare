const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, trim: true, maxlength: 254 },
        message: { type: String, required: true, trim: true, maxlength: 5000 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Contact', ContactSchema);
