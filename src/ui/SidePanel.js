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
    this.onVariableEdit = null;
    this.onClearRepl = null;
    this.activeLowerTab = 'console'; // 'console' | 'debug'

    this.bindEvents();
    this.bindTabEvents();
    this.setStatus('READY');
  }

  bindTabEvents() {
    // Upper Inspector Tabs (Variables vs Watches)
    const btnVars = document.getElementById('tab-btn-variables');
    const btnWatches = document.getElementById('tab-btn-watches');
    const subtabVars = document.getElementById('subtab-variables');
    const subtabWatches = document.getElementById('subtab-watches');

    btnVars?.addEventListener('click', () => {
      btnVars.classList.add('active');
      btnWatches?.classList.remove('active');
      if (subtabVars) subtabVars.style.display = 'block';
      if (subtabWatches) subtabWatches.style.display = 'none';
    });

    btnWatches?.addEventListener('click', () => {
      btnWatches.classList.add('active');
      btnVars?.classList.remove('active');
      if (subtabWatches) subtabWatches.style.display = 'block';
      if (subtabVars) subtabVars.style.display = 'none';
    });

    // Lower Output Tabs (Console vs Debug REPL)
    const btnConsole = document.getElementById('tab-btn-console');
    const btnDebug = document.getElementById('tab-btn-debug');
    const subtabConsole = document.getElementById('subtab-console');
    const subtabDebug = document.getElementById('subtab-debug');

    btnConsole?.addEventListener('click', () => {
      this.activeLowerTab = 'console';
      btnConsole.classList.add('active');
      btnDebug?.classList.remove('active');
      if (subtabConsole) subtabConsole.style.display = 'flex';
      if (subtabDebug) subtabDebug.style.display = 'none';
    });

    btnDebug?.addEventListener('click', () => {
      this.activeLowerTab = 'debug';
      btnDebug.classList.add('active');
      btnConsole?.classList.remove('active');
      if (subtabDebug) subtabDebug.style.display = 'flex';
      if (subtabConsole) subtabConsole.style.display = 'none';
      document.getElementById('repl-input')?.focus();
    });
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
      if (this.activeLowerTab === 'debug') {
        if (this.onClearRepl) this.onClearRepl();
      } else {
        this.clearConsole();
      }
    });

    this.elements.promptSubmitBtn?.addEventListener('click', () => {
      this.submitUserInput();
    });

    this.elements.promptInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.submitUserInput();
      }
    });

    // Event delegation for variable editing (double-click anywhere on cell, or single-click on edit button)
    this.elements.variablesTableBody?.addEventListener('dblclick', (e) => {
      const cell = e.target.closest('.var-value');
      if (!cell || cell.querySelector('.inline-var-input')) return;
      const varName = cell.dataset.var;
      if (varName) {
        this.startInlineEdit(cell, varName);
      }
    });

    this.elements.variablesTableBody?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-var');
      if (editBtn) {
        const varName = editBtn.dataset.var;
        const cell = editBtn.closest('.var-value');
        if (cell && varName && !cell.querySelector('.inline-var-input')) {
          this.startInlineEdit(cell, varName);
        }
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

      const displayVal = (cType === 'double' && typeof val === 'number' && Number.isInteger(val))
        ? val.toFixed(1)
        : JSON.stringify(val);

      rowsHtml += `
        <tr class="${isChanged ? 'variable-row-changed' : ''}">
          <td class="var-name"><code>${escapeHtml(key)}</code></td>
          <td class="var-type"><code>${cType}</code></td>
          <td class="var-value" data-var="${escapeHtml(key)}" title="${I18n.t('variables.editHint')}">
            <div class="var-value-wrapper">
              <code class="var-val-text">${escapeHtml(displayVal)}</code>
              <button type="button" class="btn-edit-var" data-var="${escapeHtml(key)}" title="${I18n.t('variables.editHint')}">✏️</button>
            </div>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml;
    this.prevVariables = { ...variables };
  }

  /**
   * Starts inline editing for a variable table cell.
   * @param {HTMLElement} cell
   * @param {string} varName
   */
  startInlineEdit(cell, varName) {
    const currentVal = this.currentVariables[varName];
    if (cell.querySelector('.inline-var-input')) return; // Already editing

    const container = document.createElement('div');
    container.className = 'inline-edit-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-var-input';
    const isDouble = this.currentFloatVars?.has(varName) || (typeof currentVal === 'number' && !Number.isInteger(currentVal));
    input.value = (isDouble && typeof currentVal === 'number' && Number.isInteger(currentVal))
      ? currentVal.toFixed(1)
      : (typeof currentVal === 'string' ? `"${currentVal}"` : String(currentVal ?? ''));

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-inline-save';
    saveBtn.textContent = '✓';
    saveBtn.title = I18n.t('variables.saveBtn') || 'Kaydet (Enter)';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-inline-cancel';
    cancelBtn.textContent = '✕';
    cancelBtn.title = I18n.t('variables.cancelBtn') || 'İptal (Esc)';

    container.appendChild(input);
    container.appendChild(saveBtn);
    container.appendChild(cancelBtn);

    cell.innerHTML = '';
    cell.appendChild(container);

    let isOpening = true;
    setTimeout(() => { isOpening = false; }, 250);

    input.focus();
    input.select();

    let finished = false;
    const finishEdit = (save = true) => {
      if (finished) return;
      finished = true;
      if (save) {
        const newValStr = input.value.trim();
        if (this.onVariableEdit && newValStr !== '') {
          try {
            this.onVariableEdit(varName, newValStr);
          } catch (err) {
            this.updateVariables(this.currentVariables, this.currentFloatVars);
          }
          return;
        }
      }
      cell.innerHTML = `
        <div class="var-value-wrapper">
          <code class="var-val-text">${escapeHtml(JSON.stringify(currentVal))}</code>
          <button type="button" class="btn-edit-var" data-var="${escapeHtml(varName)}" title="${I18n.t('variables.editHint')}">✏️</button>
        </div>
      `;
    };

    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finishEdit(true);
    });

    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finishEdit(false);
    });

    container.addEventListener('click', (e) => e.stopPropagation());
    container.addEventListener('dblclick', (e) => e.stopPropagation());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit(false);
      }
    });

    input.addEventListener('blur', (e) => {
      if (isOpening) return;
      if (e.relatedTarget === saveBtn || e.relatedTarget === cancelBtn) return;
      finishEdit(true);
    });
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
