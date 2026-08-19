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
 * Translates visual Drawflow canvas graphs into executable FlowchartNode instances.
 */
export class GraphParser {
  /**
   * Parses Drawflow export JSON object into an array or map of FlowchartNode objects.
   * @param {Object} drawflowData - Exported JSON from drawflow.export()
   * @param {Function} [evaluator] - Evaluator hook (defaults to SafeEvaluator.hook)
   * @returns {{ nodes: Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>, startNodeId: string|null, errors: string[] }}
   */
  static parseDrawflow(drawflowData, evaluator = SafeEvaluator.hook) {
    const nodes = new Map();
    const errors = [];
    let startNodeId = null;

    const moduleData = drawflowData?.drawflow?.Home?.data || drawflowData?.data || drawflowData || {};

    // First pass: instantiate all nodes
    for (const [idStr, rawNode] of Object.entries(moduleData)) {
      const id = String(rawNode.id || idStr);
      const name = (rawNode.name || rawNode.class || '').toLowerCase();
      const nodeData = rawNode.data || {};

      const outputs = rawNode.outputs || {};
      const nextNodeId = outputs.output_1?.connections?.[0]?.node ? String(outputs.output_1.connections[0].node) : null;
      const secondNodeId = outputs.output_2?.connections?.[0]?.node ? String(outputs.output_2.connections[0].node) : null;

      try {
        let nodeInstance = null;

        switch (name) {
          case 'start':
            nodeInstance = new StartNode(id, nextNodeId);
            if (!startNodeId) {
              startNodeId = id;
            }
            break;

          case 'end':
            nodeInstance = new EndNode(id);
            break;

          case 'assignment':
          case 'process': {
            const expression = nodeData.expression ?? nodeData.text ?? '';
            const variableName = nodeData.variableName || null;
            nodeInstance = new AssignmentNode(id, {
              expression,
              variableName,
              nextNodeId,
              evaluator
            });
            break;
          }

          case 'decision':
          case 'condition': {
            const condition = nodeData.condition ?? nodeData.text ?? 'true';
            nodeInstance = new DecisionNode(id, {
              condition,
              trueNodeId: nextNodeId,     // output_1 is True
              falseNodeId: secondNodeId,  // output_2 is False
              evaluator
            });
            break;
          }

          case 'loop': {
            const condition = nodeData.condition ?? nodeData.text ?? 'true';
            nodeInstance = new LoopNode(id, {
              condition,
              bodyNodeId: nextNodeId,    // output_1 is Loop Body
              exitNodeId: secondNodeId,  // output_2 is Loop Exit
              evaluator
            });
            break;
          }

          case 'input': {
            const variableName = nodeData.variableName ?? nodeData.text ?? 'x';
            const prompt = nodeData.prompt ?? `Enter ${variableName}:`;
            nodeInstance = new InputNode(id, {
              variableName,
              prompt,
              nextNodeId
            });
            break;
          }

          case 'output': {
            const expression = nodeData.expression ?? nodeData.text ?? '';
            nodeInstance = new OutputNode(id, {
              expression,
              nextNodeId,
              evaluator
            });
            break;
          }

          default:
            errors.push(`Unknown node type "${name}" with ID ${id}.`);
            break;
        }

        if (nodeInstance) {
          nodes.set(id, nodeInstance);
        }
      } catch (err) {
        errors.push(`Error building node ${id}: ${err.message}`);
      }
    }

    if (!startNodeId) {
      // Look for any start node in created map
      for (const [id, node] of nodes.entries()) {
        if (node.type === 'start') {
          startNodeId = id;
          break;
        }
      }
    }

    if (!startNodeId && nodes.size > 0) {
      errors.push('No StartNode found in flowchart. Please add a Start (Oval) node.');
    }

    return { nodes, startNodeId, errors };
  }
}
