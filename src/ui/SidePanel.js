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
    this.speed = parseInt(elements.speedSlider?.value || elements.speedSelect?.value || '500', 10);
    this.status = 'READY'; // READY | RUNNING | PAUSED | STEPPING | FINISHED | ERROR | WAITING_INPUT
    this.prevVariables = {};

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
      if (this.elements.speedValueBadge) {
        if (this.speed >= 1000) {
          this.elements.speedValueBadge.textContent = `${(this.speed / 1000).toFixed(1)} s`;
        } else {
          this.elements.speedValueBadge.textContent = `${this.speed} ms`;
        }
      }
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
      this.elements.promptLabel.textContent = promptText || `Enter value for ${varName}:`;
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
    const badge = this.elements.statusBadge;
    if (!badge) return;

    badge.className = 'status-badge status-' + status.toLowerCase();
    const textMap = {
      READY: 'Ready',
      RUNNING: 'Running...',
      PAUSED: 'Paused',
      STEPPING: 'Stepping...',
      FINISHED: 'Finished (return 0)',
      ERROR: 'Runtime Error',
      WAITING_INPUT: 'Waiting for Input'
    };
    badge.textContent = customMessage || textMap[status] || status;

    // Correctly toggle button states
    if (status === 'RUNNING') {
      this.elements.playBtn.disabled = true;
      this.elements.pauseBtn.disabled = false;
      this.elements.stepBtn.disabled = true;
      this.elements.resetBtn.disabled = false;
    } else if (status === 'FINISHED' || status === 'ERROR') {
      this.elements.playBtn.disabled = true;
      this.elements.pauseBtn.disabled = true;
      this.elements.stepBtn.disabled = true;
      this.elements.resetBtn.disabled = false;
    } else if (status === 'WAITING_INPUT') {
      this.elements.playBtn.disabled = true;
      this.elements.pauseBtn.disabled = true;
      this.elements.stepBtn.disabled = true;
      this.elements.resetBtn.disabled = false;
    } else {
      // READY, PAUSED, STEPPING
      this.elements.playBtn.disabled = false;
      this.elements.pauseBtn.disabled = true;
      this.elements.stepBtn.disabled = false;
      this.elements.resetBtn.disabled = false;
    }
  }

  /**
   * Updates variable watcher table with inferred C types.
   * @param {Record<string, any>} variables
   */
  updateVariables(variables = {}) {
    const tbody = this.elements.variablesTableBody;
    if (!tbody) return;

    const keys = Object.keys(variables);
    if (keys.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="empty-hint">No variables declared in memory yet</td></tr>`;
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
        cType = Number.isInteger(val) ? 'int' : 'double';
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
      this.elements.consoleOutput.innerHTML = `<span class="console-hint">Console output (printf) will appear here...</span>`;
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
      this.elements.consoleOutput.innerHTML = `<span class="console-hint">Console cleared.</span>`;
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
