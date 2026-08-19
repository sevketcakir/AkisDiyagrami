import { FlowchartNode } from './FlowchartNode.js';

/**
 * @class LoopNode
 * Flowchart iteration controller (While / For loop).
 * Shape: Hexagon.
 */
export class LoopNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.condition - Loop condition string (e.g. "i < 10")
   * @param {string|null} [options.bodyNodeId] - Target node ID for the loop body
   * @param {string|null} [options.exitNodeId] - Target node ID to exit the loop
   * @param {Function} [options.evaluator] - Optional evaluator hook
   */
  constructor(id, { condition = '', bodyNodeId = null, exitNodeId = null, evaluator = null } = {}) {
    super(id, 'loop');
    this.condition = String(condition || '').trim();
    this.bodyNodeId = bodyNodeId;
    this.exitNodeId = exitNodeId;
    this.evaluator = evaluator;
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    let continueLoop = false;
    if (this.evaluator) {
      continueLoop = Boolean(this.evaluator(this.condition, context));
    } else {
      continueLoop = Boolean(context.getVariable(this.condition));
    }

    context.currentNodeId = continueLoop ? this.bodyNodeId : this.exitNodeId;
  }
}
