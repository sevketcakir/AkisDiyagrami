import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import { AutoLayout } from './AutoLayout.js';

/**
 * Generates paper-standard flowchart node HTML using embedded SVG shapes.
 * - Start / End: Oval (Capsule)
 * - Assignment / Process: Rectangle
 * - Decision: Diamond (Top In, Left True, Right False)
 * - Loop: Hexagon (Top In, Upper Right Body Out, Lower Right In Return, Bottom Exit Out)
 * - Input: Parallelogram (scanf)
 * - Output: Document symbol (printf) with generous bottom clearance
 *
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
          <div class="port-label port-label-true">True (← T)</div>
          <div class="port-label port-label-false">False (F →)</div>
        </div>
      `;
    }

    case 'loop': {
      const cond = customData.condition ?? customData.text ?? 'I = 1, N, 1';
      return `
        <div class="flowchart-node-content node-hexagon">
          <svg class="shape-svg" viewBox="0 0 200 95" preserveAspectRatio="none">
            <polygon points="28,5 172,5 195,47 172,90 28,90 5,47" class="svg-shape-path svg-loop" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">Loop (Hexagon)</div>
            <input type="text" df-condition value="${escapeHtml(cond)}" placeholder="e.g. I = 1, N, 1" />
          </div>
          <div class="port-label port-label-body">Body (→)</div>
          <div class="port-label port-label-loopback">In (←)</div>
          <div class="port-label port-label-exit">Exit (↓)</div>
        </div>
      `;
    }

    case 'input': {
      const varName = customData.variableName ?? customData.variablename ?? customData.variable ?? customData.name ?? customData.text ?? 'x';
      return `
        <div class="flowchart-node-content node-parallelogram shape-input">
          <svg class="shape-svg" viewBox="0 0 190 80" preserveAspectRatio="none">
            <polygon points="26,5 185,5 164,75 5,75" class="svg-shape-path svg-input" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">Input (scanf)</div>
            <input type="text" df-variablename value="${escapeHtml(varName)}" placeholder="Variable (e.g. N)" />
          </div>
        </div>
      `;
    }

    case 'output': {
      const expr = customData.expression ?? customData.text ?? 'x';
      return `
        <div class="flowchart-node-content node-document shape-output">
          <svg class="shape-svg" viewBox="0 0 200 105" preserveAspectRatio="none">
            <path d="M 5,5 L 195,5 L 195,74 C 155,98 145,98 100,74 C 55,50 45,50 5,74 Z" class="svg-shape-path svg-document" />
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
 * Manages the Drawflow visual canvas, vertical flowchart node shapes, and connection rules.
 */
export class CanvasManager {
  /**
   * @param {HTMLElement} container - DOM container element for the canvas
   */
  constructor(container) {
    this.container = container;
    this.editor = new Drawflow(this.container);
    this.editor.reroute = false;
    this.activeNodeId = null;

    this.init();
  }

  init() {
    this.editor.start();
    this.setupVerticalCurvature();
    this.injectArrowheadDefs();
    this.setupEvents();
  }

  /**
   * Sets up natural flowchart connection curves respecting port exit directions (Bottom, Right, Left).
   */
  setupVerticalCurvature() {
    this.editor.createCurvature = (start_pos_x, start_pos_y, end_pos_x, end_pos_y) => {
      const deltaX = end_pos_x - start_pos_x;
      const deltaY = end_pos_y - start_pos_y;

      // 1. Straight vertical downward line
      if (Math.abs(deltaX) <= 6 && deltaY > 0) {
        return `M ${start_pos_x} ${start_pos_y} L ${end_pos_x} ${end_pos_y}`;
      }

      // 2. Loopback connection returning upwards (e.g. bottom of body back to loop header)
      if (deltaY < -10) {
        const loopOffset = Math.max(45, Math.abs(deltaX) * 0.4);
        const p1x = start_pos_x + (deltaX >= 0 ? loopOffset : -loopOffset);
        const p1y = start_pos_y + 30;
        const p2x = end_pos_x + 45;
        const p2y = end_pos_y;
        return `M ${start_pos_x} ${start_pos_y} C ${p1x} ${p1y} ${p2x} ${p2y} ${end_pos_x} ${end_pos_y}`;
      }

      // 3. Forward flowing connections:
      let start_dx = 0;
      let start_dy = 0;

      if (deltaX > 20) {
        // Exits horizontally to the Right (e.g. Decision False, Loop Body)
        start_dx = Math.max(35, deltaX * 0.45);
        start_dy = 0;
      } else if (deltaX < -20) {
        // Exits horizontally to the Left (e.g. Decision True)
        start_dx = -Math.max(35, Math.abs(deltaX) * 0.45);
        start_dy = 0;
      } else {
        // Exits vertically Downwards from bottom port
        start_dx = 0;
        start_dy = Math.max(25, deltaY * 0.45);
      }

      // Enters vertically from the Top into destination
      const end_dx = 0;
      const end_dy = -Math.max(25, Math.abs(deltaY) * 0.45);

      const hx1 = start_pos_x + start_dx;
      const hy1 = start_pos_y + start_dy;
      const hx2 = end_pos_x + end_dx;
      const hy2 = end_pos_y + end_dy;

      return `M ${start_pos_x} ${start_pos_y} C ${hx1} ${hy1} ${hx2} ${hy2} ${end_pos_x} ${end_pos_y}`;
    };
  }

