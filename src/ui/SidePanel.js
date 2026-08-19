import { I18n } from '../i18n/I18n.js';

/**
 * @class SidePanel
 * Manages execution controls, variable watcher table, output console, and runtime prompts.
 */
export class SidePanel {
  /**
   * @param {Object} elements
   * @param {HTMLElement} elements.playBtn
   * @param {HTMLElement} elements.pauseBtn
   * @param {HTMLElement} elements.stepBtn
   * @param {HTMLElement} elements.resetBtn
   * @param {HTMLSelectElement} elements.speedSelect
   * @param {HTMLElement} elements.speedSlider
   * @param {HTMLElement} elements.speedValueBadge
   * @param {HTMLElement} elements.statusBadge
   * @param {HTMLElement} elements.variablesTableBody
   * @param {HTMLElement} elements.consoleOutput
   * @param {HTMLElement} elements.clearConsoleBtn
   * @param {HTMLElement} elements.inputPromptContainer
   * @param {HTMLInputElement} elements.promptInput
   * @param {HTMLElement} elements.promptSubmitBtn
   * @param {HTMLElement} elements.promptLabel
   */
  constructor(elements) {
    this.elements = elements;
    this.speed = parseInt(elements.speedSlider?.value || elements.speedSelect?.value || '50', 10);
    this.status = 'READY'; // READY | RUNNING | PAUSED | STEPPING | FINISHED | ERROR | WAITING_INPUT
    this.currentCustomMessage = null;
    this.prevVariables = {};
    this.currentVariables = {};

    this.onPlay = null;
    this.onPause = null;
    this.onStep = null;
    this.onReset = null;
    this.onSpeedChange = null;
    this.onInputSubmit = null;

    this.bindEvents();
    this.setStatus('READY');
  }

