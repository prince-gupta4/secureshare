const { nanoid } = require('nanoid');

/**
 * Generate a random 8-character alphanumeric slug.
 */
function generateSlug() {
    return nanoid(8);
}

module.exports = { generateSlug };
