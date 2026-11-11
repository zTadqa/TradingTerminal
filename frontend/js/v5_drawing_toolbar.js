/* TradingTerminal v5 - 86 Drawing Tools Sidebar Toolbar */
const TerminalIcons = typeof module !== 'undefined' && module.exports
  ? require('./terminal_icons.js') : window.TerminalIcons;

const V5_TOOL_GROUPS = [
  {
    id: 'trend',
    title: 'Trend tools',
    icon: TerminalIcons.svg('trend'),
    sections: [
      {
        header: 'Lines',
        tools: [
          { kind: 'trend-line', title: 'Trendline', placement: '2 clicks' },
          { kind: 'ray', title: 'Ray', placement: '2 clicks' },
          { kind: 'info-line', title: 'Info line', placement: '2 clicks' },
          { kind: 'extended-line', title: 'Extended line', placement: '2 clicks' },
          { kind: 'trend-angle', title: 'Trend angle', placement: '2 clicks' },
          { kind: 'horizontal-line', title: 'Horizontal line', placement: '1 click' },
          { kind: 'horizontal-ray', title: 'Horizontal ray', placement: '1 click' },
          { kind: 'vertical-line', title: 'Vertical line', placement: '1 click' },
          { kind: 'cross-line', title: 'Cross line', placement: '1 click' }
        ]
      },
      {
        header: 'Channels',
        tools: [
          { kind: 'parallel-channel', title: 'Parallel channel', placement: '3 clicks' },
          { kind: 'regression-trend', title: 'Regression trend', placement: '2 clicks' },
          { kind: 'flat-top-bottom', title: 'Flat top/bottom', placement: '3 clicks' },
          { kind: 'disjoint-channel', title: 'Disjoint channel', placement: '3 clicks' }
        ]
      },
      {
        header: 'Pitchforks',
        tools: [
          { kind: 'pitchfork', title: 'Pitchfork', placement: '3 clicks' },
          { kind: 'schiff-pitchfork', title: 'Schiff pitchfork', placement: '3 clicks' },
          { kind: 'modified-schiff-pitchfork', title: 'Modified Schiff pitchfork', placement: '3 clicks' },
          { kind: 'inside-pitchfork', title: 'Inside pitchfork', placement: '3 clicks' }
        ]
      }
    ]
  },
  {
    id: 'fib',
    title: 'Gann and Fibonacci tools',
    icon: TerminalIcons.svg('fib'),
    sections: [
      {
        header: 'Fibonacci',
        tools: [
          { kind: 'fib-retracement', title: 'Fib retracement', placement: '2 clicks' },
          { kind: 'trend-based-fib-extension', title: 'Trend-based fib extension', placement: '3 clicks' },
          { kind: 'fib-channel', title: 'Fib channel', placement: '3 clicks' },
          { kind: 'fib-time-zone', title: 'Fib time zone', placement: '2 clicks' },
          { kind: 'fib-speed-resistance-fan', title: 'Fib speed resistance fan', placement: '2 clicks' },
          { kind: 'trend-based-fib-time', title: 'Trend-based fib time', placement: '3 clicks' },
          { kind: 'fib-circles', title: 'Fib circles', placement: '2 clicks' },
          { kind: 'fib-spiral', title: 'Fib spiral', placement: '2 clicks' },
          { kind: 'fib-speed-resistance-arcs', title: 'Fib speed resistance arcs', placement: '2 clicks' },
          { kind: 'fib-wedge', title: 'Fib wedge', placement: '3 clicks' },
          { kind: 'pitchfan', title: 'Pitchfan', placement: '3 clicks' }
        ]
      },
      {
        header: 'Gann',
        tools: [
          { kind: 'gann-box', title: 'Gann box', placement: '2 clicks' },
          { kind: 'gann-square-fixed', title: 'Gann square fixed', placement: '2 clicks' },
          { kind: 'gann-square', title: 'Gann square', placement: '2 clicks' },
          { kind: 'gann-fan', title: 'Gann fan', placement: '2 clicks' }
        ]
      }
    ]
  },
  {
    id: 'patterns',
    title: 'Patterns',
    icon: TerminalIcons.svg('patterns'),
    sections: [
      {
        header: 'Chart patterns',
        tools: [
          { kind: 'xabcd-pattern', title: 'XABCD pattern', placement: '5 clicks' },
          { kind: 'cypher-pattern', title: 'Cypher pattern', placement: '5 clicks' },
          { kind: 'head-and-shoulders', title: 'Head and shoulders', placement: '7 clicks' },
          { kind: 'abcd-pattern', title: 'ABCD pattern', placement: '4 clicks' },
          { kind: 'triangle-pattern', title: 'Triangle pattern', placement: '4 clicks' },
          { kind: 'three-drives-pattern', title: 'Three drives pattern', placement: '7 clicks' }
        ]
      },
      {
        header: 'Elliott waves',
        tools: [
          { kind: 'elliott-impulse', title: 'Elliott impulse wave (1-5)', placement: '6 clicks' },
          { kind: 'elliott-correction', title: 'Elliott correction wave (A-C)', placement: '4 clicks' },
          { kind: 'elliott-triangle', title: 'Elliott triangle wave (A-E)', placement: '6 clicks' },
          { kind: 'elliott-double-combo', title: 'Elliott double combo (W-Y)', placement: '4 clicks' },
          { kind: 'elliott-triple-combo', title: 'Elliott triple combo (W-Z)', placement: '6 clicks' }
        ]
      },
      {
        header: 'Cycles',
        tools: [
          { kind: 'cyclic-lines', title: 'Cyclic lines', placement: '2 clicks' },
          { kind: 'time-cycles', title: 'Time cycles', placement: '2 clicks' },
          { kind: 'sine-line', title: 'Sine line', placement: '2 clicks' }
        ]
      }
    ]
  },
  {
    id: 'forecast',
    title: 'Forecasting and measurement tools',
    icon: TerminalIcons.svg('forecast'),
    sections: [
      {
        header: 'Forecasting',
        tools: [
          { kind: 'long-position', title: 'Long position', placement: '1 click' },
          { kind: 'short-position', title: 'Short position', placement: '1 click' },
          { kind: 'position-forecast', title: 'Position forecast', placement: '2 clicks' },
          { kind: 'bar-pattern', title: 'Bars pattern', placement: '2 clicks' },
          { kind: 'ghost-feed', title: 'Ghost feed', placement: 'clicks, dbl-click finish' },
          { kind: 'sector', title: 'Sector', placement: '3 clicks' }
        ]
      },
      {
        header: 'Volume-based',
        tools: [
          { kind: 'anchored-vwap', title: 'Anchored VWAP', placement: '1 click' },
          { kind: 'fixed-range-volume-profile', title: 'Fixed range volume profile', placement: '2 clicks' },
          { kind: 'anchored-volume-profile', title: 'Anchored volume profile', placement: '1 click' }
        ]
      },
      {
        header: 'Measurers',
        tools: [
          { kind: 'price-range', title: 'Price range', placement: '2 clicks' },
          { kind: 'date-range', title: 'Date range', placement: '2 clicks' },
          { kind: 'date-and-price-range', title: 'Date and price range', placement: '2 clicks' }
        ]
      }
    ]
  },
  {
    id: 'shapes',
    title: 'Geometric shapes',
    icon: TerminalIcons.svg('shapes'),
    sections: [
      {
        header: 'Brushes',
        tools: [
          { kind: 'brush', title: 'Brush', placement: 'press, drag, release' },
          { kind: 'highlighter', title: 'Highlighter', placement: 'press, drag, release' }
        ]
      },
      {
        header: 'Arrows',
        tools: [
          { kind: 'arrow-marker', title: 'Arrow marker', placement: '2 clicks' },
          { kind: 'arrow', title: 'Arrow', placement: '2 clicks' },
          { kind: 'arrow-mark-up', title: 'Arrow mark up', placement: '1 click' },
          { kind: 'arrow-mark-down', title: 'Arrow mark down', placement: '1 click' }
        ]
      },
      {
        header: 'Shapes',
        tools: [
          { kind: 'rectangle', title: 'Rectangle', placement: '2 clicks' },
          { kind: 'rotated-rectangle', title: 'Rotated rectangle', placement: '3 clicks' },
          { kind: 'path', title: 'Path', placement: 'clicks, dbl-click finish' },
          { kind: 'circle', title: 'Circle', placement: '2 clicks' },
          { kind: 'ellipse', title: 'Ellipse', placement: '3 clicks' },
          { kind: 'polyline', title: 'Polyline', placement: 'clicks, dbl-click finish' },
          { kind: 'triangle', title: 'Triangle', placement: '3 clicks' },
          { kind: 'arc', title: 'Arc', placement: '3 clicks' },
          { kind: 'curve', title: 'Curve', placement: '2 clicks' },
          { kind: 'double-curve', title: 'Double curve', placement: '2 clicks' }
        ]
      }
    ]
  },
  {
    id: 'annotations',
    title: 'Annotation tools',
    icon: TerminalIcons.svg('text'),
    sections: [
      {
        header: 'Text and notes',
        tools: [
          { kind: 'text', title: 'Text', placement: '1 click + text' },
          { kind: 'note', title: 'Note', placement: '2 clicks + text' },
          { kind: 'price-note', title: 'Price note', placement: '2 clicks + text' },
          { kind: 'pin', title: 'Pin', placement: '1 click + text' },
          { kind: 'table', title: 'Table', placement: '1 click' },
          { kind: 'callout', title: 'Callout', placement: '2 clicks + text' },
          { kind: 'comment', title: 'Comment', placement: '1 click + text' },
          { kind: 'price-label', title: 'Price label', placement: '1 click' },
          { kind: 'signpost', title: 'Signpost', placement: '1 click + text' },
          { kind: 'flag-mark', title: 'Flag mark', placement: '1 click' }
        ]
      },
      {
        header: 'Content',
        tools: [
          { kind: 'image', title: 'Image', placement: '1 click' }
        ]
      }
    ]
  }
];

