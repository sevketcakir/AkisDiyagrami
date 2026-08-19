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
import { I18n } from '../i18n/I18n.js';

/**
 * @class GraphParser
 * Translates visual Drawflow canvas graphs into executable FlowchartNode instances,
 * performing full graph topology validation, port connection checks, and reachability path search.
 */
export class GraphParser {
  /**
   * Parses Drawflow export JSON object into an array or map of FlowchartNode objects.
   * @param {Object} drawflowData - Exported JSON from drawflow.export()
   * @param {Function} [evaluator] - Evaluator hook (defaults to SafeEvaluator.hook)
   * @returns {{
   *   nodes: Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>,
   *   startNodeId: string|null,
   *   errors: string[],
   *   warnings: string[],
   *   errorNodeId: string|null
   * }}
   */
  static parseDrawflow(drawflowData, evaluator = SafeEvaluator.hook) {
    const nodes = new Map();
    const errors = [];
    const warnings = [];
    let errorNodeId = null;
    let startNodeId = null;

    const moduleData = drawflowData?.drawflow?.Home?.data || drawflowData?.data || drawflowData || {};

    const nodeEntries = Object.entries(moduleData);
    if (nodeEntries.length === 0) {
      errors.push(I18n.t('errors.emptyCanvas'));
      return { nodes, startNodeId: null, errors, warnings, errorNodeId: null };
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
          const condition = nodeData.condition ?? nodeData.text ?? 'i = 1, 10, 1';
          nodeInstance = new LoopNode(id, {
            condition,
            bodyNodeId: nextNodeId,    // output_1 is Loop Body
            exitNodeId: secondNodeId,  // output_2 is Loop Exit
            evaluator
          });
        } else if (name.includes('input')) {
          const variableName = String(nodeData.variableName ?? nodeData.variablename ?? nodeData.variable ?? nodeData.name ?? nodeData.text ?? 'x').trim();
          const prompt = `Enter value for ${variableName}:`;
          nodeInstance = new InputNode(id, {
            variableName,
            prompt,
            nextNodeId
          });
        } else if (name.includes('output')) {
          const expression = String(nodeData.expression ?? nodeData.text ?? 'x').trim();
          nodeInstance = new OutputNode(id, {
            expression,
            nextNodeId,
            evaluator
          });
        } else {
          errors.push(`Unknown node type "${name}" with ID ${id}.`);
          if (!errorNodeId) errorNodeId = id;
        }

        if (nodeInstance) {
          nodes.set(id, nodeInstance);
        }
      } catch (err) {
        errors.push(`Error parsing node ${id}: ${err.message}`);
        if (!errorNodeId) errorNodeId = id;
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
      errors.push(I18n.t('errors.noStartNode'));
      return { nodes, startNodeId: null, errors, warnings, errorNodeId: null };
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

    // Pass 4: Graph Reachability & Port Connectivity Validation
    const { reachableNodeIds, isEndReachable, pathErrors, pathWarnings, firstErrorNodeId } = GraphParser.searchPath(nodes, startNodeId);
    errors.push(...pathErrors);
    warnings.push(...pathWarnings);
    if (!errorNodeId && firstErrorNodeId) {
      errorNodeId = firstErrorNodeId;
    }

    if (hasEndNode && !isEndReachable && pathErrors.length === 0) {
      errors.push(I18n.t('errors.noPathToEnd'));
    }

    return { nodes, startNodeId, errors, warnings, errorNodeId };
  }

  /**
   * Performs BFS traversal from StartNode to verify connectivity, detect dangling ports, and find reachability to EndNode.
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @param {string} startNodeId
   * @returns {{
   *   reachableNodeIds: Set<string>,
   *   isEndReachable: boolean,
   *   pathErrors: string[],
   *   pathWarnings: string[],
   *   firstErrorNodeId: string|null
   * }}
   */
  static searchPath(nodes, startNodeId) {
    const reachableNodeIds = new Set();
    const pathErrors = [];
    const pathWarnings = [];
    const queue = [startNodeId];
    let firstErrorNodeId = null;
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
          pathErrors.push(I18n.t('errors.missingTrueConnection', { id: node.id }));
          if (!firstErrorNodeId) firstErrorNodeId = node.id;
        } else if (!reachableNodeIds.has(decisionNode.trueNodeId)) {
          queue.push(decisionNode.trueNodeId);
        }

        if (!decisionNode.falseNodeId) {
          pathErrors.push(I18n.t('errors.missingFalseConnection', { id: node.id }));
          if (!firstErrorNodeId) firstErrorNodeId = node.id;
        } else if (!reachableNodeIds.has(decisionNode.falseNodeId)) {
          queue.push(decisionNode.falseNodeId);
        }
      } else if (node.type === 'loop') {
        const loopNode = /** @type {LoopNode} */ (node);
        if (!loopNode.bodyNodeId) {
          pathErrors.push(I18n.t('errors.missingLoopBodyConnection', { id: node.id }));
          if (!firstErrorNodeId) firstErrorNodeId = node.id;
        } else if (!reachableNodeIds.has(loopNode.bodyNodeId)) {
          queue.push(loopNode.bodyNodeId);
        }

        if (!loopNode.exitNodeId) {
          pathErrors.push(I18n.t('errors.missingLoopExitConnection', { id: node.id }));
          if (!firstErrorNodeId) firstErrorNodeId = node.id;
        } else if (!reachableNodeIds.has(loopNode.exitNodeId)) {
          queue.push(loopNode.exitNodeId);
        }
      } else if ('nextNodeId' in node) {
        if (node.nextNodeId) {
          if (!reachableNodeIds.has(node.nextNodeId)) {
            queue.push(node.nextNodeId);
          }
        } else if (node.type === 'start') {
          if (nodes.size > 1) {
            pathErrors.push(I18n.t('errors.startNotConnected', { id: node.id }));
            if (!firstErrorNodeId) firstErrorNodeId = node.id;
          }
        } else {
          pathErrors.push(I18n.t('errors.missingOutgoingConnection', { id: node.id, type: node.type }));
          if (!firstErrorNodeId) firstErrorNodeId = node.id;
        }
      }
    }

    // Check for unreachable orphaned nodes
    for (const [id, node] of nodes.entries()) {
      if (!reachableNodeIds.has(id)) {
        pathWarnings.push(I18n.t('errors.unreachableNode', { id, type: node.type }));
      }
    }

    return { reachableNodeIds, isEndReachable, pathErrors, pathWarnings, firstErrorNodeId };
  }
}
