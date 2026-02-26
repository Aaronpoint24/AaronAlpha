document.addEventListener('DOMContentLoaded', () => {

    // Set up all sliders
    const containers = document.querySelectorAll('.slider-container');

    containers.forEach(container => {
        const slider = container.querySelector('.slider');
        const beforeWrapper = container.querySelector('.image-before-wrapper');
        const beforeImg = container.querySelector('.image-before');
        const handle = container.querySelector('.slider-handle');
        const afterImg = container.querySelector('.image-after');

        // Zoom and Pan State
        let state = {
            scale: 1,
            panX: 0,
            panY: 0,
            isPanning: false,
            lastMouse: { x: 0, y: 0 },
            leftDown: false,
            rightDown: false
        };

        const updateTransform = () => {
            const transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
            afterImg.style.transform = transform;
            beforeImg.style.transform = transform;
        };

        // Match the inner image width and height to the container so it doesn't shrink/expand incorrectly
        const updateDimensions = () => {
            const containerRect = container.getBoundingClientRect();
            beforeImg.style.width = `${containerRect.width}px`;
            beforeImg.style.height = `${containerRect.height}px`;
        };

        // Initialize dimensions
        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        // Update slider positions on input
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            beforeWrapper.style.width = `${value}%`;
            handle.style.left = `${value}%`;
        });

        // --- Zoom Logic ---
        container.addEventListener('wheel', (e) => {
            // Only zoom if the mouse is inside the container
            if (e.ctrlKey) return; // Allow browser zoom if ctrl is held? No, usually override.
            e.preventDefault();

            const zoomIntensity = 0.1;
            const delta = -Math.sign(e.deltaY);
            let newScale = state.scale * (1 + delta * zoomIntensity);

            // Limit scale (min 1x, max 20x)
            newScale = Math.max(1, Math.min(newScale, 20));

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const imgX = (mouseX - state.panX) / state.scale;
            const imgY = (mouseY - state.panY) / state.scale;

            state.panX = mouseX - imgX * newScale;
            state.panY = mouseY - imgY * newScale;
            state.scale = newScale;

            if (state.scale <= 1) {
                state.panX = 0;
                state.panY = 0;
            }

            updateTransform();
        }, { passive: false });

        // --- Pan and Reset Logic ---
        container.addEventListener('mousedown', (e) => {
            if (e.button === 0) state.leftDown = true;
            if (e.button === 2) state.rightDown = true;

            // Check for both buttons for reset
            if (state.leftDown && state.rightDown) {
                state.scale = 1;
                state.panX = 0;
                state.panY = 0;
                updateTransform();
                return;
            }

            // Right click drag for pan
            if (e.button === 2) {
                state.isPanning = true;
                state.lastMouse = { x: e.clientX, y: e.clientY };
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (state.isPanning) {
                const dx = e.clientX - state.lastMouse.x;
                const dy = e.clientY - state.lastMouse.y;
                state.panX += dx;
                state.panY += dy;
                state.lastMouse = { x: e.clientX, y: e.clientY };
                updateTransform();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) state.leftDown = false;
            if (e.button === 2) {
                state.rightDown = false;
                state.isPanning = false;
                container.style.cursor = '';
            }
        });

        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });

    // Translations
    const translations = {
        ja: {
            title: "AaronAlpha",
            subtitle: "半透明の切り抜き精度をご体験下さい。",
            sample1_title: "Sample01：クラゲ",
            sample1_desc: "黒背景から完全に分離して透過処理します。エッジのフリンジを残しません。",
            sample2_title: "Sample02：半透明/グロー/ソリッド混在",
            sample2_desc: "半透明素材やグロー効果もくすみなく再現します。ソリッドを完全不透明に塗りつぶすことも可能。",
            sample3_title: "Sample03：髪の毛",
            sample3_desc: "被写界深度によるボケ味があるエッジも自然な状態で切り抜きます。",
            sample4_title: "Sample04：創造物",
            sample4_desc: "創造物や細い線もディテールを損なうことなく美しく分離します。",
            sample5_title: "Sample 05: 複雑なディテール",
            sample5_desc: "レースや網目など、非常に細かく複雑な隙間を持つ被写体でも、背景を綺麗に取り除きます。",
            sample6_title: "Sample 06: アイコン",
            sample6_desc: "地面の映り込みやボケ感なども忠実に再現。半透明混在でも編集可能。",
            bg_label: "背景",
            bg_transparent: "透過",
            bg_color: "カラー",
            link_aaron: "AaronAlphaはこちら",
            help_zoom_key: "ホイール",
            help_zoom_desc: "拡大・縮小",
            help_pan_key: "右ドラッグ",
            help_pan_desc: "移動",
            help_reset_key: "左右クリック",
            help_reset_desc: "リセット",
            footer: "All rights reserved."
        },
        en: {
            title: "AaronAlpha",
            subtitle: "Experience perfect extraction of translucency and glow effects.",
            sample1_title: "Sample01: Jellyfish",
            sample1_desc: "Perfectly separates from black backgrounds with transparent processing. No edge fringing.",
            sample2_title: "Sample02: Translucent/Glow/Solid",
            sample2_desc: "Reproduces translucent materials and glow effects without dullness. Solid areas can be completely opaque.",
            sample3_title: "Sample03: Hair",
            sample3_desc: "Naturally extracts edges with depth-of-field blur.",
            sample4_title: "Sample04: Creations",
            sample4_desc: "Beautifully separates complex creations and fine lines without losing detail.",
            sample5_title: "Sample 05: intricate Details",
            sample5_desc: "Cleanly removes background even from subjects with very fine and complex gaps like lace.",
            sample6_title: "Sample 06: Icon",
            sample6_desc: "Faithfully reproduces ground reflections and blur. Editable even with translucent mix.",
            bg_label: "Background",
            bg_transparent: "Transparent",
            bg_color: "Color",
            link_aaron: "Go to AaronAlpha",
            help_zoom_key: "Wheel",
            help_zoom_desc: "Zoom In/Out",
            help_pan_key: "Right Drag",
            help_pan_desc: "Move",
            help_reset_key: "L+R Click",
            help_reset_desc: "Reset",
            footer: "All rights reserved."
        }
    };

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.sample-section').forEach(section => {
        sectionObserver.observe(section);
    });

    // Language switch logic
    const langBtns = document.querySelectorAll('.lang-btn');
    const i18nElements = document.querySelectorAll('[data-i18n]');

    const setLanguage = (lang) => {
        // Update buttons
        langBtns.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update texts
        i18nElements.forEach(el => {
            const key = el.dataset.i18n;
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        // Update document lang
        document.documentElement.lang = lang;
    };

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    // Background switch logic
    const bgBtns = document.querySelectorAll('.bg-toggle');
    const colorPickerWrapper = document.getElementById('colorPickerWrapper');
    const colorPicker = document.getElementById('bgColorPicker');
    const sliderContainers = document.querySelectorAll('.slider-container');

    const updateBackgrounds = (type, colorValue = '#000000') => {
        sliderContainers.forEach(container => {
            if (type === 'transparent') {
                container.style.background = ''; // Reverts to CSS class default (.bg-checker if present)
                container.classList.add('bg-checker');
            } else {
                container.classList.remove('bg-checker');
                container.style.background = colorValue;
            }
        });
    };

    bgBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bgBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.dataset.bg;
            if (type === 'transparent') {
                colorPickerWrapper.classList.add('disabled');
                updateBackgrounds('transparent');
            } else {
                colorPickerWrapper.classList.remove('disabled');
                updateBackgrounds('color', colorPicker.value);
            }
        });
    });

    colorPicker.addEventListener('input', (e) => {
        // Only update if color mode is active
        const activeBtn = document.querySelector('.bg-toggle.active');
        if (activeBtn && activeBtn.dataset.bg === 'color') {
            updateBackgrounds('color', e.target.value);
        }
    });

    // Set initial state
    updateBackgrounds('transparent');
    setLanguage('ja');

});
