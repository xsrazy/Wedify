import { dto } from './dto.js';
import { storage } from './storage.js';
import { request, HTTP_POST, HTTP_GET } from './request.js';

export const session = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let ses = null;

    /**
     * @returns {string|null}
     */
    const getToken = () => ses.get('token');

    /**
     * @param {object} body
     * @returns {Promise<boolean>}
     */
    const login = (body) => {
        return request(HTTP_POST, '/api/session')
            .body(body)
            .send(dto.tokenResponse)
            .then(
                (res) => {
                    if (res.code === 200) {
                        setToken(res.data.token);
                    }

                    return res.code === 200;
                },
                () => false
            );
    };

    /**
     * @returns {void}
     */
    const logout = () => ses.unset('token');

    /**
     * @param {string} token
     * @returns {void}
     */
    const setToken = (token) => ses.set('token', token);

    /**
     * @returns {boolean}
     */
    const isAdmin = () => String(getToken() ?? '.').split('.').length === 3;

    /**
     * @returns {Promise<ReturnType<typeof dto.baseResponse<object>>}
     */
    const guest = () => {
        const config = storage('config');

        return request(HTTP_GET, '/api/config')
            .token(document.body.getAttribute('data-key'))
            .send()
            .then((res) => {
                if (res.code !== 200) {
                    return res;
                }

                for (let [key, value] of Object.entries(res.data)) {
                    config.set(key, value);
                }

                setToken(document.body.getAttribute('data-key'));
                return res;
            });
    };

    /**
     * @returns {object|null}
     */
    const decode = () => {
        if (!isAdmin()) {
            return null;
        }

        try {
            // JWT segments are base64url; convert before atob (audit fix:
            // raw atob threw on '-'/'_' and valid tokens were discarded).
            const segment = getToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
            return JSON.parse(window.atob(padded));
        } catch {
            return null;
        }
    };

    /**
     * @returns {void}
     */
    const init = () => {
        ses = storage('session');
    };

    return {
        init,
        guest,
        login,
        logout,
        decode,
        isAdmin,
        setToken,
        getToken,
    };
})();