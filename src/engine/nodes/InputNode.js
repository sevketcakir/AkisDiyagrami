import { FlowchartNode } from './FlowchartNode.js';

/**
 * @class InputNode
 * Flowchart interactive data input (scanf / prompt).
 * Shape: Parallelogram.
 */
export class InputNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.variableName - Variable name where the input will be stored
   * @param {string} [options.prompt] - Optional prompt displayed to the user
   * @param {string|null} [options.nextNodeId] - Target node ID after input is processed
   */
  constructor(id, { variableName = 'x', prompt = 'Enter value:', nextNodeId = null } = {}) {
    super(id, 'input');
    this.variableName = String(variableName || 'x').trim();
    this.prompt = String(prompt || 'Enter value:').trim();
    this.nextNodeId = nextNodeId;
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    let rawValue = null;

    if (context.inputQueue && context.inputQueue.length > 0) {
      rawValue = context.inputQueue.shift();
    } else if (typeof context.inputProvider === 'function') {
      rawValue = context.inputProvider(this.prompt, this.variableName);
    } else {
      rawValue = '0';
    }

    // Automatically convert numeric inputs to numbers (standard for C-like introductory logic)
    let parsedValue = rawValue;
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed !== '' && !isNaN(Number(trimmed))) {
        parsedValue = Number(trimmed);
      }
    }

    context.setVariable(this.variableName, parsedValue);
    context.currentNodeId = this.nextNodeId;
  }
}