  /**
   * Injects sleek SVG arrowhead marker definitions for clean connector arrows.
   */
  injectArrowheadDefs() {
    const precanvas = this.container.querySelector('.drawflow');
    if (!precanvas || precanvas.querySelector('#drawflow-arrow-defs')) return;

    const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgDefs.id = 'drawflow-arrow-defs';
    svgDefs.style.position = 'absolute';
    svgDefs.style.width = '0';
    svgDefs.style.height = '0';
    svgDefs.style.overflow = 'hidden';

    svgDefs.innerHTML = `
      <defs>
        <marker id="flowchart-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#64748b" />
        </marker>
        <marker id="flowchart-arrow-selected" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#38bdf8" />
        </marker>
        <marker id="flowchart-arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#22c55e" />
        </marker>
      </defs>
    `;
    precanvas.prepend(svgDefs);
  }

  setupEvents() {
    // 1. Synchronize input field changes directly into nodeData
    this.container.addEventListener('input', (e) => {
      const target = e.target;
      if (!target || target.tagName !== 'INPUT') return;

      const nodeElement = target.closest('.drawflow-node');
      if (!nodeElement) return;

      const nodeId = nodeElement.id.replace('node-', '');
      const nodeData = this.editor.getNodeFromId(nodeId);
      if (!nodeData) return;
      if (!nodeData.data) nodeData.data = {};

      for (const attr of target.attributes) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('df-')) {
          const key = name.slice(3);
          nodeData.data[key] = target.value;
          if (key === 'variablename' || key === 'variable') {
            nodeData.data.variableName = target.value;
            nodeData.data.variablename = target.value;
          }
          if (key === 'expression') {
            nodeData.data.expression = target.value;
          }
          if (key === 'condition') {
            nodeData.data.condition = target.value;
          }
          if (key === 'prompt') {
            nodeData.data.prompt = target.value;
          }
        }
      }
    });

    // 2. Enforce connection rules:
    // Single-output ports must only have 1 active outgoing connection.
    this.editor.on('connectionCreated', ({ output_id, input_id, output_class, input_class }) => {
      const sourceNode = this.editor.getNodeFromId(output_id);
      if (!sourceNode) return;

      const connections = sourceNode.outputs?.[output_class]?.connections || [];
      if (connections.length > 1) {
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
        // 1 input (Top), 2 outputs (output_1: True on Left, output_2: False on Right)
        return this.editor.addNode('decision', 1, 2, posX, posY, 'decision', { condition: cond, ...customData }, html, false);
      }

      case 'loop': {
        const cond = customData.condition ?? 'I = 1, N, 1';
        // 2 inputs (input_1: Top Entry, input_2: Lower Right Loop Return), 2 outputs (output_1: Upper Right Body, output_2: Bottom Exit)
        return this.editor.addNode('loop', 2, 2, posX, posY, 'loop', { condition: cond, ...customData }, html, false);
      }

      case 'input': {
        const varName = customData.variableName ?? customData.variablename ?? customData.variable ?? 'x';
        const prompt = customData.prompt ?? `Enter ${varName}:`;
        return this.editor.addNode('input', 1, 1, posX, posY, 'input', { variableName: varName, variablename: varName, prompt, ...customData }, html, false);
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
    this.injectArrowheadDefs();
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
      for (const attr of input.attributes) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('df-')) {
          const key = name.slice(3);
          nodeData.data[key] = input.value;
          if (key === 'variablename' || key === 'variable') {
            nodeData.data.variableName = input.value;
            nodeData.data.variablename = input.value;
          }
          if (key === 'expression') {
            nodeData.data.expression = input.value;
          }
          if (key === 'condition') {
            nodeData.data.condition = input.value;
          }
          if (key === 'prompt') {
            nodeData.data.prompt = input.value;
          }
        }
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
        typenode: false,
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

    this.editor.import(canonicalData, false);
    this.injectArrowheadDefs();

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

        const varInput = nodeEl.querySelector('input[df-variablename], input[df-variableName]');
        const varVal = nodeObj.data?.variableName ?? nodeObj.data?.variablename;
        if (varInput && varVal !== undefined) {
          varInput.value = varVal;
        }
      }
    }, 40);
  }

  /**
   * Automatically lays out and snaps all canvas nodes into a clean vertical flowchart.
   */
  autoLayout() {
    const rawData = this.exportData();
    const organizedData = AutoLayout.layout(rawData);
    this.loadData(organizedData);
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
