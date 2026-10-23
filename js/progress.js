import { guest } from './guest.js';

// The loading screen was removed by request of the site owner: the page now
// opens straight to the welcome cover. This module stays as a no-op with the
// same API so app.js and guest.js keep working unchanged; init() only hands
// over to guest.name() right away (guest name + form prefill).
export const progress = (() => {

    let done = false;

    const init = () => {
        if (done) {
            return;
        }
        done = true;
        guest.name();
    };

    const add = () => { };
    const complete = () => { };
    const invalid = () => { };

    return {
        init,
        add,
        invalid,
        complete,
    };
})();
