import { dto } from './dto.js';
import { util } from './util.js';
import { theme } from './theme.js';
import { navbar } from './navbar.js';
import { storage } from './storage.js';
import { session } from './session.js';
import { comment } from './comment.js';
import { bootstrap } from './bootstrap.js';
import { guests } from './guests.js';
import { site } from './site.js';
import { request, HTTP_GET, HTTP_PATCH, HTTP_PUT } from './request.js';

export const admin = (() => {

    let user = null;

    const getUserDetail = () => {
        request(HTTP_GET, '/api/user').token(session.getToken()).send().then((res) => {

            for (let [key, value] of Object.entries(res.data)) {
                user.set(key, value);
            }

            document.getElementById('dashboard-name').innerHTML = `${util.escapeHtml(res.data.name)}<i class="fa-solid fa-hands text-warning ms-2"></i>`;
            document.getElementById('dashboard-email').textContent = res.data.email;
            document.getElementById('dashboard-accesskey').value = res.data.access_key;
            document.getElementById('button-copy-accesskey').setAttribute('data-copy', res.data.access_key);

            document.getElementById('form-name').value = res.data.name;
            document.getElementById('filterBadWord').checked = Boolean(res.data.is_filter);
            document.getElementById('replyComment').checked = Boolean(res.data.can_reply);
            document.getElementById('editComment').checked = Boolean(res.data.can_edit);
            document.getElementById('deleteComment').checked = Boolean(res.data.can_delete);
            site.fill(res.data.site);
        });

        request(HTTP_GET, '/api/stats').token(session.getToken()).send().then((res) => {
            document.getElementById('count-comment').innerHTML = res.data.comments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-like').innerHTML = res.data.likes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-present').innerHTML = res.data.present.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-absent').innerHTML = res.data.absent.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-follow-groom').textContent = (res.data.follows_groom ?? 0).toString();
            document.getElementById('count-follow-bride').textContent = (res.data.follows_bride ?? 0).toString();
        });
    };

    const changeFilterBadWord = async (checkbox) => {
        const label = util.addLoadingCheckbox(checkbox);

        try {
            await request(HTTP_PATCH, '/api/user').
                token(session.getToken()).
                body({
                    filter: Boolean(checkbox.checked)
                }).
                send();
        } finally {
            label.restore();
        }
    };

    const replyComment = async (checkbox) => {
        const label = util.addLoadingCheckbox(checkbox);

        try {
            await request(HTTP_PATCH, '/api/user').
                token(session.getToken()).
                body({
                    can_reply: Boolean(checkbox.checked)
                }).
                send();
        } finally {
            label.restore();
        }
    };

    const editComment = async (checkbox) => {
        const label = util.addLoadingCheckbox(checkbox);

        try {
            await request(HTTP_PATCH, '/api/user').
                token(session.getToken()).
                body({
                    can_edit: Boolean(checkbox.checked)
                }).
                send();
        } finally {
            label.restore();
        }
    };

    const deleteComment = async (checkbox) => {
        const label = util.addLoadingCheckbox(checkbox);

        try {
            await request(HTTP_PATCH, '/api/user').
                token(session.getToken()).
                body({
                    can_delete: Boolean(checkbox.checked)
                }).
                send();
        } finally {
            label.restore();
        }
    };

    const regenerate = async (button) => {
        if (!confirm('Are you sure?')) {
            return;
        }

        const btn = util.disableButton(button);

        try {
            await request(HTTP_PUT, '/api/key').
                token(session.getToken()).
                send(dto.statusResponse).
                then((res) => {
                    if (res.data.status) {
                        getUserDetail();
                    }
                });
        } finally {
            btn.restore();
        }
    };

    const changePassword = async (button) => {
        const old = document.getElementById('old_password');
        const newest = document.getElementById('new_password');

        if (old.value.length == 0 || newest.value.length == 0) {
            alert('Password cannot be empty');
            return;
        }

        old.disabled = true;
        newest.disabled = true;

        const btn = util.disableButton(button);

        const result = await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                old_password: old.value,
                new_password: newest.value,
            }).
            send(dto.statusResponse).
            then((res) => res.data.status, () => false);

        btn.restore();

        old.disabled = false;
        newest.disabled = false;

        if (result) {
            old.value = null;
            newest.value = null;
            button.disabled = true;
            alert('Success change password');
        }
    };

    const changeName = async (button) => {
        const name = document.getElementById('form-name');

        if (name.value.length == 0) {
            alert('Name cannot be empty');
            return;
        }

        name.disabled = true;

        const btn = util.disableButton(button);

        const result = await request(HTTP_PATCH, '/api/user').
            token(session.getToken()).
            body({
                name: name.value,
            }).
            send(dto.statusResponse).
            then((res) => res.data.status, () => false);

        name.disabled = false;

        btn.restore();

        if (result) {
            getUserDetail();
            button.disabled = true;
            alert('Success change name');
        }
    };

    const download = async (button) => {
        const btn = util.disableButton(button);

        await request(HTTP_GET, '/api/download').token(session.getToken()).download();

        btn.restore();
    };

    const enableButtonName = () => {
        const btn = document.getElementById('button-change-name');
        if (btn.disabled) {
            btn.disabled = false;
        }
    };

    const enableButtonPassword = () => {
        const btn = document.getElementById('button-change-password');
        const old = document.getElementById('old_password');

        if (btn.disabled && old.value.length !== 0) {
            btn.disabled = false;
        }
    };

    const login = async (button) => {
        const btn = util.disableButton(button);

        const formEmail = document.getElementById('loginEmail');
        const formPassword = document.getElementById('loginPassword');

        formEmail.disabled = true;
        formPassword.disabled = true;

        const res = await session.login(dto.postSessionRequest(formEmail.value, formPassword.value));
        if (res) {
            getUserDetail();
            guests.load();
            comment.comment();
            bootstrap.Modal.getOrCreateInstance('#loginModal').hide();
            formEmail.value = null;
            formPassword.value = null;
        }

        btn.restore();
        formEmail.disabled = false;
        formPassword.disabled = false;
    };

    const logout = () => {
        if (!confirm('Are you sure?')) {
            return;
        }

        user.clear();
        session.logout();
        bootstrap.Modal.getOrCreateInstance('#loginModal').show();
    };

    const init = () => {
        session.init();
        user = storage('user');

        if (!session.isAdmin()) {
            storage('owns').clear();
            storage('likes').clear();
            storage('config').clear();
            storage('comment').clear();
            storage('session').clear();
            storage('information').clear();
        }

        theme.spyTop();
        comment.init();

        try {
            const jwt = session.decode();
            if (!jwt || (jwt.exp ?? 0) < (Date.now() / 1000)) {
                throw new Error('invalid token');
            }

            getUserDetail();
            guests.load();
            comment.comment();
        } catch {
            bootstrap.Modal.getOrCreateInstance('#loginModal').show();
            session.logout();
            user.clear();
        }
    };

    return {
        init,
        login,
        logout,
        changeFilterBadWord,
        replyComment,
        editComment,
        deleteComment,
        regenerate,
        changePassword,
        download,
        changeName,
        enableButtonName,
        enableButtonPassword,
        navbar,
    };
})();