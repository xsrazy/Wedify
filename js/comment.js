import { dto } from './dto.js';
import { card } from './card.js';
import { like } from './like.js';
import { util } from './util.js';
import { theme } from './theme.js';
import { session } from './session.js';
import { storage } from './storage.js';
import { pagination } from './pagination.js';
import { request, HTTP_GET, HTTP_POST, HTTP_DELETE, HTTP_PUT } from './request.js';

export const comment = (() => {

    let owns = null;
    let user = null;
    let tracker = null;
    let showHide = null;

    const changeButton = (id, disabled) => document.querySelector(`[data-button-action="${id}"]`).childNodes.forEach((e) => e.disabled = disabled);

    const remove = async (button) => {
        if (!confirm('Are you sure?')) {
            return;
        }

        const id = button.getAttribute('data-uuid');

        if (session.isAdmin()) {
            owns.set(id, button.getAttribute('data-own'));
        }

        changeButton(id, true);
        const btn = util.disableButton(button);
        const like = document.querySelector(`[onclick="like.like(this)"][data-uuid="${id}"]`);
        like.disabled = true;

        const status = await request(HTTP_DELETE, '/api/comment/' + owns.get(id))
            .token(session.getToken())
            .send(dto.statusResponse)
            .then((res) => res.data.status, () => false);

        if (!status) {
            btn.restore();
            like.disabled = false;
            return;
        }

        document.querySelectorAll('a[onclick="comment.showOrHide(this)"]').forEach((n) => {
            const oldUuids = n.getAttribute('data-uuids').split(',');

            if (oldUuids.find((i) => i === id)) {
                const uuids = oldUuids.filter((i) => i !== id).join(',');
                uuids.length === 0 ? n.remove() : n.setAttribute('data-uuids', uuids);
            }
        });

        owns.unset(id);
        document.getElementById(id).remove();
    };

    const update = async (button) => {
        const id = button.getAttribute('data-uuid');

        let isPresent = false;
        const presence = document.getElementById(`form-inner-presence-${id}`);
        if (presence) {
            presence.disabled = true;
            isPresent = presence.value === '1';
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);

        let isChecklist = false;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) {
            isChecklist = badge.classList.contains('text-success');
        }

        if (id && util.base64Encode(form.value) === form.getAttribute('data-original') && isChecklist === isPresent) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
            return;
        }

        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);

        const status = await request(HTTP_PUT, '/api/comment/' + owns.get(id))
            .token(session.getToken())
            .body(dto.updateCommentRequest(presence ? isPresent : null, form.value))
            .send(dto.statusResponse)
            .then((res) => res.data.status, () => false);

        form.disabled = false;
        if (cancel) {
            cancel.disabled = false;
        }

        if (presence) {
            presence.disabled = false;
        }

        btn.restore();

        if (!status) {
            return;
        }

        changeButton(id, false);
        document.getElementById(`inner-${id}`).remove();

        const show = document.querySelector(`[onclick="comment.showMore(this, '${id}')"]`);
        const original = card.convertMarkdownToHTML(util.escapeHtml(form.value));
        const content = document.getElementById(`content-${id}`);

        content.innerHTML = show && show.getAttribute('data-show') == 'false' ? original.slice(0, card.maxCommentLength) + '...' : original;
        if (original.length > card.maxCommentLength) {
            content.setAttribute('data-comment', util.base64Encode(original));
        }

        if (presence) {
            document.getElementById('form-presence').value = isPresent ? '1' : '2';
            storage('information').set('presence', isPresent);
        }

        if (!presence || !badge) {
            return;
        }

        if (isPresent) {
            badge.classList.remove('fa-circle-xmark', 'text-danger');
            badge.classList.add('fa-circle-check', 'text-success');
            return;
        }

        badge.classList.remove('fa-circle-check', 'text-success');
        badge.classList.add('fa-circle-xmark', 'text-danger');
    };

    const send = async (button) => {
        const id = button.getAttribute('data-uuid');

        const name = document.getElementById('form-name');
        let nameValue = name.value;

        if (session.isAdmin()) {
            nameValue = user.get('name');
        }

        if (nameValue.length == 0) {
            alert('Silakan masukkan nama Anda.');
            return;
        }

        const presence = document.getElementById('form-presence');
        if (!id && presence && presence.value == '0') {
            alert('Silakan pilih status kehadiran Anda.');
            return;
        }

        if (!id && name && !session.isAdmin()) {
            name.disabled = true;
        }

        if (presence && presence.value != '0') {
            presence.disabled = true;
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);
        const isPresence = presence ? presence.value === '1' : true;

        if (!session.isAdmin()) {
            const info = storage('information');
            info.set('name', nameValue);

            if (!id) {
                info.set('presence', isPresence);
            }
        }

        const response = await request(HTTP_POST, '/api/comment')
            .token(session.getToken())
            .body(dto.postCommentRequest(id, nameValue, isPresence, form.value))
            .send(dto.postCommentResponse)
            .then((res) => res, () => null);

        if (name) {
            name.disabled = false;
        }

        form.disabled = false;
        if (cancel) {
            cancel.disabled = false;
        }

        if (presence) {
            presence.disabled = false;
        }

        btn.restore();

        if (!response || response.code !== 201) {
            return;
        }

        owns.set(response.data.uuid, response.data.own);
        form.value = null;

        if (!id) {
            const newPage = await pagination.reset();
            if (newPage) {
                scroll();
                return;
            }

            response.data.is_admin = session.isAdmin();
            const length = document.getElementById('comments').children.length;
            pagination.setResultData(length);

            if (length == pagination.getPer()) {
                document.getElementById('comments').lastElementChild.remove();
            }

            document.getElementById('comments').innerHTML = card.renderContent(response.data) + document.getElementById('comments').innerHTML;
            scroll();
        }

        if (id) {
            showHide.set('hidden', showHide.get('hidden').concat([dto.commentShowMore(response.data.uuid, true)]));
            showHide.set('show', showHide.get('show').concat([id]));

            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();

            response.data.is_admin = session.isAdmin();
            document.getElementById(`reply-content-${id}`).insertAdjacentHTML('beforeend', card.renderInnerContent(response.data));

            const containerDiv = document.getElementById(`button-${id}`);
            const anchorTag = containerDiv.querySelector('a');
            const uuids = [response.data.uuid];

            if (anchorTag) {
                if (anchorTag.getAttribute('data-show') === 'false') {
                    showOrHide(anchorTag);
                }

                anchorTag.remove();
            }

            containerDiv.querySelector(`button[onclick="like.like(this)"][data-uuid="${id}"]`).insertAdjacentHTML('beforebegin', card.renderReadMore(id, anchorTag ? anchorTag.getAttribute('data-uuids').split(',').concat(uuids) : uuids));
        }
    };

    const cancel = (id) => {
        const form = document.getElementById(`form-inner-${id}`);

        let isPresent = false;
        const presence = document.getElementById(`form-inner-presence-${id}`);
        if (presence) {
            isPresent = presence.value === '1';
        }

        let isChecklist = false;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) {
            isChecklist = badge.classList.contains('text-success');
        }

        if (form.value.length === 0 || (util.base64Encode(form.value) === form.getAttribute('data-original') && isChecklist === isPresent) || confirm('Are you sure?')) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
        }
    };

    const reply = (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);
        document.getElementById(`button-${id}`).insertAdjacentElement('afterend', card.renderReply(id));
    };

    const edit = async (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);
        const btn = util.disableButton(button);

        await request(HTTP_GET, '/api/comment/' + id)
            .token(session.getToken())
            .send(dto.commentResponse)
            .then((res) => {
                if (res.code !== 200) {
                    return;
                }

                document.getElementById(`button-${id}`).insertAdjacentElement('afterend', card.renderEdit(id, res.data.presence));
                const formInner = document.getElementById(`form-inner-${id}`);
                formInner.value = res.data.comment;
                formInner.setAttribute('data-original', util.base64Encode(res.data.comment));
            });

        btn.restore();
        button.disabled = true;
    };

    const comment = () => {
        card.renderLoading();
        const comments = document.getElementById('comments');
        const onNullComment = `<div class="text-center p-4 my-2 bg-theme-${theme.isDarkMode('dark', 'light')} rounded-4 shadow"><p class="fw-bold p-0 m-0">Yuk bagikan undangan ini biar banyak komentarnya</p></div>`;

        return request(HTTP_GET, `/api/comment?per=${pagination.getPer()}&next=${pagination.getNext()}`)
            .token(session.getToken())
            .send()
            .then((res) => {
                pagination.setResultData(res.data.length);
                comments.setAttribute('data-loading', 'false');

                if (res.data.length === 0) {
                    if (pagination.getNext() > 0) {
                        // Empty page past the first one (an exactly-full
                        // last page invited one Next too many): step back
                        // instead of replacing the list with the empty
                        // state (audit fix).
                        return pagination.stepBack().then(() => res);
                    }

                    comments.innerHTML = onNullComment;
                    return res;
                }

                const traverse = (items, hide) => {
                    items.forEach((item) => {
                        if (!hide.find((i) => i.uuid === item.uuid)) {
                            hide.push(dto.commentShowMore(item.uuid));
                        }

                        if (item.comments && item.comments.length > 0) {
                            traverse(item.comments, hide);
                        }
                    });

                    return hide;
                };

                showHide.set('hidden', traverse(res.data, showHide.get('hidden')));
                comments.innerHTML = res.data.map((c) => card.renderContent(c)).join('');
                res.data.forEach(fetchTracker);

                return res;
            });
    };

    const showOrHide = (button) => {
        const ids = button.getAttribute('data-uuids').split(',');
        const show = button.getAttribute('data-show') === 'true';
        const uuid = button.getAttribute('data-uuid');

        if (show) {
            button.setAttribute('data-show', 'false');
            button.innerText = 'Show replies';
            button.innerText += ' (' + ids.length + ')';

            showHide.set('show', showHide.get('show').filter((i) => i !== uuid));
        } else {
            button.setAttribute('data-show', 'true');
            button.innerText = 'Hide replies';

            showHide.set('show', showHide.get('show').concat([uuid]));
        }

        for (const id of ids) {
            showHide.set('hidden', showHide.get('hidden').map((i) => {
                if (i.uuid === id) {
                    i.show = !show;
                }

                return i;
            }));

            const cls = document.getElementById(id).classList;
            show ? cls.add('d-none') : cls.remove('d-none');
        }
    };

    const showMore = (anchor, uuid) => {
        const comment = document.getElementById(`content-${uuid}`);
        const original = util.base64Decode(comment.getAttribute('data-comment'));
        const isCollapsed = anchor.getAttribute('data-show') === 'false';

        comment.innerHTML = isCollapsed ? original : original.slice(0, card.maxCommentLength) + '...';
        anchor.innerText = isCollapsed ? 'Sebagian' : 'Selengkapnya';
        anchor.setAttribute('data-show', isCollapsed ? 'true' : 'false');
    };

    const fetchTracker = (comment) => {
        if (!session.isAdmin()) {
            return;
        }

        if (comment.comments) {
            comment.comments.forEach(fetchTracker);
        }

        if (comment.ip === undefined || comment.user_agent === undefined || comment.is_admin || tracker.has(comment.ip)) {
            return;
        }

        fetch(`https://freeipapi.com/api/json/${comment.ip}`)
            .then((res) => res.json())
            .then((res) => {
                let result = res.cityName + ' - ' + res.regionName;

                if (res.cityName == '-' && res.regionName == '-') {
                    result = 'localhost';
                }

                tracker.set(comment.ip, result);
                document.getElementById(`ip-${comment.uuid}`).innerHTML = `<i class="fa-solid fa-location-dot me-1"></i>${util.escapeHtml(comment.ip)} <strong>${util.escapeHtml(result)}</strong>`;
            })
            .catch((err) => {
                document.getElementById(`ip-${comment.uuid}`).innerHTML = `<i class="fa-solid fa-location-dot me-1"></i>${util.escapeHtml(comment.ip)} <strong>${util.escapeHtml(err.message)}</strong>`;
            });
    };

    const scroll = () => document.getElementById('comments').scrollIntoView({ behavior: 'smooth' });

    const init = () => {
        like.init();
        card.init();

        owns = storage('owns');
        user = storage('user');
        tracker = storage('tracker');
        showHide = storage('comment');

        if (!showHide.has('hidden')) {
            showHide.set('hidden', []);
        }

        if (!showHide.has('show')) {
            showHide.set('show', []);
        }
    };

    return {
        init,
        scroll,
        cancel,
        send,
        edit,
        reply,
        remove,
        update,
        comment,
        showMore,
        showOrHide,
    };
})();