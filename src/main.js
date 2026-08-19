import { CanvasManager } from './ui/CanvasManager.js';
import { SidePanel } from './ui/SidePanel.js';
import { GraphParser } from './ui/GraphParser.js';
import { FlowchartInterpreter } from './engine/FlowchartInterpreter.js';
import { InterpreterContext } from './engine/InterpreterContext.js';
import { FileHandler } from './utils/FileHandler.js';
import { SamplePrograms } from './utils/SamplePrograms.js';
import { SafeEvaluator } from './evaluator/Evaluator.js';

class App {
  constructor() {
    this.canvasManager = null;
    this.sidePanel = null;
    this.interpreter = null;
    this.playInterval = null;
    this.playAnimationId = null;
    this.isWaitingForInput = false;

    this.init();
  }

  init() {
    const drawflowContainer = document.getElementById('drawflow');
    this.canvasManager = new CanvasManager(drawflowContainer);
    this.isGraphDirty = false;

    this.canvasManager.onDataChange = () => {
      this.isGraphDirty = true;
      if (this.interpreter && !this.playInterval) {
        this.interpreter = null;
        this.canvasManager.clearHighlight();
        this.sidePanel.setStatus('READY');
      }
    };

    this.sidePanel = new SidePanel({
      playBtn: document.getElementById('btn-play'),
      pauseBtn: document.getElementById('btn-pause'),
      stepBtn: document.getElementById('btn-step'),
      resetBtn: document.getElementById('btn-reset'),
      speedSelect: document.getElementById('speed-select'),
      speedSlider: document.getElementById('speed-slider'),
      speedValueBadge: document.getElementById('speed-value-badge'),
      statusBadge: document.getElementById('status-badge'),
      variablesTableBody: document.getElementById('variables-tbody'),
      consoleOutput: document.getElementById('console-output'),
      clearConsoleBtn: document.getElementById('btn-clear-console'),
      inputPromptContainer: document.getElementById('input-prompt-container'),
      promptInput: document.getElementById('prompt-input'),
      promptSubmitBtn: document.getElementById('prompt-submit-btn'),
      promptLabel: document.getElementById('prompt-label')
    });

    this.bindSidebarDrag();
    this.bindHeaderActions();
    this.bindExecutionEvents();

    // Check for auto-saved diagram or load default curriculum example
    const saved = FileHandler.loadFromLocalStorage();
    if (saved) {
      this.canvasManager.loadData(saved);
      setTimeout(() => this.resetExecution(), 120);
    } else {
      this.loadSample('rectangleArea');
    }
  }

