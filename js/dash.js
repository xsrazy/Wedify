import { likesStore, getToken, setToken, clearToken, isAuthed, api, downloadCsv } from './dash-api.js';

// ---------- Icons (inline SVG, no font, no CDN) ----------
const P = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    users: 'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
    pin: 'M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8l-4 4v1h14v-1l-4-4z',
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    heartOff: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',
    reply: 'M10 9V5l-7 7 7 7v-4c5 0 8.5 1.6 11 5-1-5-4-10-11-11z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    upload: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z',
};
const ic = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${P[name]}"/></svg>`;

// ---------- Small helpers ----------
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const markdown = (text) => esc(text)
    .replace(/```([\s\S]*?)```/g, '<code>$1</code>')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~([^~]+)~/g, '<del>$1</del>');
const presenceBadge = (p) => p === true
    ? '<span class="badge ok">Datang</span>'
    : p === false
        ? '<span class="badge no">Berhalangan</span>'
        : '<span class="badge unsure">Masih Ragu</span>';
const presenceOf = (v) => v === '1' ? true : v === '2' ? false : v === '3' ? 'ragu' : true;
const presenceSel = (p) => p === true ? '1' : p === false ? '2' : '3';

let toastTimer = null;
const toast = (msg) => {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
};
const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        toast('Tersalin');
    } catch (e) {
        toast('Gagal menyalin');
    }
};

// All 42 site keys, same list as the old dashboard (site.js FIELDS).
const FIELDS = ['groom_name', 'groom_short', 'groom_parents', 'groom_listeners', 'bride_name', 'bride_short', 'bride_parents', 'bride_listeners', 'album_title', 'album_subtitle', 'album_art', 'groom_photo', 'bride_photo', 'music_title', 'music_artist', 'music_url', 'wedding_iso', 'date_label', 'akad_time', 'akad_desc', 'resepsi_time', 'resepsi_desc', 'venue_name', 'venue_address', 'maps_url', 'cal_start', 'cal_end', 'dress_1', 'dress_2', 'lyrics_text', 'lyrics_source', 'wrapped_match', 'wrapped_genre', 'wrapped_collab', 'gift1_bank', 'gift1_number', 'gift1_owner', 'gift2_bank', 'gift2_number', 'gift2_owner', 'gallery_urls', 'share_text'];

// ---------- State ----------
let userInfo = null; // { name, email, access_key, is_filter, can_reply, can_edit, can_delete, site }
let siteData = {};
let commentPage = 0; // next offset
const PER = 10;
const fullText = {}; // uuid -> full comment text (for Selengkapnya)

// ---------- Navigation ----------
const showView = (name) => {
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('.navbtn[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    window.scrollTo(0, 0);
};
document.querySelectorAll('.navbtn[data-view]').forEach((b) => {
    b.addEventListener('click', () => showView(b.dataset.view));
});

// ---------- Login ----------
const showLogin = (message) => {
    $('appShell').hidden = true;
    $('loginScreen').hidden = false;
    const err = $('loginError');
    if (message) {
        err.textContent = message;
        err.hidden = false;
    } else {
        err.hidden = true;
    }
};
const showApp = () => {
    $('loginScreen').hidden = true;
    $('appShell').hidden = false;
};
const logout = (message) => {
    clearToken();
    userInfo = null;
    showLogin(message);
};
$('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    const btn = $('loginBtn');
    btn.disabled = true;
    const res = await api('POST', '/api/session', { email, password }, false);
    btn.disabled = false;
    if (!res.ok) {
        if (res.code === 401) {
            showLogin('Email atau password salah');
        } else if (res.code === 429) {
            showLogin('Terlalu banyak percobaan, coba lagi dalam 15 menit');
        } else {
            showLogin('Gagal terhubung, coba lagi');
        }
        return;
    }
    setToken(res.data.token);
    $('loginPassword').value = '';
    showApp();
    await boot();
});

