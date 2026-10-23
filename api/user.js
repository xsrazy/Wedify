const { loadDB, withDB, noSave, getAuth, hashPassword, verifyPassword, send, sendError, fail, readBody, defaultSite } = require('./_lib');

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
            const status = await withDB(async (db) => {
                const auth = getAuth(req, db);
                if (!auth || !auth.admin) {
                    return noSave(null);
                }
                const s = db.settings;
                if (body.old_password !== undefined || body.new_password !== undefined) {
                    if (!body.old_password || !body.new_password ||
                        !verifyPassword(body.old_password, s.password)) {
                        return noSave(false);
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
                return true;
            });
            if (status === null) {
                return sendError(res, 401, 'Unauthorized');
            }
            return send(res, 200, { status });
        }

        return sendError(res, 405, 'Method not allowed');
    } catch (err) {
        return fail(res, err);
    }
};
