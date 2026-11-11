/* TradingTerminal v5 — Central Integration for lightweight-charts-drawing */

class DrawingIntegrationV5 {
  constructor(charts, options = {}) {
    this.charts = charts || (typeof window !== 'undefined' ? window.charts : []);
    this.storage = options.storage || new DrawingStorageV5();
    this.migrator = options.migrator || new DrawingMigratorV5();
    this.managers = new Map(); // chart.id -> LightweightChartsDrawing.DrawingManager
    this.undoStacks = new Map(); // chart.id -> string[]
    this.redoStacks = new Map(); // chart.id -> string[]
    this.activeChart = null;

    this.settingsDialog = new DrawingSettingsDialogV5({
      storage: this.storage,
      onApply: (d) => {
        const mgr = this.getActiveManager();
        if (mgr) mgr.update(d);
      }
    });

    this.floatBar = new DrawingFloatBarV5({
      onUpdate: (d) => {
        const mgr = this.getActiveManager();
        if (mgr) mgr.update(d);
      },
      onDelete: (d) => {
        const mgr = this.getActiveManager();
        if (mgr) mgr.delete(d.id);
      },
      onClone: (d) => {
        this.cloneDrawing(d);
      },
      onZOrder: (d, dir) => {
        this.reorderDrawing(d, dir);
      },
      onOpenSettings: (d) => {
        this.settingsDialog.open(d);
      }
    });

    this.toolbar = new DrawingToolbarV5({
      onSelectTool: (kind, opts) => {
        const mgr = this.getActiveManager();
        if (mgr) mgr.setTool(kind, opts || {});
      },
      onAction: (action, val) => {
        this.handleToolbarAction(action, val);
      }
    });

    this.editor = {
      clear: () => {
        const mgr = this.getActiveManager();
        if (mgr) mgr.select([]);
        this.floatBar.hide();
      },
      renderHandles: () => {}
    };
  }

  setTool(tool) {
    if (tool === 'crosshair' || tool === 'cursor' || !tool) {
      this.toolbar.setTool(null);
    } else {
      this.toolbar.setTool(tool);
    }
  }

  saveDrawings(chart) {
    this.saveChartDrawings(chart || this.activeChart);
  }

  loadDrawings(chart) {
    this.loadChartDrawings(chart || this.activeChart);
  }

  static attach(charts) {
    if (typeof window === 'undefined' || !window.TERMINAL_ENGINE_V5) return null;
    if (typeof LightweightChartsDrawing === 'undefined') {
      console.warn('LightweightChartsDrawing library not found. V5 drawing integration disabled.');
      return null;
    }

    const instance = new DrawingIntegrationV5(charts);
    instance.init();
    window.v5DrawingIntegration = instance;
    return instance;
  }

