const crypto = require('crypto');
const {
    loadDB, withDB, noSave, getAuth, send, sendError, fail, httpError, readBody, clientIp,
    rateLimit, filterBadWords, parsePresence, toPublic, buildTree,
    findComment, findByOwn, removeSubtree,
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
            // One shared serializer (audit fix): same shape as the list,
            // including pinned, like, and (for admins) own/ip/user_agent.
            const { byParent } = buildTree(db.comments);
            return send(res, 200, toPublic(comment, byParent, Boolean(auth.admin)));
        }

        // Like a comment. The id is the comment's public uuid. One like per
        // IP per comment (audit fix): a repeat like returns the existing
        // like instead of inflating the count.
        if (req.method === 'POST') {
            const ip = clientIp(req);
            // Auth first, then the guest rate limit once (audit fix):
            // never inside the mutator, where retries would burn quota.
            const preDb = await loadDB();
            const preAuth = getAuth(req, preDb);
            if (!preAuth) {
                return sendError(res, 401, 'Invalid access key');
            }
            if (!preAuth.admin && !rateLimit(`like:${ip}`, 20, 60 * 1000)) {
                return sendError(res, 429, 'Terlalu banyak like. Coba lagi nanti.');
            }
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
            const ip = clientIp(req);
            const preDb = await loadDB();
            const preAuth = getAuth(req, preDb);
            if (!preAuth) {
                return sendError(res, 401, 'Invalid access key');
            }
            if (!preAuth.admin && !rateLimit(`like:${ip}`, 20, 60 * 1000)) {
                return sendError(res, 429, 'Terlalu banyak like. Coba lagi nanti.');
            }
            const removed = await withDB(async (db) => {
                const auth = getAuth(req, db);
                if (!auth) {
                    return noSave(null);
                }
                const isAdmin = Boolean(auth.admin);
                for (const comment of db.comments) {
                    const idx = (comment.likes || []).findIndex((l) => l.uuid === id);
                    if (idx >= 0) {
                        // Ownership check (audit fix m6): only the liker
                        // (same IP) or an admin may remove a like.
                        if (!isAdmin && comment.likes[idx].ip !== ip) {
                            return noSave(false);
                        }
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
            // Auth first (audit fix): unauthenticated requests get 401
            // before any body parsing runs.
            const preDb = await loadDB();
            if (!getAuth(req, preDb)) {
                return sendError(res, 401, 'Invalid access key');
            }
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
                        // Audit fix m1: an invalid presence must be a 400,
                        // not a silently dropped change (or a misleading
                        // "no change" error when nothing else changed).
                        if (newPresence === null) {
                            throw httpError(400, 'Konfirmasi kehadiran tidak valid.');
                        }
                    }
                    // Pinned comments: admin-only, root comments only, and
                    // at most one pinned comment at a time. A pin change
                    // counts as a real change for the no-change check below.
                    let pinChange = null;
                    if (body.pinned !== null && body.pinned !== undefined) {
                        if (typeof body.pinned !== 'boolean') {
                            throw httpError(400, 'Nilai pin tidak valid.');
                        }
                        if (!isAdmin) {
                            throw httpError(403, 'Hanya admin yang bisa menyematkan komentar.');
                        }
                        if (target.parent) {
                            throw httpError(400, 'Hanya komentar utama yang bisa disematkan.');
                        }
                        pinChange = body.pinned;
                    }
                    // A request that changes nothing is a client error, not
                    // a silent success (audit fix). This also covers the
                    // malformed-body-swallowed-to-{} case above.
                    if (text === target.comment && (newPresence === null || newPresence === target.presence) &&
                        (pinChange === null || pinChange === Boolean(target.pinned))) {
                        throw httpError(400, 'Tidak ada perubahan.');
                    }
                    target.comment = text;
                    if (newPresence !== null) {
                        target.presence = newPresence;
                    }
                    if (pinChange !== null) {
                        if (pinChange) {
                            for (const c of db.comments) {
                                c.pinned = false;
                            }
                        }
                        target.pinned = pinChange;
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
