import { FlowchartNode } from './FlowchartNode.js';

/**
 * @class StartNode
 * Flowchart entry point. Transitions to the first executable node.
 * Shape: Oval / Capsule.
 */
export class StartNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {string|null} [nextNodeId]
   */
  constructor(id, nextNodeId = null) {
    super(id, 'start');
    this.nextNodeId = nextNodeId;
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    if (!this.nextNodeId) {
      throw new Error(`Start node is not connected to any subsequent node.`);
    }
    context.currentNodeId = this.nextNodeId;
  }
}
