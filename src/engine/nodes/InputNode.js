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
    const rawDeclarations = SafeEvaluator.splitStatements(this.variableName).map(s => s.trim()).filter(Boolean);
    if (rawDeclarations.length === 0) {
      rawDeclarations.push('x');
    }

    for (const decl of rawDeclarations) {
      // Check if variable declaration has an optional type prefix, e.g. "double r", "float height", "int count"
      let varName = decl;
      let explicitType = null;
      const typeMatch = decl.match(/^(int|float|double|char|string)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)$/i);
      if (typeMatch) {
        explicitType = typeMatch[1].toLowerCase();
        varName = typeMatch[2];
      }

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
      let isFloat = explicitType === 'double' || explicitType === 'float';

      if (typeof rawValue === 'number') {
        isFloat = isFloat || !Number.isInteger(rawValue);
      } else if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        // Support European/Turkish comma decimals if matching pure float e.g. "3,0" or "3,14"
        const normalized = (/^[+-]?\d+,\d+$/.test(trimmed)) ? trimmed.replace(',', '.') : trimmed;

        if (normalized !== '' && !isNaN(Number(normalized))) {
          parsedValue = Number(normalized);
          // If input explicitly contains a decimal dot or exponent (e.g. "3.0", "2.", ".5", "1e-3"), treat as float/double
          if (normalized.includes('.') || normalized.toLowerCase().includes('e')) {
            isFloat = true;
          }
        }
      }

      context.setVariable(varName, parsedValue, isFloat);
    }

    if (!this.nextNodeId) {
      throw new Error(`Input node [${this.id}] executed, but has no outgoing connection to the next node.`);
    }

    context.currentNodeId = this.nextNodeId;
  }
}
