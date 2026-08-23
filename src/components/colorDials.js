/**
 * iQOO Creator Studio - Hardware Color Grading Dials Controller
 */

export class ColorDialsController {
  constructor(containerElement, timelineEngine, audioSynthesizer) {
    this.container = containerElement;
    this.timeline = timelineEngine;
    this.audio = audioSynthesizer;
    this.dials = {};

    this.initDials();
  }

  initDials() {
    const dialConfigs = [
      { id: 'exposure', label: 'EXP', min: -50, max: 50, default: 0, unit: '' },
      { id: 'contrast', label: 'CONT', min: -50, max: 50, default: 10, unit: '%' },
      { id: 'saturation', label: 'SAT', min: -50, max: 50, default: 15, unit: '%' },
      { id: 'temperature', label: 'TEMP', min: -50, max: 50, default: 5, unit: 'K' },
      { id: 'tint', label: 'TINT', min: -50, max: 50, default: 0, unit: '' }
    ];

    this.container.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'color-dials-row';

    dialConfigs.forEach(config => {
      const wrapper = document.createElement('div');
      wrapper.className = 'dial-control-wrapper';

      const knob = document.createElement('div');
      knob.className = 'rotary-dial-knob';
      knob.id = `dial-${config.id}`;

      const indicator = document.createElement('div');
      indicator.className = 'dial-indicator-line';
      knob.appendChild(indicator);

      const nameLabel = document.createElement('span');
      nameLabel.className = 'dial-name';
      nameLabel.textContent = config.label;

      const valueLabel = document.createElement('span');
      valueLabel.className = 'dial-value';
      valueLabel.id = `val-${config.id}`;
      valueLabel.textContent = `${config.default > 0 ? '+' : ''}${config.default}`;

      wrapper.appendChild(knob);
      wrapper.appendChild(nameLabel);
      wrapper.appendChild(valueLabel);
      row.appendChild(wrapper);

      this.dials[config.id] = {
        config,
        knob,
        indicator,
        valueLabel,
        currentValue: config.default
      };

      this.attachDialEvents(config.id, knob);
    });

    this.container.appendChild(row);
  }

  attachDialEvents(dialId, knobElement) {
    let startY = 0;
    let startVal = 0;
    let isDragging = false;

    const onStart = (e) => {
      e.preventDefault();
      isDragging = true;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      startVal = this.dials[dialId].currentValue;
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = startY - currentY; // dragging up increases value

      const config = this.dials[dialId].config;
      const range = config.max - config.min;
      const stepValue = Math.round(startVal + (deltaY / 2));
      const clamped = Math.max(config.min, Math.min(config.max, stepValue));

      if (clamped !== this.dials[dialId].currentValue) {
        this.setValue(dialId, clamped);
      }
    };

    const onEnd = () => {
      isDragging = false;
    };

    knobElement.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    knobElement.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }

  setValue(dialId, value) {
    const dial = this.dials[dialId];
    if (!dial) return;

    dial.currentValue = value;
    const config = dial.config;

    // Rotate indicator knob (-135deg to +135deg)
    const norm = (value - config.min) / (config.max - config.min);
    const angle = -135 + norm * 270;
    dial.knob.style.transform = `rotate(${angle}deg)`;

    // Update label
    dial.valueLabel.textContent = `${value > 0 ? '+' : ''}${value}${config.unit}`;

    // Apply to timeline engine
    this.timeline.applyColorGrade(dialId, value);

    // Audio & Haptic feedback
    if (this.audio && typeof this.audio.playBeatClickSound === 'function') {
      this.audio.playBeatClickSound(1800);
    }
  }

  updateAllFromEngine() {
    Object.keys(this.dials).forEach(key => {
      if (this.timeline.colorParams[key] !== undefined) {
        this.setValue(key, this.timeline.colorParams[key]);
      }
    });
  }
}
