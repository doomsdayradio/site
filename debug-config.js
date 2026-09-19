(function () {
  'use strict';

  var storageKey = 'ddDebugFxConfigV9';
  var base = window.doomsdayFxConfig || { version: 1, triggers: {} };
  var trigger = base.triggers || (base.triggers = {});
  var analysis = base.audioAnalysis || (base.audioAnalysis = {});
  var analysisBands = analysis.bands || (analysis.bands = {});
  var defaults = {
    heavyBass: { enabled: true, on: 0.8, off: 0.43, confirmFrames: 3, glitchCooldownMs: 1200, glitchBursts: 6, glitchMs: 760, emissionScale: 0.24 },
    highLevel: { enabled: true, on: 0.83 },
    softPulse: { enabled: true, transientOn: 0.41, intervalMs: 240, intervalMsLite: 360, burstIntervalMs: 130, burstIntervalMsLite: 170, levelFloor: 0.3 },
    noise: { enabled: true },
    trebleSpike: { enabled: true, on: 0.47, off: 0.02, transientOn: 0.14, requireTransient: false, confirmFrames: 2, intervalMs: 20, intervalMsLite: 20, cooldownMs: 150 },
    bassCoupled: { enabled: true, subFloor: 0.48, subCeil: 0.79, subGateOn: 0.43, subGateScale: 0.93, kickSubMin: 0.75, kickRiseFloor: 0.01, kickRiseRange: 0.241, kickRiseOn: 0.35, kickRearm: 0, kickCooldownMs: 500, glitchOn: 0.85, minIntervalMs: 80, maxIntervalMs: 2000, intensityExponent: 3.3, subRadiusScale: 0.5 },
    sync: { delayMs: 5500 },
    glow: { enabled: true, midWeight: 1.85, trebleWeight: 0.2, floor: 0.49, range: 1, innerAlpha: 1, outerAlpha: 0.37, innerRadius: 32, outerRadius: 85 },
    glitch: { enabled: true, durationMs: 170, topOpacity: 0.78, bottomOpacity: 0.7, fragmentDurationMs: 260 },
    emission: { enabled: true, normalRadius: 0.08, normalRadiusScale: 0.65, normalForce: 620, glitchRadius: 0.28, glitchForce: 1050 },
    mouse: { enabled: true, brightness: 0.11, radius: 0.1, radiusLite: 0.06, forceScale: 0.42, tapBrightness: 0.69, tapRadius: 0.16, tapRadiusLite: 0.06, tapForceMin: 26, tapForceRange: 85 },
    treble: { enabled: true, pipeCount: 1, pipeSpacing: 0, radius: 0.0018, radiusScale: 0.001, force: 9, forceScale: 105, lift: 1, direction: 'down', angleSpread: 1.2 },
    bass: { softFloor: 0.25, hardFloor: 0.38 },
    colors: { bassWeight: 1.5, midWeight: 1.2, trebleWeight: 0.9 }
  };
  var analysisDefaults = {};
  Object.keys(analysisBands).forEach(function (bandName) {
    analysisDefaults[bandName] = Object.assign({}, analysisBands[bandName]);
  });
  var fields = [
    ['section', 'Zonen & Trigger'],
    ['heavyBass', 'enabled', 'Hardbass aktiv', false],
    ['highLevel', 'enabled', 'Lautstärke-Effekt aktiv', true],
    ['softPulse', 'enabled', 'Soft-Pulse aktiv', true],
    ['trebleSpike', 'enabled', 'Höhen-Pipes aktiv', true],
    ['noise', 'enabled', 'Noise aktiv', true],
    ['bassCoupled', 'enabled', 'Sub-Emission aktiv', true],
      ['glow', 'enabled', 'Glow aktiv', true],
    ['glitch', 'enabled', 'Glitch aktiv', true],
    ['emission', 'enabled', 'Fluid-Emission aktiv', true],
    ['mouse', 'enabled', 'Maus-Emission aktiv', true],
    ['treble', 'enabled', 'Höhen-Pipes aktiv', true],
    ['heavyBass', 'on', 'Hardbass an', 0, 1, 0.01],
    ['heavyBass', 'off', 'Hardbass aus', 0, 1, 0.01],
    ['heavyBass', 'confirmFrames', 'Hardbass confirm frames', 1, 12, 1],
    ['heavyBass', 'emissionScale', 'Hardbass emission scale', 0.01, 1, 0.01],
    ['highLevel', 'on', 'Lautstärke an', 0, 1, 0.01],
    ['softPulse', 'transientOn', 'Attack an', 0, 1, 0.01],
    ['softPulse', 'levelFloor', 'Attack level floor', 0, 1, 0.01],
    ['softPulse', 'intervalMs', 'Attack interval ms', 20, 2000, 10],
    ['softPulse', 'intervalMsLite', 'Attack interval lite ms', 20, 2000, 10],
    ['softPulse', 'burstIntervalMs', 'Kick-Burst Abstand ms', 20, 2000, 10],
    ['softPulse', 'burstIntervalMsLite', 'Kick-Burst Abstand lite ms', 20, 2000, 10],
    ['section', 'Höhen-Splats'],
    ['trebleSpike', 'on', 'Höhen an', 0, 1, 0.01],
    ['trebleSpike', 'off', 'Höhen aus', 0, 1, 0.01],
    ['trebleSpike', 'transientOn', 'Höhen-Attack an', 0, 1, 0.01],
    ['trebleSpike', 'requireTransient', 'Höhen-Attack erforderlich', false],
    ['trebleSpike', 'confirmFrames', 'Höhen confirm frames', 1, 12, 1],
    ['trebleSpike', 'intervalMs', 'Höhen interval ms', 20, 2000, 10],
    ['trebleSpike', 'intervalMsLite', 'Höhen interval lite ms', 20, 2000, 10],
    ['trebleSpike', 'cooldownMs', 'Höhen cooldown ms', 0, 5000, 50],
    ['section', 'Sub & Kick'],
    ['bassCoupled', 'subFloor', 'Sub-Aktivität ab', 0, 1, 0.01],
    ['bassCoupled', 'subCeil', 'Sub ceiling', 0, 1, 0.01],
    ['bassCoupled', 'subGateOn', 'Sub-Gate Start', 0, 1, 0.01],
    ['bassCoupled', 'subGateScale', 'Sub-Gate Übergang', 0.01, 1, 0.01],
    ['bassCoupled', 'kickSubMin', 'Kick Sub minimum', 0, 1, 0.01],
    ['bassCoupled', 'kickRiseFloor', 'Kick rise floor', 0, 1, 0.01],
    ['bassCoupled', 'kickRiseRange', 'Kick rise range', 0.001, 1, 0.01],
    ['bassCoupled', 'kickRiseOn', 'Kick rise an', 0, 1, 0.01],
    ['bassCoupled', 'kickRearm', 'Kick re-arm', 0, 1, 0.01],
    ['bassCoupled', 'kickCooldownMs', 'Kick cooldown ms', 0, 2000, 10],
    ['bassCoupled', 'glitchOn', 'Kick glitch an', 0, 1, 0.01],
    ['bassCoupled', 'intensityExponent', 'Sub exponent', 0.1, 5, 0.1],
    ['bassCoupled', 'subRadiusScale', 'Normale Sub-Größenskalierung', 0, 0.5, 0.01],
    ['bassCoupled', 'minIntervalMs', 'Min. emission ms', 20, 1000, 10],
    ['bassCoupled', 'maxIntervalMs', 'Max. emission ms', 50, 2000, 10],
    ['section', 'Glow & Logo-Glitch'],
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
    ['section', 'Fluid & Maus'],
    ['emission', 'normalRadius', 'Emission size', 0, 0.4, 0.01],
    ['emission', 'normalRadiusScale', 'Emission size scale', 0, 0.4, 0.01],
    ['emission', 'normalForce', 'Emission force', 0, 1000, 10],
    ['emission', 'glitchRadius', 'Kick size', 0, 0.5, 0.01],
    ['emission', 'glitchForce', 'Kick force', 0, 1200, 10],
    ['mouse', 'brightness', 'Mouse brightness', 0, 1, 0.01],
    ['mouse', 'radius', 'Mouse size', 0, 0.4, 0.01],
    ['mouse', 'radiusLite', 'Mouse size lite', 0, 0.4, 0.01],
    ['mouse', 'forceScale', 'Mouse force', 0, 2, 0.01],
    ['mouse', 'tapBrightness', 'Mouse click brightness', 0, 1, 0.01],
    ['mouse', 'tapRadius', 'Mouse click size', 0, 0.4, 0.01],
    ['mouse', 'tapRadiusLite', 'Mouse click size lite', 0, 0.4, 0.01],
    ['mouse', 'tapForceMin', 'Mouse click force min', 0, 100, 1],
    ['mouse', 'tapForceRange', 'Mouse click force range', 0, 100, 1],
    ['section', 'Höhen-Geometrie'],
    ['treble', 'pipeCount', 'Hoehen pipe count', 1, 8, 1],
    ['treble', 'pipeSpacing', 'Hoehen pipe spacing', 0, 0.2, 0.01],
    ['treble', 'radius', 'Hoehen pipe size', 0.0001, 0.02, 0.0002],
    ['treble', 'radiusScale', 'Hoehen size scale', 0.0001, 0.02, 0.0002],
    ['treble', 'force', 'Hoehen force', 0, 200, 1],
    ['treble', 'forceScale', 'Hoehen force scale', 0, 200, 1],
    ['treble', 'direction', 'Hoehen Richtung', 'up', 'down'],
    ['treble', 'lift', 'Hoehen lift', 0, 2, 0.05],
    ['treble', 'angleSpread', 'Hoehen Winkelstreuung', 0, 1.2, 0.05],
    ['section', 'Audio-Analyse']
  ];
  Object.keys(analysisDefaults).forEach(function (bandName) {
    ['fromHz', 'toHz', 'levelMin', 'levelMax'].forEach(function (key) {
      var isLevel = key.indexOf('level') === 0;
      var isFrom = key === 'fromHz';
      fields.push(['audioAnalysis.bands.' + bandName, key, bandName.toUpperCase() + ' ' + key, 0, isLevel ? 1 : 24000, isLevel ? 0.01 : (isFrom ? 1 : 1)]);
    });
  });
  var descriptions = {
    'heavyBass.on': 'Ab diesem Hardbass-Wert startet ein Kick-Glitch.',
    'heavyBass.off': 'Unter diesem Wert wird der nächste Hardbass-Glitch wieder freigegeben.',
    'softPulse.transientOn': 'Mindeststärke eines kurzen Signals für einen normalen Attack-Splat.',
    'softPulse.levelFloor': 'Unter diesem Gesamtpegel werden normale Attack-Splats abgeschwächt.',
    'softPulse.burstIntervalMs': 'Abstand zwischen starken Fluid-Splats während eines Kick-Bursts.',
    'softPulse.burstIntervalMsLite': 'Wie oben, wenn der reduzierte Fluid-Modus aktiv ist.',
    'noise.enabled': 'Schaltet das statische Vollflächen-Störsignal im Hintergrund ein oder aus.',
    'trebleSpike.on': 'Mindeststärke der Höhen, damit eine Höhenphase aktiv wird.',
    'trebleSpike.off': 'Unter diesem Höhenwert wird die nächste Höhenphase wieder freigegeben.',
    'trebleSpike.transientOn': 'Mindeststärke des Attack-Signals für Höhen-Pipes.',
    'trebleSpike.requireTransient': 'Wenn aktiv, müssen Höhen zusätzlich einen Attack-Impuls liefern.',
    'trebleSpike.confirmFrames': 'Anzahl aufeinanderfolgender Frames vor einer Höhen-Attacke.',
    'trebleSpike.intervalMs': 'Mindestabstand zwischen einzelnen Höhen-Splats.',
    'trebleSpike.cooldownMs': 'Sperrzeit nach einer abgeschlossenen Höhenphase.',
    'bassCoupled.subFloor': 'Harte Untergrenze: Unter diesem Sub-Pegel bleibt die normale Sub-Emission aus.',
    'bassCoupled.subCeil': 'Sub-Pegel, bei dem die normale Emission maximal wird.',
    'bassCoupled.subGateOn': 'Weicher Startpunkt innerhalb der Sub-Kurve. Darunter wird die Emission zusätzlich abgeschwächt.',
    'bassCoupled.subGateScale': 'Breite des weichen Übergangs vom Sub-Gate bis zur vollen Gate-Wirkung.',
    'bassCoupled.kickSubMin': 'Minimaler normalisierter Sub-Pegel für einen Kick.',
    'bassCoupled.kickRiseFloor': 'Anstiegsanteil, der vor der Kick-Berechnung ignoriert wird.',
    'bassCoupled.kickRiseRange': 'Anstiegsbereich bis zur maximalen Kick-Stärke.',
    'bassCoupled.kickRiseOn': 'Benötigte Kick-Stärke, damit ein Kick ausgelöst wird.',
    'bassCoupled.kickRearm': 'Der Sub muss darunter fallen, bevor der nächste Kick erkannt wird.',
    'bassCoupled.kickCooldownMs': 'Sperrzeit zwischen zwei lokalen Kick-Erkennungen.',
    'bassCoupled.glitchOn': 'Kick-Stärke, die den maximalen Glitch-Burst auslöst.',
    'bassCoupled.intensityExponent': 'Kurvenhärte: höher bedeutet ruhiger unten und explosiver oben.',
    'bassCoupled.subRadiusScale': 'Zusätzlicher Radius normaler Sub-Splats bei stärkerem Sub-Signal. Kick-Bursts nutzen weiterhin ihre eigene Kick-Größe.',
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
    'mouse.brightness': 'Helligkeit der kontinuierlichen Mausspur.',
    'mouse.radius': 'Größe der kontinuierlichen Mausspur.',
    'mouse.radiusLite': 'Größe der Mausspur im Lite-Modus.',
    'mouse.forceScale': 'Übersetzung der Mausbewegung in Fluid-Kraft.',
    'mouse.tapBrightness': 'Helligkeit einer Maus-Klickwolke.',
    'mouse.tapRadius': 'Größe einer Maus-Klickwolke.',
    'mouse.tapRadiusLite': 'Größe einer Klickwolke im Lite-Modus.',
    'mouse.tapForceMin': 'Minimale Kraft einer Maus-Klickwolke.',
    'mouse.tapForceRange': 'Zusätzliche zufällige Kraft einer Maus-Klickwolke.',
    'treble.pipeCount': 'Anzahl der kleinen Höhen-Splats pro Höhen-Attacke.',
    'treble.pipeSpacing': 'Abstand der Orgelpfeifen relativ zur Logo-Breite.',
    'treble.radius': 'Grundgröße der Höhen-Splats.',
    'treble.radiusScale': 'Zusätzliche Größe bei stärkerem Höhen-Signal.',
    'treble.force': 'Grundkraft der Höhen-Splats.',
    'treble.forceScale': 'Zusätzliche Kraft bei stärkerem Höhen-Signal.',
    'treble.lift': 'Vertikaler Impuls in der vorgegebenen Richtung.',
    'treble.direction': 'Grundrichtung aller Höhen-Splats: up oder down.',
    'treble.angleSpread': 'Zufällige Winkelstreuung innerhalb der vorgegebenen Richtung.'
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
    var removedLegacyNoiseSettings = false;
    try {
      var stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!stored || !stored.triggers) return;
      Object.keys(stored.triggers).forEach(function (groupName) {
        var group = stored.triggers[groupName];
        if (!group || typeof group !== 'object') return;
        var target = trigger[groupName] || (trigger[groupName] = {});
        Object.keys(group).forEach(function (key) {
          if (typeof group[key] === 'number' || typeof group[key] === 'boolean'
            || (groupName === 'treble' && key === 'direction' && (group[key] === 'up' || group[key] === 'down'))) target[key] = group[key];
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
    if (trigger.noise) {
      if (Object.prototype.hasOwnProperty.call(trigger.noise, 'maxOpacity')) {
        delete trigger.noise.maxOpacity;
        removedLegacyNoiseSettings = true;
      }
      if (Object.prototype.hasOwnProperty.call(trigger.noise, 'boost')) {
        delete trigger.noise.boost;
        removedLegacyNoiseSettings = true;
      }
    }
    if (removedLegacyNoiseSettings) save();
    Object.keys(analysisDefaults).forEach(function (bandName) {
      var band = analysisBands[bandName];
      if (!band) return;
      if (band.levelMax <= band.levelMin) {
        band.levelMin = analysisDefaults[bandName].levelMin;
        band.levelMax = analysisDefaults[bandName].levelMax;
      }
    });
    if (analysisBands.sub && analysisBands.sub.levelMin < 0.1 && analysisBands.sub.levelMax <= 0.5) {
      analysisBands.sub.levelMin = analysisDefaults.sub.levelMin;
      analysisBands.sub.levelMax = analysisDefaults.sub.levelMax;
      save();
    }
    if (analysisBands.treble && analysisBands.treble.fromHz === 10000 && analysisBands.treble.toHz === 16000) {
      analysisBands.treble.fromHz = 180;
      analysisBands.treble.toHz = 12000;
      save();
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
      if (field[0] === 'section') {
        var heading = document.createElement('h3');
        heading.className = 'debug-config-section';
        heading.textContent = field[1];
        grid.appendChild(heading);
        return;
      }
      var groupName = field[0], key = field[1];
      var isAnalysisField = groupName.indexOf('audioAnalysis.bands.') === 0;
      var targetGroup = isAnalysisField
        ? analysisBands[groupName.split('.').pop()]
        : (trigger[groupName] || (trigger[groupName] = {}));
      var row = document.createElement('label');
      row.className = 'debug-config-row' + (isAnalysisField ? ' debug-config-analysis-row' : '');
      var description = descriptions[groupName + '.' + key] || 'Parameter des Effekts.';
      var isBoolean = typeof targetGroup[key] === 'boolean';
      var isDirection = groupName === 'treble' && key === 'direction';
      var inputType = isBoolean ? 'checkbox' : (isAnalysisField ? 'number' : 'range');
      row.innerHTML = '<span class="debug-config-label">' + field[2] + '<i class="debug-config-help" tabindex="0" data-tooltip="' + description + '" aria-label="' + description + '">?</i></span>'
        + (isDirection ? '<select><option value="up">OBEN</option><option value="down">UNTEN</option></select>' : '<input type="' + inputType + '">')
        + '<output></output>';
      var input = row.querySelector('input');
      var select = row.querySelector('select');
      var output = row.querySelector('output');
      if (isDirection) {
        select.value = targetGroup[key] === 'down' ? 'down' : 'up';
      } else if (!isBoolean) {
        input.min = field[3]; input.max = field[4]; input.step = field[5];
        if (isAnalysisField) { input.inputMode = 'decimal'; input.autocomplete = 'off'; }
        input.value = targetGroup[key];
      } else {
        input.checked = targetGroup[key];
      }
      function update() {
        var value = isDirection ? select.value : (isBoolean ? input.checked : Number(input.value));
        targetGroup[key] = value;
        output.value = isDirection ? (value === 'down' ? 'UNTEN' : 'OBEN') : (isBoolean ? (value ? 'AN' : 'AUS') : (isAnalysisField
          ? (key.indexOf('Hz') >= 0 ? Math.round(value) + ' Hz' : Math.round(value * 100) + '%')
          : (key.indexOf('Ms') >= 0 ? Math.round(value) + ' ms' : value.toFixed(2))));
        save();
        fireChange();
      }
      (select || input).addEventListener('input', update);
      (select || input).addEventListener('change', update);
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
            if (typeof group[key] === 'number' || typeof group[key] === 'boolean'
              || (groupName === 'treble' && key === 'direction' && (group[key] === 'up' || group[key] === 'down'))) target[key] = group[key];
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
