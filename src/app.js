/**
 * iQOO Creator Studio - Main Application Controller
 */

import { TimelineEngine } from './engine/timeline.js';
import { BeatSnapEngine } from './engine/beatsnap.js';
import { RecipeEngine } from './engine/recipe.js';
import { JogWheelController } from './components/jogWheel.js';
import { ColorDialsController } from './components/colorDials.js';
import { OfficeKitBridge } from './bridge/officeBridge.js';
import { DemoRunnerAgent } from './agent/demoRunner.js';

class CreatorStudioApp {
  constructor() {
    this.currentViewMode = 'dual'; // 'dual' | 'canvas' | 'deck' | 'mobile'

    // Initialize Core Engines
    const mainCanvas = document.getElementById('mainCanvas');
    this.timeline = new TimelineEngine(mainCanvas);
    this.beatSnap = new BeatSnapEngine();
    this.recipe = new RecipeEngine();
    this.bridge = new OfficeKitBridge();

    // Initialize UI Components
    this.initControllers();
    this.initEventListeners();
    this.renderTimelineTracks();

    // Initialize Demo Automation Agent
    this.demoRunner = new DemoRunnerAgent(this);

    // Initial Sync
    this.syncBridge();
  }

  initControllers() {
    // Jog Wheel
    const outerWheel = document.getElementById('jogWheelOuter');
    const innerWheel = document.getElementById('jogWheelInner');
    const degDisplay = document.getElementById('jogDegreeDisplay');
    this.jogWheel = new JogWheelController(outerWheel, innerWheel, degDisplay, this.timeline, this.beatSnap);

    // Color Dials
    const dialsContainer = document.getElementById('colorDialsContainer');
    this.colorDials = new ColorDialsController(dialsContainer, this.timeline, this.beatSnap);
  }