  init() {
    this.toolbar.init();

    // Bind each chart
    this.charts.forEach(chart => this.bindChart(chart));

    // Active chart default
    this.setActiveChart(this.charts[0]);

    // Global keyboard handling (Esc, Undo/Redo, Delete)
    window.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));

    // Listen to symbol change and workspace changes
    window.addEventListener('chart-symbol-changed', (e) => {
      const chart = e.detail?.chart;
      if (chart) this.loadChartDrawings(chart);
    });
  }

  bindChart(chart) {
    if (!chart || !chart.chart || !chart.series) return;
    const chartId = chart.id;

    // Create DrawingManager from library
    const dm = new LightweightChartsDrawing.DrawingManager(chart.chart, chart.series, {
      magnet: 'off',
      keyboard: true
    });
    this.managers.set(chartId, dm);
    this.undoStacks.set(chartId, []);
    this.redoStacks.set(chartId, []);

    // Load saved / migrated drawings
    this.loadChartDrawings(chart);

    // Click on container sets chart as active
    chart.container.addEventListener('pointerdown', () => {
      this.setActiveChart(chart);
    });

    // DrawingManager Events
    dm.on('change', () => {
      this.saveChartDrawings(chart);
    });

    dm.on('gestureEnd', () => {
      this.pushUndoSnapshot(chart);
    });

    dm.on('selection', (selectedIds) => {
      if (selectedIds && selectedIds.length > 0) {
        const d = dm.get(selectedIds[0]);
        if (d) {
          const rect = chart.container.getBoundingClientRect();
          this.floatBar.show(d, { x: rect.left + rect.width / 2, y: rect.top + 30 });
        }
      } else {
        this.floatBar.hide();
      }
    });

    dm.on('textEdit', (drawing, screenPt) => {
      const text = prompt('Nhập nội dung văn bản:', drawing.text || '');
      if (text !== null) {
        dm.update({ ...drawing, text });
      }
    });

    dm.on('tableEdit', (drawing, cell, box) => {
      const [row, col] = cell;
      const current = drawing.style?.tableCells?.[row]?.[col] || '';
      const text = prompt(`Nhập nội dung ô [${row + 1}, ${col + 1}]:`, current);
      if (text !== null) {
        dm.setTableCellText(drawing.id, cell, text);
        dm.endTableEdit();
      }
    });

    // Double-click opening settings
    chart.container.addEventListener('dblclick', (e) => {
      const sel = dm.selection();
      if (sel && sel.length > 0) {
        const d = dm.get(sel[0]);
        if (d) {
          e.stopPropagation();
          this.settingsDialog.open(d);
        }
      }
    });
  }

  setActiveChart(chart) {
    if (!chart) return;
    this.activeChart = chart;
    window.currentActiveChart = chart;

    // Sync active tool to this chart's manager
    const mgr = this.managers.get(chart.id);
    if (mgr && this.toolbar.activeTool) {
      mgr.setTool(this.toolbar.activeTool);
    }
  }

  getActiveManager() {
    if (!this.activeChart) return null;
    return this.managers.get(this.activeChart.id) || null;
  }

  loadChartDrawings(chart) {
    const dm = this.managers.get(chart.id);
    if (!dm) return;
    const drawings = this.storage.load(chart.id, chart.symbol);
    try {
      dm.importJSON(JSON.stringify(drawings));
      this.undoStacks.set(chart.id, [dm.exportJSON()]);
    } catch (err) {
      console.error(`Failed to load drawings for ${chart.id} ${chart.symbol}:`, err);
    }
  }

  saveChartDrawings(chart) {
    const dm = this.managers.get(chart.id);
    if (!dm) return;
    const json = dm.exportJSON();
    this.storage.save(chart.id, chart.symbol, json);
  }

  pushUndoSnapshot(chart) {
    const dm = this.managers.get(chart.id);
    if (!dm) return;
    const key = chart.id;
    const stack = this.undoStacks.get(key) || [];
    const snapshot = dm.exportJSON();
    if (stack.length === 0 || stack[stack.length - 1] !== snapshot) {
      stack.push(snapshot);
      if (stack.length > 100) stack.shift();
      this.undoStacks.set(key, stack);
      this.redoStacks.set(key, []);
    }
  }

  undo(chart) {
    const c = chart || this.activeChart;
    if (!c) return;
    const dm = this.managers.get(c.id);
    const stack = this.undoStacks.get(c.id) || [];
    const redoStack = this.redoStacks.get(c.id) || [];
    if (stack.length > 1) {
      const current = stack.pop();
      redoStack.push(current);
      const prev = stack[stack.length - 1];
      dm.importJSON(prev);
      this.saveChartDrawings(c);
    }
  }

  redo(chart) {
    const c = chart || this.activeChart;
    if (!c) return;
    const dm = this.managers.get(c.id);
    const stack = this.undoStacks.get(c.id) || [];
    const redoStack = this.redoStacks.get(c.id) || [];
    if (redoStack.length > 0) {
      const next = redoStack.pop();
      stack.push(next);
      dm.importJSON(next);
      this.saveChartDrawings(c);
    }
  }

  cloneDrawing(d) {
    const mgr = this.getActiveManager();
    if (!mgr || !d) return;
    const cloned = JSON.parse(JSON.stringify(d));
    cloned.id = `clone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    // Slight offset so clone is distinguishable
    if (cloned.points && cloned.points.length > 0) {
      const deltaPrice = (cloned.points[0].price || 0) * 0.002;
      cloned.points.forEach(p => {
        p.price += deltaPrice;
      });
    }
    mgr.add(cloned);
    mgr.select([cloned.id]);
    if (typeof showToast === 'function') showToast('Đã nhân bản hình vẽ', 'info');
  }

  reorderDrawing(d, direction) {
    const mgr = this.getActiveManager();
    if (!mgr || !d) return;
    const drawings = mgr.drawings();
    const idx = drawings.findIndex(item => item.id === d.id);
    if (idx === -1) return;

    if (direction === 'up' && idx < drawings.length - 1) {
      const temp = drawings[idx];
      drawings[idx] = drawings[idx + 1];
      drawings[idx + 1] = temp;
      mgr.importJSON(JSON.stringify(drawings));
      mgr.select([d.id]);
    } else if (direction === 'down' && idx > 0) {
      const temp = drawings[idx];
      drawings[idx] = drawings[idx - 1];
      drawings[idx - 1] = temp;
      mgr.importJSON(JSON.stringify(drawings));
      mgr.select([d.id]);
    }
  }

  handleToolbarAction(action, val) {
    const mgr = this.getActiveManager();
    if (!mgr) return;

    switch (action) {
      case 'setMagnet':
        mgr.setMagnet(val);
        break;
      case 'stayInDrawingMode':
        // dm property
        mgr.stayInDrawingMode = !!val;
        break;
      case 'lockAll':
        mgr.setInteractive(!val, { all: true });
        break;
      case 'hideAll':
        mgr.setDrawingsVisible(!val);
        break;
      case 'clearAll':
        mgr.clear();
        this.saveChartDrawings(this.activeChart);
        if (typeof showToast === 'function') showToast('🗑 Đã xóa toàn bộ hình vẽ trên chart', 'info');
        break;
    }
  }

  handleGlobalKeyDown(e) {
    // Ctrl+Z: Undo
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      this.undo();
      return;
    }
    // Ctrl+Y or Ctrl+Shift+Z: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      this.redo();
      return;
    }
    // Escape: disarm tool and deselect
    if (e.key === 'Escape') {
      const mgr = this.getActiveManager();
      if (mgr) {
        mgr.setTool(null);
        mgr.select([]);
      }
      this.toolbar.setTool(null);
      this.floatBar.hide();
    }
  }
}

if (typeof window !== 'undefined') window.DrawingIntegrationV5 = DrawingIntegrationV5;
if (typeof module !== 'undefined') module.exports = DrawingIntegrationV5;
