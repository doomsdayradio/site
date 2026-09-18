// ============================================================
// Interactive 404 Receipt - Cozy Coffee Shop Theme
// Three.js + Verlet Integration Cloth Physics
// Day/Night theme toggle with smooth transitions
// ============================================================

(function () {
    'use strict';

    // --- Detect mobile ---
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (window.innerWidth < 768);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hardwareThreads = navigator.hardwareConcurrency || 8;
    const deviceMemory = navigator.deviceMemory || 8;
    let lowPerformanceMode = prefersReducedMotion
        || isMobile
        || coarsePointer
        || hardwareThreads <= 4
        || deviceMemory <= 4
        || window.innerWidth < 900;
    try {
        const saved = localStorage.getItem('ddLowQuality');
        if (saved !== null) {
            lowPerformanceMode = saved === 'true';
        }
    } catch (e) {}
    const quality = lowPerformanceMode
        ? {
            cols: isMobile ? 14 : 28,
            rows: isMobile ? 26 : 56,
            constraintIter: isMobile ? 2 : 4,
            maxPixelRatio: 1.1,
            antialias: false,
            shadows: false,
            shadowMapSize: 1024,
            targetFps: 30,
            anisotropy: 2,
            normalUpdateInterval: 2
        }
        : {
            cols: isMobile ? 18 : 42,
            rows: isMobile ? 36 : 84,
            constraintIter: isMobile ? 3 : 6,
            maxPixelRatio: 1.5,
            antialias: true,
            shadows: true,
            shadowMapSize: 1536,
            targetFps: 60,
            anisotropy: 8,
            normalUpdateInterval: 1
        };

    document.documentElement.classList.toggle('fx-lite', lowPerformanceMode);
    document.documentElement.classList.toggle('reduced-motion', prefersReducedMotion);

    // --- Config ---
    const COLS = quality.cols;
    const ROWS = quality.rows;
    const PAPER_W = 3.2;
    const PAPER_H = 4.8;
    const STRUCT_K = 0.96;
    const SHEAR_K = 0.9;
    const BEND_K = 0.75;
    const DAMP = 0.98;
    const GRAV = new THREE.Vector3(0, -0.0006, 0);
    const DT2 = 0.9;
    const CONSTRAINT_ITER = quality.constraintIter;
    const DRAG_RADIUS = 0.6;
    const DRAG_FALLOFF = 2.0;
    const ORIGIN_Y = 2.65;

    let windTime = 0;
    const WIND_BASE = 0.00008;

    const BURN_SETTINGS = {
        gradientWidth: 220,
        fillWidth: 240,
        stops: [
            { pos: 0, color: 'rgba(45,30,15,0.85)' },
            { pos: 0.35, color: 'rgba(85,55,30,0.6)' },
            { pos: 0.7, color: 'rgba(130,95,60,0.35)' },
            { pos: 1, color: 'rgba(150,120,90,0)' }
        ],
        strokeColor: 'rgba(40,25,15,0.45)',
        strokeCount: 220,
        strokeLenMin: 8,
        strokeLenMax: 40,
        strokeJitter: 10,
        speckColor: 'rgba(25,15,10,0.35)',
        speckCount: 260,
        speckRadiusMin: 1,
        speckRadiusMax: 6,
        speckOffset: 120
    };

    // --- Lighting Config ---
    const LIGHT_CONFIG = {
        ambient: { color: 0xffe8d0, intensity: 0.5 },
        key: { color: 0xffecd2, intensity: 0.7 },
        overhead: { color: 0xfff0e0, intensity: 0.2 },
        fill: { color: 0xffd9a0, intensity: 0.15 },
        rim: { color: 0xffcc80, intensity: 0.2 },
        exposure: 1.1,
    };

    // --- Particle ---
    class Particle {
        constructor(x, y, z) {
            this.pos = new THREE.Vector3(x, y, z);
            this.prev = new THREE.Vector3(x, y, z);
            this.rest = new THREE.Vector3(x, y, z);
            this.acc = new THREE.Vector3();
            this.pinned = false;
            this._t = new THREE.Vector3();
        }
        addForce(f) { this.acc.add(f); }
        integrate() {
            if (this.pinned) return;
            const v = this._t.subVectors(this.pos, this.prev).multiplyScalar(DAMP);
            const np = v.add(this.pos).add(this.acc.multiplyScalar(DT2));
            this.prev.copy(this.pos);
            this.pos.copy(np);
            this.acc.set(0, 0, 0);
        }
    }

    // --- Constraint ---
    class Constraint {
        constructor(a, b, k) {
            this.a = a; this.b = b;
            this.rest = a.pos.distanceTo(b.pos);
            this.k = k;
            this._d = new THREE.Vector3();
        }
        solve() {
            const d = this._d.subVectors(this.b.pos, this.a.pos);
            const len = d.length();
            if (len < 1e-7) return;
            const corr = d.multiplyScalar((1 - this.rest / len) * 0.5 * this.k);
            if (!this.a.pinned) this.a.pos.add(corr);
            if (!this.b.pinned) this.b.pos.sub(corr);
        }
    }

    // --- Cloth ---
    class Cloth {
        constructor() {
            this.particles = [];
            this.constraints = [];
            const sx = PAPER_W / COLS;
            const sy = PAPER_H / ROWS;
            const C = COLS + 1;

            for (let j = 0; j <= ROWS; j++) {
                for (let i = 0; i <= COLS; i++) {
                    const x = (i - COLS / 2) * sx;
                    const y = ORIGIN_Y - j * sy;
                    const p = new Particle(x, y, 0);
                    if (j === 0) p.pinned = true;
                    this.particles.push(p);
                }
            }

            const id = (i, j) => j * C + i;

            // Structural
            for (let j = 0; j <= ROWS; j++) {
                for (let i = 0; i <= COLS; i++) {
                    if (i < COLS) this.constraints.push(new Constraint(this.particles[id(i, j)], this.particles[id(i + 1, j)], STRUCT_K));
                    if (j < ROWS) this.constraints.push(new Constraint(this.particles[id(i, j)], this.particles[id(i, j + 1)], STRUCT_K));
                }
            }
            // Shear
            for (let j = 0; j < ROWS; j++) {
                for (let i = 0; i < COLS; i++) {
                    this.constraints.push(new Constraint(this.particles[id(i, j)], this.particles[id(i + 1, j + 1)], SHEAR_K));
                    this.constraints.push(new Constraint(this.particles[id(i + 1, j)], this.particles[id(i, j + 1)], SHEAR_K));
                }
            }
            // Bend (skip 2)
            for (let j = 0; j <= ROWS; j++) {
                for (let i = 0; i <= COLS; i++) {
                    if (i + 2 <= COLS) this.constraints.push(new Constraint(this.particles[id(i, j)], this.particles[id(i + 2, j)], BEND_K));
                    if (j + 2 <= ROWS) this.constraints.push(new Constraint(this.particles[id(i, j)], this.particles[id(i, j + 2)], BEND_K));
                }
            }
            // Long-range bend (skip 4)
            for (let j = 0; j <= ROWS; j++) {
                for (let i = 0; i <= COLS; i++) {
                    if (i + 4 <= COLS) this.constraints.push(new Constraint(this.particles[id(i, j)], this.particles[id(i + 4, j)], BEND_K * 0.2));
                    if (j + 4 <= ROWS) this.constraints.push(new Constraint(this.particles[id(i, j)], this.particles[id(i, j + 4)], BEND_K * 0.2));
                }
            }
        }

        simulate() {
            windTime += 0.012;
            const wf = new THREE.Vector3();
            const C = COLS + 1;

            for (let k = 0; k < this.particles.length; k++) {
                const p = this.particles[k];
                p.addForce(GRAV);
                if (!p.pinned) {
                    const row = Math.floor(k / C);
                    const col = k % C;
                    const t = windTime;
                    const wx = Math.sin(t * 0.8 + row * 0.12) * WIND_BASE * 0.4;
                    const wz = (
                        Math.sin(t * 0.6 + col * 0.08 + row * 0.06) +
                        Math.sin(t * 1.1 + row * 0.15) * 0.4 +
                        Math.cos(t * 0.3 + col * 0.1) * 0.3
                    ) * WIND_BASE;
                    wf.set(wx, 0, wz);
                    p.addForce(wf);
                }
            }

            for (let it = 0; it < CONSTRAINT_ITER; it++) {
                for (const c of this.constraints) c.solve();
            }
            for (const p of this.particles) p.integrate();
        }
    }

    const DEFAULT_RECEIPT_TEXT = {
        headerTitle: '\u2726  LIFE STATUS  \u2726',
        titleLines: ['LIFE STATUS', 'REPORT'],
        statusInfo: [
            { label: 'DATE', value: 'Today' },
            { label: 'TIME', value: 'Right Now' },
            { label: 'LOCATION', value: 'Earth' },
            { label: 'STATUS', value: 'Still Figuring Out' },
            { label: 'VERSION', value: 'Human 1.0' }
        ],
        diagnosticsTitle: 'LIFE DIAGNOSTICS',
        diagnostics: [
            { label: 'Motivation Level', value: 'fluctuating' },
            { label: 'Coffee Level', value: 'dangerously low' },
            { label: 'Sleep Debt', value: 'accumulating' },
            { label: 'Unread Messages', value: '27' },
            { label: 'Random Ideas', value: 'too many' },
            { label: 'Procrastination', value: 'high' },
            { label: 'Hope Level', value: 'recovering' },
            { label: 'Next Break', value: 'recommended' }
        ],
        requestTitle: 'LIFE REQUEST',
        request: [
            { label: 'PATH', value: '/what-am-i-doing' },
            { label: 'METHOD', value: 'thinking' },
            { label: 'AGENT', value: 'human / confused' },
            { label: 'ACCEPT', value: 'coffee, snacks' }
        ],
        cta: 'CONTINUE EXPLORING LIFE',
        barcodeText: 'LIFE-STATUS-HUMAN-1.0'
    };

    async function loadReceiptText() {
        try {
            const res = await fetch('./impressum.json', { cache: 'no-cache' });
            if (!res.ok) return DEFAULT_RECEIPT_TEXT;
            const data = await res.json();
            const text = { ...DEFAULT_RECEIPT_TEXT, ...data };
            text.titleLines = Array.isArray(text.titleLines) ? text.titleLines : [String(text.titleLines || '')];
            text.statusInfo = Array.isArray(text.statusInfo) ? text.statusInfo : DEFAULT_RECEIPT_TEXT.statusInfo;
            text.diagnostics = Array.isArray(text.diagnostics) ? text.diagnostics : DEFAULT_RECEIPT_TEXT.diagnostics;
            text.request = Array.isArray(text.request) ? text.request : DEFAULT_RECEIPT_TEXT.request;
            return text;
        } catch (e) {
            return DEFAULT_RECEIPT_TEXT;
        }
    }

    // --- Receipt Texture ---
    function createReceiptTexture(receiptText) {
        const text = receiptText || DEFAULT_RECEIPT_TEXT;
        const canvas = document.createElement('canvas');
        const S = 2;
        canvas.width = 1200 * S;
        canvas.height = 1800 * S;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;

        // Paper base - warm off-white
        ctx.fillStyle = '#f5f1e6';
        ctx.fillRect(0, 0, W, H);

        // Noise grain on paper
        const imgData = ctx.getImageData(0, 0, W, H);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 12;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        // Burned/scorched edges on the sides
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';

        function drawBurnEdge(side) {
            const gradWidth = BURN_SETTINGS.gradientWidth * S;
            const fillWidth = BURN_SETTINGS.fillWidth * S;
            const isLeft = side === 'left';
            const grad = isLeft
                ? ctx.createLinearGradient(0, 0, gradWidth, 0)
                : ctx.createLinearGradient(W, 0, W - gradWidth, 0);

            for (const stop of BURN_SETTINGS.stops) {
                grad.addColorStop(stop.pos, stop.color);
            }

            ctx.fillStyle = grad;
            ctx.fillRect(isLeft ? 0 : W - fillWidth, 0, fillWidth, H);
        }

        drawBurnEdge('left');
        drawBurnEdge('right');

        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = BURN_SETTINGS.strokeColor;
        ctx.lineWidth = 1.2 * S;
        for (let i = 0; i < BURN_SETTINGS.strokeCount; i++) {
            const y = Math.random() * H;
            const l = (BURN_SETTINGS.strokeLenMin + Math.random() * (BURN_SETTINGS.strokeLenMax - BURN_SETTINGS.strokeLenMin)) * S;
            ctx.beginPath();
            ctx.moveTo((2 + Math.random() * 12) * S, y);
            ctx.lineTo((2 + Math.random() * 12) * S + l, y + (Math.random() - 0.5) * BURN_SETTINGS.strokeJitter * S);
            ctx.stroke();

            const yr = Math.random() * H;
            const lr = (BURN_SETTINGS.strokeLenMin + Math.random() * (BURN_SETTINGS.strokeLenMax - BURN_SETTINGS.strokeLenMin)) * S;
            ctx.beginPath();
            ctx.moveTo(W - (2 + Math.random() * 12) * S, yr);
            ctx.lineTo(W - (2 + Math.random() * 12) * S - lr, yr + (Math.random() - 0.5) * BURN_SETTINGS.strokeJitter * S);
            ctx.stroke();
        }

        ctx.fillStyle = BURN_SETTINGS.speckColor;
        for (let i = 0; i < BURN_SETTINGS.speckCount; i++) {
            const side = Math.random() > 0.5 ? 'left' : 'right';
            const x = side === 'left'
                ? (2 + Math.random() * BURN_SETTINGS.speckOffset) * S
                : W - (2 + Math.random() * BURN_SETTINGS.speckOffset) * S;
            const y = Math.random() * H;
            const r = (BURN_SETTINGS.speckRadiusMin + Math.random() * (BURN_SETTINGS.speckRadiusMax - BURN_SETTINGS.speckRadiusMin)) * S;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Thermal edge fade
        const edgeG = ctx.createLinearGradient(0, 0, W, 0);
        edgeG.addColorStop(0, 'rgba(180,170,155,0.2)');
        edgeG.addColorStop(0.06, 'rgba(180,170,155,0)');
        edgeG.addColorStop(0.94, 'rgba(180,170,155,0)');
        edgeG.addColorStop(1, 'rgba(180,170,155,0.2)');
        ctx.fillStyle = edgeG;
        ctx.fillRect(0, 0, W, H);

        // Colors
        const inkColor = '#000000';
        const lightInk = '#0a0a0a';
        const fadedInk = '#1a1a1a';
        const titleSz = 60 * S;
        const headSz = 26 * S;
        const bodySz = 23 * S;
        const smSz = 19 * S;
        const lh = bodySz * 1.7;
        const pad = 55 * S;
        let y = 50 * S;

        ctx.textAlign = 'center';

        // Thermal text helper with slight blur and offset
        function thermalText(text, x, yy, font, color, blur) {
            ctx.save();
            if (blur) {
                ctx.shadowColor = color;
                ctx.shadowBlur = blur * S;
            }
            ctx.fillStyle = color;
            ctx.font = font;
            const ox = (Math.random() - 0.5) * 0.5 * S;
            ctx.fillText(text, x + ox, yy);
            ctx.restore();
        }

        function separator(yy, style) {
            ctx.fillStyle = fadedInk;
            if (style === 'dots') {
                ctx.font = `${smSz}px 'Courier New', monospace`;
                ctx.fillText('· · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·', cx, yy);
            } else if (style === 'dashes') {
                ctx.font = `${smSz}px 'Courier New', monospace`;
                ctx.fillText('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', cx, yy);
            } else {
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1 * S;
                ctx.beginPath();
                ctx.moveTo(pad, yy - 2 * S);
                ctx.lineTo(W - pad, yy - 2 * S);
                ctx.stroke();
            }
            return yy + lh * 0.7;
        }

        // === HEADER ===
        thermalText(text.headerTitle, cx, y, `bold ${headSz}px 'Courier New', monospace`, lightInk, 0.5);
        y += lh * 0.9;
        y = separator(y, 'line');
        y += lh * 0.3;

        // Big title
        const titleLine1 = text.titleLines[0] || '';
        const titleLine2 = text.titleLines[1] || '';
        if (titleLine1) {
            thermalText(titleLine1, cx, y, `bold ${titleSz}px 'Courier New', monospace`, inkColor, 1);
            y += titleSz * 1.1;
        }
        if (titleLine2) {
            thermalText(titleLine2, cx, y, `bold ${titleSz}px 'Courier New', monospace`, inkColor, 1);
            y += titleSz * 0.4;
        } else {
            y += titleSz * 0.2;
        }

        // Underline
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 3 * S;
        ctx.beginPath();
        ctx.moveTo(cx - 140 * S, y);
        ctx.lineTo(cx + 140 * S, y);
        ctx.stroke();
        y += lh * 1.0;

        y = separator(y, 'dots');
        y += lh * 0.3;

        // === STATUS INFO ===
        if (text.statusInfoTitle) {
            thermalText(text.statusInfoTitle, cx, y, `bold ${headSz}px 'Courier New', monospace`, inkColor, 0.5);
            y += lh * 1.1;
        }
        ctx.textAlign = 'center';

        function row(label, value, yy, bold) {
            const totalLen = 50;
            const dotsNeeded = Math.max(2, totalLen - label.length - value.length);
            const dots = '.'.repeat(dotsNeeded);
            const line = `${label} ${dots} ${value}`;
            const font = bold
                ? `bold ${bodySz}px 'Courier New', monospace`
                : `${bodySz}px 'Courier New', monospace`;
            const ox = (Math.random() - 0.5) * 1.2 * S;
            thermalText(line, cx + ox, yy, font, lightInk, 0.3);
            return yy + lh;
        }

        function metricRow(label, value, yy) {
            const totalLen = 50;
            const dotsNeeded = Math.max(2, totalLen - label.length - value.length);
            const dots = '.'.repeat(dotsNeeded);
            const line = `${label} ${dots} ${value}`;
            const ox = (Math.random() - 0.5) * 1.2 * S;
            thermalText(line, cx + ox, yy, `${bodySz}px 'Courier New', monospace`, lightInk, 0.3);
            return yy + lh;
        }

        for (const item of text.statusInfo) {
            y = metricRow(item.label, item.value, y);
        }

        y += lh * 0.1;
        ctx.textAlign = 'center';
        y = separator(y, 'dashes');
        y += lh * 0.3;

        // === LIFE DIAGNOSTICS ===
        thermalText(text.diagnosticsTitle, cx, y, `bold ${headSz}px 'Courier New', monospace`, inkColor, 0.5);
        y += lh * 1.1;

        for (const item of text.diagnostics) {
            y = metricRow(item.label, item.value, y);
        }

        y += lh * 0.1;
        y = separator(y, 'dots');
        y += lh * 0.3;

        // === LIFE REQUEST ===
        thermalText(text.requestTitle, cx, y, `bold ${headSz}px 'Courier New', monospace`, inkColor, 0.5);
        y += lh * 1.0;

        for (const item of text.request) {
            y = row(item.label, item.value, y);
        }
        y += lh * 0.1;
        y = separator(y, 'line');
        y += lh * 0.6;

        thermalText(text.cta, cx, y, `bold ${headSz * 1.1}px 'Courier New', monospace`, inkColor, 0.8);
        y += lh * 1.2;

        y = separator(y, 'dashes');
        y += lh * 0.5;

        // === BARCODE ===
        ctx.fillStyle = inkColor;
        const bw = 700 * S;
        const bStart = (W - bw) / 2;
        const bh = 50 * S;
        for (let i = 0; i < 120; i++) {
            const w = (Math.random() > 0.5 ? 1.5 : 3) * S;
            const x = bStart + (i / 120) * bw;
            if (Math.random() > 0.15) {
                ctx.fillRect(x, y, w, bh);
            }
        }
        y += bh + lh * 0.5;

        ctx.fillStyle = fadedInk;
        ctx.font = `${smSz * 0.9}px 'Courier New', monospace`;
        ctx.fillText(text.barcodeText, cx, y);
        y += lh;

        // === TORN BOTTOM EDGE ===
        const tearStart = H - 240 * S;
        const tearPoints = [];
        let tx = 0;
        while (tx <= W) {
            const step = (10 + Math.random() * 28) * S;
            const depth = (80 + Math.random() * 200) * S;
            tx += step;
            tearPoints.push({ x: tx, y: tearStart + depth });
            tx += step * 0.5;
            tearPoints.push({ x: tx, y: tearStart + depth * 0.08 });
        }

        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(0, tearStart);
        for (const p of tearPoints) ctx.lineTo(p.x, p.y);
        ctx.lineTo(W, tearStart);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Torn edge shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 3 * S;
        ctx.beginPath();
        ctx.moveTo(0, tearStart);
        for (const p of tearPoints) ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Frayed fiber detail along the torn edge
        ctx.strokeStyle = 'rgba(60,45,30,0.12)';
        ctx.lineWidth = 0.8 * S;
        for (let i = 0; i < 360; i++) {
            const x = Math.random() * W;
            const idx = Math.min(tearPoints.length - 1, Math.floor((x / W) * tearPoints.length));
            const baseY = tearPoints[idx].y;
            const len = (6 + Math.random() * 18) * S;
            const wobble = (Math.random() - 0.5) * 6 * S;
            ctx.beginPath();
            ctx.moveTo(x, baseY - Math.random() * 6 * S);
            ctx.lineTo(x + wobble, baseY - len);
            ctx.stroke();
        }

        // Edge texture shading (no cut-out holes)
        ctx.strokeStyle = 'rgba(40,30,20,0.14)';
        ctx.lineWidth = 1.2 * S;
        for (let i = 0; i < 140; i++) {
            const x = Math.random() * W;
            const idx = Math.min(tearPoints.length - 1, Math.floor((x / W) * tearPoints.length));
            const baseY = tearPoints[idx].y;
            const len = (10 + Math.random() * 26) * S;
            ctx.beginPath();
            ctx.moveTo(x - 2 * S, baseY - Math.random() * 8 * S);
            ctx.lineTo(x + 2 * S, baseY - len);
            ctx.stroke();
        }

        // Extra ragged fibers and nicks above the edge
        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 1 * S;
        for (let i = 0; i < 440; i++) {
            const x = Math.random() * W;
            const idx = Math.min(tearPoints.length - 1, Math.floor((x / W) * tearPoints.length));
            const baseY = tearPoints[idx].y;
            const len = (6 + Math.random() * 24) * S;
            ctx.beginPath();
            ctx.moveTo(x, baseY - Math.random() * 10 * S);
            ctx.lineTo(x + (Math.random() - 0.5) * 6 * S, baseY - len);
            ctx.stroke();
        }

        // Small fuzz clumps along the edge
        ctx.strokeStyle = 'rgba(60,45,30,0.1)';
        ctx.lineWidth = 0.9 * S;
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * W;
            const idx = Math.min(tearPoints.length - 1, Math.floor((x / W) * tearPoints.length));
            const baseY = tearPoints[idx].y;
            const w = (3 + Math.random() * 10) * S;
            const h = (3 + Math.random() * 12) * S;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.5, baseY - Math.random() * 6 * S);
            ctx.lineTo(x + w * 0.5, baseY - h);
            ctx.stroke();
        }

        // Fewer, irregular torn-out holes away from the torn edge
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        const holeMaxY = Math.max(40 * S, tearStart - 120 * S);
        for (let i = 0; i < 16; i++) {
            const x = Math.random() * (W - 80 * S) + 40 * S;
            const y = Math.random() * (holeMaxY - 40 * S) + 40 * S;
            const r = (6 + Math.random() * 12) * S;
            const points = 7 + Math.floor(Math.random() * 6);
            ctx.beginPath();
            for (let p = 0; p <= points; p++) {
                const a = (p / points) * Math.PI * 2;
                const jag = (0.5 + Math.random() * 0.8) * r;
                const px = x + Math.cos(a) * jag;
                const py = y + Math.sin(a) * jag * (0.6 + Math.random() * 0.6);
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            // Add small bites around the main hole for a ripped edge feel
            const bites = 2 + Math.floor(Math.random() * 4);
            for (let b = 0; b < bites; b++) {
                const a = Math.random() * Math.PI * 2;
                const br = (1.5 + Math.random() * 4) * S;
                const bx = x + Math.cos(a) * (r * 0.8);
                const by = y + Math.sin(a) * (r * 0.6);
                ctx.beginPath();
                ctx.ellipse(bx, by, br, br * (0.5 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalCompositeOperation = 'source-over';

        // Subtle fiber shadow around holes
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1 * S;
        for (let i = 0; i < 16; i++) {
            const x = Math.random() * (W - 80 * S) + 40 * S;
            const y = Math.random() * (holeMaxY - 40 * S) + 40 * S;
            const r = (6 + Math.random() * 12) * S;
            const points = 7 + Math.floor(Math.random() * 6);
            ctx.beginPath();
            for (let p = 0; p <= points; p++) {
                const a = (p / points) * Math.PI * 2;
                const jag = (0.55 + Math.random() * 0.7) * r;
                const px = x + Math.cos(a) * jag;
                const py = y + Math.sin(a) * jag * (0.6 + Math.random() * 0.6);
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = quality.anisotropy;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    // --- Light references ---
    let ambientLight, keyLight, overheadLight, fillLight, rimLight;

    // --- Main ---
    let scene, camera, renderer;
    let cloth, clothMesh, clothGeo;
    let raycaster, mouse;
    let mouseDown = false;
    let dragParticle = null;
    let nearbyParticles = [];
    let dragPlane = new THREE.Plane();
    let dragOff = new THREE.Vector3();
    let isect = new THREE.Vector3();
    let toggleButton;
    let paperVisible = true;
    let lastDragPos = new THREE.Vector3();
    let needsRender = true;
    let lastFrameTime = 0;
    let normalFrameCounter = 0;

    function requestRender() {
        needsRender = true;
    }

    function init(receiptText) {
        scene = new THREE.Scene();
        scene.background = null;

        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 100);
        camera.position.set(0, 0.0, 8.5);
        camera.lookAt(0, 0.0, 0);

        renderer = new THREE.WebGLRenderer({ antialias: quality.antialias, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio));
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = quality.shadows;
        if (quality.shadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = LIGHT_CONFIG.exposure;
        renderer.outputEncoding = THREE.sRGBEncoding;
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // Lights (day theme defaults)
        const dayConf = LIGHT_CONFIG;

        ambientLight = new THREE.AmbientLight(dayConf.ambient.color, dayConf.ambient.intensity);
        scene.add(ambientLight);

        keyLight = new THREE.DirectionalLight(dayConf.key.color, dayConf.key.intensity);
        keyLight.position.set(1, 5, 3);
        keyLight.castShadow = quality.shadows;
        if (quality.shadows) {
            keyLight.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
            keyLight.shadow.camera.near = 0.5;
            keyLight.shadow.camera.far = 15;
            keyLight.shadow.camera.left = -4;
            keyLight.shadow.camera.right = 4;
            keyLight.shadow.camera.top = 5;
            keyLight.shadow.camera.bottom = -5;
            keyLight.shadow.bias = -0.0005;
            keyLight.shadow.normalBias = 0.02;
        }
        scene.add(keyLight);

        overheadLight = new THREE.DirectionalLight(dayConf.overhead.color, dayConf.overhead.intensity);
        overheadLight.position.set(0, 6, 0);
        scene.add(overheadLight);

        fillLight = new THREE.DirectionalLight(dayConf.fill.color, dayConf.fill.intensity);
        fillLight.position.set(-3, 1, -2);
        scene.add(fillLight);

        rimLight = new THREE.PointLight(dayConf.rim.color, dayConf.rim.intensity, 10);
        rimLight.position.set(0, -2, 2);
        scene.add(rimLight);

        // Cloth
        cloth = new Cloth();
        clothGeo = new THREE.PlaneGeometry(PAPER_W, PAPER_H, COLS, ROWS);

        const receiptTex = createReceiptTexture(receiptText);

        const mat = new THREE.MeshStandardMaterial({
            map: receiptTex,
            side: THREE.DoubleSide,
            roughness: 0.92,
            metalness: 0.0,
            transparent: true,
            alphaTest: 0.05,
            shadowSide: THREE.DoubleSide,
        });

        const depthMat = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            map: receiptTex,
            alphaTest: 0.05,
        });

        clothMesh = new THREE.Mesh(clothGeo, mat);
        clothMesh.castShadow = quality.shadows;
        clothMesh.receiveShadow = quality.shadows;
        clothMesh.customDepthMaterial = depthMat;
        scene.add(clothMesh);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        toggleButton = document.getElementById('toggle-paper');
        const startVisible = !toggleButton || toggleButton.dataset.startVisible !== 'false';
        setPaperVisible(startVisible);
        if (toggleButton) {
            toggleButton.textContent = 'Impressum';
            toggleButton.addEventListener('click', () => {
                setPaperVisible(!paperVisible);
            });
        }

        const el = renderer.domElement;
        el.addEventListener('mousedown', onDown, false);
        el.addEventListener('mousemove', onMove, false);
        el.addEventListener('mouseup', onUp, false);
        el.addEventListener('mouseleave', onUp, false);
        el.addEventListener('touchstart', onTouchDown, { passive: false });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onUp, false);
        window.addEventListener('resize', onResize, false);
        document.addEventListener('visibilitychange', onVisibilityChange, false);

    }

    function setPaperVisible(visible) {
        paperVisible = visible;
        if (clothMesh) clothMesh.visible = visible;
        const canvasHost = document.getElementById('canvas-container');
        if (canvasHost) {
            canvasHost.style.opacity = visible ? '1' : '0';
            canvasHost.style.pointerEvents = visible ? 'auto' : 'none';
        }
        if (toggleButton) {
            toggleButton.textContent = 'Impressum';
            toggleButton.setAttribute('aria-pressed', String(!visible));
        }
        requestRender();
    }

    function setM(cx, cy) {
        mouse.x = (cx / window.innerWidth) * 2 - 1;
        mouse.y = -(cy / window.innerHeight) * 2 + 1;
    }

    function findNearest() {
        if (!clothMesh.visible) return { particle: null, point: null, nearby: [] };
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(clothMesh);
        if (hits.length > 0) {
            const pt = hits[0].point;
            let best = null, bestD = Infinity;
            const nearby = [];
            for (const p of cloth.particles) {
                if (p.pinned) continue;
                const d = p.pos.distanceTo(pt);
                if (d < DRAG_RADIUS) {
                    nearby.push({ p, d });
                    if (d < bestD) { bestD = d; best = p; }
                }
            }
            return { particle: best, point: pt, nearby };
        }
        return { particle: null, point: null, nearby: [] };
    }

    function onDown(e) {
        e.preventDefault();
        mouseDown = true;
        setM(e.clientX, e.clientY);
        const r = findNearest();
        if (r.particle) {
            dragParticle = r.particle;
            nearbyParticles = r.nearby;
            lastDragPos.copy(r.particle.pos);
            const cd = new THREE.Vector3();
            camera.getWorldDirection(cd);
            dragPlane.setFromNormalAndCoplanarPoint(cd.negate(), dragParticle.pos);
            dragOff.subVectors(dragParticle.pos, r.point);
        }
        requestRender();
    }

    function onMove(e) {
        e.preventDefault();
        setM(e.clientX, e.clientY);
        if (mouseDown && dragParticle) {
            raycaster.setFromCamera(mouse, camera);
            if (raycaster.ray.intersectPlane(dragPlane, isect)) {
                const target = isect.clone().add(dragOff);
                dragParticle.pos.lerp(target, 0.7);
                dragParticle.prev.copy(dragParticle.pos);

                lastDragPos.copy(dragParticle.pos);

                for (const { p, d } of nearbyParticles) {
                    if (p === dragParticle) continue;
                    const influence = Math.pow(1 - d / DRAG_RADIUS, DRAG_FALLOFF) * 0.4;
                    if (influence > 0.01) {
                        p.pos.lerp(target, influence);
                        p.prev.copy(p.pos);
                    }
                }
                requestRender();
            }
        }
    }

    function onUp() {
        mouseDown = false;
        dragParticle = null;
        nearbyParticles = [];
        requestRender();
    }

    function onTouchDown(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            mouseDown = true;
            setM(e.touches[0].clientX, e.touches[0].clientY);
            const r = findNearest();
            if (r.particle) {
                dragParticle = r.particle;
                nearbyParticles = r.nearby;
                lastDragPos.copy(r.particle.pos);
                const cd = new THREE.Vector3();
                camera.getWorldDirection(cd);
                dragPlane.setFromNormalAndCoplanarPoint(cd.negate(), dragParticle.pos);
                dragOff.subVectors(dragParticle.pos, r.point);
            }
            requestRender();
        }
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && mouseDown && dragParticle) {
            setM(e.touches[0].clientX, e.touches[0].clientY);
            raycaster.setFromCamera(mouse, camera);
            if (raycaster.ray.intersectPlane(dragPlane, isect)) {
                const target = isect.clone().add(dragOff);
                dragParticle.pos.lerp(target, 0.7);
                dragParticle.prev.copy(dragParticle.pos);

                lastDragPos.copy(dragParticle.pos);

                for (const { p, d } of nearbyParticles) {
                    if (p === dragParticle) continue;
                    const influence = Math.pow(1 - d / DRAG_RADIUS, DRAG_FALLOFF) * 0.4;
                    if (influence > 0.01) {
                        p.pos.lerp(target, influence);
                        p.prev.copy(p.pos);
                    }
                }
                requestRender();
            }
        }
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio));
        requestRender();
    }

    function onVisibilityChange() {
        if (!document.hidden) {
            lastFrameTime = 0;
            requestRender();
        }
    }

    function updateGeo() {
        const pos = clothGeo.attributes.position;
        const C = COLS + 1;
        for (let j = 0; j <= ROWS; j++) {
            for (let i = 0; i <= COLS; i++) {
                const idx = j * C + i;
                const p = cloth.particles[idx];
                pos.setXYZ(idx, p.pos.x, p.pos.y, p.pos.z);
            }
        }
        pos.needsUpdate = true;
        normalFrameCounter = (normalFrameCounter + 1) % quality.normalUpdateInterval;
        if (normalFrameCounter === 0) clothGeo.computeVertexNormals();
    }

    // Hover proximity push
    function hoverPush() {
        if (mouseDown || !paperVisible || !clothMesh.visible) return;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(clothMesh);
        if (hits.length > 0) {
            const pt = hits[0].point;
            const f = new THREE.Vector3();
            for (const p of cloth.particles) {
                if (p.pinned) continue;
                const d = p.pos.distanceTo(pt);
                if (d < DRAG_RADIUS * 0.5) {
                    const s = 0.00015 * (1 - d / (DRAG_RADIUS * 0.5));
                    f.set(0, 0, s);
                    p.addForce(f);
                }
            }
            requestRender();
        }
    }

    function animate(now) {
        requestAnimationFrame(animate);
        if (document.hidden) return;

        const frameInterval = 1000 / quality.targetFps;
        if (lastFrameTime && (now - lastFrameTime) < frameInterval) return;
        lastFrameTime = now;

        if (!paperVisible && !mouseDown) {
            if (needsRender) {
                renderer.render(scene, camera);
                needsRender = false;
            }
            return;
        }

        hoverPush();
        cloth.simulate();
        updateGeo();
        renderer.render(scene, camera);
        needsRender = false;
    }

    async function start() {
        const receiptText = await loadReceiptText();
        init(receiptText);
        requestAnimationFrame(animate);
    }

    start();

})();
