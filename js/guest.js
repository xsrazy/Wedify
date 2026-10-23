import { util } from './util.js';
import { audio } from './audio.js';
import { theme } from './theme.js';
import { session } from './session.js';
import { storage } from './storage.js';
import { comment } from './comment.js';
import { progress } from './progress.js';
import { confetti } from './confetti.js';

export const guest = (() => {

    /**
     * @param {string} id
     * @param {number} speed
     * @returns {void}
     */
    const opacity = (id, speed = 0.01) => {
        const el = document.getElementById(id);
        if (!el) {
            return;
        }
        let op = parseFloat(el.style.opacity);

        let clear = null;
        const callback = () => {
            if (op > 0) {
                el.style.opacity = op.toFixed(3);
                op -= speed;
                return;
            }

            clearInterval(clear);
            clear = null;
            el.remove();
        };

        clear = setInterval(callback, 10);
    };

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let information = null;

    const countDownDate = () => {
        const until = document.getElementById('count-down')?.getAttribute('data-time')?.replace(' ', 'T');
        if (!until) {
            return;
        }

        const count = (new Date(until)).getTime();

        setInterval(() => {
            // Clamp at zero after the date (audit fix): Math.abs used to
            // make the counter climb forever once the day had passed.
            const distance = Math.max(0, count - Date.now());

            document.getElementById('day').innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
            document.getElementById('hour').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            document.getElementById('minute').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            document.getElementById('second').innerText = Math.floor((distance % (1000 * 60)) / 1000);
        }, 1000);
    };

    const animation = () => {
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const colors = ['#FFC0CB', '#FF1493', '#C71585'];

        const randomInRange = (min, max) => {
            return Math.random() * (max - min) + min;
        };

        const heart = confetti.shapeFromPath({
            path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
            matrix: [0.03333333333333333, 0, 0, 0.03333333333333333, -5.566666666666666, -5.533333333333333]
        });

        (function frame() {
            const timeLeft = animationEnd - Date.now();

            colors.forEach((color) => {
                confetti({
                    particleCount: 1,
                    startVelocity: 0,
                    ticks: Math.max(50, 75 * (timeLeft / duration)),
                    origin: {
                        x: Math.random(),
                        y: Math.abs(Math.random() - (timeLeft / duration)),
                    },
                    zIndex: 1057,
                    colors: [color],
                    shapes: [heart],
                    drift: randomInRange(-0.5, 0.5),
                    gravity: randomInRange(0.5, 1),
                    scalar: randomInRange(0.5, 1),
                });
            });

            if (timeLeft > 0) {
                requestAnimationFrame(frame);
            }
        })();
    };

    const name = () => {
        // Parse the guest name with URLSearchParams (audit fix): extra
        // parameters (fbclid and friends) no longer pollute the name, and
        // malformed percent sequences can no longer throw and kill every
        // later init step on the page.
        let name = null;
        try {
            name = new URLSearchParams(window.location.search).get('to');
        } catch {
            name = null;
        }

        if (name) {

            const guest = document.getElementById('guest-name');
            if (guest) {
                const div = document.createElement('div');
                div.classList.add('m-2');
                div.innerHTML = `
                <p class="mt-0 mb-1 mx-0 p-0" style="font-size: 0.95rem;">${guest.getAttribute('data-message')}</p>
                <h2 class="m-0 p-0">${util.escapeHtml(name)}</h2>`;

                guest.appendChild(div);
            }
        }

        const form = document.getElementById('form-name');
        if (form) {
            form.value = information.get('name') ?? name;
        }

        opacity('loading', 0.025);
    };

    const open = (button) => {
        button.disabled = true;
        document.body.scrollIntoView({ behavior: 'instant' });

        if (typeof confetti === 'function') {
            confetti({
                origin: { y: 1 },
                zIndex: 1057
            });
        }

        opacity('welcome', 0.025);

        audio.markOpened();
        audio.play();
        audio.showButton();

        theme.spyTop();
        theme.showButtonChangeTheme();

        util.timeOut(animation, 1500);
    };

    /**
     * @returns {void}
     */
    const closeInformation = () => information.set('info', true);

    const init = () => {
        session.init();
        countDownDate();
        information = storage('information');

        if (session.isAdmin()) {
            storage('user').clear();
            storage('owns').clear();
            storage('likes').clear();
            storage('comment').clear();
            storage('tracker').clear();
            // The 'session' table is deliberately NOT cleared (audit fix):
            // previewing the invitation used to log the admin out and
            // crash the next dashboard action on a null token.
        }

        const presence = information.get('presence');
        if (presence !== undefined) {
            document.getElementById('form-presence').value = presence ? '1' : '2';
        }

        const info = document.getElementById('information');
        if (info && information.get('info')) {
            info.remove();
        }

        if (document.body.getAttribute('data-key')?.length === 0) {
            document.getElementById('comment')?.remove();
            document.querySelector('a.nav-link[href="#comment"]')?.closest('li.nav-item')?.remove();
            return;
        }

        progress.add();
        progress.add();
        comment.init();

        session.guest()
            .then((res) => {
                if (res.code !== 200) {
                    progress.invalid('request');
                    return res;
                }

                progress.complete('request');
                comment.comment()
                    .then(() => progress.complete('comment'))
                    .catch(() => progress.invalid('comment'));
            })
            .catch(() => progress.invalid('request'));
    };

    return {
        init,
        open,
        name,
        closeInformation,
    };
})();