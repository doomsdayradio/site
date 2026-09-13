import WebGLFluidEnhanced from 'https://cdn.jsdelivr.net/npm/webgl-fluid-enhanced@0.8.0/dist/index.es.js';

const host = document.getElementById('fluid-background');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPerformanceMode = document.documentElement.classList.contains('fx-lite');

if (host && !prefersReducedMotion) {
  try {
    const fluid = new WebGLFluidEnhanced(host);

    // The library styles its container for standalone demos; restore our background layer.
    host.style.position = 'fixed';
    host.style.inset = '0';

    fluid.setConfig({
      simResolution: lowPerformanceMode ? 48 : 80,
      dyeResolution: lowPerformanceMode ? 192 : 384,
      densityDissipation: 2.4,
      velocityDissipation: 0.55,
      pressure: 0.7,
      pressureIterations: lowPerformanceMode ? 8 : 12,
      curl: 16,
      splatRadius: 0.12,
      splatForce: 1800,
      shading: !lowPerformanceMode,
      colorful: false,
      colorPalette: ['#7f321f', '#a84b2c', '#879f36', '#c7df62'],
      hover: false,
      transparent: true,
      brightness: 0.08,
      bloom: false,
      sunrays: false
    });

    fluid.start();
    fluid.splatAtLocation(
      window.innerWidth * 0.5 * (window.devicePixelRatio || 1),
      window.innerHeight * 0.58,
      35,
      -20
    );
    window.doomsdayFluidReady = true;

    let previousX = window.innerWidth * 0.5;
    let previousY = window.innerHeight * 0.5;
    let lastPointerSplat = 0;

    window.addEventListener('pointermove', function(event) {
      const now = performance.now();
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;

      if (now - lastPointerSplat < (lowPerformanceMode ? 70 : 42)) return;
      lastPointerSplat = now;

      const signal = window.doomsdayAudioSignal;
      fluid.setConfig({
        colorPalette: [signal && signal.playing ? audioColor(signal) : '#8f492d'],
        brightness: signal && signal.playing ? 0.07 + signal.level * 0.1 : 0.065
      });
      const pixelRatio = window.devicePixelRatio || 1;
      fluid.splatAtLocation(
        event.clientX * pixelRatio,
        event.clientY,
        deltaX * 18,
        -deltaY * 18
      );
    }, { passive: true });

    let lastAudioSplat = 0;
    function reactToAudio(now) {
      const signal = window.doomsdayAudioSignal;
      if (signal && signal.playing && signal.level > 0.035 && now - lastAudioSplat > 170) {
        lastAudioSplat = now;
        const pulse = Math.min(1, signal.level * 1.8);
        const x = window.innerWidth * (0.34 + Math.random() * 0.32);
        const y = window.innerHeight * (0.3 + Math.random() * 0.4);
        const force = 90 + pulse * 260;
        const pixelRatio = window.devicePixelRatio || 1;
        fluid.setConfig({
          colorPalette: [audioColor(signal)],
          brightness: 0.065 + pulse * 0.11
        });
        fluid.splatAtLocation(
          x * pixelRatio,
          y,
          (Math.random() - 0.5) * force,
          (Math.random() - 0.5) * force
        );
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
  const red = 118 + signal.bass * 125 + signal.treble * 20;
  const green = 48 + signal.mid * 170 + signal.treble * 55;
  const blue = 24 + signal.treble * 115;
  return rgbToHex(red, green, blue);
}

function rgbToHex(red, green, blue) {
  return '#' + [red, green, blue].map(function(value) {
    return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
  }).join('');
}
