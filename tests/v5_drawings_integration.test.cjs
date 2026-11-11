const test = require('node:test');
const assert = require('node:assert/strict');
const DrawingMigratorV5 = require('../frontend/js/v5_drawing_migrator.js');
const DrawingStorageV5 = require('../frontend/js/v5_drawing_storage.js');

test('DrawingMigratorV5: converts legacy box to rectangle with styles', () => {
  const migrator = new DrawingMigratorV5();
  const legacyBox = {
    id: 'box-1',
    type: 'box',
    p1: { time: 1700000000, price: 15000 },
    p2: { time: 1700003600, price: 15100 },
    borderColor: '#ff0000',
    width: 2,
    lineStyle: 'dashed',
    fillColor: '#00ff00',
    fillOpacity: 40,
    fillEnabled: true,
    middleLine: { enabled: true, color: '#ffffff', width: 1, style: 'solid' },
    text: 'Supply Zone',
    textStyle: { color: '#ffffff', size: 14, bold: true, italic: false, horizontal: 'center', vertical: 'inside' },
    locked: false,
    visibility: { minutes: { enabled: true, min: 1, max: 60 } }
  };

  const converted = migrator.migrateOne(legacyBox);
  assert.equal(converted.kind, 'rectangle');
  assert.equal(converted.id, 'box-1');
  assert.deepEqual(converted.points, [
    { time: 1700000000, price: 15000 },
    { time: 1700003600, price: 15100 }
  ]);
  assert.equal(converted.style.color, '#ff0000');
  assert.equal(converted.style.width, 2);
  assert.equal(converted.style.lineStyle, 'dashed');
  assert.equal(converted.style.backgroundColor, '#00ff00');
  assert.equal(converted.style.transparency, 60); // 100 - 40
  assert.equal(converted.style.text, 'Supply Zone');
  assert.equal(converted.style.rectMiddleLine?.visible, true);
  assert.equal(converted.visibility?.minutes?.on, true);
  assert.equal(converted.visibility?.minutes?.from, 1);
  assert.equal(converted.visibility?.minutes?.to, 60);
});

test('DrawingMigratorV5: reverses points for fib-retracement', () => {
  const migrator = new DrawingMigratorV5();
  const legacyFib = {
    id: 'fib-1',
    type: 'fib',
    p1: { time: 100, price: 1000 }, // in v4, level 0 is at p1
    p2: { time: 200, price: 2000 }, // in v4, level 1 is at p2
    color: '#2962ff',
    width: 1,
    lineStyle: 'solid',
    levels: [0, 0.5, 1],
    locked: true
  };

  const converted = migrator.migrateOne(legacyFib);
  assert.equal(converted.kind, 'fib-retracement');
  // CRITICAL: points must be reversed: [p2, p1]
  assert.equal(converted.points[0].price, 2000);
  assert.equal(converted.points[1].price, 1000);
  assert.equal(converted.points[0].time, 200);
  assert.equal(converted.points[1].time, 100);
  assert.equal(converted.locked, true);
  assert.equal(converted.style.levels.length, 3);
  assert.equal(converted.style.levels[1].coeff, 0.5);
});

test('DrawingMigratorV5: converts position (long and short) accurately', () => {
  const migrator = new DrawingMigratorV5();
  
  // Long: entry 100, target 110, RR 2 -> stop = 100 - (10 / 2) = 95
  const legacyLong = {
    id: 'pos-1',
    type: 'position',
    p1: { time: 1000, price: 100 },
    p2: { time: 2000, price: 110 },
    riskReward: 2
  };
  const convLong = migrator.migrateOne(legacyLong);
  assert.equal(convLong.kind, 'long-position');
  assert.equal(convLong.points.length, 1);
  assert.equal(convLong.points[0].price, 100);
  assert.equal(convLong.style.profitLevel, 10);
  assert.equal(convLong.style.stopLevel, 5);

  // Short: entry 100, target 90, RR 2 -> stop = 100 + 5 = 105
  const legacyShort = {
    id: 'pos-2',
    type: 'position',
    p1: { time: 1000, price: 100 },
    p2: { time: 2000, price: 90 },
    riskReward: 2
  };
  const convShort = migrator.migrateOne(legacyShort);
  assert.equal(convShort.kind, 'short-position');
  assert.equal(convShort.style.profitLevel, 10);
  assert.equal(convShort.style.stopLevel, 5);
});

test('DrawingMigratorV5: converts hline, text, measure, and handles invalid gracefully', () => {
  const migrator = new DrawingMigratorV5();

  const hline = migrator.migrateOne({ type: 'hline', p1: { time: 100, price: 50 }, color: '#333' });
  assert.equal(hline.kind, 'horizontal-line');
  assert.equal(hline.points[0].price, 50);

  const text = migrator.migrateOne({ type: 'text', p1: { time: 100, price: 50 }, text: 'Hello' });
  assert.equal(text.kind, 'text');
  assert.equal(text.text, 'Hello');

  const measure = migrator.migrateOne({ type: 'measure', p1: { time: 10, price: 10 }, p2: { time: 20, price: 20 } });
  assert.equal(measure.kind, 'date-and-price-range');

  const invalid = migrator.migrateOne({ type: 'unknown_alien_shape', p1: { time: 1, price: 1 } });
  assert.equal(invalid, null);

  const batch = migrator.migrate([
    { type: 'hline', p1: { time: 100, price: 50 } },
    { type: 'nonexistent' }
  ]);
  assert.equal(batch.drawings.length, 1);
  assert.equal(batch.warnings.length, 1);
});

