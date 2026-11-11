/* Floating Quick Toolbar for LightweightChartsDrawing v5 */

class DrawingFloatBarV5 {
  constructor(options = {}) {
    this.onUpdate = options.onUpdate || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onClone = options.onClone || (() => {});
    this.onZOrder = options.onZOrder || (() => {});
    this.onOpenSettings = options.onOpenSettings || (() => {});
    this.dom = null;
    this.activeDrawing = null;
  }

  show(drawing, screenPos) {
    if (!drawing) return;
    this.activeDrawing = drawing;
    this.render(screenPos);
  }

  hide() {
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
    this.dom = null;
    this.activeDrawing = null;
  }

  render(screenPos = null) {
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }

    const d = this.activeDrawing;
    const style = d.style || {};

    const bar = document.createElement('div');
    bar.className = 'v5-floatbar';
    bar.id = 'v5-drawing-floatbar';

    // Position floatbar above drawing or at top of active chart
    const left = screenPos ? Math.max(70, Math.min(window.innerWidth - 300, screenPos.x - 120)) : 100;
    const top = screenPos ? Math.max(50, screenPos.y - 45) : 80;
    bar.style.left = `${left}px`;
    bar.style.top = `${top}px`;

    // 1. Color Picker
    const colorBtn = document.createElement('button');
    colorBtn.className = 'v5-fb-btn';
    colorBtn.title = 'Màu nét';
    const hexColor = this.toHex(style.color || '#2962ff');
    colorBtn.innerHTML = `<span class="v5-fb-color-swatch" style="background: ${hexColor};"></span>`;
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = hexColor;
    colorInput.style.display = 'none';
    colorInput.addEventListener('input', (e) => {
      style.color = e.target.value;
      colorBtn.querySelector('.v5-fb-color-swatch').style.background = e.target.value;
      this.onUpdate({ ...d, style });
    });
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      colorInput.click();
    });
    bar.appendChild(colorBtn);
    bar.appendChild(colorInput);

    // 2. Line Width Selector
    const widthBtn = document.createElement('button');
    widthBtn.className = 'v5-fb-btn';
    widthBtn.title = 'Độ dày nét';
    widthBtn.innerHTML = `<span style="font-weight: 600; font-size: 11px;">${style.width || 1}px</span>`;
    widthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextWidth = ((style.width || 1) % 4) + 1;
      style.width = nextWidth;
      widthBtn.innerHTML = `<span style="font-weight: 600; font-size: 11px;">${nextWidth}px</span>`;
      this.onUpdate({ ...d, style });
    });
    bar.appendChild(widthBtn);

    // 3. Line Style Selector (solid / dashed / dotted)
    const styleBtn = document.createElement('button');
    styleBtn.className = 'v5-fb-btn';
    styleBtn.title = 'Kiểu nét';
    const styleSymbols = { solid: '—', dashed: '╌', dotted: '┈' };
    styleBtn.innerHTML = `<span style="font-size: 14px;">${styleSymbols[style.lineStyle || 'solid'] || '—'}</span>`;
    styleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cycle = ['solid', 'dashed', 'dotted'];
      const nextIdx = (cycle.indexOf(style.lineStyle || 'solid') + 1) % cycle.length;
      style.lineStyle = cycle[nextIdx];
      styleBtn.innerHTML = `<span style="font-size: 14px;">${styleSymbols[style.lineStyle]}</span>`;
      this.onUpdate({ ...d, style });
    });
    bar.appendChild(styleBtn);

    bar.appendChild(this.createDivider());

    // 4. Lock / Unlock
    const lockBtn = document.createElement('button');
    lockBtn.className = 'v5-fb-btn';
    lockBtn.title = d.locked ? 'Mở khóa hình' : 'Khóa hình';
    lockBtn.innerHTML = TerminalIcons.svg(d.locked ? 'lock' : 'unlock');
    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      d.locked = !d.locked;
      lockBtn.innerHTML = TerminalIcons.svg(d.locked ? 'lock' : 'unlock');
      lockBtn.title = d.locked ? 'Mở khóa hình' : 'Khóa hình';
      this.onUpdate({ ...d, locked: d.locked });
    });
    bar.appendChild(lockBtn);

    // 5. Clone
    const cloneBtn = document.createElement('button');
    cloneBtn.className = 'v5-fb-btn';
    cloneBtn.title = 'Nhân bản (Ctrl+D)';
    cloneBtn.innerHTML = TerminalIcons.svg('copy');
    cloneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onClone(d);
    });
    bar.appendChild(cloneBtn);

    // 6. Z-Order: Bring Forward / Send Backward
    const upBtn = document.createElement('button');
    upBtn.className = 'v5-fb-btn';
    upBtn.title = 'Đưa lên trên';
    upBtn.innerHTML = TerminalIcons.svg('up');
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onZOrder(d, 'up');
    });
    bar.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.className = 'v5-fb-btn';
    downBtn.title = 'Đưa xuống dưới';
    downBtn.innerHTML = TerminalIcons.svg('down');
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onZOrder(d, 'down');
    });
    bar.appendChild(downBtn);

    bar.appendChild(this.createDivider());

    // 7. Settings Gear
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'v5-fb-btn';
    settingsBtn.title = 'Cài đặt chi tiết (Double Click)';
    settingsBtn.innerHTML = TerminalIcons.svg('settings');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenSettings(d);
    });
    bar.appendChild(settingsBtn);

    // 8. Delete
    const delBtn = document.createElement('button');
    delBtn.className = 'v5-fb-btn';
    delBtn.style.color = '#f23645';
    delBtn.title = 'Xóa hình (Del)';
    delBtn.innerHTML = TerminalIcons.svg('trash');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onDelete(d);
      this.hide();
    });
    bar.appendChild(delBtn);

    document.body.appendChild(bar);
    this.dom = bar;
  }

  createDivider() {
    const div = document.createElement('div');
    div.className = 'v5-fb-divider';
    return div;
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

if (typeof module !== 'undefined') module.exports = DrawingFloatBarV5;
