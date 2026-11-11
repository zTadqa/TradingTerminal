/* TradingView-Style Drawing Settings Dialog (Style, Coordinates, Visibility, Text) */

class DrawingSettingsDialogV5 {
  constructor(options = {}) {
    this.storage = options.storage || (typeof DrawingStorageV5 !== 'undefined' ? new DrawingStorageV5() : null);
    this.onApply = options.onApply || (() => {});
    this.currentDrawing = null;
    this.originalDrawing = null;
    this.activeTab = 'style';
    this.dom = null;
  }

  open(drawing, initialTab = 'style') {
    if (!drawing) return;
    this.currentDrawing = JSON.parse(JSON.stringify(drawing));
    this.originalDrawing = JSON.parse(JSON.stringify(drawing));
    this.activeTab = initialTab;
    this.render();
  }

  close(rollback = false) {
    if (rollback && this.originalDrawing) {
      this.onApply(this.originalDrawing);
    }
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
    this.dom = null;
    this.currentDrawing = null;
    this.originalDrawing = null;
  }

  render() {
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'v5-modal-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close(true);
    });

    const dialog = document.createElement('div');
    dialog.className = 'v5-settings-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    // 1. Header
    const header = document.createElement('div');
    header.className = 'v5-dialog-header';
    const kindTitle = this.formatKindTitle(this.currentDrawing.kind);
    header.innerHTML = `
      <div class="v5-dialog-title">${kindTitle} Settings</div>
      <button class="v5-dialog-close" title="Close (Esc)">&times;</button>
    `;
    header.querySelector('.v5-dialog-close').addEventListener('click', () => this.close(true));
    dialog.appendChild(header);

    // 2. Tabs
    const tabs = document.createElement('div');
    tabs.className = 'v5-dialog-tabs';
    const hasTextTab = this.supportsTextTab(this.currentDrawing);
    const tabList = [
      { id: 'style', label: 'Style' },
      ...(hasTextTab ? [{ id: 'text', label: 'Text' }] : []),
      { id: 'coordinates', label: 'Coordinates' },
      { id: 'visibility', label: 'Visibility' }
    ];

    tabList.forEach(t => {
      const btn = document.createElement('button');
      btn.className = `v5-tab-btn ${this.activeTab === t.id ? 'active' : ''}`;
      btn.textContent = t.label;
      btn.dataset.tab = t.id;
      btn.addEventListener('click', () => {
        this.activeTab = t.id;
        dialog.querySelectorAll('.v5-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === t.id));
        this.renderBody(body);
      });
      tabs.appendChild(btn);
    });
    dialog.appendChild(tabs);

    // 3. Body
    const body = document.createElement('div');
    body.className = 'v5-dialog-body';
    this.renderBody(body);
    dialog.appendChild(body);

    // 4. Footer
    const footer = document.createElement('div');
    footer.className = 'v5-dialog-footer';
    footer.innerHTML = `
      <div class="v5-footer-left">
        <button class="v5-template-menu-btn" id="v5-tpl-btn">Template &#9662;</button>
        <button class="v5-btn v5-btn-secondary" id="v5-save-default">Save as default</button>
      </div>
      <div class="v5-footer-right">
        <button class="v5-btn v5-btn-secondary" id="v5-btn-cancel">Cancel</button>
        <button class="v5-btn v5-btn-primary" id="v5-btn-ok">OK</button>
      </div>
    `;

    footer.querySelector('#v5-btn-cancel').addEventListener('click', () => this.close(true));
    footer.querySelector('#v5-btn-ok').addEventListener('click', () => {
      this.close(false);
    });
    footer.querySelector('#v5-save-default').addEventListener('click', () => {
      if (this.storage && this.currentDrawing) {
        this.storage.saveDefaultStyle(this.currentDrawing.kind, this.currentDrawing.style);
        if (typeof showToast === 'function') showToast('Đã lưu cài đặt mặc định cho ' + kindTitle, 'info');
      }
    });

    const tplBtn = footer.querySelector('#v5-tpl-btn');
    tplBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTemplateMenu(tplBtn);
    });

    dialog.appendChild(footer);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    this.dom = backdrop;

    // Esc key closes with rollback
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', keyHandler);
        this.close(true);
      }
    };
    window.addEventListener('keydown', keyHandler);
  }

  renderBody(container) {
    container.innerHTML = '';
    switch (this.activeTab) {
      case 'style':
        this.renderStyleTab(container);
        break;
      case 'text':
        this.renderTextTab(container);
        break;
      case 'coordinates':
        this.renderCoordinatesTab(container);
        break;
      case 'visibility':
        this.renderVisibilityTab(container);
        break;
    }
  }

  // --- TAB 1: STYLE ---
  renderStyleTab(container) {
    const d = this.currentDrawing;
    const style = d.style || {};

    // 1. Line Stroke (Color, Width, LineStyle)
    const lineRow = document.createElement('div');
    lineRow.className = 'v5-control-row';
    lineRow.innerHTML = `
      <span class="v5-control-label">Line</span>
      <div class="v5-control-inputs">
        <input type="color" class="v5-color-input" id="v5-style-color" value="${this.toHex(style.color || '#2962ff')}">
        <select class="v5-select" id="v5-style-width">
          <option value="1" ${style.width === 1 ? 'selected' : ''}>1px</option>
          <option value="2" ${style.width === 2 ? 'selected' : ''}>2px</option>
          <option value="3" ${style.width === 3 ? 'selected' : ''}>3px</option>
          <option value="4" ${style.width === 4 ? 'selected' : ''}>4px</option>
        </select>
        <select class="v5-select" id="v5-style-lineStyle">
          <option value="solid" ${style.lineStyle === 'solid' ? 'selected' : ''}>Solid</option>
          <option value="dashed" ${style.lineStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
          <option value="dotted" ${style.lineStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
        </select>
      </div>
    `;
    lineRow.querySelector('#v5-style-color').addEventListener('input', (e) => {
      style.color = e.target.value;
      this.triggerUpdate();
    });
    lineRow.querySelector('#v5-style-width').addEventListener('change', (e) => {
      style.width = Number(e.target.value);
      this.triggerUpdate();
    });
    lineRow.querySelector('#v5-style-lineStyle').addEventListener('change', (e) => {
      style.lineStyle = e.target.value;
      this.triggerUpdate();
    });
    container.appendChild(lineRow);

    // 2. Extend options (for lines, channels, rectangles)
    if (this.supportsExtend(d.kind)) {
      const extendRow = document.createElement('div');
      extendRow.className = 'v5-control-row';
      extendRow.innerHTML = `
        <span class="v5-control-label">Extend lines</span>
        <div class="v5-control-inputs">
          <label class="v5-checkbox-label">
            <input type="checkbox" class="v5-checkbox" id="v5-extend-left" ${style.extendLeft ? 'checked' : ''}> Left
          </label>
          <label class="v5-checkbox-label">
            <input type="checkbox" class="v5-checkbox" id="v5-extend-right" ${style.extendRight ? 'checked' : ''}> Right
          </label>
        </div>
      `;
      extendRow.querySelector('#v5-extend-left').addEventListener('change', (e) => {
        style.extendLeft = e.target.checked;
        this.triggerUpdate();
      });
      extendRow.querySelector('#v5-extend-right').addEventListener('change', (e) => {
        style.extendRight = e.target.checked;
        this.triggerUpdate();
      });
      container.appendChild(extendRow);
    }

    // 3. Shape Fill (for rectangles, circles, triangles, etc.)
    if (this.supportsFill(d.kind)) {
      const fillRow = document.createElement('div');
      fillRow.className = 'v5-control-row';
      const fillBg = style.fillBackground !== false;
      const opacityVal = 100 - (Number.isFinite(style.transparency) ? style.transparency : 80);
      fillRow.innerHTML = `
        <label class="v5-checkbox-label">
          <input type="checkbox" class="v5-checkbox" id="v5-fill-bg" ${fillBg ? 'checked' : ''}> Background Fill
        </label>
        <div class="v5-control-inputs">
          <input type="color" class="v5-color-input" id="v5-bg-color" value="${this.toHex(style.backgroundColor || style.color || '#2962ff')}">
          <input type="range" min="0" max="100" value="${opacityVal}" id="v5-bg-opacity" title="Opacity %" style="width: 75px;">
          <span id="v5-bg-opacity-label" style="font-size: 11px; width: 32px;">${opacityVal}%</span>
        </div>
      `;
      fillRow.querySelector('#v5-fill-bg').addEventListener('change', (e) => {
        style.fillBackground = e.target.checked;
        this.triggerUpdate();
      });
      fillRow.querySelector('#v5-bg-color').addEventListener('input', (e) => {
        style.backgroundColor = e.target.value;
        this.triggerUpdate();
      });
      fillRow.querySelector('#v5-bg-opacity').addEventListener('input', (e) => {
        const val = Number(e.target.value);
        style.transparency = 100 - val;
        fillRow.querySelector('#v5-bg-opacity-label').textContent = val + '%';
        this.triggerUpdate();
      });
      container.appendChild(fillRow);
    }

    // 4. Rectangle Middle Line
    if (d.kind === 'rectangle') {
      const midRow = document.createElement('div');
      midRow.className = 'v5-control-row';
      const hasMid = !!style.rectMiddleLine?.visible;
      midRow.innerHTML = `
        <label class="v5-checkbox-label">
          <input type="checkbox" class="v5-checkbox" id="v5-rect-mid" ${hasMid ? 'checked' : ''}> Middle Line (50%)
        </label>
        <div class="v5-control-inputs">
          <input type="color" class="v5-color-input" id="v5-rect-mid-color" value="${this.toHex(style.rectMiddleLine?.color || '#ffffff')}">
          <select class="v5-select" id="v5-rect-mid-style">
            <option value="solid" ${style.rectMiddleLine?.style === 'solid' ? 'selected' : ''}>Solid</option>
            <option value="dashed" ${style.rectMiddleLine?.style === 'dashed' || !style.rectMiddleLine ? 'selected' : ''}>Dashed</option>
            <option value="dotted" ${style.rectMiddleLine?.style === 'dotted' ? 'selected' : ''}>Dotted</option>
          </select>
        </div>
      `;
      midRow.querySelector('#v5-rect-mid').addEventListener('change', (e) => {
        if (!style.rectMiddleLine) style.rectMiddleLine = { visible: true, color: '#ffffff', width: 1, style: 'dashed' };
        style.rectMiddleLine.visible = e.target.checked;
        this.triggerUpdate();
      });
      midRow.querySelector('#v5-rect-mid-color').addEventListener('input', (e) => {
        if (!style.rectMiddleLine) style.rectMiddleLine = { visible: true, color: '#ffffff', width: 1, style: 'dashed' };
        style.rectMiddleLine.color = e.target.value;
        this.triggerUpdate();
      });
      midRow.querySelector('#v5-rect-mid-style').addEventListener('change', (e) => {
        if (!style.rectMiddleLine) style.rectMiddleLine = { visible: true, color: '#ffffff', width: 1, style: 'dashed' };
        style.rectMiddleLine.style = e.target.value;
        this.triggerUpdate();
      });
      container.appendChild(midRow);
    }

    // 5. Fib Levels Table (for fib-retracement, trend-based-fib-extension, etc.)
    if (d.kind.includes('fib') && Array.isArray(style.levels)) {
      this.renderFibLevelsTable(container, style);
    }

    // 6. Position Tool Settings (Long/Short)
    if (d.kind === 'long-position' || d.kind === 'short-position') {
      this.renderPositionSettings(container, style);
    }

    // 7. Stats checkboxes (for trendline, date-range, price-range)
    if (this.supportsStats(d.kind)) {
      this.renderStatsOptions(container, style);
    }
  }

  renderFibLevelsTable(container, style) {
    const tableWrap = document.createElement('div');
    tableWrap.style.marginTop = '10px';
    tableWrap.innerHTML = `
      <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Fibonacci Levels</div>
      <table class="v5-levels-table">
        <thead>
          <tr>
            <th style="width: 30px;"></th>
            <th>Coeff</th>
            <th>Color</th>
          </tr>
        </thead>
        <tbody id="v5-fib-tbody"></tbody>
      </table>
    `;

    const tbody = tableWrap.querySelector('#v5-fib-tbody');
    style.levels.forEach((lvl, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="v5-checkbox" ${lvl.visible ? 'checked' : ''}></td>
        <td><input type="number" step="0.001" class="v5-input v5-level-coeff-input" value="${lvl.coeff}"></td>
        <td><input type="color" class="v5-color-input" value="${this.toHex(lvl.color || '#2962ff')}"></td>
      `;
      tr.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
        lvl.visible = e.target.checked;
        this.triggerUpdate();
      });
      tr.querySelector('input[type="number"]').addEventListener('input', (e) => {
        lvl.coeff = Number(e.target.value);
        this.triggerUpdate();
      });
      tr.querySelector('input[type="color"]').addEventListener('input', (e) => {
        lvl.color = e.target.value;
        this.triggerUpdate();
      });
      tbody.appendChild(tr);
    });

    container.appendChild(tableWrap);
  }

  renderPositionSettings(container, style) {
    const posWrap = document.createElement('div');
    posWrap.style.display = 'flex';
    posWrap.style.flexDirection = 'column';
    posWrap.style.gap = '10px';

    posWrap.innerHTML = `
      <div class="v5-control-row">
        <span class="v5-control-label">Profit Target (Level)</span>
        <div class="v5-control-inputs">
          <input type="number" step="0.25" class="v5-input" id="v5-pos-target" value="${style.profitLevel || 20}" style="width: 80px;">
          <input type="color" class="v5-color-input" id="v5-pos-target-color" value="${this.toHex(style.targetColor || '#089981')}">
        </div>
      </div>
      <div class="v5-control-row">
        <span class="v5-control-label">Stop Loss (Level)</span>
        <div class="v5-control-inputs">
          <input type="number" step="0.25" class="v5-input" id="v5-pos-stop" value="${style.stopLevel || 10}" style="width: 80px;">
          <input type="color" class="v5-color-input" id="v5-pos-stop-color" value="${this.toHex(style.stopColor || '#f23645')}">
        </div>
      </div>
      <div class="v5-control-row">
        <span class="v5-control-label">Account Size ($)</span>
        <input type="number" class="v5-input" id="v5-pos-acc" value="${style.accountSize || 1000}" style="width: 90px;">
      </div>
      <div class="v5-control-row">
        <span class="v5-control-label">Risk (%)</span>
        <input type="number" step="0.5" class="v5-input" id="v5-pos-risk" value="${style.riskPercent || 1}" style="width: 70px;">
      </div>
    `;

    posWrap.querySelector('#v5-pos-target').addEventListener('input', (e) => {
      style.profitLevel = Number(e.target.value);
      this.triggerUpdate();
    });
    posWrap.querySelector('#v5-pos-target-color').addEventListener('input', (e) => {
      style.targetColor = e.target.value;
      this.triggerUpdate();
    });
    posWrap.querySelector('#v5-pos-stop').addEventListener('input', (e) => {
      style.stopLevel = Number(e.target.value);
      this.triggerUpdate();
    });
    posWrap.querySelector('#v5-pos-stop-color').addEventListener('input', (e) => {
      style.stopColor = e.target.value;
      this.triggerUpdate();
    });
    posWrap.querySelector('#v5-pos-acc').addEventListener('input', (e) => {
      style.accountSize = Number(e.target.value);
      this.triggerUpdate();
    });
    posWrap.querySelector('#v5-pos-risk').addEventListener('input', (e) => {
      style.riskPercent = Number(e.target.value);
      this.triggerUpdate();
    });

    container.appendChild(posWrap);
  }

  renderStatsOptions(container, style) {
    const statsWrap = document.createElement('div');
    statsWrap.style.display = 'flex';
    statsWrap.style.flexDirection = 'column';
    statsWrap.style.gap = '8px';
    statsWrap.innerHTML = `
      <div style="font-size: 13px; font-weight: 600;">Stats Display</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <label class="v5-checkbox-label">
          <input type="checkbox" class="v5-checkbox" id="v5-stat-price" ${style.showPriceRange ? 'checked' : ''}> Price Range
        </label>
        <label class="v5-checkbox-label">
          <input type="checkbox" class="v5-checkbox" id="v5-stat-percent" ${style.showPercentPriceRange ? 'checked' : ''}> Percent
        </label>
        <label class="v5-checkbox-label">
          <input type="checkbox" class="v5-checkbox" id="v5-stat-bars" ${style.showBarsRange ? 'checked' : ''}> Bars Count
        </label>
        <label class="v5-checkbox-label">
          <input type="checkbox" class="v5-checkbox" id="v5-stat-time" ${style.showDateTimeRange ? 'checked' : ''}> Date / Time
        </label>
      </div>
    `;

    statsWrap.querySelector('#v5-stat-price').addEventListener('change', (e) => {
      style.showPriceRange = e.target.checked;
      style.showStats = this.hasAnyStat(style);
      this.triggerUpdate();
    });
    statsWrap.querySelector('#v5-stat-percent').addEventListener('change', (e) => {
      style.showPercentPriceRange = e.target.checked;
      style.showStats = this.hasAnyStat(style);
      this.triggerUpdate();
    });
    statsWrap.querySelector('#v5-stat-bars').addEventListener('change', (e) => {
      style.showBarsRange = e.target.checked;
      style.showStats = this.hasAnyStat(style);
      this.triggerUpdate();
    });
    statsWrap.querySelector('#v5-stat-time').addEventListener('change', (e) => {
      style.showDateTimeRange = e.target.checked;
      style.showStats = this.hasAnyStat(style);
      this.triggerUpdate();
    });

    container.appendChild(statsWrap);
  }

  hasAnyStat(style) {
    return !!(style.showPriceRange || style.showPercentPriceRange || style.showBarsRange || style.showDateTimeRange);
  }

  // --- TAB 2: TEXT ---
  renderTextTab(container) {
    const d = this.currentDrawing;
    const style = d.style || {};

    const textWrap = document.createElement('div');
    textWrap.style.display = 'flex';
    textWrap.style.flexDirection = 'column';
    textWrap.style.gap = '12px';

    const currentText = d.text || style.text || '';
    textWrap.innerHTML = `
      <div class="v5-control-row">
        <span class="v5-control-label">Text Content</span>
      </div>
      <textarea class="v5-input" id="v5-text-content" rows="4" style="width: 100%; resize: vertical;">${currentText}</textarea>
      
      <div class="v5-control-row">
        <span class="v5-control-label">Font Size</span>
        <div class="v5-control-inputs">
          <select class="v5-select" id="v5-text-size">
            ${[10, 11, 12, 14, 16, 20, 24, 28, 36].map(s => `<option value="${s}" ${(style.fontSize || 14) === s ? 'selected' : ''}>${s}px</option>`).join('')}
          </select>
          <label class="v5-checkbox-label">
            <input type="checkbox" class="v5-checkbox" id="v5-text-bold" ${style.bold ? 'checked' : ''}> Bold
          </label>
          <label class="v5-checkbox-label">
            <input type="checkbox" class="v5-checkbox" id="v5-text-italic" ${style.italic ? 'checked' : ''}> Italic
          </label>
        </div>
      </div>

      <div class="v5-control-row">
        <span class="v5-control-label">Text Color</span>
        <input type="color" class="v5-color-input" id="v5-text-color" value="${this.toHex(style.textColor || style.color || '#ffffff')}">
      </div>
    `;

    textWrap.querySelector('#v5-text-content').addEventListener('input', (e) => {
      d.text = e.target.value;
      style.text = e.target.value;
      this.triggerUpdate();
    });
    textWrap.querySelector('#v5-text-size').addEventListener('change', (e) => {
      style.fontSize = Number(e.target.value);
      this.triggerUpdate();
    });
    textWrap.querySelector('#v5-text-bold').addEventListener('change', (e) => {
      style.bold = e.target.checked;
      this.triggerUpdate();
    });
    textWrap.querySelector('#v5-text-italic').addEventListener('change', (e) => {
      style.italic = e.target.checked;
      this.triggerUpdate();
    });
    textWrap.querySelector('#v5-text-color').addEventListener('input', (e) => {
      style.textColor = e.target.value;
      this.triggerUpdate();
    });

    container.appendChild(textWrap);
  }

  // --- TAB 3: COORDINATES ---
  renderCoordinatesTab(container) {
    const d = this.currentDrawing;
    const points = d.points || [];

    const coordWrap = document.createElement('div');
    coordWrap.style.display = 'flex';
    coordWrap.style.flexDirection = 'column';
    coordWrap.style.gap = '14px';

    points.forEach((pt, idx) => {
      const row = document.createElement('div');
      row.className = 'v5-control-row';
      const dateStr = typeof pt.time === 'number' ? new Date(pt.time * 1000).toISOString().slice(0, 19).replace('T', ' ') : String(pt.time);
      row.innerHTML = `
        <span class="v5-control-label">Point ${idx + 1}</span>
        <div class="v5-control-inputs">
          <label style="font-size: 11px; color: #787b86;">Price:</label>
          <input type="number" step="0.25" class="v5-input" id="v5-pt-price-${idx}" value="${pt.price}" style="width: 90px;">
          <label style="font-size: 11px; color: #787b86; margin-left: 6px;">Time (s):</label>
          <input type="number" class="v5-input" id="v5-pt-time-${idx}" value="${pt.time}" style="width: 100px;">
        </div>
      `;

      row.querySelector(`#v5-pt-price-${idx}`).addEventListener('input', (e) => {
        pt.price = Number(e.target.value);
        this.triggerUpdate();
      });
      row.querySelector(`#v5-pt-time-${idx}`).addEventListener('input', (e) => {
        pt.time = Number(e.target.value);
        this.triggerUpdate();
      });

      coordWrap.appendChild(row);
    });

    container.appendChild(coordWrap);
  }

  // --- TAB 4: VISIBILITY ---
  renderVisibilityTab(container) {
    const d = this.currentDrawing;
    if (!d.visibility) {
      d.visibility = {
        ticks: true,
        ranges: true,
        seconds: { on: true, from: 1, to: 59 },
        minutes: { on: true, from: 1, to: 59 },
        hours: { on: true, from: 1, to: 24 },
        days: { on: true, from: 1, to: 366 },
        weeks: { on: true, from: 1, to: 52 },
        months: { on: true, from: 1, to: 12 }
      };
    }
    const vis = d.visibility;

    const visGrid = document.createElement('div');
    visGrid.className = 'v5-vis-grid';

    const intervals = [
      { key: 'minutes', label: 'Minutes', min: 1, max: 59 },
      { key: 'hours', label: 'Hours', min: 1, max: 24 },
      { key: 'days', label: 'Days', min: 1, max: 366 },
      { key: 'weeks', label: 'Weeks', min: 1, max: 52 },
      { key: 'months', label: 'Months', min: 1, max: 12 },
      { key: 'seconds', label: 'Seconds', min: 1, max: 59 }
    ];

    intervals.forEach(intv => {
      const u = vis[intv.key] || { on: true, from: intv.min, to: intv.max };
      const row = document.createElement('div');
      row.className = 'v5-vis-row';
      row.innerHTML = `
        <label class="v5-checkbox-label">
          <input type="checkbox" class="v5-checkbox" id="v5-vis-${intv.key}" ${u.on ? 'checked' : ''}>
          <span>${intv.label}</span>
        </label>
        <div class="v5-vis-inputs">
          <input type="number" class="v5-input" id="v5-vis-from-${intv.key}" value="${u.from}" min="1" max="${intv.max}">
          <span style="color: #787b86;">to</span>
          <input type="number" class="v5-input" id="v5-vis-to-${intv.key}" value="${u.to}" min="1" max="${intv.max}">
        </div>
      `;

      row.querySelector(`#v5-vis-${intv.key}`).addEventListener('change', (e) => {
        u.on = e.target.checked;
        this.triggerUpdate();
      });
      row.querySelector(`#v5-vis-from-${intv.key}`).addEventListener('input', (e) => {
        u.from = Number(e.target.value);
        this.triggerUpdate();
      });
      row.querySelector(`#v5-vis-to-${intv.key}`).addEventListener('input', (e) => {
        u.to = Number(e.target.value);
        this.triggerUpdate();
      });

      visGrid.appendChild(row);
    });

    container.appendChild(visGrid);
  }

  // --- TEMPLATES MENU ---
  openTemplateMenu(anchorBtn) {
    const existing = document.getElementById('v5-tpl-popup');
    if (existing) { existing.remove(); return; }

    const popup = document.createElement('div');
    popup.id = 'v5-tpl-popup';
    popup.className = 'v5-flyout';
    const rect = anchorBtn.getBoundingClientRect();
    popup.style.left = rect.left + 'px';
    popup.style.bottom = (window.innerHeight - rect.top + 6) + 'px';

    const tpls = this.storage ? this.storage.loadTemplates(this.currentDrawing.kind) : {};
    const tplNames = Object.keys(tpls);

    let html = `
      <button class="v5-flyout-item" id="v5-tpl-save-as"><b>+ Save As Template...</b></button>
      <button class="v5-flyout-item" id="v5-tpl-reset">Reset to Default</button>
    `;

    if (tplNames.length > 0) {
      html += `<div class="v5-section-title">Saved Templates</div>`;
      tplNames.forEach(name => {
        html += `<button class="v5-flyout-item v5-tpl-apply" data-name="${name}">${name}</button>`;
      });
    }

    popup.innerHTML = html;

    popup.querySelector('#v5-tpl-save-as').addEventListener('click', () => {
      popup.remove();
      const name = prompt('Nhập tên Template mới:');
      if (name && name.trim()) {
        this.storage.saveTemplate(this.currentDrawing.kind, name.trim(), this.currentDrawing.style);
        if (typeof showToast === 'function') showToast(`Đã lưu template "${name.trim()}"`, 'info');
      }
    });

    popup.querySelector('#v5-tpl-reset').addEventListener('click', () => {
      popup.remove();
      const def = this.storage ? this.storage.loadDefaultStyle(this.currentDrawing.kind) : null;
      if (def) {
        this.currentDrawing.style = JSON.parse(JSON.stringify(def));
        this.triggerUpdate();
        this.renderBody(this.dom.querySelector('.v5-dialog-body'));
      }
    });

    popup.querySelectorAll('.v5-tpl-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        popup.remove();
        if (tpls[name]) {
          this.currentDrawing.style = JSON.parse(JSON.stringify(tpls[name]));
          this.triggerUpdate();
          this.renderBody(this.dom.querySelector('.v5-dialog-body'));
          if (typeof showToast === 'function') showToast(`Đã áp dụng template "${name}"`, 'info');
        }
      });
    });

    document.body.appendChild(popup);
    const closeListener = (e) => {
      if (!popup.contains(e.target) && e.target !== anchorBtn) {
        popup.remove();
        document.removeEventListener('pointerdown', closeListener);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', closeListener), 10);
  }

  triggerUpdate() {
    if (this.currentDrawing) {
      this.onApply(this.currentDrawing);
    }
  }

  // --- HELPERS ---
  supportsExtend(kind) {
    return ['trend-line', 'ray', 'extended-line', 'info-line', 'trend-angle', 'rectangle'].includes(kind);
  }

  supportsFill(kind) {
    return ['rectangle', 'circle', 'ellipse', 'triangle', 'rotated-rectangle', 'path', 'polyline', 'arc', 'curve', 'double-curve'].includes(kind);
  }

  supportsStats(kind) {
    return ['trend-line', 'info-line', 'price-range', 'date-range', 'date-and-price-range'].includes(kind);
  }

  supportsTextTab(drawing) {
    const textKinds = ['text', 'note', 'callout', 'comment', 'price-label', 'signpost', 'price-note', 'pin', 'rectangle', 'trend-line'];
    return textKinds.includes(drawing.kind);
  }

  formatKindTitle(kind) {
    if (!kind) return 'Drawing';
    return kind.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  toHex(color) {
    if (!color) return '#2962ff';
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    const match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(color);
    if (match) {
      return '#' + match.slice(1, 4).map(v => Number(v).toString(16).padStart(2, '0')).join('');
    }
    return '#2962ff';
  }
}

if (typeof module !== 'undefined') module.exports = DrawingSettingsDialogV5;