// ---------- Boot: user detail + stats + lists ----------
const fillSite = () => {
    FIELDS.forEach((key) => {
        const el = $('site-' + key);
        if (el && typeof siteData[key] === 'string') {
            el.value = siteData[key];
        }
    });
};
const fillBeranda = () => {
    $('albumCover').src = siteData.album_art || '/assets/images/album.webp';
    $('albumTitle').textContent = siteData.album_title || 'USRA & ZEE';
    $('albumSubtitle').textContent = siteData.album_subtitle || 'The Wedding Album';
    $('track1Name').textContent = siteData.akad_desc || 'Akad Nikah';
    $('track1Time').textContent = siteData.akad_time || '10.00 WIB';
    $('track2Name').textContent = siteData.resepsi_desc || 'Resepsi';
    $('track2Time').textContent = siteData.resepsi_time || '13.00 WIB';
    const venue = [siteData.venue_name, siteData.venue_address].filter(Boolean).join(', ');
    $('venueLine').textContent = venue || 'Jam Gadang, Bukittinggi';
};
const getUserDetail = async () => {
    const res = await api('GET', '/api/user');
    if (!res.ok) {
        if (res.code === 401 || res.code === 403) {
            logout('Sesi berakhir, silakan login lagi.');
        } else {
            // Non-auth boot failure (audit fix m4): do not leave a blank
            // app shell with "Memuat..." labels and no error. Back to the
            // login screen with a message; the user can retry from there.
            logout('Gagal memuat data. Silakan coba login lagi.');
        }
        return false;
    }
    userInfo = res.data;
    siteData = userInfo.site || {};
    $('dashboard-name').textContent = userInfo.name || '';
    $('dashboard-email').textContent = userInfo.email || '';
    $('form-name').value = userInfo.name || '';
    $('dashboard-accesskey').value = userInfo.access_key || '';
    $('btnCopyKey').setAttribute('data-copy', userInfo.access_key || '');
    $('filterBadWord').checked = Boolean(userInfo.is_filter);
    $('replyComment').checked = Boolean(userInfo.can_reply);
    $('editComment').checked = Boolean(userInfo.can_edit);
    $('deleteComment').checked = Boolean(userInfo.can_delete);
    fillSite();
    fillBeranda();
    return true;
};
const getStats = async () => {
    const res = await api('GET', '/api/stats');
    if (!res.ok) {
        return;
    }
    const d = res.data;
    $('count-comment').textContent = d.comments;
    $('count-like').textContent = d.likes;
    $('count-present').textContent = d.present;
    $('count-absent').textContent = d.absent;
    $('count-unsure').textContent = d.unsure;
    $('count-follow-groom').textContent = d.follows_groom;
    $('count-follow-bride').textContent = d.follows_bride;
};
const boot = async () => {
    if (!await getUserDetail()) {
        return;
    }
    getStats();
    guestsLoad();
    commentsLoad(0);
};
$('btnViewSite').addEventListener('click', () => window.open('/', '_blank', 'noopener'));
$('btnGoGuest').addEventListener('click', () => showView('tamu'));
$('btnDownload').addEventListener('click', async () => {
    if (await downloadCsv()) {
        toast('CSV diunduh');
    } else {
        toast('Gagal mengunduh CSV');
    }
});

// ---------- Musik: save + uploads ----------
$('btnSaveSite').addEventListener('click', async () => {
    const payload = {};
    FIELDS.forEach((key) => {
        const el = $('site-' + key);
        if (el) {
            payload[key] = el.value;
        }
    });
    const btn = $('btnSaveSite');
    btn.disabled = true;
    const res = await api('PATCH', '/api/user', { site: payload });
    btn.disabled = false;
    if (res.ok) {
        // Fill from what the server actually stored (audit fix m2):
        // over-long fields are skipped server-side, so the form must
        // show stored values, not the submitted ones.
        siteData = res.data.site || payload;
        fillSite();
        fillBeranda();
        toast('Konten tersimpan');
    } else {
        toast(res.message || 'Gagal menyimpan');
    }
});

