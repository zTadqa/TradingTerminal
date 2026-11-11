/* v5 Drawing Migrator: converts legacy TradingTerminal v4 drawings to lightweight-charts-drawing format */
class DrawingMigratorV5 {
  convertVisibility(legacyVis) {
    if (!legacyVis) return undefined;
    const getUnit = (field, defMin, defMax) => {
      const u = legacyVis[field];
      if (!u) return { on: true, from: defMin, to: defMax };
      return {
        on: u.enabled !== false,
        from: Number.isFinite(u.min) ? u.min : defMin,
        to: Number.isFinite(u.max) ? u.max : defMax
      };
    };

    return {
      ticks: legacyVis.ticks ? legacyVis.ticks.enabled !== false : true,
      ranges: legacyVis.ranges ? legacyVis.ranges.enabled !== false : true,
      seconds: getUnit('seconds', 1, 59),
      minutes: getUnit('minutes', 1, 59),
      hours: getUnit('hours', 1, 24),
      days: getUnit('days', 1, 366),
      weeks: getUnit('weeks', 1, 52),
      months: getUnit('months', 1, 12)
    };
  }

  migrate(drawings) {
    if (!Array.isArray(drawings)) return { drawings: [], warnings: ['Input is not an array'] };
    const result = [];
    const warnings = [];

    for (let i = 0; i < drawings.length; i++) {
      const orig = drawings[i];
      if (!orig || !orig.type) {
        warnings.push(`Drawing #${i}: missing or invalid object`);
        continue;
      }
      try {
        const converted = this.migrateOne(orig, i);
        if (converted) {
          result.push(converted);
        } else {
          warnings.push(`Drawing '${orig.id || i}' (${orig.type}): could not migrate`);
        }
      } catch (err) {
        warnings.push(`Drawing '${orig.id || i}' (${orig.type}): error during migration: ${err.message}`);
      }
    }

    return { drawings: result, warnings };
  }