  bindSidebarDrag() {
    const dragItems = document.querySelectorAll('.drag-item');
    dragItems.forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('node-type', item.dataset.node);
      });
    });

    const drawflowEl = document.getElementById('drawflow');
    drawflowEl.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    drawflowEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('node-type');
      if (!nodeType) return;

      const rect = drawflowEl.getBoundingClientRect();
      const posX = Math.max(20, e.clientX - rect.left - 90);
      const posY = Math.max(20, e.clientY - rect.top - 40);

      this.canvasManager.addNode(nodeType, posX, posY);
    });
  }

  bindHeaderActions() {
    // Sample select dropdown
    const sampleSelect = document.getElementById('sample-select');
    sampleSelect.addEventListener('change', (e) => {
      const sampleKey = e.target.value;
      if (sampleKey && SamplePrograms[sampleKey]) {
        this.loadSample(sampleKey);
      }
    });

    // Auto-Layout
    const autoLayoutBtn = document.getElementById('btn-auto-layout');
    if (autoLayoutBtn) {
      autoLayoutBtn.addEventListener('click', () => {
        this.canvasManager.autoLayout();
      });
    }

    // Save JSON
    document.getElementById('btn-save').addEventListener('click', () => {
      const data = this.canvasManager.exportData();
      FileHandler.saveToFile(data, 'flowchart.json');
    });

    // Load JSON
    const fileLoader = document.getElementById('file-input-loader');
    document.getElementById('btn-load-trigger').addEventListener('click', () => {
      fileLoader.value = '';
      fileLoader.click();
    });

    fileLoader.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const data = await FileHandler.loadFromFile(file);
        this.canvasManager.loadData(data);
        setTimeout(() => this.resetExecution(), 120);
      } catch (err) {
        alert(`Error loading file: ${err.message}`);
      }
    });

    // Clear Canvas
    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      if (confirm('Clear the flowchart canvas?')) {
        FileHandler.clearLocalStorage();
        this.canvasManager.clear();
        this.resetExecution();
      }
    });

    // Zoom Controls
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      this.canvasManager.zoomIn();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      this.canvasManager.zoomOut();
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
      this.canvasManager.zoomReset();
    });
  }

  bindExecutionEvents() {
    this.sidePanel.onPlay = () => this.startPlay();
    this.sidePanel.onPause = () => this.pausePlay();
    this.sidePanel.onStep = () => {
      this.pausePlay();
      this.executeStep(false);
    };
    this.sidePanel.onReset = () => this.resetExecution();
    this.sidePanel.onSpeedChange = () => {
      // If currently playing, seamlessly switch to new speed immediately
      if (this.playInterval || this.playAnimationId) {
        this.pausePlay();
        this.startPlay();
      }
    };
  }

  loadSample(sampleKey) {
    const sample = SamplePrograms[sampleKey];
    if (!sample) return;

    const sampleSelect = document.getElementById('sample-select');
    if (sampleSelect) {
      sampleSelect.value = sampleKey;
    }

    this.canvasManager.loadData(sample.data);
    setTimeout(() => this.resetExecution(), 120);
  }

  compileGraph() {
    const rawData = this.canvasManager.exportData();

    const { nodes, startNodeId, errors, warnings } = GraphParser.parseDrawflow(rawData, SafeEvaluator.hook);

    if (errors.length > 0) {
      this.sidePanel.setStatus('ERROR', errors[0]);
      return false;
    }

    if (!startNodeId) {
      this.sidePanel.setStatus('ERROR', 'No Start node found. Please add a Start (Oval) node.');
      return false;
    }

    if (nodes.size > 0) {
      FileHandler.saveToLocalStorage(rawData);
    }

    // Interactive input provider callback for live execution
    const inputProvider = (promptText, varName) => {
      const entered = prompt(promptText || `Enter value for ${varName}:`);
      return entered !== null ? entered : '0';
    };

    const context = new InterpreterContext({ inputProvider });
    this.interpreter = new FlowchartInterpreter({
      nodes,
      startNodeId,
      context,
      evaluator: SafeEvaluator.hook
    });

    if (warnings.length > 0) {
      console.warn('Flowchart warnings:', warnings);
    }

    return true;
  }

  executeStep(isAutoPlay = false) {
    if (this.isWaitingForInput) return;

    if (!this.interpreter || this.isGraphDirty || this.interpreter.context.isFinished) {
      this.isGraphDirty = false;
      const ok = this.compileGraph();
      if (!ok) return;
    }

    if (this.interpreter.context.isFinished) {
      this.sidePanel.setStatus('FINISHED');
      this.canvasManager.clearHighlight();
      return;
    }

    const currentId = this.interpreter.context.currentNodeId;
    this.canvasManager.highlightActiveNode(currentId);

    const snapshot = this.interpreter.step();

    // Update UI components
    this.sidePanel.updateVariables(snapshot.variables);
    this.sidePanel.updateConsole(snapshot.output);

    if (snapshot.error) {
      this.sidePanel.setStatus('ERROR', snapshot.error);
      this.pausePlay();
      return;
    }

    if (snapshot.isFinished) {
      this.sidePanel.setStatus('FINISHED');
      this.pausePlay();
      this.canvasManager.clearHighlight();
    } else {
      this.sidePanel.setStatus(isAutoPlay ? 'RUNNING' : 'STEPPING');
      // Highlight the next node and the active connection path between them
      if (snapshot.nextNodeId) {
        this.canvasManager.highlightActiveNode(snapshot.nextNodeId);
        this.canvasManager.highlightActiveConnection(currentId, snapshot.nextNodeId);
      }
    }
  }

  startPlay() {
    if (!this.interpreter || this.isGraphDirty || this.interpreter.context.isFinished) {
      this.isGraphDirty = false;
      const ok = this.compileGraph();
      if (!ok) return;
    }

    this.sidePanel.setStatus('RUNNING');
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    if (this.playAnimationId) {
      cancelAnimationFrame(this.playAnimationId);
      this.playAnimationId = null;
    }

    const speed = this.sidePanel.speed;

    if (speed === 0) {
      // Instant 0ms execution: batch steps per animation frame
      const runInstant = () => {
        let count = 0;
        const maxPerFrame = 500;
        while (!this.interpreter.context.isFinished && count < maxPerFrame && !this.isWaitingForInput) {
          const snapshot = this.interpreter.step();
          count++;

          if (snapshot.error || snapshot.isFinished) {
            this.sidePanel.updateVariables(snapshot.variables);
            this.sidePanel.updateConsole(snapshot.output);
            if (snapshot.error) {
              this.sidePanel.setStatus('ERROR', snapshot.error);
            } else {
              this.sidePanel.setStatus('FINISHED');
            }
            this.pausePlay();
            this.canvasManager.clearHighlight();
            return;
          }
        }

        // Update UI after batch
        this.sidePanel.updateVariables(this.interpreter.context.variables);
        this.sidePanel.updateConsole(this.interpreter.context.output);

        if (!this.interpreter.context.isFinished && !this.isWaitingForInput) {
          this.playAnimationId = requestAnimationFrame(runInstant);
        } else {
          this.pausePlay();
          this.canvasManager.clearHighlight();
        }
      };

      runInstant();
    } else {
      this.playInterval = setInterval(() => {
        if (!this.interpreter || this.interpreter.context.isFinished) {
          this.pausePlay();
          return;
        }
        this.executeStep(true);
      }, speed);
    }
  }

  pausePlay() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    if (this.playAnimationId) {
      cancelAnimationFrame(this.playAnimationId);
      this.playAnimationId = null;
    }
    if (this.interpreter && !this.interpreter.context.isFinished) {
      this.sidePanel.setStatus('PAUSED');
    }
  }

  resetExecution() {
    this.pausePlay();
    this.canvasManager.clearHighlight();
    const ok = this.compileGraph();
    this.sidePanel.updateVariables({});
    this.sidePanel.updateConsole([]);

    if (ok && this.interpreter && this.interpreter.startNodeId) {
      this.canvasManager.highlightActiveNode(this.interpreter.startNodeId);
      this.sidePanel.setStatus('READY');
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.flowchartApp = new App();
});
