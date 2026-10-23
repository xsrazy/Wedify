const crypto = require('crypto');
const { loadDB, withDB, noSave, getAuth, send, sendError, fail } = require('./_lib');

module.exports = async (req, res) => {
    if (req.method !== 'PUT') {
        return sendError(res, 405, 'Method not allowed');
    }
    try {
        const db = await loadDB();
        const auth = getAuth(req, db);
        if (!auth || !auth.admin) {
            return sendError(res, 401, 'Unauthorized');
        }
        await withDB(async (fresh) => {
            const innerAuth = getAuth(req, fresh);
            if (!innerAuth || !innerAuth.admin) {
                return noSave(false);
            }
            fresh.settings.access_key = crypto.randomBytes(24).toString('hex');
            return true;
        });
        return send(res, 200, { status: true });
    } catch (err) {
        return fail(res, err);
    }
};
