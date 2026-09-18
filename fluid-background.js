import WebGLFluidEnhanced from 'https://cdn.jsdelivr.net/npm/webgl-fluid-enhanced@0.8.0/dist/index.es.js';

const host = document.getElementById('fluid-background');
const logo = document.querySelector('.hero-logo');
const logoStage = document.querySelector('.hero-logo-stage') || logo;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPerformanceMode = document.documentElement.classList.contains('fx-lite');
const ambientPalette = ['#b9855f', '#c99a72', '#d6ae86', '#e0c09b'];
const mousePalette = ['#b84f18', '#d97824', '#e9a13a', '#f0bd64', '#cf6930'];

/* FX trigger tuning lives in fx-config.js (window.doomsdayFxConfig). Values
 * here mirror the config defaults so the background keeps working when the
 * config script is missing or a key was renamed. */
const fxTriggers = (window.doomsdayFxConfig && window.doomsdayFxConfig.triggers) || {};
const fxNum = function(group, key, fallback) {
  const value = group && Number(group[key]);
  return Number.isFinite(value) ? value : fallback;
};
const fxHeavyBass = fxTriggers.heavyBass || {};
const getFxHeavyBassOn = () => fxNum(fxHeavyBass, 'on', 0.88);
const getFxHeavyBassOff = () => fxNum(fxHeavyBass, 'off', 0.72);
const fxHighLevel = fxTriggers.highLevel || {};
const fxHighLevelOn = fxNum(fxHighLevel, 'on', 0.88);
const fxSoftPulse = fxTriggers.softPulse || {};
const fxBass = fxTriggers.bass || {};
const fxColors = fxTriggers.colors || {};
const fxTrebleSpike = fxTriggers.trebleSpike || {};
const fxNoise = fxTriggers.noise || {};
const fxBassCoupled = fxTriggers.bassCoupled || {};
const fxEmission = fxTriggers.emission || {};
const fxMouse = fxTriggers.mouse || {};
const fxTreble = fxTriggers.treble || {};
let bassCoupledEnabled = fxBassCoupled.enabled !== false;
let heavyBassEnabled = fxHeavyBass.enabled !== false;
let highLevelEnabled = fxHighLevel.enabled !== false;
let softPulseEnabled = fxSoftPulse.enabled !== false;
let glitchEnabled = (fxTriggers.glitch || {}).enabled !== false;
let emissionEnabled = fxEmission.enabled !== false;
let trebleEnabled = fxTreble.enabled !== false && fxTrebleSpike.enabled !== false;
const trebleSparkPalette = ['#d1ff45', '#e6f2b0', '#f4f0e6', '#e0c09b'];

function refreshEnabledFlags() {
  bassCoupledEnabled = fxBassCoupled.enabled !== false;
  heavyBassEnabled = fxHeavyBass.enabled !== false;
  highLevelEnabled = fxHighLevel.enabled !== false;
  softPulseEnabled = fxSoftPulse.enabled !== false;
  glitchEnabled = (fxTriggers.glitch || {}).enabled !== false;
  emissionEnabled = fxEmission.enabled !== false;
  trebleEnabled = fxTreble.enabled !== false && fxTrebleSpike.enabled !== false;
}

