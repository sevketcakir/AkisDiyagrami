import { FlowchartNode } from './FlowchartNode.js';
import { SafeEvaluator } from '../../evaluator/Evaluator.js';

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
    const statements = SafeEvaluator.splitStatements(this.expression);

    if (statements.length === 0) {
      if (this.variableName) {
        context.setVariable(this.variableName, 0);
      }
    } else {
      for (const stmt of statements) {
        if (this.evaluator) {
          this.evaluator(stmt, context, { variableName: this.variableName });
        } else if (this.variableName && !stmt.includes('=')) {
          const num = Number(stmt);
          context.setVariable(this.variableName, isNaN(num) ? stmt : num);
        } else if (stmt.includes('=')) {
          const parts = stmt.split('=');
          const varName = parts[0].trim();
          const rhs = parts.slice(1).join('=').trim();
          const num = Number(rhs);
          context.setVariable(varName, isNaN(num) ? rhs : num);
        }
      }
    }

    if (!this.nextNodeId) {
      throw new Error(`Assignment node [${this.id}] executed, but has no outgoing connection to the next node.`);
    }

    context.currentNodeId = this.nextNodeId;
  }
}
