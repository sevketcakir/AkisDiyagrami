import { CanvasManager } from './ui/CanvasManager.js';
import { SidePanel } from './ui/SidePanel.js';
import { GraphParser } from './ui/GraphParser.js';
import { FlowchartInterpreter } from './engine/FlowchartInterpreter.js';
import { InterpreterContext } from './engine/InterpreterContext.js';
import { FileHandler } from './utils/FileHandler.js';
import { SamplePrograms } from './utils/SamplePrograms.js';
import { SafeEvaluator } from './evaluator/Evaluator.js';
import { I18n } from './i18n/I18n.js';
import { CGenerator, CGeneratorError } from './generator/CGenerator.js';
import { DebugManager } from './ui/DebugManager.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-c.js';

class App {
  constructor() {
    this.canvasManager = null;
    this.sidePanel = null;
    this.debugManager = null;
    this.interpreter = null;
    this.playInterval = null;
    this.playAnimationId = null;
    this.isWaitingForInput = false;

    this.init();
  }

  init() {
    // Apply active language to DOM immediately
    I18n.updateDOM();

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

    this.debugManager = new DebugManager({
      watchInput: document.getElementById('watch-input'),
      watchAddBtn: document.getElementById('btn-add-watch'),
      watchesTableBody: document.getElementById('watches-tbody'),
      watchesBadge: document.getElementById('watches-count-badge'),
      replInput: document.getElementById('repl-input'),
      replSubmitBtn: document.getElementById('btn-repl-eval'),
      replOutput: document.getElementById('repl-output'),
      getContext: () => {
        if (!this.interpreter) {
          this.compileGraph();
        }
        return this.interpreter?.context;
      },
      onVariableMutated: (variables, floatVars) => {
        this.sidePanel.updateVariables(variables, floatVars);
      }
    });

    this.sidePanel.onClearRepl = () => {
      this.debugManager.clearReplLog();
    };

    this.sidePanel.onVariableEdit = (varName, newValueStr) => {
      if (!this.interpreter) {
        this.compileGraph();
      }
      const ctx = this.interpreter?.context;
      if (ctx) {
        try {
          SafeEvaluator.evaluateAssignment(`${varName} = ${newValueStr}`, ctx);
          this.sidePanel.updateVariables(ctx.variables, ctx.floatVars);
          this.debugManager.updateWatches(ctx);
          this.debugManager.logReplOutput(`${varName} = ${newValueStr}`, {
            isAssignment: true,
            result: ctx.getVariable(varName),
            variables: { ...ctx.variables }
          });
        } catch (err) {
          // If assignment evaluation failed and newValueStr is not already quoted and is not a number/boolean,
          // try interpreting as string literal (e.g. user typed hello instead of "hello")
          let handled = false;
          if (!newValueStr.startsWith('"') && !newValueStr.startsWith("'") && isNaN(Number(newValueStr)) && newValueStr !== 'true' && newValueStr !== 'false') {
            try {
              const escaped = JSON.stringify(newValueStr);
              SafeEvaluator.evaluateAssignment(`${varName} = ${escaped}`, ctx);
              this.sidePanel.updateVariables(ctx.variables, ctx.floatVars);
              this.debugManager.updateWatches(ctx);
              this.debugManager.logReplOutput(`${varName} = ${escaped}`, {
                isAssignment: true,
                result: ctx.getVariable(varName),
                variables: { ...ctx.variables }
              });
              handled = true;
            } catch {
              // fallback failed, proceed with original error
            }
          }
          if (!handled) {
            alert(`Error setting variable ${varName}: ${err.message}`);
            this.sidePanel.updateVariables(ctx.variables, ctx.floatVars);
          }
        }
      }
    };

    this.bindSidebarDrag();
    this.bindHeaderActions();
    this.bindExecutionEvents();
    this.setupLanguageSwitcher();
    this.setupHelpModal();
    this.setupCCodeModal();
    this.setupSpaghettiWarningModal();

    // Check for auto-saved diagram or load default curriculum example
    const saved = FileHandler.loadFromLocalStorage();
    if (saved) {
      this.canvasManager.loadData(saved);
      setTimeout(() => this.resetExecution(), 120);
    } else {
      this.loadSample('rectangleArea');
    }
  }

