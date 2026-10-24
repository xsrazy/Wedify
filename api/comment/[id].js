const crypto = require('crypto');
const {
    loadDB, withDB, noSave, getAuth, send, sendError, fail, httpError, readBody, clientIp,
    filterBadWords, parsePresence, findComment, findByOwn, removeSubtree, formatDate,
} = require('../_lib');

const MAX_COMMENT = 3000;

module.exports = async (req, res) => {
    try {
        const id = String(req.query.id || '');

        // Show one comment (used by the edit form).
        if (req.method === 'GET') {
            const db = await loadDB();
            const auth = getAuth(req, db);
            if (!auth) {
                return sendError(res, 401, 'Invalid access key');
            }
            const comment = findComment(db, id);
            if (!comment) {
                return sendError(res, 404, 'Komentar tidak ditemukan.');
            }
            return send(res, 200, {
                name: comment.name,
                presence: comment.presence,
                comment: comment.comment,
                is_admin: comment.is_admin,
                created_at: formatDate(comment.created_at),
            });
        }

        // Like a comment. The id is the comment's public uuid. One like per
        // IP per comment (audit fix): a repeat like returns the existing
        // like instead of inflating the count.
        if (req.method === 'POST') {
            const ip = clientIp(req);
            const likeUuid = await withDB(async (db) => {
                const auth = getAuth(req, db);
                if (!auth) {
                    return noSave(null);
                }
                const comment = findComment(db, id);
                if (!comment) {
                    return noSave(undefined);
                }
                comment.likes = comment.likes || [];
                const existing = comment.likes.find((l) => l.ip === ip);
                if (existing) {
                    return noSave(existing.uuid);
                }
                const like = {
                    uuid: crypto.randomUUID(),
                    ip,
                    created_at: new Date().toISOString(),
                };
                comment.likes.push(like);
                return like.uuid;
            });
            if (likeUuid === null) {
                return sendError(res, 401, 'Invalid access key');
            }
            if (likeUuid === undefined) {
                return sendError(res, 404, 'Komentar tidak ditemukan.');
            }
            return send(res, 201, { uuid: likeUuid });
        }

        // Unlike. The id is the like uuid returned when liking.
        if (req.method === 'PATCH') {
            const removed = await withDB(async (db) => {
                const auth = getAuth(req, db);
                if (!auth) {
                    return noSave(null);
                }
                for (const comment of db.comments) {
                    const idx = (comment.likes || []).findIndex((l) => l.uuid === id);
                    if (idx >= 0) {
                        comment.likes.splice(idx, 1);
                        return true;
                    }
                }
                return noSave(false);
            });
            if (removed === null) {
                return sendError(res, 401, 'Invalid access key');
            }
            return send(res, 200, { status: removed });
        }

        if (req.method === 'PUT' || req.method === 'DELETE') {
            const body = req.method === 'PUT' || req.method === 'DELETE' ? await readBody(req).catch(() => ({})) : {};
            const status = await withDB(async (db) => {
                const auth = getAuth(req, db);
                if (!auth) {
                    return noSave(null);
                }
                const isAdmin = Boolean(auth.admin);
                // Edit / delete resolve by the secret "own" token; admins
                // may use the public uuid.
                const target = findByOwn(db, id) || (isAdmin ? findComment(db, id) : null);
                if (!target) {
                    throw httpError(404, 'Komentar tidak ditemukan.');
                }
                if (req.method === 'PUT') {
                    if (!db.settings.can_edit && !isAdmin) {
                        throw httpError(403, 'Mengubah komentar sedang dimatikan.');
                    }
                    let text = String(body.comment ?? target.comment).trim();
                    if (text.length === 0) {
                        throw httpError(400, 'Komentar tidak boleh kosong.');
                    }
                    if (text.length > MAX_COMMENT) {
                        throw httpError(400, 'Komentar terlalu panjang.');
                    }
                    if (db.settings.is_filter) {
                        text = filterBadWords(text);
                    }
                    let newPresence = null;
                    if (body.presence !== null && body.presence !== undefined) {
                        newPresence = parsePresence(body.presence);
                    }
                    // A request that changes nothing is a client error, not
                    // a silent success (audit fix). This also covers the
                    // malformed-body-swallowed-to-{} case above.
                    if (text === target.comment && (newPresence === null || newPresence === target.presence)) {
                        throw httpError(400, 'Tidak ada perubahan.');
                    }
                    target.comment = text;
                    if (newPresence !== null) {
                        target.presence = newPresence;
                    }
                    return true;
                }
                if (!db.settings.can_delete && !isAdmin) {
                    throw httpError(403, 'Menghapus komentar sedang dimatikan.');
                }
                removeSubtree(db, target.uuid);
                return true;
            });
            if (status === null) {
                return sendError(res, 401, 'Invalid access key');
            }
            return send(res, 200, { status });
        }

        return sendError(res, 405, 'Method not allowed');
    } catch (err) {
        return fail(res, err);
    }
};
