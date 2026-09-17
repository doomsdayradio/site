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
      on: 0.90,
      off: 0.76,
      confirmFrames: 3,
      glitchCooldownMs: 1200,
      glitchBursts: 3,
      glitchMs: 520,
      emissionScale: 0.12
    },

    /* High overall level zone: level punch + strong emissions when the whole
     * stream is loud (independent of bass character). Never glitches the
     * logo — that is heavyBass-only. */
    highLevel: {
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
      on: 0.45,
      off: 0.32,
      transientOn: 0.25,
      confirmFrames: 2,
      intervalMs: 160,
      intervalMsLite: 240,
      cooldownMs: 500
    },

    /* Static noise overlay: opacity = treble x transient, scaled by
     * maxOpacity. Screen-blended, so it reads as signal interference. */
    noise: {
      maxOpacity: 0.16,
      boost: 1.6
    },

    /* TEST MODE: bass-coupled emissions. When enabled, the zone logic
     * (heavyBass/highLevel/softPulse) is bypassed for smoke emissions and
     * every emission parameter is interpolated directly from the smoothed
     * bass level: more bass = faster, bigger, brighter, harder.
     * enabled:      turn the test mode on/off (off = zone logic as before)
     * minBass:      below this bass level nothing emits
     * maxBass:      bass at/above this maps to full strength
     * minIntervalMs/maxIntervalMs: emission delay at full/near-zero bass
     * curve:        exponent on the activity ramp (higher = later onset,
     *               punchier top end)
     */
    bassCoupled: {
      enabled: true,
      minBass: 0.15,
      maxBass: 0.85,
      minIntervalMs: 90,
      maxIntervalMs: 460,
      curve: 1.6
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
