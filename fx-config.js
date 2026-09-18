/* Doomsday Radio – audio-reactive FX tuning.
 *
 * Central config for when the heavy-bass effects fire and when the softer
 * effects take over. All signal values are normalized 0..1.
 *
 * Zones (highest wins): if heavyBass is active you get the glitch bursts and
 * strong emissions; below that, highLevel gives level-driven punches; below
 * that, softPulse produces gentle transient puffs. Bass shaping constants
 * control how the punch strength ramps between those zones.
 *
 * Reload the page after editing. Use ?bass-debug for a live bass readout.
 */
window.doomsdayFxConfig = {
  version: 1,

  /* Frequency windows and display zoom for the live spectrum meters. The
   * level range is the normalized analyser peak mapped to 0..100%. */
  audioAnalysis: {
    bands: {
      sub: {fromHz: 0, toHz: 120, levelMin: 0.04, levelMax: 0.45},
      bass: {fromHz: 35, toHz: 160, levelMin: 0.18, levelMax: 0.80},
      mid: {fromHz: 160, toHz: 2200, levelMin: 0.18, levelMax: 0.80},
      treble: {fromHz: 10000, toHz: 16000, levelMin: 0.18, levelMax: 0.80}
    }
  },

  triggers: {

    /* Heavy bass zone: full logo glitch + strongest smoke emissions.
     * In the server-spectrum tier hardBass is measured RELATIVE to a slow
     * bass baseline (spike ratio of the song), because RMS band values top
     * out around 60%: `on` refers to that normalized spike value, not to the
     * displayed bass percentage. In the local analyser tiers it is absolute.
     * on:           trigger level (default: bass spike ~1.9x baseline)
     * off:          must drop below this to re-arm (hysteresis, < on)
     * confirmFrames: consecutive frames above `on` before the glitch fires
     *               (prevents flicker on single peaks)
     * glitchCooldownMs: minimum time between logo glitches
     * glitchBursts: how many strong emissions one glitch releases
     * glitchMs:     how long a glitch burst stays active
     * emissionScale: steepness of the emission ramp above `on` (smaller = sharper)
     */
    heavyBass: {
      enabled: true,
      on: 0.85,
      off: 0.76,
      confirmFrames: 3,
      glitchCooldownMs: 1200,
      glitchBursts: 6,
      glitchMs: 760,
      emissionScale: 0.12
    },

    /* High overall level zone: level punch + strong emissions when the whole
     * stream is loud (independent of bass character). Never glitches the
     * logo — that is heavyBass-only. */
    highLevel: {
      enabled: true,
      on: 0.88
    },

    /* Soft zone: gentle puffs on transients and volume, active whenever none
     * of the hard zones fire.
     * transientOn:  minimum transient strength that produces a puff
     * intervalMs:   base delay between puffs (full fx)
     * intervalMsLite: base delay in fx-lite / low-performance mode
     * burstIntervalMs: puff delay during a heavy-bass glitch burst
     * burstIntervalMsLite: burst delay in fx-lite mode
     * levelFloor:   level below which volume pulses fade out
     */
    softPulse: {
      enabled: true,
      transientOn: 0.14,
      intervalMs: 240,
      intervalMsLite: 360,
      burstIntervalMs: 125,
      burstIntervalMsLite: 170,
      levelFloor: 0.30
    },

    /* Treble spike zone: sharp sparks at the top of the logo plus static
     * noise. Requires both a high treble value AND a transient (a hat/crash
     * attack), so sustained bright pads do not fire it.
     * on/off:       treble enter/re-arm levels (hysteresis, off < on)
     * transientOn:  minimum transient strength that counts as an attack
     * confirmFrames: consecutive frames before the spike is accepted
     * intervalMs:   delay between spark splashes while the spike is active
     * intervalMsLite: interval in fx-lite mode
     * cooldownMs:   minimum time between spike phases
     */
    trebleSpike: {
      enabled: true,
      on: 0.45,
      off: 0.32,
      transientOn: 0.15,
      confirmFrames: 2,
      intervalMs: 110,
      intervalMsLite: 170,
      cooldownMs: 500
    },

    /* Static noise overlay: opacity = treble x transient, scaled by
     * maxOpacity. Screen-blended, so it reads as signal interference. */
    noise: {
      enabled: true,
      maxOpacity: 0.16,
      boost: 1.6
    },

    /* Stream sync: the browser hears the stream delayed by its audio buffer
     * (a few seconds), while levels arrive live. The client queues payloads
     * and replays them delayMs later so visuals sit on the audible music.
     * delayMs: total latency to compensate (tune via ?debug until hits land
     * on the beat). 0 disables buffering (live visuals, ahead of audio). */
    sync: {
      delayMs: 5500
    },

    /* TEST MODE: bass-coupled emissions. When enabled, the zone logic
     * (heavyBass/highLevel/softPulse) is bypassed for smoke emissions.
    * Ordinary emissions follow sub intensity. A qualifying kick starts the
    * short full-strength glitch burst above that base response.
     * enabled:      turn the test mode on/off (off = zone logic as before)
     * subFloor/subCeil: raw sub (0-120 Hz) range mapped to 0..100% strength
     * subGateOn/subGateScale: absolute sub gate — below subGateOn
     *               nothing fires, full gate at subGateOn+subGateScale
     * glitchOn:     kick value that triggers the logo glitch in this mode
     * minIntervalMs/maxIntervalMs: emission delay at full/near-zero activity
    * intensityExponent: steepness of the sub-intensity curve
     *               (higher = quieter mid-range, more explosive top end)
     */
    bassCoupled: {
      enabled: true,
      subFloor: 0.04,
      subCeil: 0.45,
      subGateOn: 0.08,
      subGateScale: 0.10,
      kickSubMin: 0.28,
      kickRiseFloor: 0.01,
      kickRiseRange: 0.05,
      kickRiseOn: 0.18,
      kickRearm: 0.25,
      kickCooldownMs: 140,
      glitchOn: 0.85,
      minIntervalMs: 35,
      maxIntervalMs: 180,
      intensityExponent: 1.8
    },

    /* Logo glow and bass glitch presentation. */
    glow: {
      enabled: true,
      midWeight: 0.6,
      trebleWeight: 0.8,
      floor: 0.10,
      range: 0.70,
      innerAlpha: 0.50,
      outerAlpha: 0.22,
      innerRadius: 15,
      outerRadius: 36
    },
    glitch: {
      enabled: true,
      durationMs: 240,
      topOpacity: 0.78,
      bottomOpacity: 0.70,
      fragmentDurationMs: 260
    },
    emission: {
      enabled: true,
      normalRadius: 0.13,
      normalRadiusScale: 0.30,
      normalForce: 1100,
      glitchRadius: 0.30,
      glitchForce: 820
    },
    treble: {
      enabled: true,
      pipeCount: 12,
      pipeSpacing: 0.025,
      radius: 0.003,
      radiusScale: 0.003,
      force: 10,
      forceScale: 18,
      lift: 1,
      angleSpread: 0.55
    },

    /* Bass shaping: ramps that translate the raw bass value into punch.
     * softFloor: bass below this contributes nothing to the soft punch
     * hardFloor: bass above this starts feeding the hard punch ramp
     * punchWeight: quadratic falloff of the soft punch curve
     */
    bass: {
      softFloor: 0.25,
      hardFloor: 0.38
    },

    /* Smoke color mixing weights (relative influence of each band on the
     * burst color; higher = more dominant). */
    colors: {
      bassWeight: 1.5,
      midWeight: 1.2,
      trebleWeight: 0.9
    }
  }
};
