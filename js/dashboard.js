import { like } from './like.js';
import { util } from './util.js';
import { admin } from './admin.js';
import { site } from './site.js';
import { theme } from './theme.js';
import { guests } from './guests.js';
import { offline } from './offline.js';
import { comment } from './comment.js';
import { pagination } from './pagination.js';

document.addEventListener('DOMContentLoaded', () => {
    window.util = util;
    window.like = like;
    window.admin = admin;
    window.site = site;
    window.theme = theme;
    window.guests = guests;
    window.comment = comment;
    window.pagination = pagination;

    // Isolate init failures (audit fix), same as the invitation page.
    const safeInit = (fn) => {
        try {
            fn();
        } catch (err) {
            console.error(err);
        }
    };

    safeInit(() => theme.init());
    safeInit(() => admin.init());
    safeInit(() => site.init());
    safeInit(() => guests.init());
    safeInit(() => offline.init());
    safeInit(() => pagination.init());
});