const V5_EMOJIS = [
  '🚀', '📈', '📉', '💰', '💵', '🔥', '⚡', '🎯', '✅', '❌', '⚠️', '⭐', '🔔', '⏰', '💡', '📌',
  '🐂', '🐻', '🐳', '🦄', '👍', '👎', '👀', '💎', '😀', '😎', '🤔', '😱', '🤯', '🥳', '😭', '🙏'
];

class DrawingToolbarV5 {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('left-sidebar');
    this.onSelectTool = options.onSelectTool || (() => {});
    this.onAction = options.onAction || (() => {});
    this.activeTool = null;
    this.activeGroup = null;
    this.magnetMode = 'off'; // 'off' | 'weak' | 'strong'
    this.stayInMode = false;
    this.isLocked = false;
    this.isHidden = false;
    this.currentFlyout = null;
    this.groupSelectedTools = new Map(); // remembers last selected tool per group
  }

  init() {
    if (!this.container) return;
    this.container.classList.add('v5-active');
    this.render();
  }

  render() {
    this.container.innerHTML = '<div class="terminal-brand sidebar-brand" title="Trading Terminal"><img src="assets/terminal-mark.svg" width="30" height="30" alt="Trading Terminal"></div>';

    // 1. Cursor button (Esc / Pointer)
    const cursorBtn = document.createElement('button');
    cursorBtn.className = `v5-tool-btn ${!this.activeTool ? 'active' : ''}`;
    cursorBtn.title = 'Con trỏ Crosshair / Select (Esc)';
    cursorBtn.innerHTML = TerminalIcons.svg('cursor');
    cursorBtn.addEventListener('click', () => {
      this.closeFlyout();
      this.setTool(null);
    });
    this.container.appendChild(cursorBtn);

    // 2. Tool Groups
    V5_TOOL_GROUPS.forEach(group => {
      const btn = document.createElement('button');
      btn.className = 'v5-tool-btn';
      btn.dataset.groupId = group.id;
      btn.title = group.title;
      btn.innerHTML = `${group.icon}<span class="v5-arrow-indicator"></span>`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentFlyout && this.currentFlyout.groupId === group.id) {
          this.closeFlyout();
        } else {
          this.openFlyout(btn, group);
        }
      });

      this.container.appendChild(btn);
    });

    // 3. Emoji Tool
    const emojiBtn = document.createElement('button');
    emojiBtn.className = 'v5-tool-btn';
    emojiBtn.title = 'Emoji / Biểu tượng';
    emojiBtn.innerHTML = TerminalIcons.svg('smile') + '<span class="v5-arrow-indicator"></span>';
    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEmojiFlyout(emojiBtn);
    });
    this.container.appendChild(emojiBtn);

    this.container.appendChild(this.createDivider());

    // 4. Magnet Tool
    const magnetBtn = document.createElement('button');
    magnetBtn.className = `v5-tool-btn ${this.magnetMode !== 'off' ? 'active' : ''}`;
    magnetBtn.title = `Nam châm hút giá (${this.magnetMode.toUpperCase()})`;
    magnetBtn.innerHTML = TerminalIcons.svg('magnet');
    magnetBtn.addEventListener('click', () => {
      this.cycleMagnet(magnetBtn);
    });
    this.container.appendChild(magnetBtn);

    // 5. Stay in Drawing Mode (Keep drawing)
    const keepBtn = document.createElement('button');
    keepBtn.className = `v5-tool-btn ${this.stayInMode ? 'active' : ''}`;
    keepBtn.title = 'Giữ chế độ vẽ liên tục (Stay in drawing mode)';
    keepBtn.innerHTML = TerminalIcons.svg('pencil');
    keepBtn.addEventListener('click', () => {
      this.stayInMode = !this.stayInMode;
      keepBtn.classList.toggle('active', this.stayInMode);
      this.onAction('stayInDrawingMode', this.stayInMode);
      if (typeof showToast === 'function') {
        showToast(this.stayInMode ? '✏️ Giữ chế độ vẽ: BẬT' : '✏️ Giữ chế độ vẽ: TẮT', 'info');
      }
    });
    this.container.appendChild(keepBtn);

    // 6. Lock All Drawings
    const lockBtn = document.createElement('button');
    lockBtn.className = `v5-tool-btn ${this.isLocked ? 'active' : ''}`;
    lockBtn.title = this.isLocked ? 'Mở khóa tất cả bản vẽ' : 'Khóa tất cả bản vẽ';
    lockBtn.innerHTML = TerminalIcons.svg('lock');
    lockBtn.addEventListener('click', () => {
      this.isLocked = !this.isLocked;
      lockBtn.classList.toggle('active', this.isLocked);
      this.onAction('lockAll', this.isLocked);
    });
    this.container.appendChild(lockBtn);

    // 7. Hide All Drawings
    const hideBtn = document.createElement('button');
    hideBtn.className = `v5-tool-btn ${this.isHidden ? 'active' : ''}`;
    hideBtn.title = this.isHidden ? 'Hiện tất cả bản vẽ' : 'Ẩn tất cả bản vẽ';
    hideBtn.innerHTML = TerminalIcons.svg('eye');
    hideBtn.addEventListener('click', () => {
      this.isHidden = !this.isHidden;
      hideBtn.classList.toggle('active', this.isHidden);
      this.onAction('hideAll', this.isHidden);
    });
    this.container.appendChild(hideBtn);

    // 8. Delete All Drawings
    const trashBtn = document.createElement('button');
    trashBtn.className = 'v5-tool-btn';
    trashBtn.title = 'Xóa toàn bộ bản vẽ trên chart hiện tại';
    trashBtn.innerHTML = TerminalIcons.svg('trash');
    trashBtn.addEventListener('click', () => {
      if (this.isLocked) {
        if (typeof showToast === 'function') showToast('⚠️ Bản vẽ đang bị khóa!', 'error');
        return;
      }
      if (confirm('Bạn có chắc chắn muốn xóa tất cả hình vẽ trên chart này?')) {
        this.onAction('clearAll');
      }
    });
    this.container.appendChild(trashBtn);

    // Global listener to close flyouts
    document.addEventListener('pointerdown', (e) => {
      if (this.currentFlyout && !this.currentFlyout.dom.contains(e.target) && !this.container.contains(e.target)) {
        this.closeFlyout();
      }
    });
  }

  openFlyout(anchorBtn, group) {
    this.closeFlyout();

    const flyout = document.createElement('div');
    flyout.className = 'v5-flyout';
    const rect = anchorBtn.getBoundingClientRect();
    flyout.style.left = `${rect.right + 6}px`;
    flyout.style.top = `${Math.max(10, Math.min(window.innerHeight - 380, rect.top - 20))}px`;

    group.sections.forEach(sec => {
      if (sec.header) {
        const header = document.createElement('div');
        header.className = 'v5-section-title';
        header.textContent = sec.header;
        flyout.appendChild(header);
      }

      sec.tools.forEach(tool => {
        const item = document.createElement('button');
        item.className = `v5-flyout-item ${this.activeTool === tool.kind ? 'active' : ''}`;
        item.innerHTML = `
          <span class="v5-tool-label">${TerminalIcons.tool(tool.kind)}<span>${tool.title}</span></span>
          <span class="v5-flyout-item-desc">${tool.placement}</span>
        `;
        item.addEventListener('click', () => {
          this.setTool(tool.kind, group.id);
          this.closeFlyout();
        });
        flyout.appendChild(item);
      });
    });

    document.body.appendChild(flyout);
    this.currentFlyout = { dom: flyout, groupId: group.id };
  }

  openEmojiFlyout(anchorBtn) {
    this.closeFlyout();

    const flyout = document.createElement('div');
    flyout.className = 'v5-flyout';
    const rect = anchorBtn.getBoundingClientRect();
    flyout.style.left = `${rect.right + 6}px`;
    flyout.style.top = `${Math.max(10, Math.min(window.innerHeight - 300, rect.top - 80))}px`;

    const title = document.createElement('div');
    title.className = 'v5-section-title';
    title.textContent = 'Icons & Emojis';
    flyout.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'v5-emoji-grid';

    V5_EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'v5-emoji-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        this.setTool('font-icon', 'emoji', { glyph: emoji });
        this.closeFlyout();
      });
      grid.appendChild(btn);
    });

    flyout.appendChild(grid);
    document.body.appendChild(flyout);
    this.currentFlyout = { dom: flyout, groupId: 'emoji' };
  }

  closeFlyout() {
    if (this.currentFlyout && this.currentFlyout.dom.parentNode) {
      this.currentFlyout.dom.parentNode.removeChild(this.currentFlyout.dom);
    }
    this.currentFlyout = null;
  }

  setTool(kind, groupId = null, options = null) {
    this.activeTool = kind;
    this.activeGroup = groupId;

    // Update active state on sidebar buttons
    this.container.querySelectorAll('.v5-tool-btn').forEach(b => {
      if (!kind) {
        b.classList.toggle('active', b.title.includes('Con trỏ'));
      } else if (b.dataset.groupId) {
        b.classList.toggle('active', b.dataset.groupId === groupId);
      } else {
        b.classList.remove('active');
      }
    });

    this.onSelectTool(kind, options);
  }

  cycleMagnet(btn) {
    const cycle = { off: 'weak', weak: 'strong', strong: 'off' };
    this.magnetMode = cycle[this.magnetMode] || 'off';
    btn.classList.toggle('active', this.magnetMode !== 'off');
    btn.title = `Nam châm hút giá (${this.magnetMode.toUpperCase()})`;
    this.onAction('setMagnet', this.magnetMode);
    if (typeof showToast === 'function') {
      showToast(`🧲 Nam châm: ${this.magnetMode.toUpperCase()}`, 'info');
    }
  }

  createDivider() {
    const d = document.createElement('div');
    d.className = 'v5-sidebar-divider';
    return d;
  }
}

if (typeof module !== 'undefined') module.exports = DrawingToolbarV5;
