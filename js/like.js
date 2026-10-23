import { dto } from './dto.js';
import { storage } from './storage.js';
import { session } from './session.js';
import { confetti } from './confetti.js';
import { request, HTTP_PATCH, HTTP_POST } from './request.js';

export const like = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let likes = null;

    /**
     * Handles the like button functionality.
     * 
     * @param {HTMLButtonElement} button - The button element that was clicked.
     * @returns {Promise<void>} - A promise that resolves when the like action is complete.
     */
    const like = async (button) => {
        const id = button.getAttribute('data-uuid');

        const heart = button.firstElementChild.lastElementChild;
        const info = button.firstElementChild.firstElementChild;

        button.disabled = true;

        // The button and counters are restored in a finally block (audit
        // fix): a failed request used to leave the button disabled forever.
        try {
            if (likes.has(id)) {
                await request(HTTP_PATCH, '/api/comment/' + likes.get(id))
                    .token(session.getToken())
                    .send(dto.statusResponse)
                    .then((res) => {
                        if (res.data.status) {
                            likes.unset(id);

                            heart.classList.remove('fa-solid', 'text-danger');
                            heart.classList.add('fa-regular');

                            info.setAttribute('data-count-like', (parseInt(info.getAttribute('data-count-like')) - 1).toString());
                        }
                    });

                return;
            }

            await request(HTTP_POST, '/api/comment/' + id)
                .token(session.getToken())
                .send(dto.uuidResponse)
                .then((res) => {
                    if (res.code == 201) {
                        likes.set(id, res.data.uuid);

                        heart.classList.remove('fa-regular');
                        heart.classList.add('fa-solid', 'text-danger');

                        info.setAttribute('data-count-like', (parseInt(info.getAttribute('data-count-like')) + 1).toString());
                    }
                });
        } catch {
            // Already surfaced to the user by request.js.
        } finally {
            info.innerText = info.getAttribute('data-count-like');
            button.disabled = false;
            button.removeAttribute('disabled');
        }
    };

    /**
     * Triggers a confetti animation with heart shapes around a specified div element.
     *
     * @param {HTMLElement} div - The div element around which the confetti animation will occur.
     */
    const animation = (div) => {
        if (!confetti) {
            return;
        }

        const end = Date.now() + 25;
        const colors = ['#ff69b4', '#ff1493'];

        const yPosition = Math.max(0.3, Math.min(1, (div.getBoundingClientRect().top / window.innerHeight) + 0.2));

        const heart = confetti.shapeFromPath({
            path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
            matrix: [0.03333333333333333, 0, 0, 0.03333333333333333, -5.566666666666666, -5.533333333333333]
        });

        (function frame() {

            colors.forEach((color) => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    shapes: [heart],
                    origin: { x: 0, y: yPosition },
                    zIndex: 1057,
                    colors: [color]
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    shapes: [heart],
                    origin: { x: 1, y: yPosition },
                    zIndex: 1057,
                    colors: [color]
                });
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    /**
     * Handles the tap event on a given div element. If the tap is detected within a certain time frame,
     * it triggers a like action and an animation.
     *
     * @param {HTMLElement} div - The div element that was tapped.
     * @returns {Promise<void>} - A promise that resolves when the like action is complete.
     */
    const tapTap = async (div) => {
        if (!navigator.onLine) {
            return;
        }

        const currentTime = Date.now();
        const tapLength = currentTime - parseInt(div.getAttribute('data-tapTime'));
        const uuid = div.id.replace('body-content-', '');

        if (tapLength < 300 && tapLength > 0 && !likes.has(uuid) && div.getAttribute('data-liked') !== 'true') {
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
            animation(div);
            div.setAttribute('data-liked', 'true');
            try {
                await like(document.querySelector(`[onclick="like.like(this)"][data-uuid="${uuid}"]`));
            } finally {
                div.setAttribute('data-liked', 'false');
            }
        }

        div.setAttribute('data-tapTime', currentTime);
    };

    /**
     * Initializes the likes variable by retrieving it from storage.
     */
    const init = () => {
        likes = storage('likes');
    };

    return {
        init,
        like,
        tapTap,
    };
})();