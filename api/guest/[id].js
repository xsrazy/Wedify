const { loadDB, withDB, noSave, getAuth, send, sendError, fail } = require('../_lib');

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
            const before = fresh.guests.length;
            fresh.guests = fresh.guests.filter((g) => g.id !== id);
            if (fresh.guests.length === before) {
                return noSave(false);
            }
            return true;
        });
        return send(res, 200, { status });
    } catch (err) {
        return fail(res, err);
    }
};
