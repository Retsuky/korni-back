/**
 * URL загруженного файла для отдачи клиенту.
 */
function buildUploadUrl(req, filename) {
    if (process.env.PUBLIC_UPLOAD_BASE) {
        return `${String(process.env.PUBLIC_UPLOAD_BASE).replace(/\/$/, '')}/uploads/${filename}`;
    }
    const host = req.get('host') || 'localhost:3020';
    const proto = req.protocol || 'http';
    return `${proto}://${host}/uploads/${filename}`;
}

module.exports = { buildUploadUrl };
