import { bootstrap } from './bootstrap.js';

export const util = (() => {

    /**
     * @param {string} unsafe
     * @returns {string}
     */
    const escapeHtml = (unsafe) => {
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    /**
     * @param {function} callback
     * @param {number} timeout
     * @returns {void}
     */
    const timeOut = (callback, timeout) => {
        let clear = null;
        const c = () => {
            callback();
            clearTimeout(clear);
            clear = null;
        };

        clear = setTimeout(c, timeout);
    };

    const disableButton = (button, message = 'Loading..') => {

        button.disabled = true;
        const tmp = button.innerHTML;
        button.innerHTML = `<div class="spinner-border spinner-border-sm my-0 ms-0 me-1 p-0" style="height: 0.8rem; width: 0.8rem"></div>${message}`;

        return {
            restore: () => {
                button.innerHTML = tmp;
                button.disabled = false;
            },
        };
    };

    const addLoadingCheckbox = (checkbox) => {
        checkbox.disabled = true;

        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        const tmp = label.innerHTML;
        label.innerHTML = `<div class="spinner-border spinner-border-sm my-0 ms-0 me-1 p-0" style="height: 0.8rem; width: 0.8rem"></div>${tmp}`;

        return {
            restore: () => {
                label.innerHTML = tmp;
                checkbox.disabled = false;
            },
        };
    };

    /**
     * @param {HTMLElement} svg
     * @param {number} timeout
     * @param {string} classes
     * @returns {void}
     */
    const animate = (svg, timeout, classes) => timeOut(() => svg.classList.add(classes), timeout);

    /**
     * @param {HTMLImageElement} img
     * @returns {void}
     */
    const modal = (img) => {
        document.getElementById('show-modal-image').src = img.src;
        bootstrap.Modal.getOrCreateInstance('#modal-image').show();
    };

    const copy = async (button, message = null, timeout = 1500) => {
        const copy = button.getAttribute('data-copy');

        if (!copy || copy.length == 0) {
            alert('Nothing to copy');
            return;
        }

        button.disabled = true;

        try {
            await navigator.clipboard.writeText(copy);
        } catch {
            button.disabled = false;
            alert('Failed to copy');
            return;
        }

        const tmp = button.innerHTML;
        button.innerHTML = message ? message : '<i class="fa-solid fa-check"></i>';

        timeOut(() => {
            button.disabled = false;
            button.innerHTML = tmp;
        }, timeout);
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    const base64Encode = (str) => {
        const encoder = new TextEncoder();
        const encodedBytes = encoder.encode(str);
        // Chunked conversion (audit fix): spreading a huge byte array into
        // String.fromCharCode throws RangeError on very long comments.
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < encodedBytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, encodedBytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    const base64Decode = (str) => {
        const decoder = new TextDecoder();
        const decodedBytes = Uint8Array.from(window.atob(str), (c) => c.charCodeAt(0));
        return decoder.decode(decodedBytes);
    };

    return {
        open,
        copy,
        modal,
        timeOut,
        animate,
        escapeHtml,
        base64Encode,
        base64Decode,
        disableButton,
        addLoadingCheckbox,
    };
})();