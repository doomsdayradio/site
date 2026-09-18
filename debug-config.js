(function () {
  'use strict';

  var storageKey = 'ddDebugFxConfig';
  var base = window.doomsdayFxConfig || { version: 1, triggers: {} };
  var trigger = base.triggers || (base.triggers = {});
  var analysis = base.audioAnalysis || (base.audioAnalysis = {});
  var analysisBands = analysis.bands || (analysis.bands = {});
  var defaults = {
    heavyBass: { enabled: true, on: 0.85, off: 0.76, glitchCooldownMs: 1200, glitchBursts: 3, glitchMs: 520, emissionScale: 0.12 },
    bassCoupled: { enabled: true, subFloor: 0.04, subCeil: 0.45, subGateOn: 0.08, subGateScale: 0.10, glitchOn: 0.85, minIntervalMs: 90, maxIntervalMs: 460, intensityExponent: 1.8 },
    sync: { delayMs: 5500 },
    glow: { enabled: true, midWeight: 0.6, trebleWeight: 0.8, floor: 0.10, range: 0.70, innerAlpha: 0.50, outerAlpha: 0.22, innerRadius: 15, outerRadius: 36 },
    glitch: { enabled: true, durationMs: 240, topOpacity: 0.78, bottomOpacity: 0.70, fragmentDurationMs: 260 },
    emission: { enabled: true, normalRadius: 0.06, normalRadiusScale: 0.16, normalForce: 520, glitchRadius: 0.22, glitchForce: 520 },
    treble: { enabled: true, pipeCount: 12, pipeSpacing: 0.025, radius: 0.003, radiusScale: 0.003, force: 10, forceScale: 18, lift: 1, angleSpread: 0.55 }
  };
  var analysisDefaults = {
    sub: { fromHz: 0, toHz: 120, levelMin: 0.04, levelMax: 0.45 },
    bass: { fromHz: 35, toHz: 160, levelMin: 0.18, levelMax: 0.80 },
    mid: { fromHz: 160, toHz: 2200, levelMin: 0.18, levelMax: 0.80 },
    treble: { fromHz: 10000, toHz: 16000, levelMin: 0.18, levelMax: 0.80 }
  };
  var fields = [
    ['heavyBass', 'enabled', 'Hardbass aktiv', false],
    ['highLevel', 'enabled', 'Lautstärke-Effekt aktiv', true],
    ['softPulse', 'enabled', 'Soft-Pulse aktiv', true],
    ['trebleSpike', 'enabled', 'Höhen-Pipes aktiv', true],
    ['noise', 'enabled', 'Noise aktiv', true],
    ['bassCoupled', 'enabled', 'Sub-Emission aktiv', true],
    ['glow', 'enabled', 'Glow aktiv', true],
    ['glitch', 'enabled', 'Glitch aktiv', true],
    ['emission', 'enabled', 'Fluid-Emission aktiv', true],
    ['treble', 'enabled', 'Höhen-Pipes aktiv', true],
    ['heavyBass', 'on', 'Hardbass an', 0, 1, 0.01],
    ['heavyBass', 'off', 'Hardbass aus', 0, 1, 0.01],
    ['bassCoupled', 'subFloor', 'Sub floor', 0, 1, 0.01],
    ['bassCoupled', 'subCeil', 'Sub ceiling', 0, 1, 0.01],
    ['bassCoupled', 'subGateOn', 'Gate an', 0, 1, 0.01],
    ['bassCoupled', 'subGateScale', 'Gate range', 0.01, 1, 0.01],
    ['bassCoupled', 'glitchOn', 'Kick glitch an', 0, 1, 0.01],
    ['bassCoupled', 'intensityExponent', 'Sub exponent', 0.1, 5, 0.1],
    ['bassCoupled', 'minIntervalMs', 'Min. emission ms', 20, 1000, 10],
    ['bassCoupled', 'maxIntervalMs', 'Max. emission ms', 50, 2000, 10],
    ['sync', 'delayMs', 'Sync delay ms', 0, 12000, 50],
    ['glow', 'midWeight', 'Glow mid weight', 0, 2, 0.05],
    ['glow', 'trebleWeight', 'Glow treble weight', 0, 2, 0.05],
    ['glow', 'floor', 'Glow floor', 0, 1, 0.01],
    ['glow', 'range', 'Glow range', 0.05, 1, 0.01],
    ['glow', 'innerAlpha', 'Glow inner strength', 0, 1, 0.01],
    ['glow', 'outerAlpha', 'Glow outer strength', 0, 1, 0.01],
    ['glow', 'innerRadius', 'Glow inner size', 0, 80, 1],
    ['glow', 'outerRadius', 'Glow outer size', 0, 160, 1],
    ['glitch', 'durationMs', 'Glitch duration ms', 20, 1000, 10],
    ['glitch', 'topOpacity', 'Glitch top strength', 0, 1, 0.01],
    ['glitch', 'bottomOpacity', 'Glitch bottom strength', 0, 1, 0.01],
    ['glitch', 'fragmentDurationMs', 'Fragment duration ms', 20, 1000, 10],
    ['emission', 'normalRadius', 'Emission size', 0, 0.4, 0.01],
    ['emission', 'normalRadiusScale', 'Emission size scale', 0, 0.4, 0.01],
    ['emission', 'normalForce', 'Emission force', 0, 1000, 10],
    ['emission', 'glitchRadius', 'Kick size', 0, 0.5, 0.01],
    ['emission', 'glitchForce', 'Kick force', 0, 1200, 10],
    ['treble', 'pipeCount', 'Hoehen pipe count', 1, 8, 1],
    ['treble', 'pipeSpacing', 'Hoehen pipe spacing', 0, 0.2, 0.01],
    ['treble', 'radius', 'Hoehen pipe size', 0, 0.2, 0.005],
    ['treble', 'radiusScale', 'Hoehen size scale', 0, 0.2, 0.005],
    ['treble', 'force', 'Hoehen force', 0, 200, 1],
    ['treble', 'forceScale', 'Hoehen force scale', 0, 200, 1],
    ['treble', 'lift', 'Hoehen lift', 0, 2, 0.05],
    ['treble', 'angleSpread', 'Hoehen Winkelstreuung', 0, 1.2, 0.05]
  ];
  Object.keys(analysisDefaults).forEach(function (bandName) {
    ['fromHz', 'toHz', 'levelMin', 'levelMax'].forEach(function (key) {
      var isLevel = key.indexOf('level') === 0;
      fields.push(['audioAnalysis.bands.' + bandName, key, bandName.toUpperCase() + ' ' + key, 0, isLevel ? 1 : 24000, isLevel ? 0.01 : 10]);
    });
  });
  var descriptions = {
    'heavyBass.on': 'Ab diesem Hardbass-Wert startet ein Kick-Glitch.',
    'heavyBass.off': 'Unter diesem Wert wird der nächste Hardbass-Glitch wieder freigegeben.',
    'bassCoupled.subFloor': 'Sub-Pegel ohne Emission.',
    'bassCoupled.subCeil': 'Sub-Pegel, bei dem die normale Emission maximal wird.',
    'bassCoupled.subGateOn': 'Absolute Sub-Schwelle, ab der Emissionen einsetzen.',
    'bassCoupled.subGateScale': 'Breite des weichen Übergangs vom Gate zur vollen Sub-Wirkung.',
    'bassCoupled.glitchOn': 'Kick-Stärke, die den maximalen Glitch-Burst auslöst.',
    'bassCoupled.intensityExponent': 'Kurvenhärte: höher bedeutet ruhiger unten und explosiver oben.',
    'bassCoupled.minIntervalMs': 'Kleinster Abstand zwischen normalen Sub-Splats.',
    'bassCoupled.maxIntervalMs': 'Größter Abstand bei leiser Sub-Aktivität.',
    'sync.delayMs': 'Verzögerung des Live-Level-Feeds zum Ausgleich des Audio-Puffers.',
    'glow.midWeight': 'Gewichtung der Mitten für den Logo-Glow.',
    'glow.trebleWeight': 'Gewichtung der Höhen für den Logo-Glow.',
    'glow.floor': 'Signalboden: darunter bleibt der Glow aus.',
    'glow.range': 'Signalbereich, über den der Glow von 0 auf 100 % wächst.',
    'glow.innerAlpha': 'Maximale Deckkraft des engen inneren Glows.',
    'glow.outerAlpha': 'Maximale Deckkraft des weichen äußeren Glows.',
    'glow.innerRadius': 'Maximaler Radius des inneren Glows in Pixeln.',
    'glow.outerRadius': 'Maximaler Radius des äußeren Glows in Pixeln.',
    'glitch.durationMs': 'Dauer des Logo-Wackelns beim Kick.',
    'glitch.topOpacity': 'Stärke des oberen farbigen Glitch-Fragments.',
    'glitch.bottomOpacity': 'Stärke des unteren farbigen Glitch-Fragments.',
    'glitch.fragmentDurationMs': 'Dauer der verschobenen Logo-Fragmente.',
    'emission.normalRadius': 'Grundgröße normaler Fluid-Splats.',
    'emission.normalRadiusScale': 'Zusätzliche Größe normaler Splats bei stärkerem Sub.',
    'emission.normalForce': 'Grundkraft normaler Fluid-Splats.',
    'emission.glitchRadius': 'Größe der maximalen Kick-Glitch-Splats.',
    'emission.glitchForce': 'Kraft der maximalen Kick-Glitch-Splats.',
    'treble.pipeCount': 'Anzahl der kleinen Höhen-Splats pro Höhen-Attacke.',
    'treble.pipeSpacing': 'Abstand der Orgelpfeifen relativ zur Logo-Breite.',
    'treble.radius': 'Grundgröße der Höhen-Splats.',
    'treble.radiusScale': 'Zusätzliche Größe bei stärkerem Höhen-Signal.',
    'treble.force': 'Grundkraft der Höhen-Splats.',
    'treble.forceScale': 'Zusätzliche Kraft bei stärkerem Höhen-Signal.',
    'treble.lift': 'Vertikaler Impuls nach oben.'
  };

  function copyDefaults() {
    Object.keys(defaults).forEach(function (groupName) {
      var group = trigger[groupName] || (trigger[groupName] = {});
      Object.keys(defaults[groupName]).forEach(function (key) {
        if (group[key] === undefined) group[key] = defaults[groupName][key];
      });
    });
    Object.keys(analysisDefaults).forEach(function (bandName) {
      var band = analysisBands[bandName] || (analysisBands[bandName] = {});
      Object.keys(analysisDefaults[bandName]).forEach(function (key) {
        if (band[key] === undefined) band[key] = analysisDefaults[bandName][key];
      });
    });
  }

  function applyStored() {
    copyDefaults();
    try {
      var stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!stored || !stored.triggers) return;
      Object.keys(stored.triggers).forEach(function (groupName) {
        var group = stored.triggers[groupName];
        if (!group || typeof group !== 'object') return;
        var target = trigger[groupName] || (trigger[groupName] = {});
        Object.keys(group).forEach(function (key) {
          if (typeof group[key] === 'number' || typeof group[key] === 'boolean') target[key] = group[key];
        });
      });
      Object.keys(stored.audioAnalysis && stored.audioAnalysis.bands || {}).forEach(function (bandName) {
        var storedBand = stored.audioAnalysis.bands[bandName];
        if (!storedBand || typeof storedBand !== 'object') return;
        var targetBand = analysisBands[bandName] || (analysisBands[bandName] = {});
        Object.keys(storedBand).forEach(function (key) {
          if (typeof storedBand[key] === 'number') targetBand[key] = storedBand[key];
        });
      });
    } catch (error) {
      console.warn('[debug-config] stored config ignored', error);
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: base.version || 1, triggers: trigger, audioAnalysis: { bands: analysisBands } }));
    } catch (error) {
      console.warn('[debug-config] could not save config', error);
    }
  }

  function fireChange() {
    window.dispatchEvent(new CustomEvent('doomsday:debug-config-change', { detail: base }));
  }

  function makePanel() {
    var panel = document.createElement('aside');
    panel.className = 'debug-config-panel';
    panel.innerHTML = '<div class="debug-config-head"><strong>FX CONFIG</strong><button type="button" data-action="reset">RESET</button></div><div class="debug-config-grid"></div><div class="debug-config-actions"><button type="button" data-action="copy">JSON KOPIEREN</button><button type="button" data-action="import">JSON IMPORTIEREN</button></div><textarea aria-label="FX-Konfiguration JSON" placeholder="Konfigurations-JSON hier einfügen"></textarea><small>Werte werden lokal im Browser gespeichert.</small>';
    document.body.appendChild(panel);
    var grid = panel.querySelector('.debug-config-grid');
    fields.forEach(function (field) {
      var groupName = field[0], key = field[1];
      var isAnalysisField = groupName.indexOf('audioAnalysis.bands.') === 0;
      var targetGroup = isAnalysisField
        ? analysisBands[groupName.split('.').pop()]
        : (trigger[groupName] || (trigger[groupName] = {}));
      var row = document.createElement('label');
      row.className = 'debug-config-row' + (isAnalysisField ? ' debug-config-analysis-row' : '');
      var description = descriptions[groupName + '.' + key] || 'Parameter des Effekts.';
      var isBoolean = typeof targetGroup[key] === 'boolean';
      var inputType = isBoolean ? 'checkbox' : (isAnalysisField ? 'number' : 'range');
      row.innerHTML = '<span class="debug-config-label">' + field[2] + '<i class="debug-config-help" tabindex="0" data-tooltip="' + description + '" aria-label="' + description + '">?</i></span><input type="' + inputType + '"><output></output>';
      var input = row.querySelector('input');
      var output = row.querySelector('output');
      if (!isBoolean) {
        input.min = field[3]; input.max = field[4]; input.step = field[5];
        input.value = targetGroup[key];
      } else {
        input.checked = targetGroup[key];
      }
      function update() {
        var value = isBoolean ? input.checked : Number(input.value);
        targetGroup[key] = value;
        output.value = isBoolean ? (value ? 'AN' : 'AUS') : (isAnalysisField
          ? (key.indexOf('Hz') >= 0 ? Math.round(value) + ' Hz' : Math.round(value * 100) + '%')
          : (key.indexOf('Ms') >= 0 ? Math.round(value) + ' ms' : value.toFixed(2)));
        save();
        fireChange();
      }
      input.addEventListener('input', update);
      update();
      grid.appendChild(row);
    });
    panel.querySelector('[data-action="reset"]').addEventListener('click', function () {
      try { localStorage.removeItem(storageKey); } catch (error) {}
      location.reload();
    });
    panel.querySelector('[data-action="copy"]').addEventListener('click', function () {
      var text = JSON.stringify({ version: base.version || 1, triggers: trigger, audioAnalysis: { bands: analysisBands } }, null, 2);
      var area = panel.querySelector('textarea');
      area.value = text;
      area.select();
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
    });
    panel.querySelector('[data-action="import"]').addEventListener('click', function () {
      try {
        var imported = JSON.parse(panel.querySelector('textarea').value);
        if (!imported || !imported.triggers) throw new Error('missing triggers');
        Object.keys(imported.triggers).forEach(function (groupName) {
          var group = imported.triggers[groupName];
          if (!group || typeof group !== 'object') return;
          var target = trigger[groupName] || (trigger[groupName] = {});
          Object.keys(group).forEach(function (key) {
            if (typeof group[key] === 'number' || typeof group[key] === 'boolean') target[key] = group[key];
          });
        });
        Object.keys(imported.audioAnalysis && imported.audioAnalysis.bands || {}).forEach(function (bandName) {
          var importedBand = imported.audioAnalysis.bands[bandName];
          if (!importedBand || typeof importedBand !== 'object') return;
          var targetBand = analysisBands[bandName] || (analysisBands[bandName] = {});
          Object.keys(importedBand).forEach(function (key) {
            if (typeof importedBand[key] === 'number') targetBand[key] = importedBand[key];
          });
        });
        save();
        fireChange();
        location.reload();
      } catch (error) {
        panel.querySelector('textarea').setCustomValidity('Ungueltiges Konfigurations-JSON');
        panel.querySelector('textarea').reportValidity();
      }
    });
  }

  applyStored();
  window.addEventListener('DOMContentLoaded', makePanel, { once: true });
  window.doomsdayDebugConfig = { save: save, reset: function () { localStorage.removeItem(storageKey); } };
}());