window.addEventListener('doomsday:debug-config-change', refreshEnabledFlags);

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
      shading: false,
      colorful: false,
      colorPalette: ambientPalette,
      hover: false,
      transparent: true,
      brightness: 0.28,
      bloom: false,
      sunrays: false
    });

    fluid.start();
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
    let lastLocalKickSequence = 0;
    let lastBassCoupledActivity = 0;
    let hardBassFrames = 0;
    let hardBassTriggered = false;
    let trebleSpikeFrames = 0;
    let trebleSpikeReady = true;
    let lastTrebleSpray = 0;
    let lastTrebleSpikeEnd = 0;
    let lastTrebleSignal = 0;
    let glitchEmissionBursts = 0;
    let glitchEmissionUntil = 0;
    let audioSideToggle = 0;
    let pointerActive = false;
    let lastPointerMove = 0;
    let lastPointerEventX = null;
    let lastPointerEventY = null;
    let pendingPointerDeltaX = 0;
    let pendingPointerDeltaY = 0;

    function isInteractiveTarget(target) {
      return Boolean(target && target.closest('button,a,input,label,select,textarea,.action-bar,.status'));
    }

    function updatePointer(event) {
      if (isInteractiveTarget(event.target)) return;
      const moved = lastPointerEventX === null
        || Math.hypot(event.clientX - lastPointerEventX, event.clientY - lastPointerEventY) >= 0.5;
      if (lastPointerEventX !== null) {
        pendingPointerDeltaX += event.clientX - lastPointerEventX;
        pendingPointerDeltaY += event.clientY - lastPointerEventY;
      }
      lastPointerEventX = event.clientX;
      lastPointerEventY = event.clientY;
      if (!moved) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
      lastPointerMove = performance.now();
    }

    function emitTapCloud(event) {
      const angle = Math.random() * Math.PI * 2;
      const force = fxNum(fxMouse, 'tapForceMin', 18)
        + Math.random() * fxNum(fxMouse, 'tapForceRange', 8);
      const tapColor = mousePalette[Math.floor(Math.random() * mousePalette.length)];

      if (fxMouse.enabled === false) return;
      fluid.setConfig({
        colorPalette: [tapColor],
        brightness: fxNum(fxMouse, 'tapBrightness', 0.12),
        splatRadius: lowPerformanceMode
          ? fxNum(fxMouse, 'tapRadiusLite', 0.045)
          : fxNum(fxMouse, 'tapRadius', 0.06),
        splatForce: force
      });
      fluid.splatAtLocation(
        event.clientX * (window.devicePixelRatio || 1),
        event.clientY,
        Math.cos(angle) * force,
        Math.sin(angle) * force
      );
    }

    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerdown', function(event) {
      if (isInteractiveTarget(event.target)) {
        pointerActive = false;
        return;
      }
      updatePointer(event);
      emitTapCloud(event);
    }, { passive: true });
    window.addEventListener('pointerup', function(event) {
      pointerActive = false;
      sprayX = null;
      sprayY = null;
      previousSprayX = null;
      previousSprayY = null;
      pendingPointerDeltaX = 0;
      pendingPointerDeltaY = 0;
    }, { passive: true });
    window.addEventListener('pointercancel', function(event) {
      pointerActive = false;
      sprayX = null;
      sprayY = null;
      previousSprayX = null;
      previousSprayY = null;
      pendingPointerDeltaX = 0;
      pendingPointerDeltaY = 0;
    }, { passive: true });

    function sprayAtPointer(now) {
      if (pointerActive && now - lastPointerMove > 180) pointerActive = false;
      const signal = window.doomsdayAudioSignal || {};
      const localKickSequence = Number.isFinite(Number(signal.kickSequence)) ? Number(signal.kickSequence) : 0;
      const hasLocalKick = localKickSequence > lastLocalKickSequence;
      if (hasLocalKick) lastLocalKickSequence = localKickSequence;
      const derived = window.doomsdayAudioSignalMath.derive(signal, fxTriggers, {
        bassCoupled: bassCoupledEnabled,
        heavyBass: heavyBassEnabled,
        highLevel: highLevelEnabled,
        softPulse: softPulseEnabled,
        hasLocalKick: hasLocalKick
      });
      const isPlaying = derived.isPlaying;
      const level = derived.level;
      const transient = derived.transient;
      const bass = derived.bass;
      const hardBass = derived.hardBass;
      const mid = derived.mid;
      const treble = derived.treble;
      const bassActivity = derived.bassActivity;
      const bassHardActivity = derived.bassHardActivity;
      const hardBassActivity = hasLocalKick ? 1 : derived.hardBassActivity;
      const hardBassEmission = derived.hardBassEmission;
      const bassPunch = derived.bassPunch;
      const volumeActivity = derived.volumeActivity;
      const volumePulse = derived.volumePulse;
      const levelPunch = derived.levelPunch;
      const visualPunch = derived.visualPunch;
      if (isPlaying && hardBassActivity >= getFxHeavyBassOn()) hardBassFrames += 1;
      else if (hardBassActivity < getFxHeavyBassOff()) {
        hardBassFrames = 0;
        hardBassTriggered = false;
      }
      const hasBassPeak = heavyBassEnabled && (bassCoupledEnabled
        ? (hasLocalKick || hardBassActivity >= getFxHeavyBassOn()) && !hardBassTriggered
        : hardBassFrames >= fxNum(fxHeavyBass, 'confirmFrames', 3) && !hardBassTriggered);

      /* Logo glitch fires only on the hardest bass hits; a loud overall level
       * still drives emissions/level punch but never glitches the logo. */
      if (logoStage && glitchEnabled && hasBassPeak && now - lastLogoGlitch > fxNum(fxHeavyBass, 'glitchCooldownMs', 1200)) {
        lastLogoGlitch = now;
        hardBassTriggered = true;
        glitchEmissionBursts = hasLocalKick ? 1 : fxNum(fxHeavyBass, 'glitchBursts', 3);
        glitchEmissionUntil = now + fxNum(fxHeavyBass, 'glitchMs', 520);
        logoStage.classList.remove('logo-bass-hit');
        void logoStage.offsetWidth;
        logoStage.classList.add('logo-bass-hit');
        window.setTimeout(function() {
          logoStage.classList.remove('logo-bass-hit');
        }, 260);
      }

      if (bassCoupledEnabled && emissionEnabled) {
        /* The ordinary emissions follow raw sub intensity. A qualifying kick
         * starts a short burst at full strength, handled separately below. */
        const bcSub = signal && Number.isFinite(signal.sub) ? signal.sub : bass * 0.4;
        const bcSubFloor = fxNum(fxBassCoupled, 'subFloor', 0.10);
        const bcSubCeil = fxNum(fxBassCoupled, 'subCeil', 0.55);
        const bcSubActivity = Math.max(0, Math.min(1, (bcSub - bcSubFloor) / (bcSubCeil - bcSubFloor)));
        const bcSubGate = Math.max(0, Math.min(1,
          (bcSub - fxNum(fxBassCoupled, 'subGateOn', 0.18)) / fxNum(fxBassCoupled, 'subGateScale', 0.12)
        ));
        const bcActivity = bcSubActivity * bcSubGate;
        const bcActivityRise = bcActivity - lastBassCoupledActivity;
        lastBassCoupledActivity = isPlaying ? bcActivity : 0;
        /* Exponential strength curve: quiet parts stay subtle, loud bass
         * explodes. intensityExponent controls how aggressive the top end is. */
        const bcK = fxNum(fxBassCoupled, 'intensityExponent', 2.5);
        const bcExpK = Math.exp(bcK);
        const punch = (Math.exp(bcK * bcActivity) - 1) / (bcExpK - 1);
        const bcMinInterval = fxNum(fxBassCoupled, 'minIntervalMs', 90);
        const bcMaxInterval = fxNum(fxBassCoupled, 'maxIntervalMs', 460);
        const glitchBurstActive = glitchEmissionBursts > 0 && now < glitchEmissionUntil;
        const emitInterval = glitchBurstActive
          ? (lowPerformanceMode ? fxNum(fxSoftPulse, 'burstIntervalMsLite', 170) : fxNum(fxSoftPulse, 'burstIntervalMs', 125))
          : bcMaxInterval + (bcMinInterval - bcMaxInterval) * bcActivity;
        const emissionPunch = glitchBurstActive ? 1 : Math.max(punch, hardBassActivity);
        const bcRiseOn = fxNum(fxBassCoupled, 'kickRiseOn', 0.18);
        const shouldEmitBass = bcActivity > 0 || hasLocalKick || glitchBurstActive;
        if (isPlaying && shouldEmitBass && now - lastAudioSpray > emitInterval) {
          lastAudioSpray = now;
          const cloudColor = soundWaveColor(now, bass, mid, treble, emissionPunch);
          const kickEmission = hasLocalKick || bcActivityRise >= bcRiseOn || glitchBurstActive;
          const normalRadius = Math.max(0.006, fxNum(fxEmission, 'normalRadius', 0.06));
          const normalRadiusScale = Math.max(0.025, fxNum(fxEmission, 'normalRadiusScale', 0.16));
          const normalForce = fxNum(fxEmission, 'normalForce', 520);
          const kickRadius = Math.min(0.16, Math.max(0.025, fxNum(fxEmission, 'glitchRadius', 0.22) * 0.5));
          fluid.setConfig({
            colorPalette: [cloudColor],
            brightness: 0.28,
            splatRadius: kickEmission
              ? kickRadius
              : Math.min(0.08, normalRadius + punch * normalRadiusScale),
            splatForce: kickEmission
              ? fxNum(fxEmission, 'glitchForce', 520)
              : normalForce * (0.12 + punch * 0.48)
          });
          const emitters = logoEmitters(0.44 + Math.sin(now * 0.002) * 0.06);
          const emitY = emitters.y + Math.cos(now * 0.003) * 4;
          const emitForceX = 4 + emissionPunch * 42;
          const emitForceY = -(2 + emissionPunch * 26);
          fluid.splatAtLocation(emitters.leftX, emitY, -emitForceX, emitForceY);
          fluid.splatAtLocation(emitters.rightX, emitY, emitForceX, emitForceY);
          if (glitchBurstActive) glitchEmissionBursts -= 1;
        }
      } else {

      // Volume adds occasional light puffs; only bass can create a strong emission.
      const glitchBurstActive = glitchEmissionBursts > 0 && now < glitchEmissionUntil;
      const transientOn = fxNum(fxSoftPulse, 'transientOn', 0.14);
      const shouldEmitAudio = emissionEnabled && isPlaying && (glitchBurstActive || (softPulseEnabled && transient >= transientOn) || (heavyBassEnabled && hardBassActivity >= getFxHeavyBassOn()) || (highLevelEnabled && level >= fxHighLevelOn));
      const audioInterval = glitchBurstActive
        ? (lowPerformanceMode ? fxNum(fxSoftPulse, 'burstIntervalMsLite', 170) : fxNum(fxSoftPulse, 'burstIntervalMs', 125))
        : (lowPerformanceMode ? fxNum(fxSoftPulse, 'intervalMsLite', 360) : fxNum(fxSoftPulse, 'intervalMs', 240));

      if (shouldEmitAudio && now - lastAudioSpray > audioInterval) {
        lastAudioSpray = now;
        const normalizedPunch = visualPunch;
        const emissionPunch = glitchBurstActive ? Math.max(normalizedPunch, 0.88) : Math.max(normalizedPunch, hardBassEmission);

        const cloudRadius = (lowPerformanceMode ? 0.055 : 0.07) + (emissionPunch * 0.11) + (glitchBurstActive ? 0.025 : 0);
        const cloudBrightness = (lowPerformanceMode ? 0.10 : 0.12) + (emissionPunch * 0.22) + (glitchBurstActive ? 0.08 : 0);
        const cloudColor = soundWaveColor(now, bass, mid, treble, normalizedPunch);

        fluid.setConfig({
          colorPalette: [cloudColor],
          brightness: 0.28,
          splatRadius: glitchBurstActive
            ? fxNum(fxEmission, 'glitchRadius', 0.22)
            : Math.min(0.5, fxNum(fxEmission, 'normalRadius', 0.06) + emissionPunch * fxNum(fxEmission, 'normalRadiusScale', 0.16)),
          splatForce: glitchBurstActive
            ? fxNum(fxEmission, 'glitchForce', 520)
            : fxNum(fxEmission, 'normalForce', 520)
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
      }

      /* Treble spikes: sharp, small, cool-colored splashes at the top of the
       * logo. Gated on treble + transient so only real attacks fire. */
      const trebleSpikeOn = fxNum(fxTrebleSpike, 'on', 0.28);
      const trebleSpikeOff = fxNum(fxTrebleSpike, 'off', 0.18);
      const trebleSpikeTransientOn = fxNum(fxTrebleSpike, 'transientOn', 0.05);
      const trebleSpikeRequiresTransient = fxTrebleSpike.requireTransient === true;
      const trebleRise = Math.max(0, treble - lastTrebleSignal);
      lastTrebleSignal = treble;
      if (trebleEnabled && isPlaying && treble >= trebleSpikeOn
        && (!trebleSpikeRequiresTransient || transient >= trebleSpikeTransientOn || trebleRise >= trebleSpikeTransientOn || trebleSpikeFrames > 0)) {
        trebleSpikeFrames += 1;
      } else if (treble < trebleSpikeOff) {
        if (trebleSpikeFrames > 0) lastTrebleSpikeEnd = now;
        trebleSpikeFrames = 0;
        if (now - lastTrebleSpikeEnd > fxNum(fxTrebleSpike, 'cooldownMs', 500)) trebleSpikeReady = true;
      }
      const trebleSpikeInterval = lowPerformanceMode
        ? fxNum(fxTrebleSpike, 'intervalMsLite', 240)
        : fxNum(fxTrebleSpike, 'intervalMs', 160);
      const trebleSpikeCooldown = fxNum(fxTrebleSpike, 'cooldownMs', 500);
      if (trebleEnabled && isPlaying
        && (trebleSpikeReady || (!trebleSpikeRequiresTransient && now - lastTrebleSpray > trebleSpikeCooldown))
        && trebleSpikeFrames >= fxNum(fxTrebleSpike, 'confirmFrames', 2)
        && now - lastTrebleSpray > trebleSpikeInterval) {
        lastTrebleSpray = now;
        trebleSpikeReady = false;
        const sparkColor = trebleSparkPalette[Math.floor(Math.random() * trebleSparkPalette.length)];
        const pipeRadius = Math.min(0.006,
          fxNum(fxTreble, 'radius', 0.004) + treble * fxNum(fxTreble, 'radiusScale', 0.004));
        fluid.setConfig({
          colorPalette: [sparkColor],
          brightness: 0.65,
          splatRadius: pipeRadius,
          splatForce: fxNum(fxTreble, 'force', 10) + treble * fxNum(fxTreble, 'forceScale', 18)
        });
        const topEmitters = logoEmitters(0.02);
        const bottomEmitters = logoEmitters(0.98);
        const pipeCount = Math.max(1, Math.round(fxNum(fxTreble, 'pipeCount', 12)));
        const pipeSpacing = fxNum(fxTreble, 'pipeSpacing', 0.025)
          * (topEmitters.rightX - topEmitters.leftX);
        const pipeCenter = (topEmitters.leftX + topEmitters.rightX) * 0.5;
        const sparkForce = (fxNum(fxTreble, 'force', 10)
          + treble * fxNum(fxTreble, 'forceScale', 18) + transient * 10) * 1.8;
        const direction = fxTreble.direction === 'down' ? 1 : -1;
        const sparkEmitters = direction < 0 ? topEmitters : bottomEmitters;
        const angleSpread = Math.min(Math.PI / 2, Math.max(0, fxNum(fxTreble, 'angleSpread', 0.55)));
        for (let pipeIndex = 0; pipeIndex < pipeCount; pipeIndex += 1) {
          const pipeOffset = (pipeIndex - (pipeCount - 1) * 0.5) * pipeSpacing;
          const angle = direction * (Math.PI / 2 + (Math.random() * 2 - 1) * angleSpread);
          fluid.splatAtLocation(
            pipeCenter + pipeOffset,
            sparkEmitters.y,
            Math.cos(angle) * sparkForce,
            Math.sin(angle) * sparkForce * fxNum(fxTreble, 'lift', 1)
          );
        }
      }
      if (fxMouse.enabled !== false && pointerActive && pointerX !== null && pointerY !== null) {
        if (sprayX === null || sprayY === null) {
          sprayX = pointerX;
          sprayY = pointerY;
          previousSprayX = sprayX;
          previousSprayY = sprayY;
        }

        sprayX += (pointerX - sprayX) * (lowPerformanceMode ? 0.24 : 0.34);
        sprayY += (pointerY - sprayY) * (lowPerformanceMode ? 0.24 : 0.34);

        if (now - lastPointerSpray > (lowPerformanceMode ? 90 : 60)) {
          lastPointerSpray = now;
          const movementX = pendingPointerDeltaX;
          const movementY = pendingPointerDeltaY;
          const movementDistance = Math.hypot(movementX, movementY);

          pendingPointerDeltaX = 0;
          pendingPointerDeltaY = 0;
          if (movementDistance >= 0.5) {
            fluid.setConfig({
              colorPalette: [mouseColor(now)],
              brightness: fxNum(fxMouse, 'brightness', 0.12),
              splatRadius: lowPerformanceMode
                ? fxNum(fxMouse, 'radiusLite', 0.045)
                : fxNum(fxMouse, 'radius', 0.035)
            });
            fluid.splatAtLocation(
              sprayX * (window.devicePixelRatio || 1),
              sprayY,
              movementX * fxNum(fxMouse, 'forceScale', 0.25),
              -movementY * fxNum(fxMouse, 'forceScale', 0.25)
            );
          }
        }
      }

      requestAnimationFrame(sprayAtPointer);
      /* Publish live FX state for the ?debug panel. */
      window.doomsdayFxState={
        hardBassFrames: hardBassFrames,
        hardBassTriggered: hardBassTriggered,
        trebleSpikeFrames: trebleSpikeFrames,
        trebleSpikeReady: trebleSpikeReady,
        glitchEmissionBursts: bassCoupledEnabled ? 0 : glitchEmissionBursts,
        lastAudioSprayAge: lastAudioSpray ? Math.round(now - lastAudioSpray) : null,
        lastTrebleSprayAge: lastTrebleSpray ? Math.round(now - lastTrebleSpray) : null
      };
    }

    requestAnimationFrame(sprayAtPointer);
  } catch (error) {
    window.doomsdayFluidReady = false;
    console.warn('Fluid background unavailable:', error);
    startCanvasFallback(host);
  }
}

function startCanvasFallback(container) {
  const canvas = container.querySelector('canvas') || document.createElement('canvas');
  if (!canvas.parentNode) container.appendChild(canvas);
  const context = canvas.getContext('2d');
  if (!context) return;

  let width = 0;
  let height = 0;
  let frame = 0;
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function draw(now) {
    context.clearRect(0, 0, width, height);
    const phase = now * 0.00018;
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(184,79,24,0.18)');
    gradient.addColorStop(0.48, 'rgba(217,120,36,0.08)');
    gradient.addColorStop(1, 'rgba(131,255,171,0.12)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(209,255,69,0.18)';
    context.lineWidth = 1;
    for (let index = 0; index < 5; index += 1) {
      const y = ((height / 5) * index + Math.sin(phase * 3 + index) * 34 + now * 0.012) % (height + 80) - 40;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(width * 0.28, y - 24, width * 0.72, y + 24, width, y);
      context.stroke();
    }
    frame = requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
  window.doomsdayFluidFallbackReady = true;
}

function soundWaveColor(now, bass, mid, treble, level) {
  // Sound-reactive harmonic color blending:
  // Strong bass -> warm rust / orange smoke (#b84f18, #cf6930)
  // Strong mids -> signal amber / golden dust (#d97824, #f0bd64)
  // Strong highs/transients -> phosphor lime / light ash (#d6ae86, #e0c09b)
  const basePhase = (Math.sin(now * 0.0006) + 1) * 0.5 * (ambientPalette.length - 1);
  const baseIndex = Math.floor(basePhase);
  const baseColor = mixHex(ambientPalette[baseIndex], ambientPalette[Math.min(ambientPalette.length - 1, baseIndex + 1)], basePhase - baseIndex);

  const bassWeight = bass * fxNum(fxColors, 'bassWeight', 1.5);
  const midWeight = mid * fxNum(fxColors, 'midWeight', 1.2);
  const trebleWeight = treble * fxNum(fxColors, 'trebleWeight', 0.9);
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
