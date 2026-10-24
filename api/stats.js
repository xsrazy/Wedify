const { loadDB, getAuth, send, sendError, fail, countAll, countLikes, countFollows } = require('./_lib');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return sendError(res, 405, 'Method not allowed');
    }
    try {
        const db = await loadDB();
        const auth = getAuth(req, db);
        if (!auth || !auth.admin) {
            return sendError(res, 401, 'Unauthorized');
        }
        const topLevel = db.comments.filter((c) => !c.parent);
        return send(res, 200, {
            comments: countAll(db),
            likes: countLikes(db),
            // Strict equality: 'ragu' is truthy, so a loose filter would
            // silently count unsure guests as present.
            present: topLevel.filter((c) => c.presence === true).length,
            absent: topLevel.filter((c) => c.presence === false).length,
            unsure: topLevel.filter((c) => c.presence === 'ragu').length,
            follows_groom: countFollows(db, 'groom'),
            follows_bride: countFollows(db, 'bride'),
        });
    } catch (err) {
        return fail(res, err);
    }
};
