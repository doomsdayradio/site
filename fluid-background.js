import WebGLFluidEnhanced from 'https://cdn.jsdelivr.net/npm/webgl-fluid-enhanced@0.8.0/dist/index.es.js';

const host = document.getElementById('fluid-background');
const logo = document.querySelector('.hero-logo');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPerformanceMode = document.documentElement.classList.contains('fx-lite');
const ambientPalette = ['#b9855f', '#c99a72', '#d6ae86', '#e0c09b'];
const mousePalette = ['#879f36', '#a9c83f', '#d1ff45'];

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
    fluid.splatAtLocation(initialEmitters.leftX, initialEmitters.y, -55, -12);
    fluid.splatAtLocation(initialEmitters.rightX, initialEmitters.y, 55, -12);
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
    let pointerActive = false;

    window.addEventListener('pointermove', function(event) {
      if (event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', function() {
      pointerActive = false;
    });

    function sprayAtPointer(now) {
      if (pointerActive && pointerX !== null && pointerY !== null) {
        if (sprayX === null || sprayY === null) {
          sprayX = pointerX;
          sprayY = pointerY;
          previousSprayX = sprayX;
          previousSprayY = sprayY;
        }

        sprayX += (pointerX - sprayX) * 0.18;
        sprayY += (pointerY - sprayY) * 0.18;

        if (now - lastPointerSpray > (lowPerformanceMode ? 120 : 85)) {
          lastPointerSpray = now;
          const movementX = sprayX - previousSprayX;
          const movementY = sprayY - previousSprayY;
          const driftX = movementX * 1.15 + (Math.random() - 0.5) * 5;
          const driftY = -movementY * 1.15 - 2 - Math.random() * 4;

          fluid.setConfig({
            colorPalette: [mouseColor(movementX, movementY)],
            brightness: 0.44,
            splatRadius: 0.12
          });
          fluid.splatAtLocation(
            (sprayX + (Math.random() - 0.5) * 11) * (window.devicePixelRatio || 1),
            sprayY + (Math.random() - 0.5) * 11,
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

    let lastAudioSplat = 0;
    let lastBassPulse = 0;
    let bassEnvelope = 0;
    let trebleSide = 1;
    let visualOpacity = 0.26;
    function reactToAudio(now) {
      const signal = window.doomsdayAudioSignal;
      const targetOpacity = signal && signal.playing
        ? 0.28 + Math.min(0.18, signal.level * 0.42)
        : 0.26;
      visualOpacity += (targetOpacity - visualOpacity) * 0.045;
      host.style.opacity = visualOpacity.toFixed(3);

      if (signal && signal.playing) bassEnvelope += (signal.bass - bassEnvelope) * 0.055;
      else bassEnvelope *= 0.96;

      const audioInterval = signal
        ? (lowPerformanceMode ? 520 : 340) - Math.min(170, signal.level * 280)
        : 340;
      if (signal && signal.playing && now - lastAudioSplat > audioInterval) {
        lastAudioSplat = now;
        const pulse = Math.min(1, signal.level * 2.1);
        const phase = now * 0.00018;
        const emitterRatio = 0.38 + Math.sin(phase) * 0.13;
        const emitters = logoEmitters(emitterRatio);

        function emitFromLogoSide(side, energy, verticalOffset) {
          const direction = side === 'left' ? -1 : 1;
          const force = 55 + energy * 340 + pulse * 55;
          fluid.setConfig({
            colorPalette: [audioColor(signal)],
            brightness: 0.3 + energy * 0.5,
            splatRadius: 0.14 + energy * 0.18
          });
          fluid.splatAtLocation(
            side === 'left' ? emitters.leftX : emitters.rightX,
            emitters.y + verticalOffset,
            direction * force,
            Math.sin(phase * 1.7 + direction) * (18 + energy * 70)
          );
        }

        if (lowPerformanceMode) {
          if (signal.bass >= signal.mid) emitFromLogoSide('left', signal.bass, 18);
          else emitFromLogoSide('right', signal.mid, 18);
        } else {
          if (signal.bass > 0.025) emitFromLogoSide('left', signal.bass, 22);
          if (signal.mid > 0.025) emitFromLogoSide('right', signal.mid, 22);
        }

        const frequencyEnergy = signal.bass * 0.5 + signal.mid * 0.35 + signal.treble * 0.15;
        if (signal.treble > 0.04 && !lowPerformanceMode) {
          trebleSide *= -1;
          emitFromLogoSide(trebleSide < 0 ? 'left' : 'right', signal.treble, -70);
        }

        if (signal.bass > 0.1 && signal.bass > bassEnvelope * 1.12 + 0.015 && now - lastBassPulse > 700) {
          lastBassPulse = now;
          const bassEmitters = logoEmitters(0.62);
          const bassForce = 90 + frequencyEnergy * 280;
          fluid.setConfig({
            colorPalette: ['#d4a373'],
            brightness: 0.42 + signal.bass * 0.34,
            splatRadius: 0.27 + signal.bass * 0.1
          });
          fluid.splatAtLocation(
            bassEmitters.leftX,
            bassEmitters.y,
            -bassForce,
            24
          );
          fluid.splatAtLocation(
            bassEmitters.rightX,
            bassEmitters.y,
            bassForce,
            24
          );
        }
      }
      requestAnimationFrame(reactToAudio);
    }

    requestAnimationFrame(reactToAudio);
  } catch (error) {
    host.hidden = true;
    window.doomsdayFluidReady = false;
    console.warn('Fluid background unavailable:', error);
  }
}

function audioColor(signal) {
  const red = 178 + signal.bass * 55 + signal.mid * 18;
  const green = 126 + signal.mid * 52 + signal.treble * 24;
  const blue = 88 + signal.treble * 58 + signal.mid * 16;
  return rgbToHex(red, green, blue);
}

function mouseColor(deltaX, deltaY) {
  if (Math.abs(deltaX) > Math.abs(deltaY)) return mousePalette[2];
  return deltaY < 0 ? mousePalette[1] : mousePalette[0];
}

function rgbToHex(red, green, blue) {
  return '#' + [red, green, blue].map(function(value) {
    return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
  }).join('');
}
