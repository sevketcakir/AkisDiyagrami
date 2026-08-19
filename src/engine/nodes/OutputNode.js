import { FlowchartNode } from './FlowchartNode.js';
import { SafeEvaluator } from '../../evaluator/Evaluator.js';

/**
 * @class OutputNode
 * Flowchart output printing node (printf / print).
 * Shape: Parallelogram.
 */
export class OutputNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.expression - Expression or string to display (e.g. "x", '"Result: " + sum')
   * @param {string|null} [options.nextNodeId] - Target node ID after output is written
   * @param {Function} [options.evaluator] - Optional evaluator hook
   */
  constructor(id, { expression = '', nextNodeId = null, evaluator = null } = {}) {
    super(id, 'output');
    this.expression = String(expression || '').trim();
    this.nextNodeId = nextNodeId;
    this.evaluator = evaluator;
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    const expressions = SafeEvaluator.splitStatements(this.expression);

    if (expressions.length === 0) {
      context.writeOutput('');
    } else {
      for (const expr of expressions) {
        let outputText = '';
        if (this.evaluator) {
          const result = this.evaluator(expr, context);
          outputText = result !== undefined ? String(result) : '';
        } else if (expr in context.variables) {
          outputText = String(context.variables[expr]);
        } else {
          outputText = expr.replace(/^["']|["']$/g, '');
        }
        context.writeOutput(outputText);
      }
    }

    if (!this.nextNodeId) {
      throw new Error(`Output node [${this.id}] printed, but has no outgoing connection to the next node.`);
    }

    context.currentNodeId = this.nextNodeId;
  }
}
