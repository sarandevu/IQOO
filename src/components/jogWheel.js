/**
 * iQOO Creator Studio - Tactile Rotary Jog Wheel Controller
 * 
 * Emulates physical editing console jog/shuttle wheel with velocity sensitivity,
 * degree readouts, synthesized audio click ticks, and haptic feedback.
 */

export class JogWheelController {
  constructor(wheelElement, innerWheelElement, degreeDisplayElement, timelineEngine, audioSynthesizer) {
    this.wheel = wheelElement;
    this.innerWheel = innerWheelElement;
    this.degreeDisplay = degreeDisplayElement;
    this.timeline = timelineEngine;
    this.audio = audioSynthesizer;

    this.isDragging = false;
    this.currentAngle = 0; // Total cumulative angle
    this.lastPointerAngle = 0;
    this.lastTickAngle = 0;
    this.degreesPerFrame = 6; // 60 frames per 360-deg rotation

    this.initEvents();
  }

  initEvents() {
    const onStart = (e) => {
      e.preventDefault();
      this.isDragging = true;
      const rect = this.wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      this.lastPointerAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
      this.lastTickAngle = this.currentAngle;
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const rect = this.wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const newAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
      let deltaAngle = newAngle - this.lastPointerAngle;

      // Handle 180/-180 wrap-around
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      this.rotate(deltaAngle);
      this.lastPointerAngle = newAngle;
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    // Mouse events
    this.wheel.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Touch events
    this.wheel.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }

  rotate(deltaAngle) {
    this.currentAngle += deltaAngle;
    this.innerWheel.style.transform = `rotate(${this.currentAngle}deg)`;

    // Update degree counter display
    const normalizedDeg = Math.round(this.currentAngle % 360);
    const displayDeg = normalizedDeg < 0 ? normalizedDeg + 360 : normalizedDeg;
    if (this.degreeDisplay) {
      this.degreeDisplay.textContent = `${String(displayDeg).padStart(3, '0')}°`;
    }

    // Check if we passed a frame step tick (e.g. every 6 degrees)
    const angleDiff = Math.abs(this.currentAngle - this.lastTickAngle);
    if (angleDiff >= this.degreesPerFrame) {
      const framesToStep = Math.floor(angleDiff / this.degreesPerFrame) * Math.sign(this.currentAngle - this.lastTickAngle);
      this.lastTickAngle += framesToStep * this.degreesPerFrame;

      // Step timeline
      this.timeline.stepFrames(framesToStep);

      // Trigger Tactile Haptic & Audio Tick
      this.triggerHapticTick();
    }
  }

  stepByFrames(count) {
    const angleDelta = count * this.degreesPerFrame;
    this.rotate(angleDelta);
  }

  triggerHapticTick() {
    // 1. Audio tick
    if (this.audio && typeof this.audio.playBeatClickSound === 'function') {
      this.audio.playBeatClickSound(1200);
    }

    // 2. Hardware vibration haptic
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    // 3. Visual pulse
    this.wheel.classList.remove('haptic-pulse');
    void this.wheel.offsetWidth; // force reflow
    this.wheel.classList.add('haptic-pulse');
  }
}
