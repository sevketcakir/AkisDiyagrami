import { FlowchartNode } from './FlowchartNode.js';

/**
 * @class EndNode
 * Flowchart exit point. Concludes execution and marks the context as finished.
 * Shape: Oval / Capsule.
 */
export class EndNode extends FlowchartNode {
  /**
   * @param {string} id
   */
  constructor(id) {
    super(id, 'end');
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    context.isFinished = true;
    context.currentNodeId = null;
  }
}
