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
 * Builds clean Orthogonal (Manhattan 90-degree) step paths with rounded fillet corners.
 * @param {number} x1 - Source port X
 * @param {number} y1 - Source port Y
 * @param {number} x2 - Target port X
 * @param {number} y2 - Target port Y
 * @returns {string} SVG Path 'd' attribute
 */
export function buildOrthogonalPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const r = 8; // Corner fillet radius

  // 1. Straight vertical downward line
  if (Math.abs(dx) <= 5 && dy > 0) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // 2. Loopback returning upwards (bottom of body back to loop header)
  if (dy < -5) {
    const gutterX = Math.max(x1, x2) + 40;
    const dropY = y1 + 18;
    return `M ${x1} ${y1} ` +
           `L ${x1} ${dropY - r} ` +
           `Q ${x1} ${dropY} ${x1 + r} ${dropY} ` +
           `L ${gutterX - r} ${dropY} ` +
           `Q ${gutterX} ${dropY} ${gutterX} ${dropY - r} ` +
           `L ${gutterX} ${y2 + r} ` +
           `Q ${gutterX} ${y2} ${gutterX - r} ${y2} ` +
           `L ${x2} ${y2}`;
  }

  // 3. Forward flowing lateral connection (e.g. Decision Left/Right, Loop Body Right)
  if (dx > 20) {
    // Exits horizontally to the Right
    return `M ${x1} ${y1} ` +
           `L ${x2 - r} ${y1} ` +
           `Q ${x2} ${y1} ${x2} ${y1 + r} ` +
           `L ${x2} ${y2}`;
  } else if (dx < -20) {
    // Exits horizontally to the Left
    return `M ${x1} ${y1} ` +
           `L ${x2 + r} ${y1} ` +
           `Q ${x2} ${y1} ${x2} ${y1 + r} ` +
           `L ${x2} ${y2}`;
  }

  // 4. Default Linear Forward Step (Bottom -> Top when slightly offset)
  const midY = Math.round(y1 + dy * 0.5);
  const dirX = dx >= 0 ? 1 : -1;
  return `M ${x1} ${y1} ` +
         `L ${x1} ${midY - r} ` +
         `Q ${x1} ${midY} ${x1 + dirX * r} ${midY} ` +
         `L ${x2 - dirX * r} ${midY} ` +
         `Q ${x2} ${midY} ${x2} ${midY + r} ` +
         `L ${x2} ${y2}`;
}

