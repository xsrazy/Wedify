// Shared helpers for the Wedify invitation API.
// Database = one JSON document stored in a private Vercel Blob store.
const crypto = require('crypto');

const BLOB_API = 'https://vercel.com/api/blob/';
const DB_PREFIX = 'db-';

const blobHeaders = () => ({
    authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    'x-api-version': '11',
});

// The DB is stored as immutable versions (db-<timestamp>-<rand>.json). Reads
// always take the newest version from the list API, so a stale cached copy of
// an overwritten file can never shadow fresh data.
async function blobListVersions() {
    const res = await fetch(`${BLOB_API}?prefix=${DB_PREFIX}&limit=100`, {
        headers: blobHeaders(),
    });
    if (!res.ok) {
        throw new Error(`blob list failed: ${res.status}`);
    }
    const list = await res.json();
    return (list.blobs || [])
        .filter((b) => b.pathname.startsWith(DB_PREFIX))
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

// Editable site content (managed from the dashboard, served by
// GET /api/config). Values seed the demo wedding; the admin can change
// every one of them without touching code.
const defaultSite = () => ({
    groom_name: 'Rahmatul Usra',
    groom_short: 'Usra',
    groom_parents: 'Bapak ... & Ibu ...',
    groom_listeners: '1.205',
    bride_name: 'Azizi Asadel',
    bride_short: 'Zee',
    bride_parents: 'Bapak ... & Ibu ...',
    bride_listeners: '1.748',
    album_title: 'USRA & ZEE',
    album_subtitle: 'The Wedding Album \u2022 2050',
    album_art: '/assets/images/album.webp',
    groom_photo: '/assets/images/cowo.webp',
    bride_photo: '/assets/images/cewe.webp',
    music_title: 'River Flows in You',
    music_artist: 'Usra & Zee',
    music_url: '/assets/music/sound.mp3',
    wedding_iso: '2050-01-17T10:00:00+07:00',
    date_label: 'Senin, 17 Januari 2050',
    akad_time: '10.00 WIB',
    akad_desc: 'Akad Nikah',
    resepsi_time: '13.00 WIB',
    resepsi_desc: 'Resepsi',
    venue_name: 'Jam Gadang',
    venue_address: 'Jl. Raya Bukittinggi - Payakumbuh, Benteng Pasar Atas, Bukittinggi, Sumatera Barat',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Jam+Gadang+Bukittinggi',
    cal_start: '20500117T030000Z',
    cal_end: '20500117T040000Z',
    dress_1: 'Batik',
    dress_2: 'Dominasi warna hitam',
    lyrics_text: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.',
    lyrics_source: 'QS. Ar-Rum ayat 21',
    wrapped_match: '100%',
    wrapped_genre: 'Takdir',
    wrapped_collab: 'Usra \u00d7 Zee',
    gift1_bank: 'SeaBank',
    gift1_number: '123456784848',
    gift1_owner: 'Rahmatul Usra',
    gift2_bank: 'DANA',
    gift2_number: '081234561748',
    gift2_owner: 'Rahmatul Usra',
    gallery_urls: [
        'https://picsum.photos/seed/wedify1/600/600',
        'https://picsum.photos/seed/wedify2/600/600',
        'https://picsum.photos/seed/wedify3/600/600',
        'https://picsum.photos/seed/wedify4/600/600',
        'https://picsum.photos/seed/wedify5/600/600',
        'https://picsum.photos/seed/wedify6/600/600',
    ].join('\n'),
    share_text: 'Dengerin album pernikahan kami di Wedify!',
});

const defaultDB = () => ({
    settings: {
        name: 'Usra',
        email: process.env.ADMIN_EMAIL || '',
        password: hashPassword(process.env.ADMIN_PASSWORD || ''),
        access_key: process.env.INITIAL_ACCESS_KEY || crypto.randomBytes(24).toString('hex'),
        is_filter: false,
        can_reply: true,
        can_edit: true,
        can_delete: true,
        token_version: 0,
        site: defaultSite(),
    },
    comments: [],
    guests: [],
});

// Loads the DB together with the pathname of the version it came from.
// Safety contract (audit fix): a transient Blob failure must NEVER be
// mistaken for an empty database. The default DB is only used when the
// store genuinely contains no versions; read/parse failures of existing
// versions throw, so a following write can never persist an empty DB
// over real data. If the newest version is corrupt, the previous one is
// tried before giving up.
async function loadDBVersioned() {
    const versions = await blobListVersions();
    if (versions.length === 0) {
        return { db: defaultDB(), version: null };
    }
    let lastErr = null;
    for (const blob of versions.slice(0, 3)) {
        try {
            const res = await fetch(blob.url, {
                headers: { ...blobHeaders(), 'cache-control': 'no-cache' },
                cache: 'no-store',
            });
            if (!res.ok) {
                throw new Error(`blob get failed: ${res.status}`);
            }
            const db = JSON.parse(await res.text());
            if (!db.settings || !Array.isArray(db.comments)) {
                throw new Error('db shape invalid');
            }
            if (!Array.isArray(db.guests)) {
                db.guests = [];
            }
            if (!Array.isArray(db.follows)) {
                db.follows = [];
            }
            if (!db.settings.site || typeof db.settings.site !== 'object') {
                db.settings.site = defaultSite();
            } else {
                db.settings.site = { ...defaultSite(), ...db.settings.site };
            }
            return { db, version: blob.pathname };
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error('db unreadable');
}

async function loadDB() {
    return (await loadDBVersioned()).db;
}

async function blobWriteVersion(text) {
    const pathname = `${DB_PREFIX}${Date.now()}-${crypto.randomBytes(3).toString('hex')}.json`;
    const res = await fetch(`${BLOB_API}?pathname=${encodeURIComponent(pathname)}`, {
        method: 'PUT',
        headers: {
            ...blobHeaders(),
            'x-vercel-blob-access': 'private',
            'x-content-type': 'application/json',
            'x-add-random-suffix': '0',
            'x-cache-control-max-age': '0',
        },
        body: text,
    });
    if (!res.ok) {
        // Do not embed the upstream response body: it would leak to API
        // callers through error messages.
        throw new Error(`blob put failed: ${res.status}`);
    }
    return res.json();
}

async function blobDelete(urls) {
    if (urls.length === 0) {
        return;
    }
    try {
        const res = await fetch(`${BLOB_API}delete`, {
            method: 'POST',
            headers: { ...blobHeaders(), 'content-type': 'application/json' },
            body: JSON.stringify({ urls }),
        });
        if (!res.ok) {
            console.error(`blob delete failed: ${res.status}`);
        }
    } catch (err) {
        console.error(`blob delete failed: ${err.message}`);
    }
}

const saveDB = async (db) => {
    await blobWriteVersion(JSON.stringify(db));
    // Best-effort cleanup: keep only the two newest versions.
    const versions = await blobListVersions().catch(() => []);
    if (versions.length > 2) {
        await blobDelete(versions.slice(2).map((b) => b.url));
    }
};

// Serialized read-modify-write with optimistic concurrency (audit fix for
// the lost-update race): the mutator runs against the newest version; if
// another writer saved in the meantime, the mutation is re-applied on the
// fresh version instead of silently overwriting it. The mutator must be
// re-runnable (it may run more than once) and returns either its result or
// noSave(value) to finish without writing.
async function withDB(mutator) {
    for (let attempt = 0; attempt < 6; attempt++) {
        const { db, version } = await loadDBVersioned();
        const result = await mutator(db);
        if (result && typeof result === 'object' && result.__noSave) {
            return result.value;
        }
        const now = await blobListVersions();
        const newest = now.length ? now[0].pathname : null;
        if (newest !== version) {
            continue; // lost the race; retry on the fresh version
        }
        await saveDB(db);
        return result;
    }
    const err = new Error('Sedang sibuk, silakan coba lagi.');
    err.status = 409;
    throw err;
}

const noSave = (value) => ({ __noSave: true, value });

// ---------- passwords ----------
// New hashes use scrypt. Legacy salted SHA-256 hashes still verify so the
// stored admin password keeps working; session.js upgrades it to scrypt
// opportunistically on the next successful login.
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(String(password), salt, 64, SCRYPT_PARAMS);
    return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
};

const isLegacyHash = (stored) => !String(stored || '').startsWith('scrypt:');

const verifyPassword = (password, stored) => {
    const s = String(stored || '');
    try {
        if (s.startsWith('scrypt:')) {
            const [, saltHex, hashHex] = s.split(':');
            const expected = Buffer.from(hashHex || '', 'hex');
            if (expected.length !== 64) {
                return false;
            }
            const check = crypto.scryptSync(String(password), Buffer.from(saltHex || '', 'hex'), 64, SCRYPT_PARAMS);
            return crypto.timingSafeEqual(expected, check);
        }
        const [salt, hash] = s.split(':');
        if (!salt || !hash) {
            return false;
        }
        const expected = Buffer.from(hash, 'hex');
        const check = crypto.createHash('sha256').update(salt + String(password)).digest();
        // timingSafeEqual throws on length mismatch; guard instead of
        // turning a malformed stored hash into a 500 (audit fix).
        if (expected.length !== check.length) {
            return false;
        }
        return crypto.timingSafeEqual(expected, check);
    } catch {
        return false;
    }
};

// ---------- auth ----------
const authSecret = () => {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        // Fail closed (audit fix): never fall back to a known string.
        throw new Error('AUTH_SECRET is not configured');
    }
    return secret;
};

const b64url = (input) =>
    Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const signToken = (payload) => {
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64url(JSON.stringify(payload));
    const sig = crypto.createHmac('sha256', authSecret())
        .update(`${header}.${body}`).digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${header}.${body}.${sig}`;
};

const verifyToken = (token) => {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) {
        return null;
    }
    const [header, body, sig] = parts;
    let expected;
    try {
        expected = crypto.createHmac('sha256', authSecret())
            .update(`${header}.${body}`).digest('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
        return null;
    }
    if (sig.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return null;
    }
    try {
        const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        if ((payload.exp ?? 0) < Date.now() / 1000) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
};

// Returns { admin: payload } or { guest: true } or null.
// Admin tokens carry a token-version claim (tv); changing the admin
// password bumps settings.token_version and thereby revokes every token
// issued before the change (audit fix).
const getAuth = (req, db) => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
        const payload = verifyToken(auth.slice(7));
        if (payload && (payload.tv ?? -1) === (db.settings.token_version ?? 0)) {
            return { admin: payload };
        }
    }
    const key = req.headers['x-access-key'];
    if (key && key === db.settings.access_key) {
        return { guest: true };
    }
    return null;
};

// ---------- http helpers ----------
const send = (res, code, data, httpStatus = code) => {
    res.status(httpStatus).json({ code, data, error: null });
};

const sendError = (res, code, message) => {
    res.status(code).json({ code, data: null, error: [message] });
};

// Uniform failure path for handlers (audit fix): known client errors keep
// their message; anything else becomes a generic 500 so internal details
// (upstream bodies, stack text) never leak to callers.
const fail = (res, err) => {
    if (err && err.status) {
        return sendError(res, err.status, err.message);
    }
    console.error(err);
    return sendError(res, 500, 'Terjadi kesalahan pada server.');
};

const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

const readBody = async (req) => {
    // Vercel parses JSON bodies lazily: merely READING req.body throws when
    // the client sent malformed JSON with an application/json content type.
    // Guard the getter so that becomes a 400 instead of a 500.
    let body;
    try {
        body = req.body;
    } catch {
        throw httpError(400, 'Format data tidak valid.');
    }
    let parsed;
    if (body !== undefined && body !== null) {
        if (typeof body === 'string') {
            try {
                parsed = body ? JSON.parse(body) : {};
            } catch {
                throw httpError(400, 'Format data tidak valid.');
            }
        } else {
            parsed = body;
        }
    } else {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const text = Buffer.concat(chunks).toString('utf8');
        if (!text) {
            return {};
        }
        try {
            parsed = JSON.parse(text);
        } catch {
            throw httpError(400, 'Format data tidak valid.');
        }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw httpError(400, 'Format data tidak valid.');
    }
    return parsed;
};

// Minimal in-memory rate limiting (audit fix). Serverless instances are
// ephemeral, so this is a speed bump rather than a hard guarantee, but it
// stops naive single-source floods and password guessing loops.
const rateBuckets = new Map();
const rateLimit = (bucket, limit, windowMs) => {
    const now = Date.now();
    const key = String(bucket);
    let entry = rateBuckets.get(key);
    if (!entry || now - entry.start > windowMs) {
        entry = { start: now, count: 0 };
        rateBuckets.set(key, entry);
    }
    entry.count += 1;
    if (rateBuckets.size > 5000) {
        rateBuckets.clear();
    }
    return entry.count <= limit;
};

const clientIp = (req) =>
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

// ---------- comments ----------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const formatDate = (iso) => {
    const d = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}.${mm} WIB`;
};

const BAD_WORDS = ['anjing', 'bangsat', 'kontol', 'memek', 'ngentot', 'tolol', 'goblok',
    'jancok', 'asu', 'bajingan', 'kampret', 'fuck', 'shit', 'bitch', 'dick', 'pussy'];

const filterBadWords = (text) => {
    let out = String(text);
    for (const word of BAD_WORDS) {
        out = out.replace(new RegExp(`\\b${word}\\b`, 'gi'), '***');
    }
    return out;
};

// Strict presence parsing (audit fix): only explicit attend values count
// as attending; explicit absent values count as absent; anything else is
// rejected by callers (null return).
const parsePresence = (value) => {
    if (value === undefined || value === null) {
        return true; // template default: attending
    }
    if (value === true || value === 1 || value === '1') {
        return true;
    }
    if (value === false || value === 2 || value === '2' || value === 0 || value === '0') {
        return false;
    }
    if (value === 3 || value === '3') {
        return 'ragu';
    }
    return null;
};

const toPublic = (comment, byParent, isAdmin) => {
    const replies = (byParent.get(comment.uuid) || [])
        .slice()
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((c) => toPublic(c, byParent, isAdmin));
    const out = {
        uuid: comment.uuid,
        name: comment.name,
        presence: comment.presence,
        comment: comment.comment,
        is_admin: comment.is_admin,
        created_at: formatDate(comment.created_at),
        comments: replies,
        like: { love: (comment.likes || []).length },
    };
    if (isAdmin) {
        out.own = comment.own;
        out.ip = comment.ip;
        out.user_agent = comment.user_agent;
    }
    return out;
};

const buildTree = (comments) => {
    const byParent = new Map();
    for (const c of comments) {
        const key = c.parent || null;
        if (!byParent.has(key)) {
            byParent.set(key, []);
        }
        byParent.get(key).push(c);
    }
    const roots = (byParent.get(null) || [])
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { roots, byParent };
};

const findComment = (db, uuid) => db.comments.find((c) => c.uuid === uuid) || null;
const findByOwn = (db, own) => db.comments.find((c) => c.own === own) || null;

// Depth of a comment in the reply tree (root = 0), used to cap nesting.
const commentDepth = (db, comment) => {
    let depth = 0;
    let current = comment;
    const seen = new Set([current.uuid]);
    while (current.parent) {
        const parent = findComment(db, current.parent);
        if (!parent || seen.has(parent.uuid)) {
            break;
        }
        seen.add(parent.uuid);
        depth += 1;
        current = parent;
    }
    return depth;
};

const removeSubtree = (db, uuid) => {
    const targets = new Set([uuid]);
    let grew = true;
    while (grew) {
        grew = false;
        for (const c of db.comments) {
            if (c.parent && targets.has(c.parent) && !targets.has(c.uuid)) {
                targets.add(c.uuid);
                grew = true;
            }
        }
    }
    db.comments = db.comments.filter((c) => !targets.has(c.uuid));
    return targets.size;
};

const countAll = (db) => db.comments.length;
const countFollows = (db, artist) => (db.follows || []).filter((f) => f.artist === artist).length;
const countLikes = (db) => db.comments.reduce((n, c) => n + (c.likes || []).length, 0);

module.exports = {
    loadDB, loadDBVersioned, saveDB, withDB, noSave,
    hashPassword, verifyPassword, isLegacyHash,
    signToken, verifyToken, getAuth,
    send, sendError, fail, httpError, readBody, rateLimit, clientIp,
    formatDate, filterBadWords, parsePresence, toPublic, buildTree,
    findComment, findByOwn, commentDepth, removeSubtree, countAll, countLikes,
    defaultSite, countFollows,
};
