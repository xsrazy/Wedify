const { Readable } = require('stream');

// GET /api/media/<name> — public streaming proxy for files uploaded
// from the dashboard. Files live in the private Blob store (flat
// media-<ts>-<rand>.<ext> names); this route streams them out with
// Range support so the music player can seek.
const BLOB_API = 'https://vercel.com/api/blob/';
const NAME_RE = /^media-\d+-[a-f0-9]+\.(webp|png|jpg|gif|mp3|ogg|m4a|aac)$/;
const MIME = {
    webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac',
};

module.exports = async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).end();
    }
    const name = String(req.query.name || '');
    if (!NAME_RE.test(name)) {
        return res.status(404).end();
    }
    try {
        const headers = {
            authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            'x-api-version': '11',
        };
        const listRes = await fetch(`${BLOB_API}?prefix=${encodeURIComponent(name)}&limit=10`, { headers });
        if (!listRes.ok) {
            // Map a real upstream 404 through instead of a generic 502
            // (audit fix); anything else stays a bad-gateway.
            return res.status(listRes.status === 404 ? 404 : 502).end();
        }
        const list = await listRes.json();
        const blob = (list.blobs || []).find((b) => b.pathname === name);
        if (!blob) {
            return res.status(404).end();
        }
        const fetchHeaders = { authorization: headers.authorization, 'cache-control': 'no-cache' };
        if (req.headers.range) {
            fetchHeaders.range = req.headers.range;
        }
        const fileRes = await fetch(blob.url, { headers: fetchHeaders });
        if (!fileRes.ok && fileRes.status !== 206) {
            // Map real upstream 404/416 through instead of a generic 502
            // (audit fix): a missing file is a 404, an unsatisfiable
            // Range is a 416, not a bad gateway.
            const mapped = fileRes.status === 404 || fileRes.status === 416 ? fileRes.status : 502;
            return res.status(mapped).end();
        }
        const ext = name.split('.').pop();
        res.status(fileRes.status);
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Accept-Ranges', 'bytes');
        for (const h of ['content-length', 'content-range']) {
            const v = fileRes.headers.get(h);
            if (v) {
                res.setHeader(h, v);
            }
        }
        if (req.method === 'HEAD' || !fileRes.body) {
            return res.end();
        }
        Readable.fromWeb(fileRes.body).pipe(res);
    } catch (err) {
        console.error(err);
        return res.status(500).end();
    }
};
