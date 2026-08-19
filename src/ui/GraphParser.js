import {
  StartNode,
  EndNode,
  AssignmentNode,
  DecisionNode,
  LoopNode,
  InputNode,
  OutputNode
} from '../engine/index.js';
import { SafeEvaluator } from '../evaluator/Evaluator.js';

/**
 * @class GraphParser
 * Translates visual Drawflow canvas graphs into executable FlowchartNode instances,
 * performing full graph topology validation and reachability path search.
 */
export class GraphParser {
  /**
   * Parses Drawflow export JSON object into an array or map of FlowchartNode objects.
   * @param {Object} drawflowData - Exported JSON from drawflow.export()
   * @param {Function} [evaluator] - Evaluator hook (defaults to SafeEvaluator.hook)
   * @returns {{ nodes: Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>, startNodeId: string|null, errors: string[], warnings: string[] }}
   */
  static parseDrawflow(drawflowData, evaluator = SafeEvaluator.hook) {
    const nodes = new Map();
    const errors = [];
    const warnings = [];
    let startNodeId = null;

    const moduleData = drawflowData?.drawflow?.Home?.data || drawflowData?.data || drawflowData || {};

    const nodeEntries = Object.entries(moduleData);
    if (nodeEntries.length === 0) {
      errors.push('The flowchart canvas is empty. Drag symbols from the left palette to build a program.');
      return { nodes, startNodeId: null, errors, warnings };
    }

    // Pass 1: Instantiate all node objects
    for (const [idStr, rawNode] of nodeEntries) {
      const id = String(rawNode.id || idStr);
      const name = (rawNode.name || rawNode.class || '').trim().toLowerCase();
      const nodeData = rawNode.data || {};

      const outputs = rawNode.outputs || {};
      const nextNodeId = outputs.output_1?.connections?.[0]?.node ? String(outputs.output_1.connections[0].node) : null;
      const secondNodeId = outputs.output_2?.connections?.[0]?.node ? String(outputs.output_2.connections[0].node) : null;

      try {
        let nodeInstance = null;

        if (name.includes('start')) {
          nodeInstance = new StartNode(id, nextNodeId);
          if (!startNodeId) {
            startNodeId = id;
          }
        } else if (name.includes('end')) {
          nodeInstance = new EndNode(id);
        } else if (name.includes('assignment') || name.includes('process')) {
          const expression = nodeData.expression ?? nodeData.text ?? 'x = 0';
          const variableName = nodeData.variableName || null;
          nodeInstance = new AssignmentNode(id, {
            expression,
            variableName,
            nextNodeId,
            evaluator
          });
        } else if (name.includes('decision') || name.includes('condition')) {
          const condition = nodeData.condition ?? nodeData.text ?? 'x > 0';
          nodeInstance = new DecisionNode(id, {
            condition,
            trueNodeId: nextNodeId,     // output_1 is True
            falseNodeId: secondNodeId,  // output_2 is False
            evaluator
          });
        } else if (name.includes('loop')) {
          const condition = nodeData.condition ?? nodeData.text ?? 'i < 10';
          nodeInstance = new LoopNode(id, {
            condition,
            bodyNodeId: nextNodeId,    // output_1 is Loop Body
            exitNodeId: secondNodeId,  // output_2 is Loop Exit
            evaluator
          });
        } else if (name.includes('input')) {
          const variableName = nodeData.variableName ?? nodeData.text ?? 'x';
          const prompt = nodeData.prompt ?? `Enter ${variableName}:`;
          nodeInstance = new InputNode(id, {
            variableName,
            prompt,
            nextNodeId
          });
        } else if (name.includes('output')) {
          const expression = nodeData.expression ?? nodeData.text ?? 'x';
          nodeInstance = new OutputNode(id, {
            expression,
            nextNodeId,
            evaluator
          });
        } else {
          errors.push(`Unknown node type "${name}" with ID ${id}.`);
        }

        if (nodeInstance) {
          nodes.set(id, nodeInstance);
        }
      } catch (err) {
        errors.push(`Error parsing node ${id}: ${err.message}`);
      }
    }

    // Pass 2: Identify Start node
    if (!startNodeId) {
      for (const [id, node] of nodes.entries()) {
        if (node.type === 'start') {
          startNodeId = id;
          break;
        }
      }
    }

    if (!startNodeId) {
      errors.push('No Start node found. Every flowchart must begin with a Start (Oval) node.');
      return { nodes, startNodeId: null, errors, warnings };
    }

    // Pass 3: Identify End node(s)
    let hasEndNode = false;
    for (const node of nodes.values()) {
      if (node.type === 'end') {
        hasEndNode = true;
        break;
      }
    }

    if (!hasEndNode) {
      warnings.push('No End node found. Flowcharts should terminate at an End (Oval) node.');
    }

    // Pass 4: Graph Reachability Search (BFS from Start to End)
    const { reachableNodeIds, isEndReachable, pathWarnings } = GraphParser.searchPath(nodes, startNodeId);
    warnings.push(...pathWarnings);

    if (hasEndNode && !isEndReachable) {
      errors.push('No valid execution path found from Start to End. Please ensure your nodes are connected.');
    }

    // Check for single start node with no outgoing connections
    const startNode = nodes.get(startNodeId);
    if (startNode && !startNode.nextNodeId && nodes.size > 1) {
      errors.push('Start node is not connected to any subsequent node. Drag an arrow from Start to your first step.');
    }

    return { nodes, startNodeId, errors, warnings };
  }

