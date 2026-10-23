import { storage } from './storage.js';

export const theme = (() => {

    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';
    const themeColors = {
        '#000000': '#ffffff',
        '#ffffff': '#000000',
        '#212529': '#f8f9fa',
        '#f8f9fa': '#212529'
    };
    const themeLight = ['#ffffff', '#f8f9fa'];
    const themeDark = ['#000000', '#212529'];

    let theme = null;
    let isAuto = false;
    let metaTheme = null;
    let observerLight = null;
    let observerDark = null;

    const toLight = (element) => {
        if (element.classList.contains('text-light')) {
            element.classList.remove('text-light');
            element.classList.add('text-dark');
        }

        if (element.classList.contains('btn-theme-light')) {
            element.classList.remove('btn-theme-light');
            element.classList.add('btn-theme-dark');
        }

        if (element.classList.contains('bg-dark')) {
            element.classList.remove('bg-dark');
            element.classList.add('bg-light');
        }

        if (element.classList.contains('bg-black')) {
            element.classList.remove('bg-black');
            element.classList.add('bg-white');
        }

        if (element.classList.contains('bg-theme-dark')) {
            element.classList.remove('bg-theme-dark');
            element.classList.add('bg-theme-light');
        }

        if (element.classList.contains('color-theme-black')) {
            element.classList.remove('color-theme-black');
            element.classList.add('color-theme-white');
        }

        if (element.classList.contains('btn-outline-light')) {
            element.classList.remove('btn-outline-light');
            element.classList.add('btn-outline-dark');
        }

        if (element.classList.contains('bg-cover-black')) {
            element.classList.remove('bg-cover-black');
            element.classList.add('bg-cover-white');
        }
    };

    const toDark = (element) => {
        if (element.classList.contains('text-dark')) {
            element.classList.remove('text-dark');
            element.classList.add('text-light');
        }

        if (element.classList.contains('btn-theme-dark')) {
            element.classList.remove('btn-theme-dark');
            element.classList.add('btn-theme-light');
        }

        if (element.classList.contains('bg-light')) {
            element.classList.remove('bg-light');
            element.classList.add('bg-dark');
        }

        if (element.classList.contains('bg-white')) {
            element.classList.remove('bg-white');
            element.classList.add('bg-black');
        }

        if (element.classList.contains('bg-theme-light')) {
            element.classList.remove('bg-theme-light');
            element.classList.add('bg-theme-dark');
        }

        if (element.classList.contains('color-theme-white')) {
            element.classList.remove('color-theme-white');
            element.classList.add('color-theme-black');
        }

        if (element.classList.contains('btn-outline-dark')) {
            element.classList.remove('btn-outline-dark');
            element.classList.add('btn-outline-light');
        }

        if (element.classList.contains('bg-cover-white')) {
            element.classList.remove('bg-cover-white');
            element.classList.add('bg-cover-black');
        }
    };

    const onLight = () => {
        theme.set('active', THEME_LIGHT);
        document.documentElement.setAttribute('data-bs-theme', THEME_LIGHT);

        const elements = document.querySelectorAll('.text-light, .btn-theme-light, .bg-dark, .bg-black, .bg-theme-dark, .color-theme-black, .btn-outline-light, .bg-cover-black');
        elements.forEach((e) => observerLight.observe(e));
    };

    const onDark = () => {
        theme.set('active', THEME_DARK);
        document.documentElement.setAttribute('data-bs-theme', THEME_DARK);

        const elements = document.querySelectorAll('.text-dark, .btn-theme-dark, .bg-light, .bg-white, .bg-theme-light, .color-theme-white, .btn-outline-dark, .bg-cover-white');
        elements.forEach((e) => observerDark.observe(e));
    };

    const isDarkMode = (onDark = null, onLight = null) => {
        const status = theme.get('active') === THEME_DARK;

        if (onDark && onLight) {
            return status ? onDark : onLight;
        }

        return status;
    };

    const change = () => {
        if (isDarkMode()) {
            onLight();
        } else {
            onDark();
        }
    };

    const showButtonChangeTheme = () => {
        if (isAuto) {
            document.getElementById('button-theme').style.display = 'block';
        }
    };

    const initObserver = () => {
        observerLight = new IntersectionObserver((es, o) => {

            es.filter((e) => e.isIntersecting).forEach((e) => toLight(e.target));
            es.filter((e) => !e.isIntersecting).forEach((e) => toLight(e.target));

            o.disconnect();

            const now = metaTheme.getAttribute('content');
            metaTheme.setAttribute('content', themeDark.some((i) => i === now) ? themeColors[now] : now);
        });

        observerDark = new IntersectionObserver((es, o) => {

            es.filter((e) => e.isIntersecting).forEach((e) => toDark(e.target));
            es.filter((e) => !e.isIntersecting).forEach((e) => toDark(e.target));

            o.disconnect();

            const now = metaTheme.getAttribute('content');
            metaTheme.setAttribute('content', themeLight.some((i) => i === now) ? themeColors[now] : now);
        });
    };

    const spyTop = () => {
        const observerTop = new IntersectionObserver((es) => {
            es.filter((e) => e.isIntersecting).forEach((e) => {
                const themeColor = ['bg-black', 'bg-white'].some((i) => e.target.classList.contains(i))
                    ? isDarkMode(themeDark[0], themeLight[0])
                    : isDarkMode(themeDark[1], themeLight[1]);

                metaTheme.setAttribute('content', themeColor);
            });
        }, {
            rootMargin: '0% 0% -95% 0%',
        });

        document.querySelectorAll('section').forEach((e) => observerTop.observe(e));
    };

    const init = () => {
        theme = storage('theme');
        metaTheme = document.querySelector('meta[name="theme-color"]');

        initObserver();

        if (!theme.has('active')) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                theme.set('active', THEME_DARK);
            } else {
                theme.set('active', THEME_LIGHT);
            }
        }

        switch (document.body.getAttribute('data-theme')) {
            case 'dark':
                theme.set('active', THEME_DARK);
                break;
            case 'light':
                theme.set('active', THEME_LIGHT);
                break;
            default:
                isAuto = true;
                break;
        }

        if (isDarkMode()) {
            onDark();
        } else {
            onLight();
        }
    };

    return {
        change,
        init,
        spyTop,
        isDarkMode,
        showButtonChangeTheme
    };
})();