test('DrawingStorageV5: isolates v5 keys, creates backup, migrates on first read', () => {
  const storageMap = new Map();
  const mockWorkspace = {
    read(key, fallback) {
      return storageMap.has(key) ? storageMap.get(key) : fallback;
    },
    write(key, value) {
      storageMap.set(key, value);
      return true;
    }
  };

  const storage = new DrawingStorageV5(mockWorkspace);
  const chartId = 'box-1';
  const symbol = 'NQ1!';

  // Initially nothing
  assert.deepEqual(storage.load(chartId, symbol), []);

  // Now seed legacy v4 drawing
  mockWorkspace.write('drawings_box-1_NQ1!', [
    { id: 'v4-box', type: 'box', p1: { time: 100, price: 50 }, p2: { time: 200, price: 60 } }
  ]);

  // Load in v5: should migrate, backup v4, and save to v5
  const loaded = storage.load(chartId, symbol);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].kind, 'rectangle');
  assert.equal(loaded[0].id, 'v4-box');

  // Verify backup exists
  assert.equal(storage.hasBackup(chartId, symbol), true);
  const backup = storage.getBackup(chartId, symbol);
  assert.equal(backup[0].type, 'box'); // original format untouched!

  // Verify v5 key is written
  assert.equal(storageMap.has('drawings_v5_box-1_NQ1!'), true);

  // Now subsequent load reads from v5 directly
  storage.save(chartId, symbol, [{ id: 'new-v5-line', kind: 'trend-line', points: [{ time: 1, price: 1 }, { time: 2, price: 2 }] }]);
  const loaded2 = storage.load(chartId, symbol);
  assert.equal(loaded2[0].id, 'new-v5-line');

  // And legacy backup was NOT overwritten
  assert.equal(storage.getBackup(chartId, symbol)[0].type, 'box');
});

test('DrawingStorageV5: templates and default styles management', () => {
  const store = new Map();
  const mockWs = {
    read(k, fb) { return store.has(k) ? store.get(k) : fb; },
    write(k, v) { store.set(k, v); return true; }
  };
  const storage = new DrawingStorageV5(mockWs);

  // Templates
  assert.deepEqual(storage.loadTemplates('rectangle'), {});
  storage.saveTemplate('rectangle', 'My Bearish OrderBlock', { color: '#f23645', transparency: 60 });
  const tpls = storage.loadTemplates('rectangle');
  assert.equal(tpls['My Bearish OrderBlock'].color, '#f23645');

  storage.deleteTemplate('rectangle', 'My Bearish OrderBlock');
  assert.deepEqual(storage.loadTemplates('rectangle'), {});

  // Default styles
  assert.equal(storage.loadDefaultStyle('trend-line'), null);
  storage.saveDefaultStyle('trend-line', { color: '#089981', width: 2 });
  const def = storage.loadDefaultStyle('trend-line');
  assert.equal(def.color, '#089981');
  assert.equal(def.width, 2);
});

test('DrawingToolbarV5: contains all 86 tool kinds across TradingView groups', () => {
  const DrawingToolbarV5 = require('../frontend/js/v5_drawing_toolbar.js');
  // Read V5_TOOL_GROUPS
  const allTools = [];
  // Count through sections
  const groupFile = require('fs').readFileSync(
    require('path').join(__dirname, '../frontend/js/v5_drawing_toolbar.js'),
    'utf8'
  );
  // Match kinds in toolbar file
  const kinds = [...groupFile.matchAll(/kind:\s*['"]([a-z0-9-]+)['"]/g)].map(m => m[1]);
  const uniqueKinds = new Set(kinds);
  
  // We have 85 tool kinds in groups + 1 'font-icon' (emojis) = 86 total tools!
  assert.equal(uniqueKinds.size, 85);
  assert.ok(uniqueKinds.has('trend-line'));
  assert.ok(uniqueKinds.has('fib-retracement'));
  assert.ok(uniqueKinds.has('long-position'));
  assert.ok(uniqueKinds.has('short-position'));
  assert.ok(uniqueKinds.has('rectangle'));
  assert.ok(uniqueKinds.has('pitchfork'));
  assert.ok(uniqueKinds.has('anchored-vwap'));
  assert.ok(uniqueKinds.has('head-and-shoulders'));
  assert.ok(uniqueKinds.has('elliott-impulse'));
  assert.ok(uniqueKinds.has('gann-box'));
});

test('DrawingSettingsDialogV5: supportsTextTab, formatKindTitle, toHex', () => {
  const DrawingSettingsDialogV5 = require('../frontend/js/v5_drawing_settings.js');
  const dialog = new DrawingSettingsDialogV5();

  assert.equal(dialog.formatKindTitle('fib-retracement'), 'Fib Retracement');
  assert.equal(dialog.formatKindTitle('trend-line'), 'Trend Line');
  assert.equal(dialog.formatKindTitle('long-position'), 'Long Position');

  assert.equal(dialog.toHex('#ff00aa'), '#ff00aa');
  assert.equal(dialog.toHex('rgb(255, 0, 0)'), '#ff0000');
  assert.equal(dialog.toHex('rgba(0, 255, 0, 0.5)'), '#00ff00');

  assert.equal(dialog.supportsTextTab({ kind: 'text' }), true);
  assert.equal(dialog.supportsTextTab({ kind: 'rectangle' }), true);
  assert.equal(dialog.supportsTextTab({ kind: 'pitchfork' }), false);

  assert.equal(dialog.supportsExtend('trend-line'), true);
  assert.equal(dialog.supportsFill('rectangle'), true);
  assert.equal(dialog.supportsStats('date-and-price-range'), true);
});

