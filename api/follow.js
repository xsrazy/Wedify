const {
    loadDB, withDB, noSave, getAuth, send, sendError, fail, readBody,
    clientIp, rateLimit, countFollows,
} = require('./_lib');

// POST /api/follow { artist: 'groom' | 'bride' } -> toggles this
// visitor's follow (one per IP per artist, like the comment likes).
// Returns { following, count } for that artist.
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }
    try {
        // Auth first (audit fix): unauthenticated requests get 401
        // before any body validation runs.
        const preDb = await loadDB();
        const preAuth = getAuth(req, preDb);
        if (!preAuth) {
            return sendError(res, 401, 'Invalid access key');
        }
        const body = await readBody(req);
        const artist = body.artist === 'bride' ? 'bride' : body.artist === 'groom' ? 'groom' : null;
        if (!artist) {
            return sendError(res, 400, 'Artis tidak valid.');
        }
        const ip = clientIp(req);
        // Guest rate limit checked once here (audit fix), never inside
        // the mutator where retries would burn quota. Admins exempt.
        if (!preAuth.admin && !rateLimit(`follow:${ip}`, 30, 60 * 1000)) {
            return sendError(res, 429, 'Terlalu cepat. Coba lagi sebentar.');
        }
        const result = await withDB(async (db) => {
            const auth = getAuth(req, db);
            if (!auth) {
                return noSave(null);
            }
            db.follows = db.follows || [];
            const idx = db.follows.findIndex((f) => f.artist === artist && f.ip === ip);
            let following;
            if (idx >= 0) {
                db.follows.splice(idx, 1);
                following = false;
            } else {
                db.follows.push({ artist, ip, created_at: new Date().toISOString() });
                following = true;
            }
            return { following, count: countFollows(db, artist) };
        });
        if (result === null) {
            return sendError(res, 401, 'Invalid access key');
        }
        return send(res, 200, result);
    } catch (err) {
        return fail(res, err);
    }
};
