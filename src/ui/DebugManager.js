import { SafeEvaluator } from '../evaluator/Evaluator.js';
import { I18n } from '../i18n/I18n.js';
import jsep from 'jsep';

/**
 * @class DebugManager
 * Manages the Debug REPL (expression evaluation & variable mutation),
 * the Watch Expressions window, and inline variable editing.
 */
export class DebugManager {
  /**
   * @param {Object} options
   * @param {HTMLElement} [options.watchInput]
   * @param {HTMLElement} [options.watchAddBtn]
   * @param {HTMLElement} [options.watchesTableBody]
   * @param {HTMLElement} [options.watchesBadge]
   * @param {HTMLElement} [options.replInput]
   * @param {HTMLElement} [options.replSubmitBtn]
   * @param {HTMLElement} [options.replOutput]
   * @param {HTMLElement} [options.clearBtn]
   * @param {Function} [options.getContext] Returns active InterpreterContext
   * @param {Function} [options.onVariableMutated] Callback when variable values change
   */
  constructor(options = {}) {
    this.options = options;
    this.watches = this.loadWatches();
    this.history = [];
    this.historyIndex = -1;

    this.bindEvents();
  }

  loadWatches() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('flowchart_watches');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      // Fallback
    }
    return [];
  }

  saveWatches() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flowchart_watches', JSON.stringify(this.watches));
      }
    } catch (e) {
      // Ignore
    }
  }

  bindEvents() {
    // Add Watch
    const handleAddWatch = () => {
      const input = this.options.watchInput;
      if (!input) return;
      const expr = input.value.trim();
      if (expr) {
        this.addWatch(expr);
        input.value = '';
      }
    };

    this.options.watchAddBtn?.addEventListener('click', handleAddWatch);
    this.options.watchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAddWatch();
      }
    });

    // REPL Submit
    const handleReplSubmit = () => {
      const input = this.options.replInput;
      if (!input) return;
      const cmd = input.value.trim();
      if (cmd) {
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        this.executeRepl(cmd);
        input.value = '';
      }
    };

    this.options.replSubmitBtn?.addEventListener('click', handleReplSubmit);
    this.options.replInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleReplSubmit();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.history.length > 0 && this.historyIndex > 0) {
          this.historyIndex--;
          this.options.replInput.value = this.history[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.options.replInput.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.options.replInput.value = '';
        }
      }
    });

    // Event delegation for watch editing (double-click anywhere on expression cell, or click on edit button)
    this.options.watchesTableBody?.addEventListener('dblclick', (e) => {
      const cell = e.target.closest('.watch-expr');
      if (!cell || cell.querySelector('.inline-watch-input')) return;
      const indexStr = cell.dataset.index;
      if (indexStr !== undefined) {
        this.startInlineEdit(cell, parseInt(indexStr, 10));
      }
    });

    this.options.watchesTableBody?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.btn-remove-watch');
      if (removeBtn) {
        const idx = parseInt(removeBtn.dataset.index, 10);
        if (!isNaN(idx)) {
          this.removeWatch(idx);
        }
        return;
      }

      const editBtn = e.target.closest('.btn-edit-watch');
      if (editBtn) {
        const indexStr = editBtn.dataset.index;
        const row = editBtn.closest('tr');
        const cell = row?.querySelector('.watch-expr');
        if (cell && indexStr !== undefined && !cell.querySelector('.inline-watch-input')) {
          this.startInlineEdit(cell, parseInt(indexStr, 10));
        }
      }
    });
  }

  /**
   * Adds an expression to watches.
   * @param {string} expression
   */
  addWatch(expression) {
    const trimmed = expression.trim();
    if (!trimmed) return;
    if (!this.watches.includes(trimmed)) {
      this.watches.push(trimmed);
      this.saveWatches();
    }
    this.updateWatches();
  }

  /**
   * Removes an expression from watches by index or string.
   * @param {number|string} target
   */
  removeWatch(target) {
    if (typeof target === 'number') {
      this.watches.splice(target, 1);
    } else {
      this.watches = this.watches.filter(w => w !== target);
    }
    this.saveWatches();
    this.updateWatches();
  }

  /**
   * Updates an existing watch expression by index.
   * @param {number} index
   * @param {string} newExpression
   * @returns {boolean}
   */
  editWatch(index, newExpression) {
    const trimmed = (newExpression || '').trim();
    if (!trimmed) return false;
    if (typeof index === 'number' && index >= 0 && index < this.watches.length) {
      this.watches[index] = trimmed;
      this.saveWatches();
      this.updateWatches();
      return true;
    }
    return false;
  }

  clearWatches() {
    this.watches = [];
    this.saveWatches();
    this.updateWatches();
  }

  /**
   * Evaluates all watch expressions against the given or current context.
   * @param {import('../engine/InterpreterContext.js').InterpreterContext} [context]
   * @returns {Array<{ expr: string, value: any, cType: string, isError: boolean, errorMsg?: string }>}
   */
  evaluateWatches(context = null) {
    const ctx = context || this.options.getContext?.();
    const scope = ctx ? { ...ctx.variables, __floatVars: ctx.floatVars } : {};
    const floatVars = ctx?.floatVars || new Set();

    return this.watches.map((expr) => {
      try {
        const val = SafeEvaluator.evaluate(expr, scope);

        if (val === undefined) {
          return {
            expr,
            value: undefined,
            cType: '-',
            isError: false
          };
        }

        let cType = 'int';
        if (typeof val === 'number') {
          let isFloat = false;
          try {
            const ast = jsep(expr);
            isFloat = SafeEvaluator.isFloatAST(ast, scope);
          } catch (e) {
            isFloat = !Number.isInteger(val) || floatVars.has(expr);
          }
          cType = isFloat ? 'double' : 'int';
        } else if (typeof val === 'boolean') {
          cType = 'bool';
        } else if (typeof val === 'string') {
          cType = 'char[]';
        }

        return {
          expr,
          value: val,
          cType,
          isError: false
        };
      } catch (err) {
        return {
          expr,
          value: null,
          cType: 'error',
          isError: true,
          errorMsg: err.message
        };
      }
    });
  }

  /**
   * Re-evaluates and renders the watches table in the DOM.
   * @param {import('../engine/InterpreterContext.js').InterpreterContext} [context]
   */
  updateWatches(context = null) {
    const tbody = this.options.watchesTableBody;
    const badge = this.options.watchesBadge;
    if (badge) {
      badge.textContent = String(this.watches.length);
      badge.style.display = this.watches.length > 0 ? 'inline-flex' : 'none';
    }

    if (!tbody) return;

    // Do not disrupt user if they are currently typing in inline edit mode
    if (tbody.querySelector('.inline-watch-input')) return;

    if (this.watches.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-hint">${I18n.t('watches.emptyHint')}</td></tr>`;
      return;
    }

    const results = this.evaluateWatches(context);
    let html = '';

    results.forEach((res, index) => {
      let valDisplay = '';
      let valClass = 'watch-val';

      if (res.isError) {
        valDisplay = `<span class="watch-error" title="${escapeHtml(res.errorMsg)}">⚠️ ${escapeHtml(res.errorMsg)}</span>`;
        valClass += ' watch-val-error';
      } else if (res.value === undefined) {
        valDisplay = `<span class="watch-undefined">${I18n.t('watches.undefined')}</span>`;
      } else {
        valDisplay = `<code>${escapeHtml(JSON.stringify(res.value))}</code>`;
      }

      const editHint = I18n.t('watches.editHint');
      const tooltip = `${escapeHtml(res.expr)} - ${editHint}`;

      html += `
        <tr data-index="${index}">
          <td class="watch-expr" data-index="${index}" title="${tooltip}">
            <div class="watch-expr-wrapper">
              <code class="watch-expr-text">${escapeHtml(res.expr)}</code>
            </div>
          </td>
          <td class="${valClass}">${valDisplay}</td>
          <td class="var-type"><code>${escapeHtml(res.cType)}</code></td>
          <td class="watch-action">
            <button type="button" class="btn-edit-watch" data-index="${index}" title="${escapeHtml(editHint)}">✏️</button>
            <button type="button" class="btn-remove-watch" data-index="${index}" title="${I18n.t('watches.remove')}">✕</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  /**
   * Starts inline editing for a watch expression table cell.
   * @param {HTMLElement} cell
   * @param {number} index
   */
  startInlineEdit(cell, index) {
    if (index < 0 || index >= this.watches.length) return;
    const currentExpr = this.watches[index];
    if (cell.querySelector('.inline-watch-input')) return; // Already editing

    const container = document.createElement('div');
    container.className = 'inline-edit-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-var-input inline-watch-input';
    input.value = currentExpr;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-inline-save';
    saveBtn.textContent = '✓';
    saveBtn.title = I18n.t('watches.saveBtn') || 'Kaydet (Enter)';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-inline-cancel';
    cancelBtn.textContent = '✕';
    cancelBtn.title = I18n.t('watches.cancelBtn') || 'İptal (Esc)';

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
        const newExpr = input.value.trim();
        if (newExpr !== '' && newExpr !== currentExpr) {
          cell.innerHTML = '';
          this.editWatch(index, newExpr);
          return;
        }
      }
      cell.innerHTML = '';
      this.updateWatches();
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
   * Evaluates an expression or executes a variable mutation in the Debug REPL.
   * @param {string} inputStr
   * @param {import('../engine/InterpreterContext.js').InterpreterContext} [context]
   */
  executeRepl(inputStr, context = null) {
    const trimmed = inputStr.trim();
    if (!trimmed) return;

    const ctx = context || this.options.getContext?.();
    if (!ctx) {
      this.logReplOutput(trimmed, { error: I18n.t('debug.noContext') });
      return;
    }

    // Determine if statement is an assignment (e.g. x = 10, count += 1, a = 1, b = 2)
    const isAssignment = this.isAssignmentStatement(trimmed);

    try {
      if (isAssignment) {
        // Execute assignment and mutate context variables
        const result = SafeEvaluator.evaluateAssignment(trimmed, ctx);

        // Notify app to refresh Variables table & Watches table
        if (this.options.onVariableMutated) {
          this.options.onVariableMutated(ctx.variables, ctx.floatVars);
        }
        this.updateWatches(ctx);

        this.logReplOutput(trimmed, {
          isAssignment: true,
          result,
          variables: { ...ctx.variables }
        });
      } else {
        // Pure expression evaluation (e.g. x + 5, sqrt(delta), a > b)
        const scope = { ...ctx.variables, __floatVars: ctx.floatVars };
        const result = SafeEvaluator.evaluate(trimmed, scope);

        let cType = 'int';
        if (typeof result === 'number') {
          let isFloat = false;
          try {
            const ast = jsep(trimmed);
            isFloat = SafeEvaluator.isFloatAST(ast, scope);
          } catch (e) {
            isFloat = !Number.isInteger(result) || (ctx.floatVars?.has(trimmed));
          }
          cType = isFloat ? 'double' : 'int';
        } else if (typeof result === 'boolean') {
          cType = 'bool';
        } else if (typeof result === 'string') {
          cType = 'char[]';
        } else if (result === undefined) {
          cType = 'undefined';
        }

        this.logReplOutput(trimmed, {
          isAssignment: false,
          result,
          cType
        });
      }
    } catch (err) {
      this.logReplOutput(trimmed, { error: err.message });
    }
  }

  /**
   * Checks whether a command string is an assignment statement.
   * @param {string} str
   * @returns {boolean}
   */
  isAssignmentStatement(str) {
    if (str.includes(',')) {
      // Possible multi-assignment like "a = 1, b = 2"
      const parts = SafeEvaluator.splitStatements(str);
      if (parts.some(p => this.isSingleAssignment(p))) return true;
    }
    return this.isSingleAssignment(str);
  }

  isSingleAssignment(str) {
    const trimmed = str.trim();
    // Starts with variable name followed by assignment operator (=, +=, -=, *=, /=, %=)
    // and NOT followed by = (to exclude ==)
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*(=|\+=|-=|\*=|\/=|%=)(?!=)/.test(trimmed);
  }

  /**
   * Appends an entry to the REPL output log.
   * @param {string} input
   * @param {Object} res
   */
  logReplOutput(input, res) {
    const container = this.options.replOutput;
    if (!container) return;

    // Remove empty placeholder hint if present
    const hint = container.querySelector('.repl-hint');
    if (hint) hint.remove();

    const entry = document.createElement('div');
    entry.className = 'repl-entry';

    let resultHtml = '';
    if (res.error) {
      resultHtml = `<div class="repl-res repl-res-error"><span class="repl-indicator">❌</span> ${escapeHtml(res.error)}</div>`;
    } else if (res.isAssignment) {
      resultHtml = `<div class="repl-res repl-res-assign"><span class="repl-indicator">✓</span> <code>${escapeHtml(JSON.stringify(res.result))}</code> <span class="repl-badge-assign">${I18n.t('debug.varUpdated')}</span></div>`;
    } else {
      const typeBadge = res.cType ? `<span class="repl-type-badge">${escapeHtml(res.cType)}</span>` : '';
      const displayVal = res.result === undefined ? 'undefined' : JSON.stringify(res.result);
      resultHtml = `<div class="repl-res repl-res-val"><span class="repl-indicator">←</span> <code>${escapeHtml(displayVal)}</code> ${typeBadge}</div>`;
    }

    entry.innerHTML = `
      <div class="repl-cmd"><span class="repl-prompt-sym">&gt;</span> <span class="repl-cmd-text">${escapeHtml(input)}</span></div>
      ${resultHtml}
    `;

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  clearReplLog() {
    const container = this.options.replOutput;
    if (container) {
      container.innerHTML = `<span class="repl-hint">${I18n.t('debug.replHint')}</span>`;
    }
  }

  refreshLocalization() {
    this.updateWatches();
    const hint = this.options.replOutput?.querySelector('.repl-hint');
    if (hint) {
      hint.textContent = I18n.t('debug.replHint');
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
