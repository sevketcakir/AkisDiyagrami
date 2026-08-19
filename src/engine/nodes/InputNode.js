import { FlowchartNode } from './FlowchartNode.js';
import { SafeEvaluator } from '../../evaluator/Evaluator.js';

/**
 * @class InputNode
 * Flowchart interactive data input (scanf / prompt).
 * Shape: Parallelogram.
 */
export class InputNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.variableName - Variable name(s) where the input will be stored (e.g. "a, b, c")
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
    const varNames = SafeEvaluator.splitStatements(this.variableName).map(s => s.trim()).filter(Boolean);
    if (varNames.length === 0) {
      varNames.push('x');
    }

    for (const varName of varNames) {
      let rawValue = null;

      if (context.inputQueue && context.inputQueue.length > 0) {
        rawValue = context.inputQueue.shift();
      } else if (typeof context.inputProvider === 'function') {
        const promptText = `Enter value for ${varName}:`;
        rawValue = context.inputProvider(promptText, varName);
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

      context.setVariable(varName, parsedValue);
    }

    if (!this.nextNodeId) {
      throw new Error(`Input node [${this.id}] executed, but has no outgoing connection to the next node.`);
    }

    context.currentNodeId = this.nextNodeId;
  }
}