const base64Encode = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return window.btoa(binary);
};
const prepareImage = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Gagal memproses gambar'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve({ data: reader.result.split(',')[1], contentType: 'image/webp', size: blob.size });
            reader.onerror = () => reject(new Error('Gagal membaca gambar'));
            reader.readAsDataURL(blob);
        }, 'image/webp', 0.85);
    };
    img.onerror = () => reject(new Error('File bukan gambar yang valid'));
    img.src = window.URL.createObjectURL(file);
});
const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ data: reader.result.split(',')[1], contentType: file.type || 'application/octet-stream', size: file.size });
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
});
const uploadOne = async (kind, file, statusEl) => {
    if (kind === 'audio' && file.size > 3 * 1024 * 1024) {
        statusEl.textContent = 'File audio melebihi 3 MB.';
        return null;
    }
    statusEl.textContent = 'Mengunggah...';
    try {
        const prep = kind === 'image' ? await prepareImage(file) : await readFile(file);
        const res = await api('POST', '/api/upload', { kind, contentType: prep.contentType, dataBase64: prep.data });
        if (!res.ok) {
            statusEl.textContent = res.message || 'Gagal mengunggah.';
            return null;
        }
        statusEl.textContent = 'Terupload. Klik Simpan buat menerapkan.';
        return res.data.url;
    } catch (e) {
        statusEl.textContent = e.message || 'Gagal mengunggah.';
        return null;
    }
};
document.querySelectorAll('.upload-row').forEach((row) => {
    const key = row.dataset.upload;
    const kind = row.dataset.kind;
    const label = kind === 'audio' ? 'Upload musik' : kind === 'gallery' ? 'Upload foto galeri' : 'Upload foto';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-ghost btn-sm';
    btn.setAttribute('data-offline', '');
    btn.textContent = label;
    const status = document.createElement('span');
    status.className = 'up-status';
    const input = document.createElement('input');
    input.type = 'file';
    input.hidden = true;
    // Audio picker matches the server whitelist (audit fix m7): the
    // server accepts only mp3/ogg/m4a/aac, so wav/flac must not be
    // pickable in the first place. Images are converted to webp in the
    // browser, so image/* stays fine there.
    input.accept = kind === 'audio' ? 'audio/mpeg,audio/mp3,audio/ogg,audio/mp4,audio/x-m4a,audio/aac' : 'image/*';
    input.multiple = kind === 'gallery';
    row.append(btn, status, input);
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
        const files = Array.from(input.files || []);
        input.value = '';
        if (files.length === 0) {
            return;
        }
        const target = $('site-' + key);
        if (kind === 'gallery') {
            const urls = [];
            for (const file of files) {
                const url = await uploadOne('image', file, status);
                if (url) {
                    urls.push(url);
                }
            }
            if (urls.length > 0) {
                target.value = [target.value.trim(), ...urls].filter(Boolean).join('\n');
                status.textContent = `${urls.length} foto terupload. Klik Simpan buat menerapkan.`;
            }
        } else {
            const url = await uploadOne(kind, files[0], status);
            if (url) {
                target.value = url;
            }
        }
    });
});

