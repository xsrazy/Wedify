const { loadDB, getAuth, sendError, fail, formatDate } = require('./_lib');

// Quote a CSV cell and neutralize spreadsheet formulas (audit fix): a
// leading =, +, -, @, tab or CR would otherwise be evaluated by Excel /
// Sheets even inside quotes, and names/comments are guest-controlled.
const csvCell = (value) => {
    let s = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(s)) {
        s = `'${s}`;
    }
    return `"${s.replace(/"/g, '""')}"`;
};

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
        const rows = [['uuid', 'parent', 'name', 'presence', 'comment', 'likes', 'is_admin', 'ip', 'user_agent', 'created_at']];
        // Include replies as their own rows (audit fix: the old export
        // silently dropped every nested comment). Parents come before
        // their replies; siblings are ordered by creation time.
        const byParent = new Map();
        for (const c of db.comments) {
            const key = c.parent || null;
            if (!byParent.has(key)) {
                byParent.set(key, []);
            }
            byParent.get(key).push(c);
        }
        const walk = (parentKey) => {
            const siblings = (byParent.get(parentKey) || [])
                .slice()
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            for (const c of siblings) {
                rows.push([c.uuid, c.parent || '', c.name, c.presence === 'ragu' ? 'Masih Ragu' : c.presence ? 'Datang' : 'Berhalangan',
                    c.comment, (c.likes || []).length, c.is_admin ? '1' : '0', c.ip || '',
                    c.user_agent || '', formatDate(c.created_at)]);
                walk(c.uuid);
            }
        };
        walk(null);
        const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="comments.csv"');
        return res.status(200).send(csv);
    } catch (err) {
        return fail(res, err);
    }
};
