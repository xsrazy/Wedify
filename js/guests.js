import { util } from './util.js';
import { session } from './session.js';
import { request, HTTP_GET, HTTP_POST, HTTP_DELETE } from './request.js';

// Guest manager for the dashboard: build personalized invitation links
// (?to=Name), send them via WhatsApp, and keep a saved guest list.
export const guests = (() => {

    // Invitation links must point at this site itself. location.origin is
    // used instead of a hardcoded domain so the dashboard never advertises
    // another wedding site (audit fix).
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
        const name = document.getElementById('guest-name')?.value ?? '';
        const phone = document.getElementById('guest-phone')?.value ?? '';
        const link = linkFor(name);
        const hasName = name.trim().length > 0;

        const preview = document.getElementById('guest-link-preview');
        if (preview) {
            preview.textContent = hasName ? link : `${SITE}/?to=Nama+Tamu`;
        }

        const copyBtn = document.getElementById('guest-copy-button');
        if (copyBtn) {
            copyBtn.setAttribute('data-copy', hasName ? link : '');
        }

        const waBtn = document.getElementById('guest-wa-button');
        if (waBtn) {
            waBtn.href = hasName ? waHref(name.trim(), link, phone) : '#';
        }
    };

    const render = (items) => {
        const list = document.getElementById('guest-list');
        if (!list) {
            return;
        }

        if (!items || items.length === 0) {
            list.innerHTML = '<p class="m-0 p-0 text-center" style="font-size: 0.9rem;">Belum ada tamu tersimpan.</p>';
            return;
        }

        list.innerHTML = items.map((g) => {
            const link = linkFor(g.name);
            const wa = waHref(g.name, link, '');
            return `
            <div class="border rounded-4 p-3 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="me-2" style="min-width: 0;">
                        <p class="fw-bold m-0 p-0 text-truncate">${util.escapeHtml(g.name)}</p>
                        <small class="text-break">${link}</small>
                        <br><small>${util.escapeHtml(g.created_at)}</small>
                    </div>
                </div>
                <div class="d-flex gap-2 mt-2">
                    <a class="btn btn-success btn-sm rounded-4" style="font-size: 0.75rem;" target="_blank" rel="noopener" href="${wa}"><i class="fa-brands fa-whatsapp me-1"></i>Kirim WA</a>
                    <button class="btn btn-outline-secondary btn-sm rounded-4" style="font-size: 0.75rem;" data-copy="${link}" onclick="util.copy(this, 'Tersalin')"><i class="fa-solid fa-copy me-1"></i>Salin Link</button>
                    <button class="btn btn-outline-danger btn-sm rounded-4" style="font-size: 0.75rem;" onclick="guests.remove(this, '${g.id}')"><i class="fa-solid fa-trash me-1"></i>Hapus</button>
                </div>
            </div>`;
        }).join('');
    };

    const load = async () => {
        if (!session.isAdmin()) {
            return;
        }
        await request(HTTP_GET, '/api/guest')
            .token(session.getToken())
            .send()
            .then((res) => render(res.data))
            .catch(() => null);
    };

    const add = async (button) => {
        const nameInput = document.getElementById('guest-name');
        const name = nameInput.value.trim();
        if (name.length === 0) {
            alert('Nama tamu tidak boleh kosong');
            return;
        }

        const btn = util.disableButton(button);
        await request(HTTP_POST, '/api/guest')
            .token(session.getToken())
            .body({ name })
            .send()
            .then(() => load())
            .catch(() => null);
        btn.restore();
    };

    const remove = async (button, id) => {
        if (!confirm('Hapus tamu ini?')) {
            return;
        }

        const btn = util.disableButton(button);
        await request(HTTP_DELETE, `/api/guest/${id}`)
            .token(session.getToken())
            .send()
            // Reload either way: a 404 means the guest is already gone, so
            // the list on screen is the truth in both cases (audit fix).
            .then(() => load())
            .catch(() => load());
        btn.restore();
    };

    const init = () => {
        const name = document.getElementById('guest-name');
        const phone = document.getElementById('guest-phone');
        if (name) {
            name.addEventListener('input', updatePreview);
        }
        if (phone) {
            phone.addEventListener('input', updatePreview);
        }
        updatePreview();
        load();
    };

    return {
        init,
        load,
        add,
        remove,
        updatePreview,
    };
})();
