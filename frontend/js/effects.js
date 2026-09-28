/* =====================================================================
   EFFECTS — hiệu ứng chuyển động cho các trang APP (trang chủ giữ nguyên)
   - Reveal on scroll + stagger (card/section)
   - Count-up số liệu (stat-info h3)
   - Ripple khi bấm nút
   - 3D tilt nhẹ cho card CLB / Sự kiện / thành viên
   Tôn trọng prefers-reduced-motion và bỏ qua khi body.is-home.
   ===================================================================== */
(function () {
    'use strict';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const isHome = () => document.body && document.body.classList.contains('is-home');
    const seen = new WeakSet();   // đã reveal
    const counted = new WeakSet(); // đã count-up

    /* ---------- Reveal on scroll ---------- */
    function initReveal(root) {
        if (reduce || !root) return;
        const els = root.querySelectorAll('.card, .stat-card, .club-card, .event-card, .member-card, .post-card, .section-header, .detail-section, .timeline-item, .cal-day');
        if (!els.length) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (seen.has(el)) return;
                seen.add(el);
                const parent = el.parentElement;
                let idx = 0;
                if (parent) idx = Array.prototype.indexOf.call(parent.children, el);
                el.style.transitionDelay = '';
                el.style.animationDelay = Math.min(idx * 55, 400) + 'ms';
                el.classList.add('fx-in');
                el.addEventListener('animationend', () => {
                    el.classList.remove('fx-in');
                    el.style.animationDelay = '';
                }, { once: true });
                io.unobserve(el);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        els.forEach(el => io.observe(el));
    }

    /* ---------- Count-up số liệu ---------- */
    function initCountUp(root) {
        if (reduce || !root) return;
        root.querySelectorAll('.stat-info h3').forEach((el) => {
            if (counted.has(el)) return;
            const raw = el.textContent.trim();
            const num = parseInt(raw.replace(/[^0-9]/g, ''), 10);
            if (!raw || isNaN(num)) { counted.add(el); return; }
            let done = false;
            const io = new IntersectionObserver((entries) => {
                if (done || !entries[0].isIntersecting) return;
                done = true;
                io.disconnect();
                const dur = 900;
                const start = performance.now();
                function frame(t) {
                    const p = Math.min((t - start) / dur, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(num * eased);
                    if (p < 1) requestAnimationFrame(frame);
                    else el.textContent = raw;
                }
                requestAnimationFrame(frame);
            }, { threshold: 0.3 });
            io.observe(el);
        });
    }

    /* ---------- Ripple nút ---------- */
    function makeRipple(e) {
        if (reduce || isHome()) return;
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const d = Math.max(rect.width, rect.height) * 2;
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        const r = document.createElement('span');
        r.className = 'fx-ripple';
        r.style.width = r.style.height = d + 'px';
        r.style.left = (e.clientX - rect.left - d / 2) + 'px';
        r.style.top = (e.clientY - rect.top - d / 2) + 'px';
        btn.appendChild(r);
        setTimeout(() => r.remove(), 650);
    }

    /* ---------- 3D tilt card ---------- */
    function applyTilt(e) {
        if (reduce || isHome() || coarse) return;
        const card = e.target.closest('.club-card, .event-card, .member-card');
        if (!card || seen.has(card)) return;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * 7;
        const ry = (px - 0.5) * 7;
        card.style.transform = `perspective(820px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        card.style.boxShadow = '0 26px 52px -20px rgba(79, 70, 229, 0.45)';
        card.style.willChange = 'transform, box-shadow';
    }
    function clearTilt(e) {
        const card = e.target.closest('.club-card, .event-card, .member-card');
        if (!card) return;
        card.style.transform = '';
        card.style.boxShadow = '';
        card.style.willChange = '';
    }

    /* ---------- Glow màu lướt theo chuột (nền hero) ---------- */
    const GLOW_SELECTOR = 'section[style*="gradient-hero"], .detail-header, .event-banner, .profile-header, .settings-hero, .timeline-hero, .cert-hero';
    const glowSections = new WeakSet();
    let glowEl = null, glowFrame = false;

    function glowFor(el) {
        if (glowSections.has(el)) return el.querySelector('.fx-glow');
        const s = document.createElement('div');
        s.className = 'fx-glow';
        el.appendChild(s);
        glowSections.add(el);
        return s;
    }
    function onGlowMove(e) {
        if (reduce || isHome()) return;
        const el = e.target.closest(GLOW_SELECTOR);
        if (!el) {
            if (glowEl) { glowEl.classList.remove('on'); glowEl = null; }
            return;
        }
        if (!glowEl || glowEl.glow !== el) {
            const s = glowFor(el);
            s.classList.add('on');
            glowEl = s;
            glowEl.glow = el;
        }
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (glowFrame) return;
        glowFrame = true;
        requestAnimationFrame(() => {
            glowEl.style.setProperty('--mx', x + 'px');
            glowEl.style.setProperty('--my', y + 'px');
            glowFrame = false;
        });
    }
    document.addEventListener('pointermove', onGlowMove, { passive: true });
    document.addEventListener('pointerout', (e) => {
        if (glowEl && !e.target.closest(GLOW_SELECTOR)) {
            glowEl.classList.remove('on');
            glowEl = null;
        }
    }, { passive: true });

    /* ---------- Particles: bụi phấn bay (tối ưu: ít hạt, tự dừng khi offscreen) ---------- */
    const particleSections = new WeakSet();
    let activeParticles = 0;
    const MAX_PARTICLES_SECTIONS = 2;

    function initParticles(root, selector) {
        if (reduce || !root) return;
        if (activeParticles >= MAX_PARTICLES_SECTIONS) return;
        root.querySelectorAll(selector).forEach((section) => {
            if (particleSections.has(section) || activeParticles >= MAX_PARTICLES_SECTIONS) return;
            particleSections.add(section);
            activeParticles++;

            let rafId = 0, running = false;
            const canvas = document.createElement('canvas');
            canvas.className = 'fx-canvas';
            section.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            const DPR = Math.min(1.5, window.devicePixelRatio || 1);
            let W = 0, H = 0, parts = [], t0 = 0;

            function spawn() {
                const n = Math.min(14, Math.floor(W / 80) + 5);
                parts = Array.from({ length: n }, () => ({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    r: 0.8 + Math.random() * 1.5,
                    s: 0.15 + Math.random() * 0.4,
                    sway: 0.5 + Math.random() * 1,
                    ph: Math.random() * 6.283,
                    o: 0.2 + Math.random() * 0.45
                }));
            }
            function resize() {
                const rect = canvas.getBoundingClientRect();
                W = rect.width;
                H = rect.height;
                canvas.width = W * DPR;
                canvas.height = H * DPR;
                ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
                spawn();
            }
            function frame(now) {
                if (!running || !canvas.isConnected) return;
                t0 = t0 || now;
                const sec = Math.min(60, (now - t0)) / 1000;
                t0 = now;
                ctx.clearRect(0, 0, W, H);
                for (const p of parts) {
                    p.y -= p.s * sec * 22;
                    p.ph += p.s * sec * 1.6;
                    if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
                    p.x += Math.sin(p.ph) * p.sway * 0.3;
                    ctx.globalAlpha = p.o * (0.55 + 0.45 * Math.sin(p.ph * 2));
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                rafId = requestAnimationFrame(frame);
            }
            function start() {
                if (running || !canvas.isConnected) return;
                running = true;
                rafId = requestAnimationFrame(frame);
            }
            function stop() {
                running = false;
                cancelAnimationFrame(rafId);
            }
            window.addEventListener('resize', resize);
            new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) start();
                    else stop();
                });
            }, { rootMargin: '120px' }).observe(section);
            resize();
            start();
        });

        if (activeParticles > MAX_PARTICLES_SECTIONS) activeParticles = MAX_PARTICLES_SECTIONS;
    }

    function scan(root) {
        const r = root || document;
        if (isHome()) {
            // Trang chủ: chỉ chạy particles cho banner CTA "phần dưới" (.cta-fx)
            activeParticles = document.querySelectorAll('.fx-canvas').length;
            initParticles(r, '.cta-fx');
            return;
        }
        initReveal(r);
        initCountUp(r);
        initParticles(r, 'section[style*="gradient-hero"], .detail-header, .event-banner, .settings-hero, .timeline-hero, .cert-hero');
    }

    /* ---------- Spotlight đèn theo chuột (nền hero) ---------- */
    document.addEventListener('click', makeRipple, true);
    document.addEventListener('mousemove', applyTilt, true);
    document.addEventListener('mouseleave', clearTilt, true);

    let scanTimer = 0;
    const mainObserver = new MutationObserver((mutations) => {
        const added = mutations.some(m => m.addedNodes && m.addedNodes.length > 0);
        if (!added) return;
        clearTimeout(scanTimer);
        scanTimer = setTimeout(() => {
            const main = document.getElementById('mainContent');
            if (main) scan(main);
        }, 150);
    });
    const appEl = document.getElementById('app') || document.body;
    mainObserver.observe(appEl, { childList: true, subtree: true });

    document.addEventListener('DOMContentLoaded', () => {
        scan(document);
    });

    window.Effects = { scan };
})();