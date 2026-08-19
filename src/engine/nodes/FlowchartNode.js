/**
 * @abstract
 * @class FlowchartNode
 * Abstract base class for all flowchart nodes using the Command Pattern.
 */
export class FlowchartNode {
  /**
   * @param {string} id - Unique identifier for this node.
   * @param {string} type - Node type classifier ('start', 'end', 'assignment', 'decision', 'loop', 'input', 'output').
   */
  constructor(id, type) {
    if (new.target === FlowchartNode) {
      throw new TypeError('Cannot construct FlowchartNode instances directly. It is an abstract class.');
    }
    if (!id || typeof id !== 'string') {
      throw new Error('FlowchartNode must have a valid non-empty string id.');
    }
    this.id = id;
    this.type = type;
  }

  /**
   * Abstract execution method representing the Command Pattern execution.
   * Modifies context (memory, output, status) and updates context.currentNodeId.
   *
   * @abstract
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   * @returns {void}
   */
  execute(context) {
    throw new Error(`execute(context) must be implemented by subclass ${this.constructor.name}.`);
  }
}