  setupHelpModal() {
    const modal = document.getElementById('help-modal');
    const triggerBtn = document.getElementById('btn-help-trigger');
    const closeBtn = document.getElementById('btn-close-help');

    if (!modal) return;

    const openModal = () => {
      modal.classList.remove('hidden');
    };

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    triggerBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Tab switching
    const tabBtns = modal.querySelectorAll('.modal-tab-btn');
    const tabContents = modal.querySelectorAll('.modal-tab-content');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabKey = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(`tab-${tabKey}`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  setupCCodeModal() {
    const modal = document.getElementById('c-code-modal');
    const triggerBtn = document.getElementById('btn-view-c-code');
    const closeBtn = document.getElementById('btn-close-c-code-modal');
    const copyBtn = document.getElementById('btn-copy-c-code');
    const downloadBtn = document.getElementById('btn-download-c-code');
    const codeOutput = document.getElementById('c-code-output');

    if (!modal) return;

    const openModal = () => {
      const rawData = this.canvasManager.exportData();
      const { nodes, startNodeId, errors, errorNodeId } = GraphParser.parseDrawflow(rawData, SafeEvaluator.hook);

      if (errors.length > 0) {
        this.sidePanel.setStatus('ERROR', errors[0]);
        if (errorNodeId) {
          this.canvasManager.highlightErrorNode(errorNodeId);
        }
        return;
      }

      if (!startNodeId) {
        this.sidePanel.setStatus('ERROR', I18n.t('errors.noStartNode'));
        return;
      }

      try {
        const { cCode } = CGenerator.generateCProgram(startNodeId, nodes);
        if (codeOutput) {
          codeOutput.innerHTML = Prism.highlight(cCode, Prism.languages.c, 'c');
          codeOutput.dataset.rawCode = cCode;
        }
        modal.style.display = 'flex';
      } catch (err) {
        if (err instanceof CGeneratorError) {
          if (err.nodeId) {
            this.canvasManager.highlightErrorNode(err.nodeId);
          }
          this.showSpaghettiWarning(err.message);
        } else {
          alert(`C Generator Error: ${err.message}`);
        }
      }
    };

    const closeModal = () => {
      modal.style.display = 'none';
    };

    triggerBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });

    // Copy to clipboard
    copyBtn?.addEventListener('click', async () => {
      const codeText = codeOutput?.dataset?.rawCode || codeOutput?.textContent || '';
      try {
        await navigator.clipboard.writeText(codeText);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = I18n.t('cCodeModal.copied');
        copyBtn.classList.add('btn-success');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('btn-success');
        }, 2000);
      } catch (e) {
        // Fallback copy
        const textarea = document.createElement('textarea');
        textarea.value = codeText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyBtn.textContent = I18n.t('cCodeModal.copied');
        setTimeout(() => { copyBtn.textContent = I18n.t('cCodeModal.copy'); }, 2000);
      }
    });

    // Download .c file
    downloadBtn?.addEventListener('click', () => {
      const codeText = codeOutput?.dataset?.rawCode || codeOutput?.textContent || '';
      const blob = new Blob([codeText], { type: 'text/x-csrc;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flowchart_program.c';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  setupSpaghettiWarningModal() {
    const modal = document.getElementById('spaghetti-warning-modal');
    const closeBtn = document.getElementById('btn-close-spaghetti-modal');
    const understoodBtn = document.getElementById('btn-spaghetti-understood');
    const msgEl = document.getElementById('spaghetti-warning-message');

    if (!modal) return;

    this.showSpaghettiWarning = (message) => {
      if (msgEl) {
        msgEl.textContent = message;
      }
      modal.style.display = 'flex';
    };

    const closeModal = () => {
      modal.style.display = 'none';
    };

    closeBtn?.addEventListener('click', closeModal);
    understoodBtn?.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });
  }

  setupLanguageSwitcher() {
    const updateSwitcherUI = (lang) => {
      const btnTr = document.getElementById('btn-lang-tr');
      const btnEn = document.getElementById('btn-lang-en');
      if (btnTr && btnEn) {
        btnTr.classList.toggle('active', lang === 'tr');
        btnEn.classList.toggle('active', lang === 'en');
      }
      this.populateSampleDropdown();
      this.canvasManager.refreshNodeLabels();
      this.sidePanel.refreshLocalization();
      this.debugManager?.refreshLocalization();
    };

    I18n.onLanguageChange((lang) => {
      updateSwitcherUI(lang);
    });

    updateSwitcherUI(I18n.getLanguage());
  }

  populateSampleDropdown() {
    const sampleSelect = document.getElementById('sample-select');
    if (!sampleSelect) return;

    const currentVal = sampleSelect.value;
    sampleSelect.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.disabled = true;
    if (!currentVal) defaultOpt.selected = true;
    defaultOpt.textContent = I18n.t('header.sampleSelectDefault');
    sampleSelect.appendChild(defaultOpt);

    for (const [key, sample] of Object.entries(SamplePrograms)) {
      const opt = document.createElement('option');
      opt.value = key;
      if (key === currentVal) opt.selected = true;
      opt.textContent = sample.name;
      sampleSelect.appendChild(opt);
    }
  }

  bindSidebarDrag() {
    const dragItems = document.querySelectorAll('.drag-item');
    const drawflowEl = document.getElementById('drawflow');
    let tapOffsetCounter = 0;

    dragItems.forEach((item) => {
      const nodeType = item.dataset.node;
      if (!nodeType) return;

      // 1. Desktop HTML5 Drag & Drop
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('node-type', nodeType);
      });

      // 2. Touch Drag & Drop (Tablets & Mobile)
      let touchStartX = 0;
      let touchStartY = 0;
      let isDragging = false;
      let ghost = null;
      let touchJustEnded = false;

      item.addEventListener('touchstart', (e) => {
        if (!e.touches?.[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = false;
        touchJustEnded = false;
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        if (!e.touches?.[0]) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const dist = Math.hypot(currentX - touchStartX, currentY - touchStartY);

        if (!isDragging && dist > 10) {
          isDragging = true;
          ghost = document.createElement('div');
          ghost.className = 'touch-drag-ghost';
          ghost.innerHTML = item.innerHTML;
          document.body.appendChild(ghost);
        }

        if (isDragging && ghost) {
          e.preventDefault(); // Prevent scrolling while dragging a node
          ghost.style.left = `${currentX}px`;
          ghost.style.top = `${currentY}px`;
        }
      }, { passive: false });

      item.addEventListener('touchend', (e) => {
        if (isDragging && ghost) {
          e.preventDefault();
          ghost.remove();
          ghost = null;
          touchJustEnded = true;
          setTimeout(() => { touchJustEnded = false; }, 300);

          const touch = e.changedTouches?.[0];
          if (touch && drawflowEl) {
            const rect = drawflowEl.getBoundingClientRect();
            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
              const zoom = this.canvasManager.editor.zoom || 1;
              const canvasX = this.canvasManager.editor.canvas_x || 0;
              const canvasY = this.canvasManager.editor.canvas_y || 0;
              const posX = Math.max(20, Math.round((touch.clientX - rect.left - canvasX) / zoom - 90));
              const posY = Math.max(20, Math.round((touch.clientY - rect.top - canvasY) / zoom - 40));
              this.canvasManager.addNode(nodeType, posX, posY);
            }
          }
          isDragging = false;
        }
      });

      item.addEventListener('touchcancel', () => {
        if (ghost) {
          ghost.remove();
          ghost = null;
        }
        isDragging = false;
      });

      // 3. Tap / Click to Add: Instantly adds node at visible canvas center
      item.addEventListener('click', () => {
        if (isDragging || touchJustEnded) return;
        const center = this.canvasManager.getVisibleCanvasCenter();
        const offset = (tapOffsetCounter++ % 6) * 16;
        this.canvasManager.addNode(nodeType, center.x + offset, center.y + offset);
      });
    });

    if (drawflowEl) {
      drawflowEl.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      drawflowEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData('node-type');
        if (!nodeType) return;

        const rect = drawflowEl.getBoundingClientRect();
        const zoom = this.canvasManager.editor.zoom || 1;
        const canvasX = this.canvasManager.editor.canvas_x || 0;
        const canvasY = this.canvasManager.editor.canvas_y || 0;
        const posX = Math.max(20, Math.round((e.clientX - rect.left - canvasX) / zoom - 90));
        const posY = Math.max(20, Math.round((e.clientY - rect.top - canvasY) / zoom - 40));

        this.canvasManager.addNode(nodeType, posX, posY);
      });
    }
  }

  bindHeaderActions() {
    // Language Switcher Buttons
    document.getElementById('btn-lang-tr')?.addEventListener('click', () => {
      I18n.setLanguage('tr');
    });

    document.getElementById('btn-lang-en')?.addEventListener('click', () => {
      I18n.setLanguage('en');
    });

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
      if (confirm(I18n.t('header.clearConfirm'))) {
        FileHandler.clearLocalStorage();
        this.canvasManager.clear();
        this.resetExecution();
      }
    });

    // Zoom Controls
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.canvasManager.zoomIn();
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.canvasManager.zoomOut();
    });
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
      this.canvasManager.zoomReset();
    });
    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
      this.canvasManager.zoomToFit();
    });

    // Global keyboard shortcut: Shift + F to Zoom to Fit
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        this.canvasManager.zoomToFit();
      }
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

    const { nodes, startNodeId, errors, warnings, errorNodeId } = GraphParser.parseDrawflow(rawData, SafeEvaluator.hook);

    if (errors.length > 0) {
      this.sidePanel.setStatus('ERROR', errors[0]);
      if (errorNodeId) {
        this.canvasManager.highlightErrorNode(errorNodeId);
      }
      return false;
    }

    if (!startNodeId) {
      this.sidePanel.setStatus('ERROR', I18n.t('errors.noStartNode'));
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

    if (!this.interpreter || this.isGraphDirty || this.interpreter.context.isFinished || this.interpreter.context.error) {
      this.isGraphDirty = false;
      this.resetExecution();
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
    this.sidePanel.updateVariables(snapshot.variables, this.interpreter.context.floatVars);
    this.sidePanel.updateConsole(snapshot.output);
    this.debugManager?.updateWatches(this.interpreter.context);

    if (snapshot.error) {
      this.sidePanel.setStatus('ERROR', snapshot.error);
      this.canvasManager.highlightErrorNode(currentId);
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
    if (!this.interpreter || this.isGraphDirty || this.interpreter.context.isFinished || this.interpreter.context.error) {
      this.isGraphDirty = false;
      this.resetExecution();
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
          const currentId = this.interpreter.context.currentNodeId;
          const snapshot = this.interpreter.step();
          count++;

          if (snapshot.error || snapshot.isFinished) {
            this.sidePanel.updateVariables(snapshot.variables, this.interpreter.context.floatVars);
            this.sidePanel.updateConsole(snapshot.output);
            this.debugManager?.updateWatches(this.interpreter.context);
            if (snapshot.error) {
              this.sidePanel.setStatus('ERROR', snapshot.error);
              this.canvasManager.highlightErrorNode(currentId);
            } else {
              this.sidePanel.setStatus('FINISHED');
            }
            this.pausePlay();
            this.canvasManager.clearHighlight();
            return;
          }
        }

        // Update UI after batch
        this.sidePanel.updateVariables(this.interpreter.context.variables, this.interpreter.context.floatVars);
        this.sidePanel.updateConsole(this.interpreter.context.output);
        this.debugManager?.updateWatches(this.interpreter.context);

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
    this.isWaitingForInput = false;
    this.sidePanel.hideInputPrompt();
    this.canvasManager.clearHighlight();
    const ok = this.compileGraph();
    this.sidePanel.updateVariables({});
    this.sidePanel.updateConsole([]);
    this.debugManager?.updateWatches(this.interpreter?.context);

    if (ok && this.interpreter && this.interpreter.startNodeId) {
      this.interpreter.reset();
      this.canvasManager.highlightActiveNode(this.interpreter.startNodeId);
      this.sidePanel.setStatus('READY');
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.flowchartApp = new App();
});
