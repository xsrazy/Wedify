const { loadDB, send, sendError, fail, clientIp, countFollows } = require('./_lib');

// Public site config: the invitation page renders entirely from this.
// It also carries the guest access key (the same exposure as embedding
// it in the page) so the key can be rotated from the dashboard, plus
// the real follow counts and this visitor's own follow state.
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return sendError(res, 405, 'Method not allowed');
    }
    try {
        const db = await loadDB();
        const s = db.settings;
        const ip = clientIp(req);
        const mine = (artist) => (db.follows || []).some((f) => f.artist === artist && f.ip === ip);
        return send(res, 200, {
            site: s.site,
            access_key: s.access_key,
            can_reply: s.can_reply,
            can_edit: s.can_edit,
            can_delete: s.can_delete,
            follows: {
                groom: countFollows(db, 'groom'),
                bride: countFollows(db, 'bride'),
            },
            you_follow: { groom: mine('groom'), bride: mine('bride') },
        });
    } catch (err) {
        return fail(res, err);
    }
};
