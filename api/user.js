const { loadDB, withDB, noSave, getAuth, hashPassword, verifyPassword, send, sendError, fail, httpError, readBody, defaultSite } = require('./_lib');

module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const db = await loadDB();
            const auth = getAuth(req, db);
            if (!auth || !auth.admin) {
                return sendError(res, 401, 'Unauthorized');
            }
            const s = db.settings;
            return send(res, 200, {
                name: s.name,
                email: s.email,
                access_key: s.access_key,
                is_filter: s.is_filter,
                can_reply: s.can_reply,
                can_edit: s.can_edit,
                can_delete: s.can_delete,
                site: s.site || defaultSite(),
            });
        }

        if (req.method === 'PATCH') {
            const body = await readBody(req);
            const result = await withDB(async (db) => {
                const auth = getAuth(req, db);
                if (!auth || !auth.admin) {
                    return noSave(null);
                }
                const s = db.settings;
                if (body.old_password !== undefined || body.new_password !== undefined) {
                    // Password change: wrong old password is a 401 (audit
                    // fix M1), not a 200 {status:false} that the dashboard
                    // could mistake for success.
                    if (!body.old_password || !body.new_password) {
                        throw httpError(400, 'Password lama dan baru wajib diisi.');
                    }
                    if (!verifyPassword(body.old_password, s.password)) {
                        throw httpError(401, 'Password lama salah.');
                    }
                    if (body.new_password.length < 8) {
                        throw httpError(400, 'Password baru minimal 8 karakter.');
                    }
                    s.password = hashPassword(body.new_password);
                    // Revoke every previously issued admin token (audit fix).
                    s.token_version = (s.token_version ?? 0) + 1;
                }
                if (typeof body.name === 'string' && body.name.trim().length > 0) {
                    s.name = body.name.trim();
                }
                if (typeof body.filter === 'boolean') {
                    s.is_filter = body.filter;
                }
                if (typeof body.can_reply === 'boolean') {
                    s.can_reply = body.can_reply;
                }
                if (typeof body.can_edit === 'boolean') {
                    s.can_edit = body.can_edit;
                }
                if (typeof body.can_delete === 'boolean') {
                    s.can_delete = body.can_delete;
                }
                // Site content: whitelist-merge string fields only, so
                // the dashboard form can never smuggle unexpected keys
                // or non-string values into the stored document.
                if (body.site && typeof body.site === 'object' && !Array.isArray(body.site)) {
                    const allowed = Object.keys(defaultSite());
                    const current = (s.site && typeof s.site === 'object') ? s.site : {};
                    for (const key of allowed) {
                        const value = body.site[key];
                        if (typeof value === 'string' && value.length <= 6000) {
                            current[key] = value;
                        }
                    }
                    s.site = { ...defaultSite(), ...current };
                }
                // Return the stored site (audit fix m2): over-long fields
                // are silently skipped above, so the dashboard must fill
                // from what the server actually stored, not from what it
                // submitted.
                return s.site || defaultSite();
            });
            if (result === null) {
                return sendError(res, 401, 'Unauthorized');
            }
            return send(res, 200, { status: true, site: result });
        }

        return sendError(res, 405, 'Method not allowed');
    } catch (err) {
        return fail(res, err);
    }
};
