/* Derives visual activity from the shared audio snapshot. */
(function () {
  'use strict';

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  function number(group, key, fallback) {
    var value = group && Number(group[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function derive(signal, triggers, flags) {
    var source = signal || {};
    var heavyBass = triggers.heavyBass || {};
    var highLevel = triggers.highLevel || {};
    var softPulse = triggers.softPulse || {};
    var bass = triggers.bass || {};
    var bassCoupled = triggers.bassCoupled || {};
    var level = clamp(Number(source.level) || 0);
    var transient = clamp(Number(source.transient) || 0);
    var bassValue = clamp(Number.isFinite(Number(source.bass)) ? Number(source.bass) : level);
    var hardBass = clamp(Number(source.hardBass) || 0);
    var kickSequence = Number.isFinite(Number(source.kickSequence)) ? Number(source.kickSequence) : 0;
    var mid = clamp(Number.isFinite(Number(source.mid)) ? Number(source.mid) : level);
    var treble = clamp(Number.isFinite(Number(source.treble)) ? Number(source.treble) : level);
    var softFloor = number(bass, 'softFloor', 0.25);
    var hardFloor = number(bass, 'hardFloor', 0.38);
    var bassActivity = clamp((bassValue - softFloor) / (1 - softFloor));
    var bassHardActivity = clamp((bassValue - hardFloor) / (1 - hardFloor));
    var hardBassActivity = flags.heavyBass && flags.bassCoupled
      ? (flags.hasLocalKick ? 1 : (Number(source.bassOnset) >= number(bassCoupled, 'glitchOn', 0.85) ? Number(source.bassOnset) : 0))
      : (source.hardBassConfirmed ? hardBass : 0);
    var hardBassEmission = clamp((hardBassActivity - number(heavyBass, 'on', 0.80)) / number(heavyBass, 'emissionScale', 0.24));
    var bassPunch = Math.max(
      bassActivity * bassActivity,
      bassHardActivity * bassHardActivity,
      hardBassActivity * hardBassActivity
    );
    var levelFloor = number(softPulse, 'levelFloor', 0.30);
    var volumeActivity = clamp((level - levelFloor) / (1 - levelFloor));
    var volumePulse = flags.softPulse ? transient * (0.08 + volumeActivity * 0.34) : 0;
    var levelOn = number(highLevel, 'on', 0.83);
    var levelPunch = flags.highLevel ? clamp((level - levelOn) / (1 - levelOn)) : 0;

    return {
      isPlaying: Boolean(source.playing && (level >= 0.02 || (Number(source.sub) || 0) >= 0.12 || bassValue >= 0.12)),
      level: level,
      transient: transient,
      bass: bassValue,
      mid: mid,
      treble: treble,
      hardBass: hardBass,
      kickSequence: kickSequence,
      bassActivity: bassActivity,
      bassHardActivity: bassHardActivity,
      hardBassActivity: hardBassActivity,
      hardBassEmission: hardBassEmission,
      bassPunch: bassPunch,
      volumeActivity: volumeActivity,
      volumePulse: volumePulse,
      levelPunch: levelPunch,
      visualPunch: Math.min(1, Math.max(bassPunch, volumePulse, levelPunch * 0.82))
    };
  }

  window.doomsdayAudioSignalMath = {derive: derive};
}());