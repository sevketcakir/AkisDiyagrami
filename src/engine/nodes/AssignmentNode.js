import { FlowchartNode } from './FlowchartNode.js';

/**
 * @class AssignmentNode
 * Flowchart calculation and state mutation node.
 * Shape: Rectangle.
 */
export class AssignmentNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.expression - Expression string (e.g., "x = y + 5" or "count = 0")
   * @param {string} [options.variableName] - Explicit variable name (optional)
   * @param {string|null} [options.nextNodeId] - Target node ID after assignment
   * @param {Function} [options.evaluator] - Optional evaluator hook
   */
  constructor(id, { expression = '', variableName = null, nextNodeId = null, evaluator = null } = {}) {
    super(id, 'assignment');
    this.expression = String(expression || '').trim();
    this.variableName = variableName;
    this.nextNodeId = nextNodeId;
    this.evaluator = evaluator;
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    if (this.evaluator) {
      this.evaluator(this.expression, context, { variableName: this.variableName });
    } else if (this.variableName) {
      // Fallback simple assignment if no evaluator is attached
      const num = Number(this.expression);
      context.setVariable(this.variableName, isNaN(num) ? this.expression : num);
    } else if (this.expression.includes('=')) {
      const parts = this.expression.split('=');
      const varName = parts[0].trim();
      const rhs = parts.slice(1).join('=').trim();
      const num = Number(rhs);
      context.setVariable(varName, isNaN(num) ? rhs : num);
    }

    context.currentNodeId = this.nextNodeId;
  }
}
