// Minimal API client for the Wedify dashboard rebuild. Same endpoints,
// headers, and bodies as the old dashboard modules; the only difference
// is that responses keep their HTTP status so the UI can tell a wrong
// password (401) apart from a rate limit (429) and a network failure.
const table = (name) => {
    const read = () => {
        try {
            return JSON.parse(localStorage.getItem(name)) || {};
        } catch (e) {
            return {};
        }
    };
    const write = (data) => {
        try {
            localStorage.setItem(name, JSON.stringify(data));
        } catch (e) { /* abaikan */ }
    };
    return {
        get: (key) => (key === undefined ? read() : read()[key]),
        set: (key, value) => {
            const data = read();
            data[key] = value;
            write(data);
        },
        unset: (key) => {
            const data = read();
            delete data[key];
            write(data);
        },
        has: (key) => Object.prototype.hasOwnProperty.call(read(), key),
        clear: () => write({}),
    };
};

const sessionStore = table('session');
const likesStore = table('likes');

const getToken = () => sessionStore.get('token') || null;
const setToken = (token) => sessionStore.set('token', token);
const clearToken = () => sessionStore.unset('token');

const decodeToken = (token) => {
    if (!token || String(token).split('.').length !== 3) {
        return null;
    }
    try {
        const segment = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
        return JSON.parse(window.atob(padded));
    } catch (e) {
        return null;
    }
};

const isAuthed = () => {
    const jwt = decodeToken(getToken());
    return Boolean(jwt && (jwt.exp || 0) > Date.now() / 1000);
};

// Raw fetch wrapper. Returns { ok, code, data, message } and never
// alerts or throws for HTTP errors; network failures come back as
// code 0 so callers can distinguish them.
const api = async (method, path, body, useAuth = true) => {
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    if (useAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
    }
    let res;
    try {
        res = await fetch(path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (e) {
        return { ok: false, code: 0, data: null, message: 'Gagal terhubung, coba lagi.' };
    }
    let json = null;
    try {
        json = await res.json();
    } catch (e) { /* non-JSON body */ }
    if (!json || typeof json !== 'object') {
        return { ok: res.ok, code: res.status, data: null, message: res.ok ? null : 'Gagal terhubung, coba lagi.' };
    }
    const message = json.error && json.error[0] ? json.error[0] : null;
    return { ok: res.ok, code: res.status, data: json.data !== undefined ? json.data : null, message };
};

// CSV download (GET /api/download with the admin token).
const downloadCsv = async () => {
    const token = getToken();
    const res = await fetch('/api/download', {
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
    });
    if (!res.ok) {
        return false;
    }
    const blob = await res.blob();
    const filename = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'comments.csv';
    const link = document.createElement('a');
    const href = window.URL.createObjectURL(blob);
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(href);
    return true;
};

export { table, sessionStore, likesStore, getToken, setToken, clearToken, decodeToken, isAuthed, api, downloadCsv };
