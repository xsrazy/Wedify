const crypto = require('crypto');
const { loadDB, getAuth, send, sendError, fail, readBody, rateLimit, clientIp } = require('./_lib');

const BLOB_API = 'https://vercel.com/api/blob/';
const MAX_BYTES = 3 * 1024 * 1024; // Vercel function body cap is ~4.5 MB; base64 inflates ~33%.

const TYPES = {
    image: {
        'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
    },
    audio: {
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/ogg': 'ogg',
        'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac',
    },
};

// POST /api/upload (admin only) { kind: 'image'|'audio', contentType, dataBase64 }
// Stores the file in the private Blob store under a flat media-<ts>-<rand>
// name and returns the public proxy path /api/media/<name>.
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }
    try {
        const db = await loadDB();
        const auth = getAuth(req, db);
        if (!auth || !auth.admin) {
            return sendError(res, 401, 'Unauthorized');
        }
        if (!rateLimit(`upload:${clientIp(req)}`, 30, 60 * 1000)) {
            return sendError(res, 429, 'Terlalu banyak upload. Coba lagi nanti.');
        }
        const body = await readBody(req);
        const kind = body.kind === 'audio' ? 'audio' : body.kind === 'image' ? 'image' : null;
        const table = kind ? TYPES[kind] : null;
        const ext = table ? table[String(body.contentType || '').toLowerCase()] : null;
        if (!kind || !ext) {
            return sendError(res, 400, 'Jenis file tidak didukung.');
        }
        const data = Buffer.from(String(body.dataBase64 || ''), 'base64');
        if (data.length === 0) {
            return sendError(res, 400, 'File kosong.');
        }
        if (data.length > MAX_BYTES) {
            return sendError(res, 400, 'Ukuran file melebihi batas 3 MB.');
        }
        const name = `media-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
        const put = await fetch(`${BLOB_API}?pathname=${encodeURIComponent(name)}`, {
            method: 'PUT',
            headers: {
                authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
                'x-api-version': '11',
                'x-vercel-blob-access': 'private',
                'x-content-type': String(body.contentType).toLowerCase(),
                'x-add-random-suffix': '0',
                'x-cache-control-max-age': '0',
            },
            body: data,
        });
        if (!put.ok) {
            throw new Error(`blob put failed: ${put.status}`);
        }
        return send(res, 201, { url: `/api/media/${name}`, name, size: data.length }, 201);
    } catch (err) {
        return fail(res, err);
    }
};
