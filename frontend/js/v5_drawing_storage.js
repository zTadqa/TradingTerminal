/* v5 preview drawing storage — keeps v5 drawings strictly isolated in terminal_v5_preview: namespace */
class DrawingStorageV5 {
  constructor(workspace, migrator) {
    this.workspace = workspace || (typeof Workspace !== 'undefined' ? Workspace : null);
    if (migrator) {
      this.migrator = migrator;
    } else if (typeof DrawingMigratorV5 !== 'undefined') {
      this.migrator = new DrawingMigratorV5();
    } else if (typeof require !== 'undefined') {
      try {
        const MigratorClass = require('./v5_drawing_migrator.js');
        this.migrator = new MigratorClass();
      } catch (e) {
        this.migrator = null;
      }
    } else {
      this.migrator = null;
    }
  }

  v5Key(chartId, symbol) {
    return 'drawings_v5_' + chartId + '_' + symbol;
  }

  legacyKey(chartId, symbol) {
    return 'drawings_' + chartId + '_' + symbol;
  }

  legacySymbolKey(symbol) {
    return 'drawings_' + symbol;
  }

  backupKey(chartId, symbol) {
    return 'drawings_v4_backup_' + chartId + '_' + symbol;
  }

  save(chartId, symbol, drawings) {
    if (!this.workspace) return false;
    const key = this.v5Key(chartId, symbol);
    const data = typeof drawings === 'string' ? JSON.parse(drawings) : drawings;
    return this.workspace.write(key, data);
  }

  load(chartId, symbol) {
    if (!this.workspace) return [];
    const v5Key = this.v5Key(chartId, symbol);
    const saved = this.workspace.read(v5Key, null);
    if (saved !== null && Array.isArray(saved)) {
      return saved;
    }

    // First time in v5 for this chart/symbol: check if legacy v4 drawings exist
    const legacy = this.loadLegacy(chartId, symbol);
    if (legacy && legacy.length > 0) {
      this.backup(chartId, symbol, legacy);
      if (this.migrator) {
        const converted = this.migrator.migrate(legacy);
        this.save(chartId, symbol, converted.drawings);
        return converted.drawings;
      }
    }
    return [];
  }

  loadLegacy(chartId, symbol) {
    if (!this.workspace) return [];
    const primary = this.workspace.read(this.legacyKey(chartId, symbol), null);
    if (primary && Array.isArray(primary) && primary.length) return primary;
    const fallback = this.workspace.read(this.legacySymbolKey(symbol), null);
    if (fallback && Array.isArray(fallback) && fallback.length) return fallback;
    return [];
  }

  backup(chartId, symbol, legacyData) {
    if (!this.workspace) return false;
    const bKey = this.backupKey(chartId, symbol);
    const existing = this.workspace.read(bKey, null);
    // Never overwrite an existing backup
    if (existing !== null) return false;
    const data = legacyData || this.loadLegacy(chartId, symbol);
    if (data && data.length) {
      return this.workspace.write(bKey, data);
    }
    return false;
  }

  hasBackup(chartId, symbol) {
    if (!this.workspace) return false;
    return this.workspace.read(this.backupKey(chartId, symbol), null) !== null;
  }

  getBackup(chartId, symbol) {
    if (!this.workspace) return null;
    return this.workspace.read(this.backupKey(chartId, symbol), null);
  }

  saveTemplate(kind, name, style) {
    if (!this.workspace) return false;
    const templates = this.loadTemplates(kind);
    templates[name] = style;
    return this.workspace.write('drawing_templates_v5_' + kind, templates);
  }

  loadTemplates(kind) {
    if (!this.workspace) return {};
    return this.workspace.read('drawing_templates_v5_' + kind, {});
  }

  deleteTemplate(kind, name) {
    if (!this.workspace) return false;
    const templates = this.loadTemplates(kind);
    delete templates[name];
    return this.workspace.write('drawing_templates_v5_' + kind, templates);
  }

  saveDefaultStyle(kind, style) {
    if (!this.workspace) return false;
    return this.workspace.write('drawing_default_style_v5_' + kind, style);
  }

  loadDefaultStyle(kind) {
    if (!this.workspace) return null;
    return this.workspace.read('drawing_default_style_v5_' + kind, null);
  }
}

if (typeof module !== 'undefined') module.exports = DrawingStorageV5;
