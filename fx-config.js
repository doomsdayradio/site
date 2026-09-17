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

  triggers: {

    /* Heavy bass zone: full logo glitch + strongest smoke emissions.
     * on:           bass level that counts as "heavy bass"
     * off:          must drop below this to re-arm (hysteresis, < on)
     * confirmFrames: consecutive frames above `on` before the glitch fires
     *               (prevents flicker on single peaks)
     * glitchCooldownMs: minimum time between logo glitches
     * glitchBursts: how many strong emissions one glitch releases
     * glitchMs:     how long a glitch burst stays active
     * emissionScale: steepness of the emission ramp above `on` (smaller = sharper)
     */
    heavyBass: {
      on: 0.88,
      off: 0.72,
      confirmFrames: 3,
      glitchCooldownMs: 1200,
      glitchBursts: 3,
      glitchMs: 520,
      emissionScale: 0.12
    },

    /* High overall level zone: logo glitch + level punch when the whole
     * stream is loud (independent of bass character). */
    highLevel: {
      on: 0.88,
      off: 0.78,
      confirmFrames: 2
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
      transientOn: 0.14,
      intervalMs: 240,
      intervalMsLite: 360,
      burstIntervalMs: 125,
      burstIntervalMsLite: 170,
      levelFloor: 0.30
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
