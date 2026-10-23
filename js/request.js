import { dto } from './dto.js';

export const HTTP_GET = 'GET';
export const HTTP_POST = 'POST';
export const HTTP_PUT = 'PUT';
export const HTTP_PATCH = 'PATCH';
export const HTTP_DELETE = 'DELETE';

export const request = (method, path) => {

    let url = document.body.getAttribute('data-url');
    let req = {
        method: String(method).toUpperCase(),
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }),
    };

    if (url.slice(-1) === '/') {
        url = url.slice(0, -1);
    }

    return {
        /**
         * @template T
         * @param {((data: any) => T)=} transform
         * @returns {Promise<ReturnType<typeof dto.baseResponse<T>>>}
         */
        send(transform = null) {
            return fetch(url + path, req)
                .then((res) => {
                    return res.json().then((json) => {
                        if (res.status >= 500 && (json.message ?? json[0])) {
                            throw new Error(json.message ?? json[0]);
                        }

                        if (json.error) {
                            throw new Error(json.error[0]);
                        }

                        if (transform) {
                            json.data = transform(json.data);
                        }

                        return dto.baseResponse(json.code, json.data, json.error);
                    });
                })
                .catch((err) => {
                    if (err instanceof TypeError) {
                        alert('Koneksi bermasalah, silakan coba lagi.');
                    } else {
                        alert(err.message ?? err);
                    }
                    throw err;
                });
        },
        /**
         * @returns {Promise<boolean>}
         */
        download() {
            return fetch(url + path, req)
                .then((res) => {
                    if (res.status !== 200) {
                        return false;
                    }

                    const existingLink = document.querySelector('a[download]');
                    if (existingLink) {
                        document.body.removeChild(existingLink);
                    }

                    const filename = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? 'download.csv';

                    return res.blob().then((blob) => {
                        const link = document.createElement('a');
                        const href = window.URL.createObjectURL(blob);

                        link.href = href;
                        link.download = filename;
                        document.body.appendChild(link);

                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(href);

                        return true;
                    });
                })
                .catch((err) => {
                    if (err instanceof TypeError) {
                        alert('Koneksi bermasalah, silakan coba lagi.');
                    } else {
                        alert(err.message ?? err);
                    }
                    throw err;
                });
        },
        /**
         * @param {string} token
         * @returns {this}
         */
        token(token) {
            if (token && token.split('.').length === 3) {
                req.headers.append('Authorization', 'Bearer ' + token);
                return this;
            }

            req.headers.append('x-access-key', token);
            return this;
        },
        /**
         * @param {object} body
         * @returns {this}
         */
        body(body) {
            req.body = JSON.stringify(body);
            return this;
        },
    };
};