  /**
   * Performs BFS traversal from StartNode to verify connectivity and find reachability to EndNode.
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @param {string} startNodeId
   * @returns {{ reachableNodeIds: Set<string>, isEndReachable: boolean, pathWarnings: string[] }}
   */
  static searchPath(nodes, startNodeId) {
    const reachableNodeIds = new Set();
    const pathWarnings = [];
    const queue = [startNodeId];
    let isEndReachable = false;

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || reachableNodeIds.has(currentId)) continue;

      reachableNodeIds.add(currentId);
      const node = nodes.get(currentId);
      if (!node) continue;

      if (node.type === 'end') {
        isEndReachable = true;
        continue;
      }

      if (node.type === 'decision') {
        const decisionNode = /** @type {DecisionNode} */ (node);
        if (!decisionNode.trueNodeId) {
          pathWarnings.push(`Decision node [${node.id}] is missing a "True (T)" connection.`);
        } else if (!reachableNodeIds.has(decisionNode.trueNodeId)) {
          queue.push(decisionNode.trueNodeId);
        }

        if (!decisionNode.falseNodeId) {
          pathWarnings.push(`Decision node [${node.id}] is missing a "False (F)" connection.`);
        } else if (!reachableNodeIds.has(decisionNode.falseNodeId)) {
          queue.push(decisionNode.falseNodeId);
        }
      } else if (node.type === 'loop') {
        const loopNode = /** @type {LoopNode} */ (node);
        if (!loopNode.bodyNodeId) {
          pathWarnings.push(`Loop node [${node.id}] is missing a "Body" connection.`);
        } else if (!reachableNodeIds.has(loopNode.bodyNodeId)) {
          queue.push(loopNode.bodyNodeId);
        }

        if (!loopNode.exitNodeId) {
          pathWarnings.push(`Loop node [${node.id}] is missing an "Exit" connection.`);
        } else if (!reachableNodeIds.has(loopNode.exitNodeId)) {
          queue.push(loopNode.exitNodeId);
        }
      } else if ('nextNodeId' in node) {
        if (node.nextNodeId) {
          if (!reachableNodeIds.has(node.nextNodeId)) {
            queue.push(node.nextNodeId);
          }
        } else if (node.type !== 'start' || nodes.size > 1) {
          pathWarnings.push(`Node [${node.id}] (${node.type}) has no outgoing connection.`);
        }
      }
    }

    // Check for unreachable orphaned nodes
    for (const [id, node] of nodes.entries()) {
      if (!reachableNodeIds.has(id)) {
        pathWarnings.push(`Node [${id}] (${node.type}) is not reachable from the Start node.`);
      }
    }

    return { reachableNodeIds, isEndReachable, pathWarnings };
  }
}