  bindEvents() {
    this.elements.playBtn?.addEventListener('click', () => {
      if (this.onPlay) this.onPlay();
    });

    this.elements.pauseBtn?.addEventListener('click', () => {
      if (this.onPause) this.onPause();
    });

    this.elements.stepBtn?.addEventListener('click', () => {
      if (this.onStep) this.onStep();
    });

    this.elements.resetBtn?.addEventListener('click', () => {
      if (this.onReset) this.onReset();
    });

    // Speed Slider
    const handleSpeedChange = (val) => {
      this.speed = parseInt(val, 10);
      this.updateSpeedBadge();
      if (this.onSpeedChange) {
        this.onSpeedChange(this.speed);
      }
    };

    this.elements.speedSlider?.addEventListener('input', (e) => {
      handleSpeedChange(e.target.value);
    });

    this.elements.speedSelect?.addEventListener('change', (e) => {
      handleSpeedChange(e.target.value);
    });

    this.elements.clearConsoleBtn?.addEventListener('click', () => {
      this.clearConsole();
    });

    this.elements.promptSubmitBtn?.addEventListener('click', () => {
      this.submitUserInput();
    });

    this.elements.promptInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.submitUserInput();
      }
    });
  }

  updateSpeedBadge() {
    if (this.elements.speedValueBadge) {
      if (this.speed === 0) {
        this.elements.speedValueBadge.textContent = I18n.t('controls.delayInstant');
      } else if (this.speed >= 1000) {
        this.elements.speedValueBadge.textContent = `${(this.speed / 1000).toFixed(1)} s`;
      } else {
        this.elements.speedValueBadge.textContent = `${this.speed} ms`;
      }
    }
  }

  submitUserInput() {
    const val = this.elements.promptInput.value;
    this.hideInputPrompt();
    if (this.onInputSubmit) {
      this.onInputSubmit(val);
    }
  }

  /**
   * Prompts the student for input when InputNode is encountered.
   * @param {string} promptText
   * @param {string} varName
   * @returns {Promise<string>}
   */
  requestUserInput(promptText, varName) {
    return new Promise((resolve) => {
      this.setStatus('WAITING_INPUT');
      this.elements.promptLabel.textContent = promptText || `${I18n.t('controls.promptTitle')} ${varName}:`;
      this.elements.promptInput.value = '';
      this.elements.inputPromptContainer.classList.remove('hidden');
      this.elements.promptInput.focus();

      this.onInputSubmit = (val) => {
        resolve(val);
      };
    });
  }

  hideInputPrompt() {
    this.elements.inputPromptContainer?.classList.add('hidden');
  }

  /**
   * Sets current state badge and toggles button enablement correctly.
   * @param {'READY' | 'RUNNING' | 'PAUSED' | 'STEPPING' | 'FINISHED' | 'ERROR' | 'WAITING_INPUT'} status
   * @param {string} [customMessage]
   */
  setStatus(status, customMessage = null) {
    this.status = status;
    this.currentCustomMessage = customMessage;
    const badge = this.elements.statusBadge;
    if (!badge) return;

    badge.className = 'status-badge status-' + status.toLowerCase();
    const textMap = {
      READY: I18n.t('status.ready'),
      RUNNING: I18n.t('status.running'),
      PAUSED: I18n.t('status.paused'),
      STEPPING: I18n.t('status.stepping'),
      FINISHED: I18n.t('status.finished'),
      ERROR: I18n.t('status.error'),
      WAITING_INPUT: I18n.t('status.waitingInput')
    };
    badge.textContent = customMessage || textMap[status] || status;

    // Correctly toggle button states
    if (status === 'RUNNING') {
      this.elements.playBtn.disabled = true;
      this.elements.pauseBtn.disabled = false;
      this.elements.stepBtn.disabled = true;
      this.elements.resetBtn.disabled = false;
    } else if (status === 'WAITING_INPUT') {
      this.elements.playBtn.disabled = true;
      this.elements.pauseBtn.disabled = true;
      this.elements.stepBtn.disabled = true;
      this.elements.resetBtn.disabled = false;
    } else {
      // READY, PAUSED, STEPPING, FINISHED, ERROR (Allow immediate restart on Play/Step)
      this.elements.playBtn.disabled = false;
      this.elements.pauseBtn.disabled = true;
      this.elements.stepBtn.disabled = false;
      this.elements.resetBtn.disabled = false;
    }
  }

  /**
   * Updates variable watcher table with inferred C types.
   * @param {Record<string, any>} variables
   * @param {Set<string>} [floatVars]
   */
  updateVariables(variables = {}, floatVars = new Set()) {
    this.currentVariables = variables;
    const tbody = this.elements.variablesTableBody;
    if (!tbody) return;

    const keys = Object.keys(variables);
    if (keys.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="empty-hint">${I18n.t('variables.emptyHint')}</td></tr>`;
      this.prevVariables = {};
      return;
    }

    let rowsHtml = '';
    for (const key of keys) {
      const val = variables[key];
      const prevVal = this.prevVariables[key];
      const isChanged = prevVal !== undefined && prevVal !== val;

      let cType = 'int';
      if (typeof val === 'number') {
        cType = (floatVars?.has(key) || !Number.isInteger(val)) ? 'double' : 'int';
      } else if (typeof val === 'boolean') {
        cType = 'bool';
      } else if (typeof val === 'string') {
        cType = 'char[]';
      }

      rowsHtml += `
        <tr class="${isChanged ? 'variable-row-changed' : ''}">
          <td class="var-name"><code>${escapeHtml(key)}</code></td>
          <td class="var-type"><code>${cType}</code></td>
          <td class="var-value"><code>${escapeHtml(JSON.stringify(val))}</code></td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml;
    this.prevVariables = { ...variables };
  }

  /**
   * Updates console output textarea / pre element.
   * @param {string[]} outputLines
   */
  updateConsole(outputLines = []) {
    if (!this.elements.consoleOutput) return;

    if (outputLines.length === 0) {
      this.elements.consoleOutput.innerHTML = `<span class="console-hint">${I18n.t('console.emptyHint')}</span>`;
      return;
    }

    const linesHtml = outputLines.map((line, idx) => {
      return `<div class="console-line"><span class="line-num">${idx + 1}</span> <span class="line-text">${escapeHtml(line)}</span></div>`;
    }).join('');

    this.elements.consoleOutput.innerHTML = linesHtml;
    this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
  }

  clearConsole() {
    if (this.elements.consoleOutput) {
      this.elements.consoleOutput.innerHTML = `<span class="console-hint">${I18n.t('console.emptyHint')}</span>`;
    }
  }

  /**
   * Refreshes all side panel labels when the language switches.
   */
  refreshLocalization() {
    this.setStatus(this.status, this.currentCustomMessage);
    this.updateSpeedBadge();
    if (Object.keys(this.currentVariables).length === 0) {
      const tbody = this.elements.variablesTableBody;
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-hint">${I18n.t('variables.emptyHint')}</td></tr>`;
      }
    }
    const consoleHint = this.elements.consoleOutput?.querySelector('.console-hint');
    if (consoleHint) {
      consoleHint.textContent = I18n.t('console.emptyHint');
    }
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
