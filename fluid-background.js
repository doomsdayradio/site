import WebGLFluidEnhanced from 'https://cdn.jsdelivr.net/npm/webgl-fluid-enhanced@0.8.0/dist/index.es.js';

const host = document.getElementById('fluid-background');
const logo = document.querySelector('.hero-logo');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPerformanceMode = document.documentElement.classList.contains('fx-lite');
const ambientPalette = ['#b9855f', '#c99a72', '#d6ae86', '#e0c09b'];
const mousePalette = ['#b84f18', '#d97824', '#e9a13a', '#f0bd64', '#cf6930'];

if (host && !prefersReducedMotion) {
  try {
    const fluid = new WebGLFluidEnhanced(host);

    // The library styles its container for standalone demos; restore our background layer.
    host.style.position = 'fixed';
    host.style.inset = '0';

    fluid.setConfig({
      simResolution: lowPerformanceMode ? 48 : 80,
      dyeResolution: lowPerformanceMode ? 192 : 384,
      densityDissipation: 0.42,
      velocityDissipation: 0.32,
      pressure: 0.7,
      pressureIterations: lowPerformanceMode ? 8 : 12,
      curl: 3,
      splatRadius: 0.2,
      splatForce: 520,
      shading: !lowPerformanceMode,
      colorful: false,
      colorPalette: ambientPalette,
      hover: false,
      transparent: true,
      brightness: 0.28,
      bloom: false,
      sunrays: false
    });

    fluid.start();
    const initialEmitters = logoEmitters(0.48);
    fluid.splatAtLocation(initialEmitters.leftX, initialEmitters.y, -7, -2);
    fluid.splatAtLocation(initialEmitters.rightX, initialEmitters.y, 7, -2);
    window.doomsdayFluidReady = true;

    function logoEmitters(verticalRatio) {
      const pixelRatio = window.devicePixelRatio || 1;
      const rect = logo ? logo.getBoundingClientRect() : {
        left: window.innerWidth * 0.28,
        right: window.innerWidth * 0.72,
        top: window.innerHeight * 0.2,
        height: window.innerHeight * 0.5,
        width: window.innerWidth * 0.44
      };
      const edgeInset = Math.min(14, rect.width * 0.035);
      return {
        leftX: (rect.left + edgeInset) * pixelRatio,
        rightX: (rect.right - edgeInset) * pixelRatio,
        y: rect.top + rect.height * verticalRatio
      };
    }

    let pointerX = null;
    let pointerY = null;
    let sprayX = null;
    let sprayY = null;
    let previousSprayX = null;
    let previousSprayY = null;
    let lastPointerSpray = 0;
    let lastAudioSpray = 0;
    let audioSideToggle = 0;
    let pointerActive = false;

    window.addEventListener('pointermove', function(event) {
      if (event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
    }, { passive: true });

    function sprayAtPointer(now) {
      const signal = window.doomsdayAudioSignal;
      const isPlaying = Boolean(signal && signal.playing);
      const level = Math.max(0, Math.min(1, signal ? (signal.level || 0) : 0));
      const bass = Math.max(0, Math.min(1, signal ? (signal.bass || level) : level));
      const mid = Math.max(0, Math.min(1, signal ? (signal.mid || level) : level));
      const treble = Math.max(0, Math.min(1, signal ? (signal.treble || level) : level));
      const bassEmissionThreshold = 0.35;
      const bassActivity = Math.max(0, Math.min(1, (bass - bassEmissionThreshold) / (1 - bassEmissionThreshold)));
      const bassPunch = bassActivity * bassActivity;

      // Keep ordinary signal activity nearly still; bass is the only strong driver.
      const shouldEmitAudio = isPlaying && bass >= bassEmissionThreshold;
      const audioInterval = (lowPerformanceMode ? 620 : 460) / Math.max(0.9, 0.9 + bassPunch * 0.8);

      if (shouldEmitAudio && now - lastAudioSpray > audioInterval) {
        lastAudioSpray = now;
        const normalizedPunch = bassPunch;

        // Keep the ambient puff small; only a strong bass hit should noticeably grow it.
        const cloudRadius = (lowPerformanceMode ? 0.055 : 0.07) + (normalizedPunch * 0.055);
        const cloudBrightness = (lowPerformanceMode ? 0.10 : 0.12) + (normalizedPunch * 0.13);
        const cloudColor = soundWaveColor(now, bass, mid, treble, normalizedPunch);

        fluid.setConfig({
          colorPalette: [cloudColor],
          brightness: Math.min(0.25, cloudBrightness),
          splatRadius: Math.min(0.13, cloudRadius)
        });

        // Emitter alternates between left and right broadcast arches with gentle drift
        const emitters = logoEmitters(0.44 + Math.sin(now * 0.002) * 0.06);
        audioSideToggle = (audioSideToggle + 1) % 2;
        const isLeft = audioSideToggle === 0;

        const emitX = isLeft ? emitters.leftX : emitters.rightX;
        const emitY = emitters.y + Math.cos(now * 0.003) * 4;
        const forceX = (isLeft ? -1 : 1) * (4 + normalizedPunch * 12);
        const forceY = -2 - (normalizedPunch * 7);

        fluid.splatAtLocation(emitX, emitY, forceX, forceY);
      }
      if (pointerActive && pointerX !== null && pointerY !== null) {
        if (sprayX === null || sprayY === null) {
          sprayX = pointerX;
          sprayY = pointerY;
          previousSprayX = sprayX;
          previousSprayY = sprayY;
        }

        sprayX += (pointerX - sprayX) * 0.075;
        sprayY += (pointerY - sprayY) * 0.075;

        if (now - lastPointerSpray > (lowPerformanceMode ? 320 : 220)) {
          lastPointerSpray = now;
          const movementX = sprayX - previousSprayX;
          const movementY = sprayY - previousSprayY;
          const phase = now * 0.00022;
          const driftX = movementX * 0.55 + Math.sin(phase) * 3.5;
          const driftY = -movementY * 0.55 - 2.5 + Math.cos(phase * 0.73) * 2;
          const orbitX = Math.sin(phase * 0.61) * 7;
          const orbitY = Math.cos(phase * 0.47) * 7;

          fluid.setConfig({
            colorPalette: [mouseColor(now)],
            brightness: 0.38,
            splatRadius: 0.16
          });
          fluid.splatAtLocation(
            (sprayX + orbitX) * (window.devicePixelRatio || 1),
            sprayY + orbitY,
            driftX,
            driftY
          );

          previousSprayX = sprayX;
          previousSprayY = sprayY;
        }
      }

      requestAnimationFrame(sprayAtPointer);
    }

    requestAnimationFrame(sprayAtPointer);
  } catch (error) {
    host.hidden = true;
    window.doomsdayFluidReady = false;
    console.warn('Fluid background unavailable:', error);
  }
}

function soundWaveColor(now, bass, mid, treble, level) {
  // Sound-reactive harmonic color blending:
  // Strong bass -> warm rust / orange smoke (#b84f18, #cf6930)
  // Strong mids -> signal amber / golden dust (#d97824, #f0bd64)
  // Strong highs/transients -> phosphor lime / light ash (#d6ae86, #e0c09b)
  const basePhase = (Math.sin(now * 0.0006) + 1) * 0.5 * (ambientPalette.length - 1);
  const baseIndex = Math.floor(basePhase);
  const baseColor = mixHex(ambientPalette[baseIndex], ambientPalette[Math.min(ambientPalette.length - 1, baseIndex + 1)], basePhase - baseIndex);

  const bassWeight = bass * 1.5;
  const midWeight = mid * 1.2;
  const trebleWeight = treble * 0.9;
  const totalWeight = bassWeight + midWeight + trebleWeight + 0.001;

  // Primary accent colors for sound bursts
  const orange = [184, 79, 24];
  const amber = [217, 120, 36];
  const ash = [224, 192, 155];

  const soundR = Math.round((orange[0] * bassWeight + amber[0] * midWeight + ash[0] * trebleWeight) / totalWeight);
  const soundG = Math.round((orange[1] * bassWeight + amber[1] * midWeight + ash[1] * trebleWeight) / totalWeight);
  const soundB = Math.round((orange[2] * bassWeight + amber[2] * midWeight + ash[2] * trebleWeight) / totalWeight);
  const soundHex = rgbToHex(soundR, soundG, soundB);

  return mixHex(baseColor, soundHex, Math.min(0.85, level * 0.9 + 0.15));
}

function mouseColor(now) {
  const palettePosition = (Math.sin(now * 0.000075) + 1) * 0.5 * (mousePalette.length - 1);
  const startIndex = Math.floor(palettePosition);
  const endIndex = Math.min(mousePalette.length - 1, startIndex + 1);
  return mixHex(mousePalette[startIndex], mousePalette[endIndex], palettePosition - startIndex);
}

function mixHex(start, end, amount) {
  const startColor = parseInt(start.slice(1), 16);
  const endColor = parseInt(end.slice(1), 16);
  return rgbToHex(
    ((startColor >> 16) & 255) + (((endColor >> 16) & 255) - ((startColor >> 16) & 255)) * amount,
    ((startColor >> 8) & 255) + (((endColor >> 8) & 255) - ((startColor >> 8) & 255)) * amount,
    (startColor & 255) + ((endColor & 255) - (startColor & 255)) * amount
  );
}

function rgbToHex(red, green, blue) {
  return '#' + [red, green, blue].map(function(value) {
    return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
  }).join('');
}