// ---------- Tamu ----------
const SITE = location.origin;
const linkFor = (name) => {
    const clean = String(name || '').trim().replace(/\s+/g, ' ');
    return `${SITE}/?to=${encodeURIComponent(clean).replace(/%20/g, '+')}`;
};
const waText = (name, link) => [
    'Kepada Yth.',
    `Bapak/Ibu/Saudara/i ${name}`,
    '',
    "Assalamu'alaikum Wr. Wb.",
    '',
    'Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami (Usra & Zee). Detail undangan dapat dilihat melalui tautan berikut:',
    '',
    link,
    '',
    'Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir. Terima kasih.',
    '',
    "Wassalamu'alaikum Wr. Wb.",
    'Usra & Zee',
].join('\n');
const normalizePhone = (raw) => {
    let phone = String(raw || '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '62' + phone.slice(1);
    } else if (phone.startsWith('8')) {
        phone = '62' + phone;
    }
    return phone;
};
const waHref = (name, link, phoneRaw) => {
    const phone = normalizePhone(phoneRaw);
    const text = encodeURIComponent(waText(name, link));
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
};
const updatePreview = () => {
    const name = $('guest-name').value;
    const phone = $('guest-phone').value;
    const link = linkFor(name);
    const hasName = name.trim().length > 0;
    $('guest-link-preview').textContent = hasName ? link : `${SITE}/?to=Nama+Tamu`;
    $('guest-copy-button').setAttribute('data-copy', hasName ? link : '');
    $('guest-wa-button').href = hasName ? waHref(name.trim(), link, phone) : '#';
};
$('guest-name').addEventListener('input', updatePreview);
$('guest-phone').addEventListener('input', updatePreview);
$('guest-copy-button').addEventListener('click', () => {
    const link = $('guest-copy-button').getAttribute('data-copy');
    if (link) {
        copyText(link);
    }
});
$('guest-add-button').addEventListener('click', async () => {
    const name = $('guest-name').value.trim();
    if (name.length === 0) {
        toast('Nama tamu tidak boleh kosong');
        return;
    }
    const btn = $('guest-add-button');
    btn.disabled = true;
    const res = await api('POST', '/api/guest', { name });
    btn.disabled = false;
    if (res.ok) {
        $('guest-name').value = '';
        $('guest-phone').value = '';
        updatePreview();
        guestsLoad();
        toast('Tamu tersimpan');
    } else {
        toast(res.message || 'Gagal menyimpan tamu');
    }
});
const guestsLoad = async () => {
    const list = $('guest-list');
    const res = await api('GET', '/api/guest');
    if (!res.ok) {
        list.innerHTML = '<p class="empty">Gagal memuat daftar tamu. <button class="btn-ghost btn-sm" data-action="guest-retry">Muat Ulang</button></p>';
        return;
    }
    const items = res.data || [];
    if (items.length === 0) {
        list.innerHTML = '<p class="empty">Belum ada tamu tersimpan.</p>';
        return;
    }
    list.innerHTML = items.map((g) => {
        const link = linkFor(g.name);
        const wa = waHref(g.name, link, '');
        return `<div class="card">
            <p style="margin:0 0 4px;font-weight:700;word-break:break-word;">${esc(g.name)}</p>
            <p style="margin:0 0 4px;font-size:13px;word-break:break-all;color:#b3b3b3;">${esc(link)}</p>
            <p style="margin:0 0 12px;font-size:12px;color:#b3b3b3;">${esc(g.created_at)}</p>
            <div class="rowbtns">
                <a class="btn-ghost btn-sm btn-link" target="_blank" rel="noopener" href="${wa}">Kirim WA</a>
                <button class="btn-ghost btn-sm" data-action="copy" data-copy="${esc(link)}">Salin Link</button>
                <button class="btn-ghost btn-sm" data-action="guest-del" data-id="${g.id}">Hapus</button>
            </div>
        </div>`;
    }).join('');
};
$('guest-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
        return;
    }
    if (btn.dataset.action === 'guest-retry') {
        guestsLoad();
    } else if (btn.dataset.action === 'copy') {
        copyText(btn.dataset.copy);
    } else if (btn.dataset.action === 'guest-del') {
        if (!confirm('Hapus tamu ini?')) {
            return;
        }
        // Reload either way: a 404 means the guest is already gone.
        await api('DELETE', `/api/guest/${btn.dataset.id}`);
        guestsLoad();
    }
});

