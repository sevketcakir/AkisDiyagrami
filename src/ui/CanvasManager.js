import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import { AutoLayout } from './AutoLayout.js';
import { I18n } from '../i18n/I18n.js';

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
          <div class="node-title">${I18n.t('nodes.startTitle')}</div>
          <div class="node-subtitle">${I18n.t('nodes.startSubtitle')}</div>
        </div>
      `;

    case 'end':
      return `
        <div class="flowchart-node-content shape-oval shape-end">
          <div class="node-title">${I18n.t('nodes.endTitle')}</div>
          <div class="node-subtitle">${I18n.t('nodes.endSubtitle')}</div>
        </div>
      `;

    case 'assignment': {
      const expr = customData.expression ?? customData.text ?? 'x = 0';
      const lines = String(expr).split('\n').length;
      const rows = Math.min(4, Math.max(1, lines));
      return `
        <div class="flowchart-node-content shape-rectangle">
          <div class="node-header">${I18n.t('nodes.processHeader')}</div>
          <div class="node-body">
            <textarea df-expression class="node-textarea" rows="${rows}" placeholder="${I18n.t('nodes.processPlaceholder')}" title="${escapeHtml(expr)}">${escapeHtml(expr)}</textarea>
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
            <div class="node-header">${I18n.t('nodes.decisionHeader')}</div>
            <textarea df-condition class="node-textarea" rows="1" placeholder="${I18n.t('nodes.decisionPlaceholder')}" title="${escapeHtml(cond)}">${escapeHtml(cond)}</textarea>
          </div>
          <div class="port-label port-label-true">${I18n.t('nodes.portTrue')}</div>
          <div class="port-label port-label-false">${I18n.t('nodes.portFalse')}</div>
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
            <div class="node-header">${I18n.t('nodes.loopHeader')}</div>
            <textarea df-condition class="node-textarea" rows="1" placeholder="${I18n.t('nodes.loopPlaceholder')}" title="${escapeHtml(cond)}">${escapeHtml(cond)}</textarea>
          </div>
          <div class="port-label port-label-body">${I18n.t('nodes.portBody')}</div>
          <div class="port-label port-label-loopback">${I18n.t('nodes.portIn')}</div>
          <div class="port-label port-label-exit">${I18n.t('nodes.portExit')}</div>
        </div>
      `;
    }

    case 'input': {
      const varName = customData.variableName ?? customData.variablename ?? customData.variable ?? customData.name ?? customData.text ?? 'x';
      const lines = String(varName).split('\n').length;
      const rows = Math.min(3, Math.max(1, lines));
      return `
        <div class="flowchart-node-content node-parallelogram shape-input">
          <svg class="shape-svg" viewBox="0 0 190 80" preserveAspectRatio="none">
            <polygon points="26,5 185,5 164,75 5,75" class="svg-shape-path svg-input" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">${I18n.t('nodes.inputHeader')}</div>
            <textarea df-variablename class="node-textarea" rows="${rows}" placeholder="${I18n.t('nodes.inputPlaceholder')}" title="${escapeHtml(varName)}">${escapeHtml(varName)}</textarea>
          </div>
        </div>
      `;
    }

    case 'output': {
      const expr = customData.expression ?? customData.text ?? 'x';
      const lines = String(expr).split('\n').length;
      const rows = Math.min(3, Math.max(1, lines));
      return `
        <div class="flowchart-node-content node-document shape-output">
          <svg class="shape-svg" viewBox="0 0 200 105" preserveAspectRatio="none">
            <path d="M 5,5 L 195,5 L 195,74 C 155,98 145,98 100,74 C 55,50 45,50 5,74 Z" class="svg-shape-path svg-document" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">${I18n.t('nodes.outputHeader')}</div>
            <textarea df-expression class="node-textarea" rows="${rows}" placeholder="${I18n.t('nodes.outputPlaceholder')}" title="${escapeHtml(expr)}">${escapeHtml(expr)}</textarea>
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
 * Generates an SVG path string connecting orthogonal points with smooth rounded fillet corners.
 * @param {Array<{x: number, y: number}>} points
 * @param {number} [radius=6]
 * @returns {string} SVG Path 'd'
 */
