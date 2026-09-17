(function () {
  'use strict';

  var storageKey = 'ddDebugFxConfig';
  var base = window.doomsdayFxConfig || { version: 1, triggers: {} };
  var trigger = base.triggers || (base.triggers = {});
  var defaults = {
    heavyBass: { on: 0.85, off: 0.76, glitchCooldownMs: 1200, glitchBursts: 3, glitchMs: 520, emissionScale: 0.12 },
    bassCoupled: { enabled: true, subFloor: 0.04, subCeil: 0.45, subGateOn: 0.08, subGateScale: 0.10, glitchOn: 0.85, minIntervalMs: 90, maxIntervalMs: 460, intensityExponent: 1.8 },
    sync: { delayMs: 5500 }
  };
  var fields = [
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
    ['sync', 'delayMs', 'Sync delay ms', 0, 12000, 50]
  ];

  function copyDefaults() {
    Object.keys(defaults).forEach(function (groupName) {
      var group = trigger[groupName] || (trigger[groupName] = {});
      Object.keys(defaults[groupName]).forEach(function (key) {
        if (group[key] === undefined) group[key] = defaults[groupName][key];
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
    } catch (error) {
      console.warn('[debug-config] stored config ignored', error);
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: base.version || 1, triggers: trigger }));
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
      var row = document.createElement('label');
      row.className = 'debug-config-row';
      row.innerHTML = '<span>' + field[2] + '</span><input type="range"><output></output>';
      var input = row.querySelector('input');
      var output = row.querySelector('output');
      input.min = field[3]; input.max = field[4]; input.step = field[5];
      input.value = trigger[groupName][key];
      function update() {
        var value = Number(input.value);
        trigger[groupName][key] = value;
        output.value = key.indexOf('Ms') >= 0 ? Math.round(value) + ' ms' : value.toFixed(2);
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
      var text = JSON.stringify({ version: base.version || 1, triggers: trigger }, null, 2);
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
