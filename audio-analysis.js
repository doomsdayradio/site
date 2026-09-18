/* Shared audio-analysis math. It has no DOM or playback side effects. */
(function () {
  'use strict';

  var defaults = {
    bass: {fromHz: 35, toHz: 160, levelMin: 0.18, levelMax: 0.80},
    mid: {fromHz: 160, toHz: 2200, levelMin: 0.18, levelMax: 0.80},
    treble: {fromHz: 10000, toHz: 16000, levelMin: 0.18, levelMax: 0.80},
    sub: {fromHz: 0, toHz: 120, levelMin: 0.04, levelMax: 0.45}
  };

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resolveBand(name, configured) {
    var fallback = defaults[name];
    var source = configured || {};
    var fromHz = Math.max(0, finite(source.fromHz, fallback.fromHz));
    var levelMin = finite(source.levelMin, fallback.levelMin);
    return {
      name: name,
      fromHz: fromHz,
      toHz: Math.max(fromHz, finite(source.toHz, fallback.toHz)),
      levelMin: levelMin,
      levelMax: Math.max(levelMin + 0.001, finite(source.levelMax, fallback.levelMax))
    };
  }

  function resolveBands(config) {
    var configured = (config || {}).bands || {};
    var bands = {};
    Object.keys(defaults).forEach(function (name) {
      bands[name] = resolveBand(name, configured[name]);
    });
    if (bands.sub.fromHz === bands.bass.fromHz && bands.sub.toHz === bands.bass.toHz) {
      bands.sub.levelMin = bands.bass.levelMin;
      bands.sub.levelMax = bands.bass.levelMax;
    }
    return bands;
  }

  function normalizeBandLevel(rawLevel, band) {
    return clamp((rawLevel - band.levelMin) / (band.levelMax - band.levelMin), 0, 1);
  }

  function bandRange(spectrum, band, binWidth) {
    return {
      start: Math.max(1, Math.floor(band.fromHz / binWidth)),
      end: Math.min(spectrum.length, Math.ceil(band.toHz / binWidth))
    };
  }

  function rawRms(spectrum, band, binWidth) {
    var range = bandRange(spectrum, band, binWidth);
    var energy = 0;
    var sum = 0;
    var count = 0;
    for (var index = range.start; index < range.end; index += 1) {
      var sample = Number(spectrum[index]) || 0;
      energy += sample * sample;
      sum += sample;
      count += 1;
    }
    if (band.name === 'sub') {
      var expectedBins = Math.max(1, Math.ceil((band.toHz - band.fromHz) / binWidth));
      return sum / expectedBins;
    }
    return count ? Math.sqrt(energy / count) : 0;
  }

  function db(spectrum, band, binWidth, floor) {
    var range = bandRange(spectrum, band, binWidth);
    var power = 0;
    var count = 0;
    for (var index = range.start; index < range.end; index += 1) {
      var value = Number(spectrum[index]);
      if (Number.isFinite(value)) {
        power += Math.pow(10, value / 10);
        count += 1;
      }
    }
    return count ? 10 * Math.log10(power / count) : floor;
  }

  window.doomsdayAudioAnalysis = {
    defaults: defaults,
    clamp: clamp,
    resolveBands: resolveBands,
    normalizeBandLevel: normalizeBandLevel,
    rawRms: rawRms,
    db: db
  };
}());