export function createFilletedPath(points, radius = 6) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const vx1 = prev.x - curr.x;
    const vy1 = prev.y - curr.y;
    const len1 = Math.hypot(vx1, vy1);

    const vx2 = next.x - curr.x;
    const vy2 = next.y - curr.y;
    const len2 = Math.hypot(vx2, vy2);

    if (len1 === 0 || len2 === 0) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const r = Math.min(radius, len1 / 2, len2 / 2);

    const startX = curr.x + (vx1 / len1) * r;
    const startY = curr.y + (vy1 / len1) * r;
    const endX = curr.x + (vx2 / len2) * r;
    const endY = curr.y + (vy2 / len2) * r;

    d += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`;
  }

  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

/**
 * Builds clean Orthogonal (Manhattan 90-degree) step paths with multi-corner routing and rounded corners.
 * Handles loop body top entry, loop return under pass, and lateral branching cleanly without node collision.
 *
 * @param {number} x1 - Source port X
 * @param {number} y1 - Source port Y
 * @param {number} x2 - Target port X
 * @param {number} y2 - Target port Y
 * @returns {string} SVG Path 'd' attribute
 */
export function buildOrthogonalPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  // 1. Straight vertical alignment (within 5px)
  if (Math.abs(dx) <= 5 && dy > 0) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // 2. Upward loopback / return line (dy <= -10)
  // Drops down under source block, routes around side corridor (left or right), steps up above target, and drops into top port
  if (dy <= -10) {
    const clearBottomY = y1 + 25;
    const clearTopY = y2 - 25;
    // Route around the left corridor if source is to the left or dx < -20
    const goLeft = dx < -20 || (Math.abs(dx) <= 20 && x1 < 300);
    const corridorX = goLeft ? Math.min(x1, x2) - 50 : Math.max(x1, x2) + 50;

    return createFilletedPath([
      { x: x1, y: y1 },
      { x: x1, y: clearBottomY },
      { x: corridorX, y: clearBottomY },
      { x: corridorX, y: clearTopY },
      { x: x2, y: clearTopY },
      { x: x2, y: y2 }
    ]);
  }

  // 3. Loop Body Output (exiting right to a target whose top is level or higher, e.g. sum1ToN)
  // Routes right, steps UP above target block, goes right, and drops cleanly into top input port
  if (dx > 20 && dy < 30) {
    const clearTopY = y2 - 25; // 25px clearance above target block
    const stepRightX = Math.round(x1 + Math.min(35, dx * 0.35));
    return createFilletedPath([
      { x: x1, y: y1 },
      { x: stepRightX, y: y1 },
      { x: stepRightX, y: clearTopY },
      { x: x2, y: clearTopY },
      { x: x2, y: y2 }
    ]);
  }

  // 4. Return Wire going Left to Loop In port at horizontal level (e.g. from process bottom (575, 425) to Loop In (450, 421))
  if (dx < -20 && dy < 30) {
    const clearBottomY = y1 + 25;
    const approachX = Math.round(x2 + 25);
    return createFilletedPath([
      { x: x1, y: y1 },
      { x: x1, y: clearBottomY },
      { x: approachX, y: clearBottomY },
      { x: approachX, y: y2 },
      { x: x2, y: y2 }
    ]);
  }

  // 5. Exiting Right and flowing downwards (Decision False or Loop Body to lower block)
  if (dx > 20) {
    return createFilletedPath([
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 }
    ]);
  }

  // 6. Exiting Left and flowing downwards (Decision True)
  if (dx < -20) {
    return createFilletedPath([
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 }
    ]);
  }

  // 7. General Forward Step (Bottom -> Top with lateral offset)
  const midY = Math.round(y1 + dy * 0.5);
  return createFilletedPath([
    { x: x1, y: y1 },
    { x: x1, y: midY },
    { x: x2, y: midY },
    { x: x2, y: y2 }
  ]);
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
    // Prevent Drawflow node dragging when selecting text inside inputs or interactive elements
    const isolateInputEvents = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select', 'button'].includes(tag)) {
        e.stopPropagation();
      }
    };

    this.container.addEventListener('mousedown', isolateInputEvents, true);
    this.container.addEventListener('pointerdown', isolateInputEvents, true);
    this.container.addEventListener('touchstart', isolateInputEvents, true);

    // 1. Synchronize input field changes directly into internal Drawflow node data
    this.container.addEventListener('input', (e) => {
      const target = e.target;
      if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return;

      // Update hover tooltip with full expression text
      target.title = target.value;

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

    const inputs = this.container.querySelectorAll('.drawflow-node input, .drawflow-node textarea');
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
   * Sanitizes, repairs, and enforces strict bidirectional symmetry on all Drawflow node connections.
   * Ensures that inputs and outputs have correctly named connection properties (input vs output).
   * @param {Record<string, any>} rawNodes
   */
  static sanitizeConnections(rawNodes) {
    // 1. Normalize outputs
    for (const [sourceId, node] of Object.entries(rawNodes)) {
      if (!node.outputs) node.outputs = {};
      if (!node.inputs) node.inputs = {};

      for (const [outPort, outObj] of Object.entries(node.outputs)) {
        if (!outObj.connections) outObj.connections = [];
        outObj.connections = outObj.connections.map(conn => {
          const targetNode = String(conn.node);
          const rawPort = conn.output || conn.input || 'input_1';
          const targetPort = rawPort.startsWith('input_') ? rawPort : 'input_1';
          return { node: targetNode, output: targetPort };
        });
      }

      for (const [inPort, inObj] of Object.entries(node.inputs)) {
        if (!inObj.connections) inObj.connections = [];
        inObj.connections = inObj.connections.map(conn => {
          const srcNode = String(conn.node);
          const rawPort = conn.input || conn.output || 'output_1';
          const srcPort = rawPort.startsWith('output_') ? rawPort : 'output_1';
          return { node: srcNode, input: srcPort };
        });
      }
    }

    // 2. Ensure bidirectional symmetry: every output connection MUST exist in the target's inputs
    for (const [sourceId, node] of Object.entries(rawNodes)) {
      for (const [outPort, outObj] of Object.entries(node.outputs)) {
        for (const conn of outObj.connections) {
          const targetNode = rawNodes[conn.node];
          if (targetNode) {
            if (!targetNode.inputs) targetNode.inputs = {};
            const targetPort = conn.output;
            if (!targetNode.inputs[targetPort]) {
              targetNode.inputs[targetPort] = { connections: [] };
            }
            const exists = targetNode.inputs[targetPort].connections.some(
              c => String(c.node) === String(sourceId) && c.input === outPort
            );
            if (!exists) {
              targetNode.inputs[targetPort].connections.push({ node: String(sourceId), input: outPort });
            }
          }
        }
      }
    }
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
        inputs: JSON.parse(JSON.stringify(node.inputs || {})),
        outputs: JSON.parse(JSON.stringify(node.outputs || {})),
        pos_x: Number(node.pos_x) || 100,
        pos_y: Number(node.pos_y) || 100
      };
    }

    // Automatically sanitize and repair connection symmetry
    CanvasManager.sanitizeConnections(sanitizedNodes);

    const canonicalData = {
      drawflow: {
        Home: {
          data: sanitizedNodes
        }
      }
    };

    this.editor.import(canonicalData, false);
    this.injectArrowheadDefs();

    const updateAllNodesAndInputs = () => {
      for (const id of Object.keys(sanitizedNodes)) {
        this.editor.updateConnectionNodes(`node-${id}`);

        const nodeEl = this.container.querySelector(`#node-${id}`);
        if (!nodeEl) continue;

        const nodeObj = sanitizedNodes[id];
        const exprInput = nodeEl.querySelector('input[df-expression], textarea[df-expression]');
        if (exprInput && nodeObj.data?.expression !== undefined) {
          exprInput.value = nodeObj.data.expression;
          exprInput.title = nodeObj.data.expression;
        }

        const condInput = nodeEl.querySelector('input[df-condition], textarea[df-condition]');
        if (condInput && nodeObj.data?.condition !== undefined) {
          condInput.value = nodeObj.data.condition;
          condInput.title = nodeObj.data.condition;
        }

        const varInput = nodeEl.querySelector('input[df-variablename], textarea[df-variablename], input[df-variableName], textarea[df-variableName]');
        const varVal = nodeObj.data?.variableName ?? nodeObj.data?.variablename;
        if (varInput && varVal !== undefined) {
          varInput.value = varVal;
          varInput.title = varVal;
        }
      }
      this.classifyConnections();
    };

    requestAnimationFrame(() => updateAllNodesAndInputs());
    setTimeout(() => updateAllNodesAndInputs(), 50);
    setTimeout(() => updateAllNodesAndInputs(), 150);
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

  /**
   * Refreshes all rendered node titles, headers, port labels, and placeholders to match active language.
   */
  refreshNodeLabels() {
    const nodeElements = this.container.querySelectorAll('.drawflow-node');
    nodeElements.forEach((nodeEl) => {
      const numId = nodeEl.id.replace('node-', '');
      const rawData = this.getNodeData(numId);
      const nodeType = (rawData?.name || rawData?.class || '').toLowerCase();

      // Headers
      const header = nodeEl.querySelector('.node-header');
      if (header) {
        if (nodeType === 'assignment') header.textContent = I18n.t('nodes.processHeader');
        else if (nodeType === 'decision') header.textContent = I18n.t('nodes.decisionHeader');
        else if (nodeType === 'loop') header.textContent = I18n.t('nodes.loopHeader');
        else if (nodeType === 'input') header.textContent = I18n.t('nodes.inputHeader');
        else if (nodeType === 'output') header.textContent = I18n.t('nodes.outputHeader');
      }

      // Start & End Titles
      const startTitle = nodeEl.querySelector('.shape-start .node-title');
      if (startTitle) startTitle.textContent = I18n.t('nodes.startTitle');
      const startSub = nodeEl.querySelector('.shape-start .node-subtitle');
      if (startSub) startSub.textContent = I18n.t('nodes.startSubtitle');

      const endTitle = nodeEl.querySelector('.shape-end .node-title');
      if (endTitle) endTitle.textContent = I18n.t('nodes.endTitle');
      const endSub = nodeEl.querySelector('.shape-end .node-subtitle');
      if (endSub) endSub.textContent = I18n.t('nodes.endSubtitle');

      // Port labels
      const truePort = nodeEl.querySelector('.port-label-true');
      if (truePort) truePort.textContent = I18n.t('nodes.portTrue');
      const falsePort = nodeEl.querySelector('.port-label-false');
      if (falsePort) falsePort.textContent = I18n.t('nodes.portFalse');

      const bodyPort = nodeEl.querySelector('.port-label-body');
      if (bodyPort) bodyPort.textContent = I18n.t('nodes.portBody');
      const inPort = nodeEl.querySelector('.port-label-loopback');
      if (inPort) inPort.textContent = I18n.t('nodes.portIn');
      const exitPort = nodeEl.querySelector('.port-label-exit');
      if (exitPort) exitPort.textContent = I18n.t('nodes.portExit');

      // Placeholders
      const exprTa = nodeEl.querySelector('textarea[df-expression]');
      if (exprTa) {
        exprTa.placeholder = nodeType === 'assignment' ? I18n.t('nodes.processPlaceholder') : I18n.t('nodes.outputPlaceholder');
      }
      const condTa = nodeEl.querySelector('textarea[df-condition]');
      if (condTa) {
        condTa.placeholder = nodeType === 'decision' ? I18n.t('nodes.decisionPlaceholder') : I18n.t('nodes.loopPlaceholder');
      }
      const inputTa = nodeEl.querySelector('textarea[df-variablename]');
      if (inputTa) {
        inputTa.placeholder = I18n.t('nodes.inputPlaceholder');
      }
    });
  }
}