  initEventListeners() {
    // View Mode Tabs
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.dataset.mode;
        this.switchView(mode);
      });
    });

    // Transport controls
    document.getElementById('btnTogglePlay')?.addEventListener('click', () => {
      this.timeline.togglePlay();
      this.bridge.sendCommand('togglePlay');
    });

    document.getElementById('btnDeckPlay')?.addEventListener('click', () => {
      this.timeline.togglePlay();
      this.bridge.sendCommand('togglePlay');
    });

    document.getElementById('btnJogStepBack')?.addEventListener('click', () => {
      this.jogWheel.stepByFrames(-1);
      this.bridge.sendCommand('step', { frames: -1 });
    });

    document.getElementById('btnJogStepFwd')?.addEventListener('click', () => {
      this.jogWheel.stepByFrames(1);
      this.bridge.sendCommand('step', { frames: 1 });
    });

    // Editing Operations
    document.getElementById('btnDeckSplit')?.addEventListener('click', () => {
      this.timeline.splitAtPlayhead();
      this.bridge.sendCommand('split');
    });

    document.getElementById('btnDeckDelete')?.addEventListener('click', () => {
      this.timeline.rippleDeleteCurrentClip();
      this.bridge.sendCommand('rippleDelete');
    });

    // BeatSnap AI Trigger
    document.getElementById('btnTriggerBeatSnap')?.addEventListener('click', () => {
      this.openBeatSnapModal();
    });

    document.getElementById('btnStartNpuAnalysis')?.addEventListener('click', async () => {
      await this.executeBeatSnapAI();
    });

    // .iqoo Recipe Export & Import
    document.getElementById('btnExportIqooRecipe')?.addEventListener('click', () => {
      this.openRecipeModal();
    });

    document.getElementById('btnCopyRecipePayload')?.addEventListener('click', () => {
      const jsonViewer = document.getElementById('recipeJsonViewer');
      navigator.clipboard.writeText(jsonViewer.textContent);
      const btn = document.getElementById('btnCopyRecipePayload');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = 'Copy JSON Recipe'; }, 1500);
    });

    document.getElementById('btnReconstructRecipe')?.addEventListener('click', () => {
      this.reconstructFromRecipePayload();
    });

    // Demo Runner Agent
    document.getElementById('btnStartDemoAgent')?.addEventListener('click', () => {
      this.demoRunner.startDemo();
    });

    document.getElementById('btnStopDemoAgent')?.addEventListener('click', () => {
      this.demoRunner.stopDemo();
    });

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        this.closeModal(modalId);
      });
    });

    // Timeline Engine Subscriptions
    this.timeline.subscribe((event, data) => {
      if (event === 'timeUpdate' || event === 'seek') {
        this.updateTimecodeDisplays(data.time);
        this.updatePlayheadPosition(data.time);
      } else if (event === 'playState') {
        this.updatePlayButtonIcons(data.isPlaying);
      } else if (event === 'timelineChanged') {
        this.renderTimelineTracks();
      } else if (event === 'colorGraded') {
        this.colorDials.updateAllFromEngine();
      }
    });

    // Timeline Click Seeking
    const tracksArea = document.getElementById('timelineTracksArea');
    tracksArea?.addEventListener('click', (e) => {
      const rect = tracksArea.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = clickX / rect.width;
      const targetTime = progress * this.timeline.duration;
      this.timeline.seek(targetTime);
      this.bridge.sendCommand('seek', { time: targetTime });
    });
  }

  syncBridge() {
    this.bridge.onCommand((type, msg) => {
      if (type === 'command') {
        const { action, payload } = msg;
        if (action === 'togglePlay') this.timeline.togglePlay();
        else if (action === 'seek') this.timeline.seek(payload.time);
        else if (action === 'step') this.jogWheel.stepByFrames(payload.frames);
        else if (action === 'split') this.timeline.splitAtPlayhead();
        else if (action === 'rippleDelete') this.timeline.rippleDeleteCurrentClip();
        else if (action === 'colorGrade') this.colorDials.setValue(payload.dialId, payload.value);
        else if (action === 'beatSnap') this.timeline.applyBeatSnapCuts(payload.beats);
      }
    });
  }

  switchView(mode) {
    this.currentViewMode = mode;

    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const laptopPane = document.getElementById('laptopPane');
    const phonePane = document.getElementById('phonePane');

    if (mode === 'dual') {
      laptopPane.style.display = 'flex';
      phonePane.style.display = 'flex';
      laptopPane.style.flex = '1.35';
      phonePane.style.flex = '0.95';
    } else if (mode === 'canvas') {
      laptopPane.style.display = 'flex';
      phonePane.style.display = 'none';
      laptopPane.style.flex = '1';
    } else if (mode === 'deck' || mode === 'mobile') {
      laptopPane.style.display = 'none';
      phonePane.style.display = 'flex';
      phonePane.style.flex = '1';
    }

    // Trigger canvas resize
    this.timeline.initCanvas();
  }

  updateTimecodeDisplays(timeSec) {
    const tcStr = this.timeline.getTimecodeString(timeSec);
    const hudTimecode = document.getElementById('hudTimecode');
    const deckTimecode = document.getElementById('deckTimecode');
    if (hudTimecode) hudTimecode.textContent = tcStr;
    if (deckTimecode) deckTimecode.textContent = tcStr;
  }

  updatePlayheadPosition(timeSec) {
    const progress = (timeSec / this.timeline.duration) * 100;
    const playheadLine = document.getElementById('timelinePlayheadLine');
    if (playheadLine) {
      playheadLine.style.left = `${progress}%`;
    }
  }

  updatePlayButtonIcons(isPlaying) {
    const playIcons = document.querySelectorAll('.play-icon-symbol');
    playIcons.forEach(icon => {
      icon.textContent = isPlaying ? '⏸' : '▶';
    });
  }

  renderTimelineTracks() {
    const videoTrack = document.getElementById('trackVideoClips');
    const beatTrack = document.getElementById('trackBeatPins');
    if (!videoTrack || !beatTrack) return;

    // 1. Render Video Clips
    videoTrack.innerHTML = '';
    const dur = this.timeline.duration;

    this.timeline.clips.forEach((clip, idx) => {
      const leftPercent = (clip.start / dur) * 100;
      const widthPercent = ((clip.end - clip.start) / dur) * 100;

      const clipEl = document.createElement('div');
      clipEl.className = `clip-block clip-video-${(idx % 3) + 1} ${idx === this.timeline.activeClipIndex ? 'selected' : ''}`;
      clipEl.style.left = `${leftPercent}%`;
      clipEl.style.width = `${widthPercent}%`;
      clipEl.textContent = clip.name;

      clipEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.timeline.seek(clip.start);
      });

      videoTrack.appendChild(clipEl);
    });

    // 2. Render Beat Pins
    beatTrack.innerHTML = '';
    this.timeline.beatMarkers.forEach(bt => {
      const leftPercent = (bt / dur) * 100;
      const pin = document.createElement('div');
      pin.className = 'beat-marker-pin';
      pin.style.left = `${leftPercent}%`;
      beatTrack.appendChild(pin);
    });
  }

  openBeatSnapModal() {
    const modal = document.getElementById('beatSnapModal');
    modal.classList.add('open');

    // Draw initial waveform
    const wfCanvas = document.getElementById('waveformCanvas');
    if (wfCanvas) {
      wfCanvas.width = wfCanvas.offsetWidth || 560;
      wfCanvas.height = 90;
      this.beatSnap.drawWaveform(wfCanvas, this.timeline.currentTime, this.timeline.beatMarkers);
    }
  }

  async executeBeatSnapAI() {
    const statusText = document.getElementById('npuAnalysisStatus');
    const progressBar = document.getElementById('npuProgressBar');
    const btn = document.getElementById('btnStartNpuAnalysis');

    btn.disabled = true;
    btn.textContent = 'Hexagon NPU Inferencing...';

    const result = await this.beatSnap.runAnalysis((prog, stage) => {
      if (progressBar) progressBar.style.width = `${prog}%`;
      if (statusText) statusText.textContent = stage;
      
      const wfCanvas = document.getElementById('waveformCanvas');
      if (wfCanvas) {
        this.beatSnap.drawWaveform(wfCanvas, this.timeline.currentTime, this.beatSnap.detectedTransients);
      }
    });

    // Apply cuts to timeline
    this.timeline.applyBeatSnapCuts(result.timestamps);
    this.bridge.sendCommand('beatSnap', { beats: result.timestamps });

    btn.disabled = false;
    btn.textContent = '✓ AI Sync Complete (52ms)';
  }

  openRecipeModal() {
    const modal = document.getElementById('recipeModal');
    modal.classList.add('open');

    const recipeObj = this.recipe.createRecipe(this.timeline);
    const serialized = this.recipe.serializeRecipe(recipeObj);

    // Update JSON viewer
    const jsonViewer = document.getElementById('recipeJsonViewer');
    jsonViewer.textContent = JSON.stringify(recipeObj, null, 2);

    // Update Size Badge
    const sizeBadge = document.getElementById('recipePayloadSize');
    sizeBadge.textContent = `${serialized.byteSize} Bytes (${serialized.formattedKb})`;

    // Draw QR Code
    const qrCanvas = document.getElementById('qrCanvas');
    qrCanvas.width = 160;
    qrCanvas.height = 160;
    this.recipe.renderQRCodeCanvas(qrCanvas, serialized.encoded);
  }

  reconstructFromRecipePayload() {
    const jsonViewer = document.getElementById('recipeJsonViewer');
    const res = this.recipe.deserializeRecipe(jsonViewer.textContent);
    if (res.success) {
      const r = res.recipe;
      this.timeline.clips = r.clips;
      this.timeline.beatMarkers = r.beats;
      this.timeline.colorParams = r.colorGrading;
      this.colorDials.updateAllFromEngine();
      this.renderTimelineTracks();
      this.closeModal('recipeModal');
      alert('✓ .iqoo Recipe successfully reconstructed offline!');
    } else {
      alert('Error parsing recipe: ' + res.error);
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new CreatorStudioApp();
});
