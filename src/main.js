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
    this.isWaitingForInput = false;

    this.init();
  }

  init() {
    const drawflowContainer = document.getElementById('drawflow');
    this.canvasManager = new CanvasManager(drawflowContainer);

    this.sidePanel = new SidePanel({
      playBtn: document.getElementById('btn-play'),
      pauseBtn: document.getElementById('btn-pause'),
      stepBtn: document.getElementById('btn-step'),
      resetBtn: document.getElementById('btn-reset'),
      speedSelect: document.getElementById('speed-select'),
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

    // Load initial sample or saved data
    const saved = FileHandler.loadFromLocalStorage();
    if (saved) {
      this.canvasManager.loadData(saved);
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
      const posX = e.clientX - rect.left - 80;
      const posY = e.clientY - rect.top - 40;

      this.canvasManager.addNode(nodeType, posX, posY);
    });
  }

  bindHeaderActions() {
    // Sample select
    const sampleSelect = document.getElementById('sample-select');
    sampleSelect.addEventListener('change', (e) => {
      const sampleKey = e.target.value;
      if (sampleKey && SamplePrograms[sampleKey]) {
        this.loadSample(sampleKey);
      }
    });

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
        this.resetExecution();
      } catch (err) {
        alert(`Error loading file: ${err.message}`);
      }
    });

    // Clear Canvas
    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      if (confirm('Clear the entire flowchart canvas?')) {
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
    this.sidePanel.onStep = () => this.executeStep();
    this.sidePanel.onReset = () => this.resetExecution();
  }

  loadSample(sampleKey) {
    const sample = SamplePrograms[sampleKey];
    if (!sample) return;

    this.canvasManager.loadData(sample.data);
    this.resetExecution();
  }

  compileGraph() {
    const rawData = this.canvasManager.exportData();
    FileHandler.saveToLocalStorage(rawData);

    const { nodes, startNodeId, errors } = GraphParser.parseDrawflow(rawData, SafeEvaluator.hook);

    if (errors.length > 0) {
      this.sidePanel.setStatus('ERROR', errors[0]);
      return false;
    }

    // Custom input provider callback for interactive execution
    const inputProvider = (promptText, varName) => {
      // If we are in interactive UI mode and step/play hits input, return promise
      return prompt(promptText || `Enter ${varName}:`) || '0';
    };

    const context = new InterpreterContext({ inputProvider });
    this.interpreter = new FlowchartInterpreter({
      nodes,
      startNodeId,
      context,
      evaluator: SafeEvaluator.hook
    });

    return true;
  }

  executeStep() {
    if (this.isWaitingForInput) return;

    if (!this.interpreter || this.interpreter.context.isFinished) {
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
      this.sidePanel.setStatus('RUNNING');
      // Highlight the next node that will be executed
      if (snapshot.nextNodeId) {
        this.canvasManager.highlightActiveNode(snapshot.nextNodeId);
      }
    }
  }

  startPlay() {
    if (!this.interpreter || this.interpreter.context.isFinished) {
      const ok = this.compileGraph();
      if (!ok) return;
    }

    this.sidePanel.setStatus('RUNNING');
    if (this.playInterval) clearInterval(this.playInterval);

    this.playInterval = setInterval(() => {
      if (!this.interpreter || this.interpreter.context.isFinished) {
        this.pausePlay();
        return;
      }
      this.executeStep();
    }, this.sidePanel.speed);
  }

  pausePlay() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    if (this.interpreter && !this.interpreter.context.isFinished) {
      this.sidePanel.setStatus('PAUSED');
    }
  }

  resetExecution() {
    this.pausePlay();
    this.canvasManager.clearHighlight();
    this.compileGraph();
    this.sidePanel.updateVariables({});
    this.sidePanel.updateConsole([]);
    this.sidePanel.setStatus('READY');
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.flowchartApp = new App();
});
