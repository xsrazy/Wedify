import { util } from './util.js';
import { session } from './session.js';
import { request, HTTP_PATCH } from './request.js';

// Editor for the public site content (settings.site in the DB). The
// field list mirrors defaultSite() in api/_lib.js and the whitelist in
// api/user.js; every input in the Konten Web pane uses id `site-<key>`.
const FIELDS = [
    'groom_name', 'groom_short', 'groom_parents', 'groom_listeners',
    'bride_name', 'bride_short', 'bride_parents', 'bride_listeners',
    'album_title', 'album_subtitle', 'album_art', 'groom_photo', 'bride_photo',
    'music_title', 'music_artist', 'music_url',
    'wedding_iso', 'date_label', 'akad_time', 'akad_desc',
    'resepsi_time', 'resepsi_desc', 'venue_name', 'venue_address',
    'maps_url', 'cal_start', 'cal_end', 'dress_1', 'dress_2',
    'lyrics_text', 'lyrics_source',
    'wrapped_match', 'wrapped_genre', 'wrapped_collab',
    'gift1_bank', 'gift1_number', 'gift1_owner',
    'gift2_bank', 'gift2_number', 'gift2_owner',
    'gallery_urls', 'share_text',
];

// Media fields that accept a direct file upload instead of a pasted URL.
const MEDIA_FIELDS = {
    album_art: 'image',
    groom_photo: 'image',
    bride_photo: 'image',
    music_url: 'audio',
};
const MAX_AUDIO_BYTES = 3 * 1024 * 1024;

const toBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

// Downscale + re-encode images in the browser so uploads stay small.
const prepareImage = async (file) => {
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = url;
        });
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
        if (!blob) {
            throw new Error('Gagal memproses gambar.');
        }
        return { blob, contentType: 'image/webp' };
    } finally {
        URL.revokeObjectURL(url);
    }
};

const uploadFile = async (kind, file) => {
    let blob = file;
    let contentType = file.type;
    if (kind === 'image') {
        const prepared = await prepareImage(file);
        blob = prepared.blob;
        contentType = prepared.contentType;
    } else if (file.size > MAX_AUDIO_BYTES) {
        throw new Error('File musik maksimal 3 MB. Kecilkan dulu file-nya (misalnya potong jadi loop pendek).');
    }
    const dataBase64 = await toBase64(blob);
    const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.getToken(),
        },
        body: JSON.stringify({ kind, contentType, dataBase64 }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || !json.data || !json.data.url) {
        throw new Error((json && json.error && json.error[0]) || 'Upload gagal.');
    }
    return json.data.url;
};

export const site = (() => {

    const fill = (data) => {
        if (!data) {
            return;
        }
        for (const key of FIELDS) {
            const el = document.getElementById(`site-${key}`);
            if (el && typeof data[key] === 'string') {
                el.value = data[key];
            }
        }
    };

    const save = async (button) => {
        const payload = {};
        for (const key of FIELDS) {
            const el = document.getElementById(`site-${key}`);
            if (el) {
                payload[key] = el.value;
            }
        }
        const btn = util.disableButton(button);
        try {
            const res = await request(HTTP_PATCH, '/api/user')
                .token(session.getToken())
                .body({ site: payload })
                .send();
            if (res && res.data && res.data.status) {
                alert('Konten web berhasil disimpan. Perubahan langsung tampil di halaman undangan.');
            } else {
                alert('Gagal menyimpan. Coba lagi.');
            }
        } catch {
            alert('Gagal menyimpan. Coba lagi.');
        } finally {
            btn.restore();
        }
    };

    const addUploadControl = (key, kind) => {
        const input = document.getElementById(`site-${key}`);
        if (!input || input.dataset.uploadBound) {
            return;
        }
        input.dataset.uploadBound = '1';
        const host = input.closest('.col-md-6') || input.parentElement;
        const row = document.createElement('div');
        row.className = 'mt-2 d-flex gap-2 align-items-center';
        row.innerHTML = '<button type="button" class="btn btn-outline-success btn-sm rounded-4">'
            + '<i class="fa-solid fa-upload me-1"></i>Upload</button>'
            + '<span class="text-muted" style="font-size: 0.8rem;"></span>';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.hidden = true;
        fileInput.accept = kind === 'image' ? 'image/*' : 'audio/*';
        row.appendChild(fileInput);
        host.appendChild(row);
        const btn = row.querySelector('button');
        const status = row.querySelector('span');
        btn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                return;
            }
            btn.disabled = true;
            status.textContent = 'Mengupload...';
            try {
                const url = await uploadFile(kind, file);
                input.value = url;
                status.textContent = 'Terupload. Klik Simpan Konten buat menerapkan.';
            } catch (err) {
                status.textContent = err.message || 'Upload gagal.';
            } finally {
                btn.disabled = false;
                fileInput.value = '';
            }
        });
    };

    const addGalleryControl = () => {
        const input = document.getElementById('site-gallery_urls');
        if (!input || input.dataset.uploadBound) {
            return;
        }
        input.dataset.uploadBound = '1';
        const host = input.closest('.col-md-6') || input.parentElement;
        const row = document.createElement('div');
        row.className = 'mt-2 d-flex gap-2 align-items-center';
        row.innerHTML = '<button type="button" class="btn btn-outline-success btn-sm rounded-4">'
            + '<i class="fa-solid fa-upload me-1"></i>Upload foto galeri</button>'
            + '<span class="text-muted" style="font-size: 0.8rem;"></span>';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.hidden = true;
        fileInput.multiple = true;
        fileInput.accept = 'image/*';
        row.appendChild(fileInput);
        host.appendChild(row);
        const btn = row.querySelector('button');
        const status = row.querySelector('span');
        btn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const files = Array.from(fileInput.files || []);
            if (files.length === 0) {
                return;
            }
            btn.disabled = true;
            let done = 0;
            try {
                for (const file of files) {
                    status.textContent = `Mengupload ${done + 1}/${files.length}...`;
                    const url = await uploadFile('image', file);
                    input.value = (input.value.replace(/\s+$/, '') + (input.value.trim() ? '\n' : '') + url);
                    done += 1;
                }
                status.textContent = `${done} foto terupload. Klik Simpan Konten buat menerapkan.`;
            } catch (err) {
                status.textContent = err.message || 'Upload gagal.';
            } finally {
                btn.disabled = false;
                fileInput.value = '';
            }
        });
    };

    const init = () => {
        for (const [key, kind] of Object.entries(MEDIA_FIELDS)) {
            addUploadControl(key, kind);
        }
        addGalleryControl();
    };

    return { fill, save, init, FIELDS };
})();