// ---------- Komentar ----------
const cmtTextHtml = (c) => {
    const full = c.comment || '';
    fullText[c.uuid] = full;
    if (full.length > 250) {
        return `<div class="cmt-text" data-text-for="${c.uuid}">${markdown(full.slice(0, 250))}... <button class="btn-ghost btn-sm" data-action="more" data-id="${c.uuid}">Selengkapnya</button></div>`;
    }
    return `<div class="cmt-text">${markdown(full)}</div>`;
};
const cmtHtml = (c, isReply) => {
    const liked = likesStore.has(c.uuid);
    const canReply = userInfo && userInfo.can_reply;
    const canEdit = userInfo && userInfo.can_edit;
    const pinBtn = !isReply
        ? (c.pinned
            ? `<button class="btn-ghost btn-sm" data-action="unpin" data-id="${c.uuid}">Lepas sematan</button>`
            : `<button class="btn-ghost btn-sm" data-action="pin" data-id="${c.uuid}">Sematkan</button>`)
        : '';
    const pinBadge = c.pinned ? `<span class="badge pin">${ic('pin')}Disematkan</span>` : '';
    const meta = (c.ip || c.user_agent)
        ? `<div class="cmt-meta">${c.ip ? esc(c.ip) + ' &middot; ' : ''}${esc(c.user_agent || '')}</div>`
        : '';
    return `<div class="cmt${isReply ? ' reply' : ''}" data-cmt="${c.uuid}">
        <div class="cmt-head">
            <span class="cmt-ava">${esc((c.name || '?').trim().charAt(0).toUpperCase())}</span>
            <span class="cmt-name">${esc(c.name)}</span>
            ${c.is_admin ? '<span class="cmt-admin">Admin</span>' : ''}
            ${isReply ? '' : presenceBadge(c.presence)}
            ${pinBadge}
            <span class="cmt-time">${esc(c.created_at)}</span>
        </div>
        ${cmtTextHtml(c)}
        ${meta}
        <div class="cmt-actions">
            <button class="cmt-like${liked ? ' liked' : ''}" data-action="like" data-id="${c.uuid}">${ic(liked ? 'heart' : 'heartOff')}<span>${c.like.love}</span></button>
            ${canReply ? `<button class="btn-ghost btn-sm" data-action="reply" data-id="${c.uuid}">Balas</button>` : ''}
            ${c.own && canEdit ? `<button class="btn-ghost btn-sm" data-action="edit" data-id="${c.uuid}">Edit</button>` : ''}
            <button class="btn-ghost btn-sm" data-action="delete" data-id="${c.uuid}">Hapus</button>
            ${pinBtn}
        </div>
    </div>`;
};
const commentsLoad = async (next) => {
    const box = $('comments');
    box.innerHTML = '<p class="empty">Memuat...</p>';
    const res = await api('GET', `/api/comment?per=${PER}&next=${next}`);
    if (!res.ok) {
        box.innerHTML = '<p class="empty">Gagal memuat komentar. <button class="btn-ghost btn-sm" data-action="cmt-retry">Muat Ulang</button></p>';
        return;
    }
    const roots = res.data || [];
    if (roots.length === 0 && next > 0) {
        // Empty page past the first: step back one page (old behavior).
        commentsLoad(next - PER);
        return;
    }
    commentPage = next;
    $('page').textContent = Math.floor(next / PER) + 1;
    $('btnPrev').disabled = next === 0;
    $('btnNext').disabled = roots.length < PER;
    if (roots.length === 0) {
        box.innerHTML = '<p class="empty">Belum ada komentar. Yuk bagikan undangan ini biar banyak komentarnya.</p>';
        return;
    }
    box.innerHTML = roots.map((c) => {
        const replies = (c.comments || []).map((r) => cmtHtml(r, true)).join('');
        return cmtHtml(c, false) + replies;
    }).join('');
};
$('btnPrev').addEventListener('click', () => commentsLoad(Math.max(0, commentPage - PER)));
$('btnNext').addEventListener('click', () => commentsLoad(commentPage + PER));
$('btnSendComment').addEventListener('click', async () => {
    // Guard against a null userInfo (audit fix m4): without it the
    // handler throws after disabling the button and it stays stuck.
    if (!userInfo) {
        toast('Data admin belum dimuat, muat ulang halaman.');
        return;
    }
    const text = $('form-comment').value.trim();
    if (text.length === 0) {
        toast('Komentar tidak boleh kosong');
        return;
    }
    const btn = $('btnSendComment');
    btn.disabled = true;
    const res = await api('POST', '/api/comment', {
        name: userInfo.name,
        presence: presenceOf($('form-presence').value),
        comment: text,
    });
    btn.disabled = false;
    if (res.ok) {
        $('form-comment').value = '';
        commentsLoad(0);
        getStats();
        toast('Komentar terkirim');
    } else {
        toast(res.message || 'Gagal mengirim komentar');
    }
});
$('comments').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
        return;
    }
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const card = btn.closest('.cmt');
    if (action === 'cmt-retry') {
        commentsLoad(commentPage);
        return;
    }
    if (action === 'more') {
        const textEl = card.querySelector('.cmt-text');
        textEl.innerHTML = markdown(fullText[id] || '');
        return;
    }
    if (action === 'like') {
        const likedUuid = likesStore.get(id);
        if (likedUuid) {
            const res = await api('PATCH', `/api/comment/${likedUuid}`, null);
            if (res.ok) {
                likesStore.unset(id);
            }
        } else {
            const res = await api('POST', `/api/comment/${id}`, null);
            if (res.ok && res.data && res.data.uuid) {
                likesStore.set(id, res.data.uuid);
            }
        }
        commentsLoad(commentPage);
        getStats();
        return;
    }
    if (action === 'reply') {
        if (card.querySelector('.inline-form')) {
            return;
        }
        const form = document.createElement('div');
        form.className = 'inline-form';
        form.innerHTML = `<textarea rows="3" placeholder="Tulis balasan..."></textarea>
            <div class="rowbtns">
                <button class="btn-green btn-sm" data-action="reply-send" data-id="${id}">Kirim</button>
                <button class="btn-ghost btn-sm" data-action="reply-cancel" data-id="${id}">Batal</button>
            </div>`;
        card.appendChild(form);
        form.querySelector('textarea').focus();
        return;
    }
    if (action === 'reply-cancel') {
        btn.closest('.inline-form').remove();
        return;
    }
    if (action === 'reply-send') {
        const form = btn.closest('.inline-form');
        const text = form.querySelector('textarea').value.trim();
        if (text.length === 0) {
            toast('Balasan tidak boleh kosong');
            return;
        }
        // Same null-userInfo guard as the main composer (audit fix m4).
        if (!userInfo) {
            toast('Data admin belum dimuat, muat ulang halaman.');
            return;
        }
        const res = await api('POST', '/api/comment', {
            id,
            name: userInfo.name,
            presence: true,
            comment: text,
        });
        if (res.ok) {
            commentsLoad(commentPage);
            getStats();
            toast('Balasan terkirim');
        } else {
            toast(res.message || 'Gagal mengirim balasan');
        }
        return;
    }
    if (action === 'edit') {
        if (card.querySelector('.inline-form')) {
            return;
        }
        const res = await api('GET', `/api/comment/${id}`);
        if (!res.ok) {
            toast(res.message || 'Gagal memuat komentar');
            return;
        }
        const c = res.data;
        const isRoot = !card.classList.contains('reply');
        const form = document.createElement('div');
        form.className = 'inline-form';
        form.innerHTML = `<textarea rows="3"></textarea>
            ${isRoot ? `<select>
                <option value="1"${c.presence === true ? ' selected' : ''}>Datang</option>
                <option value="2"${c.presence === false ? ' selected' : ''}>Berhalangan</option>
                <option value="3"${c.presence === 'ragu' ? ' selected' : ''}>Masih Ragu</option>
            </select>` : ''}
            <div class="rowbtns">
                <button class="btn-green btn-sm" data-action="edit-save" data-id="${id}">Simpan</button>
                <button class="btn-ghost btn-sm" data-action="edit-cancel" data-id="${id}">Batal</button>
            </div>`;
        form.querySelector('textarea').value = c.comment || '';
        card.appendChild(form);
        form.querySelector('textarea').focus();
        return;
    }
    if (action === 'edit-cancel') {
        btn.closest('.inline-form').remove();
        return;
    }
    if (action === 'edit-save') {
        const form = btn.closest('.inline-form');
        const text = form.querySelector('textarea').value.trim();
        const sel = form.querySelector('select');
        const isRoot = !card.classList.contains('reply');
        const body = { comment: text };
        if (isRoot && sel) {
            body.presence = presenceOf(sel.value);
        } else {
            body.presence = null;
        }
        if (text.length === 0) {
            toast('Komentar tidak boleh kosong');
            return;
        }
        const res = await api('PUT', `/api/comment/${id}`, body);
        if (res.ok) {
            commentsLoad(commentPage);
            toast('Komentar diubah');
        } else {
            toast(res.message || 'Gagal mengubah komentar');
        }
        return;
    }
    if (action === 'delete') {
        if (!confirm('Hapus komentar ini?')) {
            return;
        }
        const res = await api('DELETE', `/api/comment/${id}`);
        if (res.ok) {
            commentsLoad(commentPage);
            getStats();
            toast('Komentar dihapus');
        } else {
            toast(res.message || 'Gagal menghapus komentar');
        }
        return;
    }
    if (action === 'pin' || action === 'unpin') {
        const res = await api('PUT', `/api/comment/${id}`, { pinned: action === 'pin' });
        if (res.ok) {
            commentsLoad(commentPage);
            toast(action === 'pin' ? 'Komentar disematkan' : 'Sematan dilepas');
        } else {
            toast(res.message || 'Gagal mengubah sematan');
        }
        return;
    }
});

