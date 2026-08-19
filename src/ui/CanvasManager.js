import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';

/**
 * Generates paper-standard flowchart node HTML using embedded SVG shapes.
 * @param {string} type
 * @param {Object} [customData]
 * @returns {string}
 */
export function renderNodeHtml(type, customData = {}) {
  switch (type) {
    case 'start':
      return `
        <div class="flowchart-node-content shape-oval shape-start">
          <div class="node-title">START</div>
          <div class="node-subtitle">int main()</div>
        </div>
      `;

    case 'end':
      return `
        <div class="flowchart-node-content shape-oval shape-end">
          <div class="node-title">END</div>
          <div class="node-subtitle">return 0;</div>
        </div>
      `;

    case 'assignment': {
      const expr = customData.expression ?? customData.text ?? 'x = 0';
      return `
        <div class="flowchart-node-content shape-rectangle">
          <div class="node-header">Process / Assignment</div>
          <div class="node-body">
            <input type="text" df-expression value="${escapeHtml(expr)}" placeholder="e.g. x = y + 5" />
          </div>
        </div>
      `;
    }

    case 'decision': {
      const cond = customData.condition ?? customData.text ?? 'x > 0';
      return `
        <div class="flowchart-node-content node-diamond">
          <svg class="shape-svg" viewBox="0 0 190 110" preserveAspectRatio="none">
            <polygon points="95,5 185,55 95,105 5,55" class="svg-shape-path svg-decision" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">Decision (If)</div>
            <input type="text" df-condition value="${escapeHtml(cond)}" placeholder="e.g. score >= 50" />
          </div>
          <div class="port-label port-label-true">True (T)</div>
          <div class="port-label port-label-false">False (F)</div>
        </div>
      `;
    }

    case 'loop': {
      const cond = customData.condition ?? customData.text ?? 'i < 10';
      return `
        <div class="flowchart-node-content node-hexagon">
          <svg class="shape-svg" viewBox="0 0 200 95" preserveAspectRatio="none">
            <polygon points="28,5 172,5 195,47 172,90 28,90 5,47" class="svg-shape-path svg-loop" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">Loop (While)</div>
            <input type="text" df-condition value="${escapeHtml(cond)}" placeholder="e.g. i <= 10" />
          </div>
          <div class="port-label port-label-body">Body</div>
          <div class="port-label port-label-exit">Exit</div>
        </div>
      `;
    }

    case 'input': {
      const varName = customData.variableName ?? customData.text ?? 'x';
      return `
        <div class="flowchart-node-content node-parallelogram shape-input">
          <svg class="shape-svg" viewBox="0 0 190 80" preserveAspectRatio="none">
            <polygon points="26,5 185,5 164,75 5,75" class="svg-shape-path svg-input" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">Input (scanf)</div>
            <input type="text" df-variableName value="${escapeHtml(varName)}" placeholder="Variable (e.g. x)" />
          </div>
        </div>
      `;
    }

    case 'output': {
      const expr = customData.expression ?? customData.text ?? 'x';
      return `
        <div class="flowchart-node-content node-parallelogram shape-output">
          <svg class="shape-svg" viewBox="0 0 190 80" preserveAspectRatio="none">
            <polygon points="26,5 185,5 164,75 5,75" class="svg-shape-path svg-output" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">Output (printf)</div>
            <input type="text" df-expression value="${escapeHtml(expr)}" placeholder="Expression to print" />
          </div>
        </div>
      `;
    }

    default:
      return `<div class="flowchart-node-content shape-rectangle">${type}</div>`;
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @class CanvasManager
 * Manages the Drawflow visual canvas, custom flowchart node shapes, and connection rules.
 */
export class CanvasManager {
  /**
   * @param {HTMLElement} container - DOM container element for the canvas
   */
  constructor(container) {
    this.container = container;
    this.editor = new Drawflow(this.container);
    this.editor.reroute = true;
    this.editor.reroute_fix_curvature = true;
    this.activeNodeId = null;

    this.init();
  }

  init() {
    this.editor.start();
    this.setupEvents();
  }

  setupEvents() {
    // 1. Synchronize input field changes directly into nodeData
    this.container.addEventListener('input', (e) => {
      const target = e.target;
      if (!target.hasAttribute('df-expression') &&
          !target.hasAttribute('df-condition') &&
          !target.hasAttribute('df-variableName') &&
          !target.hasAttribute('df-prompt')) {
        return;
      }

      const nodeElement = target.closest('.drawflow-node');
      if (!nodeElement) return;

      const nodeId = nodeElement.id.replace('node-', '');
      const nodeData = this.editor.getNodeFromId(nodeId);
      if (nodeData) {
        if (!nodeData.data) nodeData.data = {};
        if (target.hasAttribute('df-expression')) {
          nodeData.data.expression = target.value;
        }
        if (target.hasAttribute('df-condition')) {
          nodeData.data.condition = target.value;
        }
        if (target.hasAttribute('df-variableName')) {
          nodeData.data.variableName = target.value;
        }
        if (target.hasAttribute('df-prompt')) {
          nodeData.data.prompt = target.value;
        }
      }
    });

    // 2. Enforce connection rules:
    // Single-output ports must only have 1 active outgoing connection.
    // When a student draws a new connection from an output port that already has one,
    // replace the old connection with the new one.
    this.editor.on('connectionCreated', ({ output_id, input_id, output_class, input_class }) => {
      const sourceNode = this.editor.getNodeFromId(output_id);
      if (!sourceNode) return;

      const connections = sourceNode.outputs?.[output_class]?.connections || [];
      if (connections.length > 1) {
        // Keep the latest connection, remove any earlier connections from this specific port
        for (let i = 0; i < connections.length - 1; i++) {
          const oldConn = connections[i];
          this.editor.removeSingleConnection(output_id, oldConn.node, output_class, oldConn.output);
        }
      }
    });
  }

  /**
   * Adds a node to the canvas at (posX, posY).
   * @param {string} type
   * @param {number} posX
   * @param {number} posY
   * @param {Object} [customData]
   */
  addNode(type, posX, posY, customData = {}) {
    const html = renderNodeHtml(type, customData);

    switch (type) {
      case 'start':
        return this.editor.addNode('start', 0, 1, posX, posY, 'start', customData, html, false);

      case 'end':
        return this.editor.addNode('end', 1, 0, posX, posY, 'end', customData, html, false);

      case 'assignment': {
        const expr = customData.expression ?? 'x = 0';
        return this.editor.addNode('assignment', 1, 1, posX, posY, 'assignment', { expression: expr, ...customData }, html, false);
      }

      case 'decision': {
        const cond = customData.condition ?? 'x > 0';
        // 1 input, 2 outputs (output_1: True, output_2: False)
        return this.editor.addNode('decision', 1, 2, posX, posY, 'decision', { condition: cond, ...customData }, html, false);
      }

      case 'loop': {
        const cond = customData.condition ?? 'i < 10';
        // 2 inputs (entry + loopback), 2 outputs (output_1: Body, output_2: Exit)
        return this.editor.addNode('loop', 2, 2, posX, posY, 'loop', { condition: cond, ...customData }, html, false);
      }

      case 'input': {
        const varName = customData.variableName ?? 'x';
        const prompt = customData.prompt ?? `Enter ${varName}:`;
        return this.editor.addNode('input', 1, 1, posX, posY, 'input', { variableName: varName, prompt, ...customData }, html, false);
      }

      case 'output': {
        const expr = customData.expression ?? 'x';
        return this.editor.addNode('output', 1, 1, posX, posY, 'output', { expression: expr, ...customData }, html, false);
      }

      default:
        console.warn(`Unknown node type to add: ${type}`);
    }
  }

  /**
   * Highlights the currently executing node in glowing green.
   * @param {string|null} nodeId
   */
  highlightActiveNode(nodeId) {
    if (this.activeNodeId) {
      const prevElement = this.container.querySelector(`#node-${this.activeNodeId}`);
      if (prevElement) {
        prevElement.classList.remove('active-executing-node');
      }
    }

    this.activeNodeId = nodeId ? String(nodeId) : null;
    if (this.activeNodeId) {
      const currentElement = this.container.querySelector(`#node-${this.activeNodeId}`);
      if (currentElement) {
        currentElement.classList.add('active-executing-node');
      }
    }
  }

  /**
   * Clears any active highlight.
   */
  clearHighlight() {
    this.highlightActiveNode(null);
  }

  /**
   * Clears the canvas.
   */
  clear() {
    this.clearHighlight();
    this.editor.clearModuleSelected();
    this.editor.clear();
  }

  /**
   * Exports diagram JSON with synchronized input values.
   */
  exportData() {
    const inputs = this.container.querySelectorAll('.drawflow-node input');
    for (const input of inputs) {
      const nodeEl = input.closest('.drawflow-node');
      if (!nodeEl) continue;
      const nodeId = nodeEl.id.replace('node-', '');
      const nodeData = this.editor.getNodeFromId(nodeId);
      if (!nodeData) continue;

      if (!nodeData.data) nodeData.data = {};
      if (input.hasAttribute('df-expression')) {
        nodeData.data.expression = input.value;
      } else if (input.hasAttribute('df-condition')) {
        nodeData.data.condition = input.value;
      } else if (input.hasAttribute('df-variableName')) {
        nodeData.data.variableName = input.value;
      } else if (input.hasAttribute('df-prompt')) {
        nodeData.data.prompt = input.value;
      }
    }

    return this.editor.export();
  }

  /**
   * Loads diagram data into canvas, ensuring complete HTML templates and typenode=false for all nodes.
   * @param {Object} rawData
   */
  loadData(rawData) {
    this.clear();
    if (!rawData) return;

    // Normalize raw data from any source format
    const rawModuleData = rawData?.drawflow?.Home?.data || rawData?.data || rawData || {};
    const sanitizedNodes = {};

    for (const [id, node] of Object.entries(rawModuleData)) {
      if (!node || typeof node !== 'object') continue;
      const numId = parseInt(node.id || id, 10) || String(id);
      const nodeType = (node.name || node.class || 'assignment').toLowerCase();
      const nodeData = node.data || {};

      sanitizedNodes[numId] = {
        id: numId,
        name: nodeType,
        class: node.class || nodeType,
        data: nodeData,
        html: renderNodeHtml(nodeType, nodeData),
        typenode: false, // Explicitly boolean false to prevent Drawflow render.version lookup
        inputs: node.inputs || {},
        outputs: node.outputs || {},
        pos_x: Number(node.pos_x) || 100,
        pos_y: Number(node.pos_y) || 100
      };
    }

    const canonicalData = {
      drawflow: {
        Home: {
          data: sanitizedNodes
        }
      }
    };

    // Import normalized dataset
    this.editor.import(canonicalData, false);

    // Refresh connections and bind input values into DOM inputs
    setTimeout(() => {
      for (const id of Object.keys(sanitizedNodes)) {
        this.editor.updateConnectionNodes(`node-${id}`);

        const nodeEl = this.container.querySelector(`#node-${id}`);
        if (!nodeEl) continue;

        const nodeObj = sanitizedNodes[id];
        const exprInput = nodeEl.querySelector('input[df-expression]');
        if (exprInput && nodeObj.data?.expression !== undefined) {
          exprInput.value = nodeObj.data.expression;
        }

        const condInput = nodeEl.querySelector('input[df-condition]');
        if (condInput && nodeObj.data?.condition !== undefined) {
          condInput.value = nodeObj.data.condition;
        }

        const varInput = nodeEl.querySelector('input[df-variableName]');
        if (varInput && nodeObj.data?.variableName !== undefined) {
          varInput.value = nodeObj.data.variableName;
        }
      }
    }, 40);
  }

  zoomIn() {
    this.editor.zoom_in();
  }

  zoomOut() {
    this.editor.zoom_out();
  }

  zoomReset() {
    this.editor.zoom_reset();
  }
}
