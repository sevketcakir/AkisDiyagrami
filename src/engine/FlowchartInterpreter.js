import { InterpreterContext } from './InterpreterContext.js';

/**
 * @class FlowchartInterpreter
 * Deterministic State Machine executor for flowcharts implementing the Command Pattern.
 */
export class FlowchartInterpreter {
  /**
   * @param {Object} [options]
   * @param {Map<string, import('./nodes/FlowchartNode.js').FlowchartNode> | Record<string, import('./nodes/FlowchartNode.js').FlowchartNode>} [options.nodes] - Dictionary or Map of node IDs to FlowchartNode instances.
   * @param {string|null} [options.startNodeId] - Optional explicit StartNode ID.
   * @param {InterpreterContext} [options.context] - Optional pre-existing context.
   * @param {Function} [options.evaluator] - Expression evaluator hook to bind to nodes.
   */
  constructor({ nodes = {}, startNodeId = null, context = null, evaluator = null } = {}) {
    /** @type {Map<string, import('./nodes/FlowchartNode.js').FlowchartNode>} */
    this.nodes = new Map();
    this.evaluator = evaluator;
    this.context = context || new InterpreterContext();
    this.startNodeId = startNodeId;

    if (nodes) {
      this.loadNodes(nodes, startNodeId);
    }
  }

  /**
   * Finds the ID of the StartNode in the registered node map.
   * @returns {string|null}
   */
  findStartNodeId() {
    for (const [id, node] of this.nodes.entries()) {
      if (node.type === 'start') {
        return id;
      }
    }
    return null;
  }

  /**
   * Loads a dictionary/map of nodes into the interpreter.
   * @param {Map<string, import('./nodes/FlowchartNode.js').FlowchartNode> | Record<string, import('./nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @param {string|null} [startNodeId]
   */
  loadNodes(nodes, startNodeId = null) {
    this.nodes.clear();

    if (Array.isArray(nodes)) {
      for (const node of nodes) {
        if (node && node.id) {
          this.nodes.set(node.id, node);
        }
      }
    } else if (nodes instanceof Map) {
      for (const [id, node] of nodes.entries()) {
        const key = (node && node.id) ? node.id : String(id);
        this.nodes.set(key, node);
      }
    } else if (typeof nodes === 'object' && nodes !== null) {
      for (const [id, node] of Object.entries(nodes)) {
        const key = (node && node.id) ? node.id : String(id);
        this.nodes.set(key, node);
      }
    }

    // Attach evaluator to nodes that require it if not already attached
    if (this.evaluator) {
      for (const node of this.nodes.values()) {
        if ('evaluator' in node && !node.evaluator) {
          node.evaluator = this.evaluator;
        }
      }
    }

    this.startNodeId = startNodeId || this.findStartNodeId();
    this.reset();
  }

  /**
   * Resets execution context to initial state at the start node.
   */
  reset() {
    if (!this.startNodeId) {
      this.startNodeId = this.findStartNodeId();
    }
    this.context.reset(this.startNodeId);
  }

  /**
   * Advances the program execution by exactly one node (Command execution).
   * @returns {{
   *   executedNodeId: string|null,
   *   nextNodeId: string|null,
   *   variables: Record<string, any>,
   *   output: string[],
   *   isFinished: boolean,
   *   error: string|null,
   *   stepCount: number
   * }} Snapshot of execution state
   */
  step() {
    if (this.context.isFinished) {
      return this.getSnapshot(null);
    }

    const currentId = this.context.currentNodeId;
    if (!currentId) {
      this.context.isFinished = true;
      return this.getSnapshot(null);
    }

    const node = this.nodes.get(currentId);
    if (!node) {
      this.context.error = `Runtime Error: Target node "${currentId}" not found in flowchart.`;
      this.context.isFinished = true;
      return this.getSnapshot(currentId);
    }

    try {
      this.context.recordSnapshot();
      this.context.stepCount++;
      node.execute(this.context);

      if (!this.context.currentNodeId) {
        this.context.isFinished = true;
      }
    } catch (err) {
      this.context.error = `Runtime Error at Node [${currentId} (${node.type})]: ${err.message}`;
      this.context.isFinished = true;
    }

    return this.getSnapshot(currentId);
  }

  /**
   * Returns a snapshot copy of current interpreter state.
   * @param {string|null} [executedNodeId]
   */
  getSnapshot(executedNodeId = null) {
    return {
      executedNodeId,
      nextNodeId: this.context.currentNodeId,
      variables: { ...this.context.variables },
      output: [...this.context.output],
      isFinished: this.context.isFinished,
      error: this.context.error,
      stepCount: this.context.stepCount
    };
  }
}
