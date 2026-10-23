import { bootstrap } from './bootstrap.js';

export const navbar = (() => {

    /**
     * @param {HTMLElement} btn
     * @returns {void}
     */
    const setActive = (btn) => {
        ['button-mobile-home', 'button-mobile-setting', 'button-mobile-guest'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
            }
        });
        btn.classList.add('active');
    };

    const buttonNavHome = (btn) => {
        bootstrap.Tab.getOrCreateInstance(document.getElementById('button-home')).show();
        setActive(btn);
    };

    /**
     * @param {HTMLElement} btn
     * @returns {void}
     */
    const buttonNavSetting = (btn) => {
        bootstrap.Tab.getOrCreateInstance(document.getElementById('button-setting')).show();
        setActive(btn);
    };

    /**
     * @param {HTMLElement} btn
     * @returns {void}
     */
    const buttonNavGuest = (btn) => {
        bootstrap.Tab.getOrCreateInstance(document.getElementById('button-guest')).show();
        setActive(btn);
    };

    return {
        buttonNavHome,
        buttonNavSetting,
        buttonNavGuest,
    };
})();