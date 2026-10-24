const { loadDB, withDB, noSave, getAuth, send, sendError, fail, httpError } = require('../_lib');

// DELETE /api/guest/:id (admin only) -> { status }
module.exports = async (req, res) => {
    if (req.method !== 'DELETE') {
        return sendError(res, 405, 'Method not allowed');
    }
    try {
        const db = await loadDB();
        const auth = getAuth(req, db);
        if (!auth || !auth.admin) {
            return sendError(res, 401, 'Unauthorized');
        }
        const id = req.query.id;
        const status = await withDB(async (fresh) => {
            // Re-check auth inside withDB (audit fix): the outer check
            // runs against a possibly stale snapshot, so a token revoked
            // between the check and the save must not still delete.
            const innerAuth = getAuth(req, fresh);
            if (!innerAuth || !innerAuth.admin) {
                return noSave(false);
            }
            const before = fresh.guests.length;
            fresh.guests = fresh.guests.filter((g) => g.id !== id);
            if (fresh.guests.length === before) {
                throw httpError(404, 'Tamu tidak ditemukan.');
            }
            return true;
        });
        if (status === false) {
            return sendError(res, 401, 'Unauthorized');
        }
        return send(res, 200, { status });
    } catch (err) {
        return fail(res, err);
    }
};
