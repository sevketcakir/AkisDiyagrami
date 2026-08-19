import { FlowchartNode } from './FlowchartNode.js';

/**
 * @class LoopNode
 * Flowchart iteration controller (Hexagon shape).
 * Supports standard engineering loop syntax: `I = 1, N, 1` (var = start, end, step)
 * as well as boolean conditions (`i <= N`).
 */
export class LoopNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.condition - Loop specification (e.g. "I = 1, N, 1" or "i <= 10")
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
    const rawSpec = this.condition.trim();

    // Check if the loop header specifies a parametric loop: `I = 1, N, 1` or `I = 1, N`
    const paramMatch = rawSpec.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^,]+),\s*([^,]+)(?:,\s*([^,]+))?$/);

    if (paramMatch) {
      const varName = paramMatch[1];
      const startExpr = paramMatch[2].trim();
      const endExpr = paramMatch[3].trim();
      const stepExpr = paramMatch[4] ? paramMatch[4].trim() : '1';

      if (!context.loopStates) {
        context.loopStates = {};
      }

      let state = context.loopStates[this.id];

      if (!state || !state.active) {
        // First entry into the loop: initialize loop variable to start value
        const startVal = this.evaluator ? Number(this.evaluator(startExpr, context)) : (Number(startExpr) || 0);
        const endVal = this.evaluator ? Number(this.evaluator(endExpr, context)) : (Number(endExpr) || 0);
        const stepVal = this.evaluator ? Number(this.evaluator(stepExpr, context)) : (Number(stepExpr) || 1);

        context.setVariable(varName, startVal);

        state = {
          varName,
          endVal,
          stepVal: isNaN(stepVal) || stepVal === 0 ? 1 : stepVal,
          active: true
        };
        context.loopStates[this.id] = state;

        // Check if initial condition is satisfied (inclusive bound)
        const currentVal = startVal;
        const continueLoop = (state.stepVal > 0) ? (currentVal <= state.endVal) : (currentVal >= state.endVal);

        if (continueLoop) {
          context.currentNodeId = this.bodyNodeId;
        } else {
          state.active = false;
          context.currentNodeId = this.exitNodeId;
        }
      } else {
        // Subsequent iteration (loop-back into loop header): increment and test
        const currentVal = Number(context.getVariable(state.varName) ?? 0);
        const nextVal = currentVal + state.stepVal;
        context.setVariable(state.varName, nextVal);

        // Re-evaluate end bound dynamically in case N changed
        const dynamicEndVal = this.evaluator ? Number(this.evaluator(endExpr, context)) : state.endVal;

        const continueLoop = (state.stepVal > 0) ? (nextVal <= dynamicEndVal) : (nextVal >= dynamicEndVal);

        if (continueLoop) {
          context.currentNodeId = this.bodyNodeId;
        } else {
          state.active = false;
          context.currentNodeId = this.exitNodeId;
        }
      }
      return;
    }

    // Standard boolean expression fallback (e.g. `i <= 10`)
    let continueLoop = false;
    if (this.evaluator) {
      continueLoop = Boolean(this.evaluator(rawSpec, context));
    } else {
      continueLoop = Boolean(context.getVariable(rawSpec));
    }

    context.currentNodeId = continueLoop ? this.bodyNodeId : this.exitNodeId;
  }
}