/**
 * @class CanvasManager
 * Manages the Drawflow visual canvas, orthogonal flowchart node shapes, and connection rules.
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
    this.activeConnection = null;
    this.onDataChange = null;

    this.init();
  }

  init() {
    this.editor.start();
    this.setupOrthogonalRouting();
    this.injectArrowheadDefs();
    this.setupEvents();
  }

  /**
   * Sets up paper-standard orthogonal (Manhattan 90-degree) connection lines.
   */
  setupOrthogonalRouting() {
    this.editor.createCurvature = (start_pos_x, start_pos_y, end_pos_x, end_pos_y) => {
      return buildOrthogonalPath(start_pos_x, start_pos_y, end_pos_x, end_pos_y);
    };
  }

  /**
   * Injects color-coded SVG arrowhead marker definitions.
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
        <!-- Default Linear Arrow -->
        <marker id="flowchart-arrow-default" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#38bdf8" />
        </marker>
        <!-- True Branch Arrow (Green) -->
        <marker id="flowchart-arrow-true" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#22c55e" />
        </marker>
        <!-- False Branch Arrow (Red) -->
        <marker id="flowchart-arrow-false" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#f43f5e" />
        </marker>
        <!-- Loop Body Arrow (Cyan) -->
        <marker id="flowchart-arrow-body" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#06b6d4" />
        </marker>
        <!-- Loopback Return Arrow (Purple) -->
        <marker id="flowchart-arrow-loopback" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#a855f7" />
        </marker>
        <!-- Active Executing Glow Arrow (Gold) -->
        <marker id="flowchart-arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="#eab308" />
        </marker>
      </defs>
    `;
    precanvas.prepend(svgDefs);
  }

  /**
   * Applies semantic color classes (conn-true, conn-false, conn-body, conn-loopback, conn-linear) to connection SVGs.
   */
  classifyConnections() {
    const rawData = this.editor.drawflow.drawflow[this.editor.module]?.data || {};
    const conns = this.container.querySelectorAll('.drawflow .connection');

    for (const conn of conns) {
      const classes = Array.from(conn.classList);
      const outNodeClass = classes.find(c => c.startsWith('node_out_node-'));
      const inNodeClass = classes.find(c => c.startsWith('node_in_node-'));
      const outPortClass = classes.find(c => c.startsWith('output_'));
      const inPortClass = classes.find(c => c.startsWith('input_'));

      if (!outNodeClass) continue;
      const sourceId = outNodeClass.replace('node_out_node-', '');
      const sourceNode = rawData[sourceId];
      const sourceType = (sourceNode?.name || sourceNode?.class || '').toLowerCase();

      conn.classList.remove('conn-true', 'conn-false', 'conn-body', 'conn-loopback', 'conn-linear');

      if (sourceType.includes('decision')) {
        if (outPortClass === 'output_1') {
          conn.classList.add('conn-true');
        } else if (outPortClass === 'output_2') {
          conn.classList.add('conn-false');
        }
      } else if (sourceType.includes('loop')) {
        if (outPortClass === 'output_1') {
          conn.classList.add('conn-body');
        }
      }

      if (inNodeClass) {
        const targetId = inNodeClass.replace('node_in_node-', '');
        const targetNode = rawData[targetId];
        const targetType = (targetNode?.name || targetNode?.class || '').toLowerCase();
        if (targetType.includes('loop') && inPortClass === 'input_2') {
          conn.classList.add('conn-loopback');
        }
      }

      if (!conn.classList.contains('conn-true') &&
          !conn.classList.contains('conn-false') &&
          !conn.classList.contains('conn-body') &&
          !conn.classList.contains('conn-loopback')) {
        conn.classList.add('conn-linear');
      }
    }
  }

  setupEvents() {
    // 1. Synchronize input field changes directly into internal Drawflow node data
    this.container.addEventListener('input', (e) => {
      const target = e.target;
      if (!target || target.tagName !== 'INPUT') return;

      const nodeElement = target.closest('.drawflow-node');
      if (!nodeElement) return;

      const nodeId = nodeElement.id.replace('node-', '');
      const rawNode = this.editor.drawflow.drawflow[this.editor.module]?.data?.[nodeId];
      if (!rawNode) return;
      if (!rawNode.data) rawNode.data = {};

      for (const attr of target.attributes) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('df-')) {
          const key = name.slice(3);
          rawNode.data[key] = target.value;
          if (key === 'variablename' || key === 'variable') {
            rawNode.data.variableName = target.value;
            rawNode.data.variablename = target.value;
          }
          if (key === 'expression') {
            rawNode.data.expression = target.value;
          }
          if (key === 'condition') {
            rawNode.data.condition = target.value;
          }
          if (key === 'prompt') {
            rawNode.data.prompt = target.value;
          }
        }
      }

      this.onDataChange?.();
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

      this.classifyConnections();
      this.onDataChange?.();
    });

    this.editor.on('connectionRemoved', () => {
      this.classifyConnections();
      this.onDataChange?.();
    });

    this.editor.on('nodeCreated', () => {
      this.classifyConnections();
      this.onDataChange?.();
    });

    this.editor.on('nodeRemoved', () => {
      this.classifyConnections();
      this.onDataChange?.();
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

    let id = null;
    switch (type) {
      case 'start':
        id = this.editor.addNode('start', 0, 1, posX, posY, 'start', customData, html, false);
        break;

      case 'end':
        id = this.editor.addNode('end', 1, 0, posX, posY, 'end', customData, html, false);
        break;

      case 'assignment': {
        const expr = customData.expression ?? 'x = 0';
        id = this.editor.addNode('assignment', 1, 1, posX, posY, 'assignment', { expression: expr, ...customData }, html, false);
        break;
      }

      case 'decision': {
        const cond = customData.condition ?? 'x > 0';
        id = this.editor.addNode('decision', 1, 2, posX, posY, 'decision', { condition: cond, ...customData }, html, false);
        break;
      }

      case 'loop': {
        const cond = customData.condition ?? 'I = 1, N, 1';
        id = this.editor.addNode('loop', 2, 2, posX, posY, 'loop', { condition: cond, ...customData }, html, false);
        break;
      }

      case 'input': {
        const varName = customData.variableName ?? customData.variablename ?? customData.variable ?? 'x';
        id = this.editor.addNode('input', 1, 1, posX, posY, 'input', { variableName: varName, variablename: varName, ...customData }, html, false);
        break;
      }

      case 'output': {
        const expr = customData.expression ?? 'x';
        id = this.editor.addNode('output', 1, 1, posX, posY, 'output', { expression: expr, ...customData }, html, false);
        break;
      }

      default:
        console.warn(`Unknown node type to add: ${type}`);
    }

    setTimeout(() => this.classifyConnections(), 20);
    return id;
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
   * Highlights the active connection path currently being traversed during execution.
   * @param {string|null} fromNodeId
   * @param {string|null} toNodeId
   */
  highlightActiveConnection(fromNodeId, toNodeId) {
    this.clearActiveConnection();
    if (!fromNodeId || !toNodeId) return;

    const selector = `.connection.node_out_node-${fromNodeId}.node_in_node-${toNodeId}`;
    const conn = this.container.querySelector(selector);
    if (conn) {
      conn.classList.add('active-flow-path');
      this.activeConnection = conn;
    }
  }

  /**
   * Clears any active connection highlight.
   */
  clearActiveConnection() {
    if (this.activeConnection) {
      this.activeConnection.classList.remove('active-flow-path');
      this.activeConnection = null;
    }
    const allActive = this.container.querySelectorAll('.connection.active-flow-path');
    allActive.forEach(c => c.classList.remove('active-flow-path'));
  }

  /**
   * Clears any active highlight.
   */
  clearHighlight() {
    this.highlightActiveNode(null);
    this.clearActiveConnection();
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
   * Exports diagram JSON with synchronized input values from all DOM inputs.
   */
  exportData() {
    const exported = this.editor.export();
    const moduleData = exported?.drawflow?.Home?.data || exported?.data || {};

    const inputs = this.container.querySelectorAll('.drawflow-node input');
    for (const input of inputs) {
      const nodeEl = input.closest('.drawflow-node');
      if (!nodeEl) continue;
      const nodeId = nodeEl.id.replace('node-', '');
      const nodeData = moduleData[nodeId];
      const rawInternalNode = this.editor.drawflow.drawflow[this.editor.module]?.data?.[nodeId];

      if (nodeData) {
        if (!nodeData.data) nodeData.data = {};
        if (rawInternalNode && !rawInternalNode.data) rawInternalNode.data = {};

        for (const attr of input.attributes) {
          const name = attr.name.toLowerCase();
          if (name.startsWith('df-')) {
            const key = name.slice(3);
            nodeData.data[key] = input.value;
            if (rawInternalNode) rawInternalNode.data[key] = input.value;

            if (key === 'variablename' || key === 'variable') {
              nodeData.data.variableName = input.value;
              nodeData.data.variablename = input.value;
              if (rawInternalNode) {
                rawInternalNode.data.variableName = input.value;
                rawInternalNode.data.variablename = input.value;
              }
            }
            if (key === 'expression') {
              nodeData.data.expression = input.value;
              if (rawInternalNode) rawInternalNode.data.expression = input.value;
            }
            if (key === 'condition') {
              nodeData.data.condition = input.value;
              if (rawInternalNode) rawInternalNode.data.condition = input.value;
            }
            if (key === 'prompt') {
              nodeData.data.prompt = input.value;
              if (rawInternalNode) rawInternalNode.data.prompt = input.value;
            }
          }
        }
      }
    }

    return exported;
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
      this.classifyConnections();
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