// ---------- Pengaturan ----------
$('form-name').addEventListener('input', () => {
    $('btnChangeName').disabled = $('form-name').value.trim().length === 0;
});
$('btnChangeName').addEventListener('click', async () => {
    const name = $('form-name').value.trim();
    const res = await api('PATCH', '/api/user', { name });
    if (res.ok) {
        userInfo.name = name;
        $('dashboard-name').textContent = name;
        toast('Nama diubah');
    } else {
        toast(res.message || 'Gagal mengubah nama');
    }
});
$('btnCopyKey').addEventListener('click', () => {
    const key = $('dashboard-accesskey').value;
    if (key) {
        copyText(key);
    }
});
$('btnRegenerate').addEventListener('click', async () => {
    if (!confirm('Buat kunci akses baru? Kunci lama tidak bisa dipakai lagi.')) {
        return;
    }
    const res = await api('PUT', '/api/key', {});
    if (res.ok) {
        const detail = await getUserDetail();
        if (detail) {
            toast('Kunci akses baru dibuat');
        }
    } else {
        toast(res.message || 'Gagal merotasi kunci');
    }
});
const togglePatch = async (key, value) => {
    const res = await api('PATCH', '/api/user', { [key]: value });
    if (res.ok) {
        userInfo[key] = value;
        commentsLoad(commentPage);
    } else {
        toast(res.message || 'Gagal menyimpan pengaturan');
    }
};
$('filterBadWord').addEventListener('change', (e) => togglePatch('is_filter', e.target.checked));
$('replyComment').addEventListener('change', (e) => togglePatch('can_reply', e.target.checked));
$('editComment').addEventListener('change', (e) => togglePatch('can_edit', e.target.checked));
$('deleteComment').addEventListener('change', (e) => togglePatch('can_delete', e.target.checked));
$('old_password').addEventListener('input', () => {
    $('btnChangePassword').disabled = $('old_password').value.length === 0;
});
$('btnChangePassword').addEventListener('click', async () => {
    const old_password = $('old_password').value;
    const new_password = $('new_password').value;
    if (new_password.length === 0) {
        toast('Password baru tidak boleh kosong');
        return;
    }
    const btn = $('btnChangePassword');
    btn.disabled = true;
    const res = await api('PATCH', '/api/user', { old_password, new_password });
    btn.disabled = false;
    // Success ONLY when HTTP ok AND the server status is not false
    // (audit fix M1): a wrong old password must never log the admin out
    // with a false "Password diubah" message.
    if (res.ok && res.data && res.data.status !== false) {
        // Token lama ikut hangus (token_version naik): logout bersih.
        logout('Password diubah. Silakan login lagi dengan password baru.');
        toast('Password diubah. Silakan login lagi.');
    } else {
        toast(res.message || 'Password lama salah');
    }
});
const doLogout = async () => {
    if (confirm('Yakin mau logout?')) {
        // Best-effort server-side revoke (audit fix): the token is
        // invalidated via DELETE /api/session, but local discard happens
        // even if that call fails (offline, transient error).
        await api('DELETE', '/api/session');
        logout();
    }
};
$('btnLogout').addEventListener('click', doLogout);
$('sideLogout').addEventListener('click', doLogout);

// ---------- Offline ----------
const applyOffline = () => {
    const off = !navigator.onLine;
    $('offlineBanner').hidden = !off;
    document.querySelectorAll('[data-offline]').forEach((el) => {
        el.disabled = off;
    });
};
window.addEventListener('online', applyOffline);
window.addEventListener('offline', applyOffline);

// ---------- Init ----------
document.querySelectorAll('.nav-ic').forEach((el) => {
    el.innerHTML = ic(el.dataset.ic);
});
updatePreview();
applyOffline();
if (isAuthed()) {
    showApp();
    boot();
} else {
    showLogin();
}
