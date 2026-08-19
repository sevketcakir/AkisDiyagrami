/**
 * @class InterpreterContext
 * Holds program memory and execution state for the flowchart interpreter.
 */
export class InterpreterContext {
  /**
   * @param {Object} [options]
   * @param {Record<string, any>} [options.variables] - Initial variable store.
   * @param {string[]} [options.inputQueue] - Pre-filled inputs for batch or automated testing.
   * @param {Function} [options.inputProvider] - Callback function (promptText, varName) => string | number for interactive inputs.
   */
  constructor({ variables = {}, inputQueue = [], inputProvider = null } = {}) {
    this.variables = { ...variables };
    this.output = [];
    this.inputQueue = [...inputQueue];
    this.inputProvider = inputProvider;
    this.currentNodeId = null;
    this.isFinished = false;
    this.error = null;
    this.stepCount = 0;
    this.history = [];
    this.loopStates = {};
    this.floatVars = new Set();
  }

  /**
   * Resets context state.
   * @param {string|null} [startNodeId]
   */
  reset(startNodeId = null) {
    this.variables = {};
    this.output = [];
    this.currentNodeId = startNodeId;
    this.isFinished = false;
    this.error = null;
    this.stepCount = 0;
    this.history = [];
    this.loopStates = {};
    this.floatVars = new Set();
  }

  /**
   * Pushes a message to the output buffer.
   * @param {string|number|boolean} text
   */
  writeOutput(text) {
    this.output.push(String(text));
  }

  /**
   * Retrieves a variable value from memory.
   * @param {string} name
   * @returns {any}
   */
  getVariable(name) {
    return this.variables[name];
  }

  /**
   * Sets or updates a variable in memory.
   * @param {string} name
   * @param {any} value
   * @param {boolean} [isFloat] - Explicit float type flag
   */
  setVariable(name, value, isFloat = false) {
    this.variables[name] = value;
    if (isFloat || (typeof value === 'number' && !Number.isInteger(value))) {
      this.floatVars.add(name);
    } else {
      this.floatVars.delete(name);
    }
  }

  /**
   * Records a snapshot of current memory and state.
   */
  recordSnapshot() {
    this.history.push({
      step: this.stepCount,
      nodeId: this.currentNodeId,
      variables: { ...this.variables },
      output: [...this.output]
    });
  }
}
