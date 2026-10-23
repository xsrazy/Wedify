const crypto = require('crypto');
const { loadDB, withDB, getAuth, send, sendError, fail, readBody, formatDate } = require('../_lib');

const toGuest = (g) => ({
    id: g.id,
    name: g.name,
    created_at: formatDate(g.created_at),
});

// Admin-only guest list for personalized invitation links.
// GET  /api/guest        -> [{ id, name, created_at }]
// POST /api/guest {name} -> 201 { id, name, created_at }
module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const db = await loadDB();
            const auth = getAuth(req, db);
            if (!auth || !auth.admin) {
                return sendError(res, 401, 'Unauthorized');
            }
            const guests = [...db.guests]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(toGuest);
            return send(res, 200, guests);
        }

        if (req.method === 'POST') {
            const body = await readBody(req);
            const name = String(body.name || '').trim().replace(/\s+/g, ' ');
            if (name.length === 0) {
                return sendError(res, 400, 'Nama tamu tidak boleh kosong');
            }
            if (name.length > 100) {
                return sendError(res, 400, 'Nama tamu terlalu panjang');
            }
            const guest = await withDB(async (db) => {
                const auth = getAuth(req, db);
                if (!auth || !auth.admin) {
                    return null;
                }
                const g = {
                    id: crypto.randomUUID(),
                    name,
                    created_at: new Date().toISOString(),
                };
                db.guests.push(g);
                return g;
            });
            if (!guest) {
                return sendError(res, 401, 'Unauthorized');
            }
            return send(res, 201, toGuest(guest), 201);
        }

        return sendError(res, 405, 'Method not allowed');
    } catch (err) {
        return fail(res, err);
    }
};
