/**
 * iQOO Creator Studio - Video Demo Automation Agent
 * 
 * Automates the presentation script and screen interactions for video recording & live pitches.
 */

export class DemoRunnerAgent {
  constructor(app) {
    this.app = app;
    this.isRunning = false;
    this.currentStepIndex = 0;
    this.banner = document.getElementById('demoAgentBanner');
    this.stepTag = document.getElementById('narrationStepTag');
    this.speechText = document.getElementById('narrationSpeechText');
    this.pointer = document.getElementById('demoSpotlightPointer');

    this.steps = [
      {
        time: '0:00 - 0:25',
        title: 'STAGE 1: THE MOBILE EDITING PAIN',
        speech: 'Creators want to edit on the go, but mobile editing forces complex timelines onto tiny screens without tactile control.',
        action: async () => {
          this.app.switchView('dual');
          await this.movePointerTo('#btnTogglePlay');
          await this.clickPointer();
          this.app.timeline.play();
          await this.sleep(1800);
          this.app.timeline.pause();
          await this.movePointerTo('#btnJogStepFwd');
          await this.clickPointer();
          this.app.jogWheel.stepByFrames(5);
          await this.sleep(1200);
        }
      },
      {
        time: '0:25 - 1:00',
        title: 'STAGE 2: BEATSNAP ON-DEVICE AI',
        speech: 'Instead of manual beat hunting, BeatSnap uses Snapdragon 8 Elite on-device NPU to detect audio transients in 52ms and snap cuts.',
        action: async () => {
          await this.movePointerTo('#btnTriggerBeatSnap');
          await this.clickPointer();
          this.app.openBeatSnapModal();
          await this.sleep(400);
          await this.movePointerTo('#btnStartNpuAnalysis');
          await this.clickPointer();
          await this.app.executeBeatSnapAI();
          await this.sleep(1600);
          this.app.closeModal('beatSnapModal');
          await this.sleep(800);
        }
      },
      {
        time: '1:00 - 1:45',
        title: 'STAGE 3: STUDIO MODE & CREATOR DECK',
        speech: 'At the desk, Office Kit connects phone and PC: the laptop becomes the 4K canvas, while the iQOO phone becomes the Creator Deck hardware.',
        action: async () => {
          this.app.switchView('dual');
          await this.movePointerTo('.jog-wheel-outer');
          // Rotate jog wheel smoothly
          for (let i = 0; i < 15; i++) {
            this.app.jogWheel.stepByFrames(3);
            await this.sleep(80);
          }
          await this.sleep(600);
          await this.movePointerTo('#btnDeckSplit');
          await this.clickPointer();
          this.app.timeline.splitAtPlayhead();
          await this.sleep(1000);
        }
      },
      {
        time: '1:45 - 2:20',
        title: 'STAGE 4: TACTILE COLOR GRADING',
        speech: 'Rotary hardware dials provide physical control over exposure, saturation, and temperature with instant real-time canvas updates.',
        action: async () => {
          await this.movePointerTo('#dial-exposure');
          this.app.colorDials.setValue('exposure', 24);
          await this.sleep(600);
          await this.movePointerTo('#dial-temperature');
          this.app.colorDials.setValue('temperature', 28);
          await this.sleep(600);
          await this.movePointerTo('#dial-saturation');
          this.app.colorDials.setValue('saturation', 35);
          await this.sleep(1200);
        }
      },
      {
        time: '2:20 - 2:45',
        title: 'STAGE 5: .IQOO PORTABLE RECIPE & QR',
        speech: 'Move the edit, not the media. The entire edit state serializes into an 840-byte .iqoo recipe transferable via offline QR code.',
        action: async () => {
          await this.movePointerTo('#btnExportIqooRecipe');
          await this.clickPointer();
          this.app.openRecipeModal();
          await this.sleep(2200);
          this.app.closeModal('recipeModal');
        }
      },
      {
        time: '2:45 - 3:00',
        title: 'STAGE 6: CONCLUSION',
        speech: '“We did not make the phone a smaller desktop editor. We made the phone the editing hardware.”',
        action: async () => {
          this.hidePointer();
          this.app.timeline.play();
          await this.sleep(2500);
        }
      }
    ];
  }

  async startDemo() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.banner.classList.add('active');
    this.pointer.classList.add('active');

    for (let i = 0; i < this.steps.length; i++) {
      if (!this.isRunning) break;
      this.currentStepIndex = i;
      const step = this.steps[i];

      this.stepTag.textContent = `${step.time} | ${step.title}`;
      this.speechText.textContent = step.speech;

      await step.action();
      await this.sleep(1000);
    }

    this.stopDemo();
  }

  stopDemo() {
    this.isRunning = false;
    this.banner.classList.remove('active');
    this.pointer.classList.remove('active');
  }

  async movePointerTo(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    this.pointer.style.left = `${targetX}px`;
    this.pointer.style.top = `${targetY}px`;
    await this.sleep(500);
  }

  async clickPointer() {
    this.pointer.classList.add('clicking');
    await this.sleep(150);
    this.pointer.classList.remove('clicking');
    await this.sleep(150);
  }

  hidePointer() {
    this.pointer.classList.remove('active');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