  migrateOne(d, index = 0) {
    if (!d || !d.type) return null;
    const id = d.id || `migrated_${d.type}_${index}_${Date.now()}`;
    const visibility = this.convertVisibility(d.visibility);
    const locked = !!d.locked;

    // Helper for point validation
    const validPoint = (p) => p && Number.isFinite(p.time) && Number.isFinite(p.price);

    switch (d.type) {
      case 'box': {
        if (!validPoint(d.p1) || !validPoint(d.p2)) return null;
        const color = d.borderColor || d.color || '#211f1d';
        const fillEnabled = d.fillEnabled !== false;
        const fillColor = d.fillColor || '#916966';
        const fillOpacity = Number.isFinite(d.fillOpacity) ? d.fillOpacity : 32;
        const transparency = Math.max(0, Math.min(100, 100 - fillOpacity));

        const style = {
          color: color,
          width: d.width || 1,
          lineStyle: d.lineStyle || 'solid',
          fillBackground: fillEnabled,
          backgroundColor: fillColor,
          transparency: transparency,
          extendLeft: d.extend === 'left' || d.extend === 'both',
          extendRight: d.extend === 'right' || d.extend === 'both'
        };

        if (d.middleLine && d.middleLine.enabled) {
          style.rectMiddleLine = {
            visible: true,
            color: d.middleLine.color || '#ffffff',
            width: d.middleLine.width || 1,
            style: d.middleLine.style || 'solid'
          };
        }

        if (d.text) {
          style.text = d.text;
          if (d.textStyle) {
            style.textColor = d.textStyle.color || '#ffffff';
            style.fontSize = d.textStyle.size || 12;
            style.bold = !!d.textStyle.bold;
            style.italic = !!d.textStyle.italic;
            style.horzLabelsAlign = d.textStyle.horizontal || 'right';
            style.vertLabelsAlign = d.textStyle.vertical === 'above' ? 'top' : (d.textStyle.vertical === 'below' ? 'bottom' : 'middle');
          }
        }

        return {
          id,
          kind: 'rectangle',
          points: [
            { time: d.p1.time, price: d.p1.price },
            { time: d.p2.time, price: d.p2.price }
          ],
          style,
          locked,
          visibility
        };
      }

      case 'line': {
        if (!validPoint(d.p1)) return null;
        const color = d.color || '#211f1d';

        if (d.axis === 'vertical') {
          return {
            id,
            kind: 'vertical-line',
            points: [{ time: d.p1.time, price: d.p1.price }],
            style: {
              color,
              width: d.width || 1,
              lineStyle: d.lineStyle || 'solid'
            },
            locked,
            visibility
          };
        }

        if (!validPoint(d.p2)) return null;

        const style = {
          color,
          width: d.width || 1,
          lineStyle: d.lineStyle || 'solid',
          extendLeft: d.extend === 'left' || d.extend === 'both',
          extendRight: d.extend === 'right' || d.extend === 'both'
        };

        if (d.stats) {
          style.showMiddlePoint = !!d.stats.middle;
          const hasStats = !!(d.stats.price || d.stats.percent || d.stats.bars || d.stats.time);
          if (hasStats) {
            style.showStats = true;
            style.showPriceRange = !!d.stats.price;
            style.showPercentPriceRange = !!d.stats.percent;
            style.showBarsRange = !!d.stats.bars;
            style.showDateTimeRange = !!d.stats.time;
          }
        }

        if (d.text) {
          style.text = d.text;
          if (d.textStyle) {
            style.textColor = d.textStyle.color;
            style.fontSize = d.textStyle.size;
            style.bold = !!d.textStyle.bold;
            style.italic = !!d.textStyle.italic;
          }
        }

        return {
          id,
          kind: 'trend-line',
          points: [
            { time: d.p1.time, price: d.p1.price },
            { time: d.p2.time, price: d.p2.price }
          ],
          style,
          locked,
          visibility
        };
      }

      case 'hline': {
        if (!validPoint(d.p1)) return null;
        return {
          id,
          kind: 'horizontal-line',
          points: [{ time: d.p1.time, price: d.p1.price }],
          style: {
            color: d.color || '#211f1d',
            width: d.width || 1,
            lineStyle: d.lineStyle || 'solid'
          },
          locked,
          visibility
        };
      }

      case 'fib': {
        if (!validPoint(d.p1) || !validPoint(d.p2)) return null;
        // CRITICAL: In lightweight-charts-drawing, coefficient 0 is at points[1]
        // while in legacy DrawingModel, coefficient 0 is at p1.
        // Therefore points must be reversed: [p2, p1].
        const color = d.color || '#211f1d';
        const rawLevels = Array.isArray(d.levels) ? d.levels : [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const levels = rawLevels.map(coeff => ({
          coeff: Number(coeff),
          color: color,
          visible: true
        }));

        const style = {
          color,
          width: d.width || 1,
          lineStyle: d.lineStyle || 'solid',
          levels,
          extendLines: d.extend === 'right' || d.extend === 'both',
          showText: true
        };

        return {
          id,
          kind: 'fib-retracement',
          points: [
            { time: d.p2.time, price: d.p2.price },
            { time: d.p1.time, price: d.p1.price }
          ],
          style,
          locked,
          visibility
        };
      }

      case 'text': {
        if (!validPoint(d.p1)) return null;
        const textStyle = d.textStyle || {};
        const textColor = textStyle.color || d.color || '#211f1d';
        return {
          id,
          kind: 'text',
          points: [{ time: d.p1.time, price: d.p1.price }],
          text: d.text || 'Text',
          style: {
            color: textColor,
            textColor: textColor,
            fontSize: textStyle.size || 14,
            bold: !!textStyle.bold,
            italic: !!textStyle.italic
          },
          locked,
          visibility
        };
      }

      case 'position': {
        if (!validPoint(d.p1) || !validPoint(d.p2)) return null;
        const entry = d.p1.price;
        const target = d.p2.price;
        const rr = d.riskReward > 0 ? d.riskReward : 2;
        const isLong = target >= entry;
        const stop = isLong ? entry - Math.abs(target - entry) / rr : entry + Math.abs(entry - target) / rr;

        const stopLevel = Math.abs(entry - stop);
        const profitLevel = Math.abs(target - entry);

        return {
          id,
          kind: isLong ? 'long-position' : 'short-position',
          points: [{ time: d.p1.time, price: d.p1.price }],
          style: {
            color: '#808080',
            width: 1,
            lineStyle: 'solid',
            stopLevel,
            profitLevel,
            stopColor: '#f23645',
            stopTransparency: 80,
            targetColor: '#089981',
            targetTransparency: 80,
            showPriceLabels: true,
            accountSize: 1000,
            riskPercent: 25,
            lotSize: 1
          },
          locked,
          visibility
        };
      }

      case 'measure': {
        if (!validPoint(d.p1) || !validPoint(d.p2)) return null;
        return {
          id,
          kind: 'date-and-price-range',
          points: [
            { time: d.p1.time, price: d.p1.price },
            { time: d.p2.time, price: d.p2.price }
          ],
          style: {
            color: d.color || '#2962ff',
            width: d.width || 1,
            lineStyle: d.lineStyle || 'solid',
            showPriceRange: true,
            showPercentPriceRange: true,
            showBarsRange: true,
            showDateTimeRange: true
          },
          locked,
          visibility
        };
      }

      default:
        return null;
    }
  }
}

if (typeof module !== 'undefined') module.exports = DrawingMigratorV5;
