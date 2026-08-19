/**
 * @class AutoLayout
 * Deterministic, paper-standard vertical flowchart layout engine.
 * Arranges nodes along the central vertical axis with symmetric decision branches
 * and right-aligned loop iterations.
 */
export class AutoLayout {
  /**
   * Computes clean (X, Y) positions for all nodes in a flowchart.
   * @param {Object} drawflowData
   * @param {Object} [options]
   * @param {number} [options.startX=280]
   * @param {number} [options.startY=40]
   * @param {number} [options.verticalSpacing=115]
   * @param {number} [options.branchSpacing=200]
   * @returns {Object} Updated drawflowData with optimized pos_x and pos_y
   */
  static layout(drawflowData, options = {}) {
    const startX = options.startX ?? 280;
    const startY = options.startY ?? 40;
    const vSpacing = options.verticalSpacing ?? 115;
    const branchSpacing = options.branchSpacing ?? 200;

    const data = JSON.parse(JSON.stringify(drawflowData));
    const moduleData = data?.drawflow?.Home?.data || data?.data || data || {};

    const nodeIds = Object.keys(moduleData);
    if (nodeIds.length === 0) return data;

    // Find start node
    let startId = null;
    for (const [id, node] of Object.entries(moduleData)) {
      const type = (node.name || node.class || '').toLowerCase();
      if (type.includes('start')) {
        startId = id;
        break;
      }
    }

    if (!startId) {
      startId = nodeIds[0];
    }

    const positions = new Map(); // id -> { x, y }
    const visited = new Set();

    const getTargetId = (node, portName) => {
      return node?.outputs?.[portName]?.connections?.[0]?.node || null;
    };

    const layoutSubtree = (nodeId, x, y) => {
      if (!nodeId || visited.has(String(nodeId))) return y;

      const idStr = String(nodeId);
      const node = moduleData[idStr];
      if (!node) return y;

      visited.add(idStr);
      positions.set(idStr, { x, y });

      const nodeType = (node.name || node.class || '').toLowerCase();

      if (nodeType.includes('decision')) {
        // Decision Diamond:
        // True branch -> Left (x - branchSpacing, y + vSpacing)
        // False branch -> Right (x + branchSpacing, y + vSpacing)
        const trueTargetId = getTargetId(node, 'output_1');
        const falseTargetId = getTargetId(node, 'output_2');

        const nextY = y + vSpacing;
        let trueBranchEndY = nextY;
        let falseBranchEndY = nextY;

        if (trueTargetId && !visited.has(String(trueTargetId))) {
          trueBranchEndY = layoutSubtree(trueTargetId, x - branchSpacing, nextY);
        }

        if (falseTargetId && !visited.has(String(falseTargetId))) {
          falseBranchEndY = layoutSubtree(falseTargetId, x + branchSpacing, nextY);
        }

        // Return the max Y reached by either branch
        return Math.max(trueBranchEndY, falseBranchEndY);
      } else if (nodeType.includes('loop')) {
        // Loop Hexagon:
        // Body branch -> Right (x + branchSpacing, y)
        // Exit branch -> Down (x, y + vSpacing)
        const bodyTargetId = getTargetId(node, 'output_1');
        const exitTargetId = getTargetId(node, 'output_2');

        if (bodyTargetId && !visited.has(String(bodyTargetId))) {
          layoutSubtree(bodyTargetId, x + branchSpacing, y);
        }

        if (exitTargetId && !visited.has(String(exitTargetId))) {
          return layoutSubtree(exitTargetId, x, y + vSpacing);
        }

        return y + vSpacing;
      } else if (nodeType.includes('end')) {
        // End node
        return y;
      } else {
        // Linear nodes (Start, Assignment, Input, Output)
        const nextId = getTargetId(node, 'output_1');
        if (nextId && !visited.has(String(nextId))) {
          return layoutSubtree(nextId, x, y + vSpacing);
        }
        return y;
      }
    };

    layoutSubtree(startId, startX, startY);

    // Place any remaining unvisited / orphan nodes in an aligned right column
    let orphanY = startY;
    for (const id of nodeIds) {
      if (!visited.has(id)) {
        positions.set(id, { x: startX + branchSpacing * 2.5, y: orphanY });
        orphanY += vSpacing;
      }
    }

    // Apply positions back to moduleData
    for (const [id, pos] of positions.entries()) {
      if (moduleData[id]) {
        moduleData[id].pos_x = Math.round(pos.x);
        moduleData[id].pos_y = Math.round(pos.y);
      }
    }

    return data;
  }
}
