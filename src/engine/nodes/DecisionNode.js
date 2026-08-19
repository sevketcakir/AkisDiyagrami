import { FlowchartNode } from './FlowchartNode.js';

/**
 * @class DecisionNode
 * Flowchart conditional branch (If / Else).
 * Shape: Diamond.
 */
export class DecisionNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.condition - Boolean expression string (e.g. "x > 0", "count <= 10")
   * @param {string|null} [options.trueNodeId] - Target node ID when condition evaluates to true
   * @param {string|null} [options.falseNodeId] - Target node ID when condition evaluates to false
   * @param {Function} [options.evaluator] - Optional evaluator hook
   */
  constructor(id, { condition = '', trueNodeId = null, falseNodeId = null, evaluator = null } = {}) {
    super(id, 'decision');
    this.condition = String(condition || '').trim();
    this.trueNodeId = trueNodeId;
    this.falseNodeId = falseNodeId;
    this.evaluator = evaluator;
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    let result = false;
    if (this.evaluator) {
      result = Boolean(this.evaluator(this.condition, context));
    } else {
      // Fallback simple comparison if no evaluator is attached
      result = Boolean(context.getVariable(this.condition));
    }

    context.currentNodeId = result ? this.trueNodeId : this.falseNodeId;
  }
}
