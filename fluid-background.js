import WebGLFluidEnhanced from 'https://cdn.jsdelivr.net/npm/webgl-fluid-enhanced@0.8.0/dist/index.es.js';

const host = document.getElementById('fluid-background');
const logo = document.querySelector('.hero-logo');
const logoStage = document.querySelector('.hero-logo-stage') || logo;
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
    let lastLogoGlitch = 0;
    let hardBassFrames = 0;
    let hardBassTriggered = false;
    let highLevelFrames = 0;
    let highLevelTriggered = false;
    let glitchEmissionBursts = 0;
    let glitchEmissionUntil = 0;
    let audioSideToggle = 0;
    let pointerActive = false;

    function updatePointer(event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
    }

    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerdown', updatePointer, { passive: true });
    window.addEventListener('pointerup', function(event) {
      if (event.pointerType !== 'mouse') pointerActive = false;
    }, { passive: true });
    window.addEventListener('pointercancel', function(event) {
      if (event.pointerType !== 'mouse') pointerActive = false;
    }, { passive: true });

    function sprayAtPointer(now) {
      const signal = window.doomsdayAudioSignal;
      const isPlaying = Boolean(signal && signal.playing);
      const level = Math.max(0, Math.min(1, signal ? (signal.level || 0) : 0));
      const transient = Math.max(0, Math.min(1, signal ? (signal.transient || 0) : 0));
      const bass = Math.max(0, Math.min(1, signal ? (signal.bass || level) : level));
      const hardBass = Math.max(0, Math.min(1, signal ? (signal.hardBass || 0) : 0));
      const mid = Math.max(0, Math.min(1, signal ? (signal.mid || level) : level));
      const treble = Math.max(0, Math.min(1, signal ? (signal.treble || level) : level));
      const bassActivity = Math.max(0, Math.min(1, (bass - 0.25) / 0.75));
      const bassHardThreshold = 0.38;
      const bassHardActivity = Math.max(0, Math.min(1, (bass - bassHardThreshold) / 0.38));
      const hardBassActivity = signal && signal.hardBassConfirmed ? hardBass : 0;
      const hardBassEmission = Math.max(0, Math.min(1, (hardBassActivity - 0.88) / 0.12));
      const bassPunch = Math.max(
        bassActivity * bassActivity,
        bassHardActivity * bassHardActivity,
        hardBassActivity * hardBassActivity
      );
      const volumeActivity = Math.max(0, Math.min(1, (level - 0.3) / 0.7));
      const volumePulse = transient * (0.08 + volumeActivity * 0.34);
      const levelPunch = Math.max(0, Math.min(1, (level - 0.88) / 0.12));
      const visualPunch = Math.min(1, Math.max(bassPunch, volumePulse, levelPunch * 0.82));
      if (isPlaying && hardBassActivity >= 0.88) hardBassFrames += 1;
      else {
        hardBassFrames = 0;
        hardBassTriggered = false;
      }
      if (isPlaying && level >= 0.88) highLevelFrames += 1;
      else {
        highLevelFrames = 0;
        highLevelTriggered = false;
      }
      const hasBassPeak = hardBassFrames >= 3 && !hardBassTriggered;
      const hasLevelPeak = highLevelFrames >= 2 && !highLevelTriggered;

      if (logoStage && (hasBassPeak || hasLevelPeak) && now - lastLogoGlitch > 1200) {
        lastLogoGlitch = now;
        if (hasBassPeak) hardBassTriggered = true;
        if (hasLevelPeak) highLevelTriggered = true;
        glitchEmissionBursts = 3;
        glitchEmissionUntil = now + 520;
        logoStage.classList.remove('logo-bass-hit');
        void logoStage.offsetWidth;
        logoStage.classList.add('logo-bass-hit');
        window.setTimeout(function() {
          logoStage.classList.remove('logo-bass-hit');
        }, 260);
      }

      // Volume adds occasional light puffs; only bass can create a strong emission.
      const glitchBurstActive = glitchEmissionBursts > 0 && now < glitchEmissionUntil;
      const shouldEmitAudio = isPlaying && (glitchBurstActive || transient >= 0.14 || hardBassActivity >= 0.88 || level >= 0.88);
      const audioInterval = glitchBurstActive ? (lowPerformanceMode ? 170 : 125) : (lowPerformanceMode ? 360 : 240);

      if (shouldEmitAudio && now - lastAudioSpray > audioInterval) {
        lastAudioSpray = now;
        const normalizedPunch = visualPunch;
        const emissionPunch = glitchBurstActive ? Math.max(normalizedPunch, 0.88) : Math.max(normalizedPunch, hardBassEmission);

        const cloudRadius = (lowPerformanceMode ? 0.055 : 0.07) + (emissionPunch * 0.11) + (glitchBurstActive ? 0.025 : 0);
        const cloudBrightness = (lowPerformanceMode ? 0.10 : 0.12) + (emissionPunch * 0.22) + (glitchBurstActive ? 0.08 : 0);
        const cloudColor = soundWaveColor(now, bass, mid, treble, normalizedPunch);

        fluid.setConfig({
          colorPalette: [cloudColor],
          brightness: Math.min(0.5, cloudBrightness),
          splatRadius: Math.min(0.22, cloudRadius)
        });

        // Emitter alternates between left and right broadcast arches with gentle drift
        const emitters = logoEmitters(0.44 + Math.sin(now * 0.002) * 0.06);
        audioSideToggle = (audioSideToggle + 1) % 2;
        const isLeft = audioSideToggle === 0;

        const emitX = isLeft ? emitters.leftX : emitters.rightX;
        const emitY = emitters.y + Math.cos(now * 0.003) * 4;
        const forceX = (isLeft ? -1 : 1) * (4 + bassPunch * 31 + levelPunch * 20 + volumePulse * 5 + hardBassEmission * 18 + (glitchBurstActive ? 11 : 0));
        const forceY = -2 - (bassPunch * 18 + levelPunch * 11 + volumePulse * 3 + hardBassEmission * 10 + (glitchBurstActive ? 8 : 0));

        fluid.splatAtLocation(emitX, emitY, forceX, forceY);
        if (glitchBurstActive) glitchEmissionBursts -= 1;
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
