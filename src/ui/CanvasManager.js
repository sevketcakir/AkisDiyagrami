import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import { AutoLayout } from './AutoLayout.js';
import { I18n } from '../i18n/I18n.js';
import { InputNode } from '../engine/nodes/InputNode.js';

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
      const validation = InputNode.validateVariableName(varName);
      const isInvalid = !validation.isValid;
      const tooltip = isInvalid
        ? `${escapeHtml(varName)}\n⚠️ ${I18n.t('nodes.inputInvalidWarning')}`
        : escapeHtml(varName);
      return `
        <div class="flowchart-node-content node-parallelogram shape-input ${isInvalid ? 'node-input-invalid' : ''}">
          <svg class="shape-svg" viewBox="0 0 190 80" preserveAspectRatio="none">
            <polygon points="26,5 185,5 164,75 5,75" class="svg-shape-path svg-input" />
          </svg>
          <div class="node-inner-content">
            <div class="node-header">${I18n.t('nodes.inputHeader')}</div>
            <textarea df-variablename class="node-textarea" rows="${rows}" placeholder="${I18n.t('nodes.inputPlaceholder')}" title="${tooltip}">${escapeHtml(varName)}</textarea>
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
 * Cleans points by eliminating redundant collinear points and duplicates.
 * @param {Array<{x: number, y: number}>} points
 * @returns {Array<{x: number, y: number}>}
 */
export function cleanPoints(points) {
  if (!points || points.length <= 2) return points ? [...points] : [];
  const result = [{ x: Math.round(points[0].x), y: Math.round(points[0].y) }];

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = { x: Math.round(points[i].x), y: Math.round(points[i].y) };

    // Skip if coincident with previous point
    if (Math.abs(curr.x - prev.x) < 1 && Math.abs(curr.y - prev.y) < 1) {
      continue;
    }

    // Check if intermediate point is collinear with previous-previous and current
    if (result.length >= 2) {
      const pPrev = result[result.length - 2];
      // Horizontal collinearity
      if (Math.abs(pPrev.y - prev.y) === 0 && Math.abs(prev.y - curr.y) === 0) {
        result[result.length - 1] = curr;
        continue;
      }
      // Vertical collinearity
      if (Math.abs(pPrev.x - prev.x) === 0 && Math.abs(prev.x - curr.x) === 0) {
        result[result.length - 1] = curr;
        continue;
      }
    }

    result.push(curr);
  }

  return result;
}

/**
 * Generates an SVG path string connecting orthogonal points with smooth rounded fillet corners.
 * @param {Array<{x: number, y: number}>} rawPoints
 * @param {number} [radius=6]
 * @returns {string} SVG Path 'd'
 */
export function createFilletedPath(rawPoints, radius = 6) {
  const points = cleanPoints(rawPoints);
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

    const startX = Math.round(curr.x + (vx1 / len1) * r);
    const startY = Math.round(curr.y + (vy1 / len1) * r);
    const endX = Math.round(curr.x + (vx2 / len2) * r);
    const endY = Math.round(curr.y + (vy2 / len2) * r);

    d += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`;
  }

  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

/**
 * Determines port exit or entry normal direction.
 * @param {string} nodeType
 * @param {string} portClass e.g. "output_1", "output_2", "input_1", "input_2"
 * @param {boolean} isOutput
 * @returns {'north' | 'south' | 'east' | 'west'}
 */
export function getPortDirection(nodeType, portClass, isOutput) {
  const type = (nodeType || '').toLowerCase();
  if (isOutput) {
    if (type.includes('decision')) {
      return portClass === 'output_1' ? 'west' : 'east'; // True = Left (West), False = Right (East)
    }
    if (type.includes('loop')) {
      return portClass === 'output_1' ? 'east' : 'south'; // Body = Right (East), Exit = Bottom (South)
    }
    return 'south'; // Start, Assignment, Input, Output: all exit South (Bottom)
  } else {
    if (type.includes('loop') && portClass === 'input_2') {
      return 'east'; // Loopback in (←): enters from East (Right)
    }
    return 'north'; // All input_1 ports enter from North (Top)
  }
}

/**
 * Fallback port coordinate offsets when DOM element measurements are not yet ready.
 * @param {string} nodeType
 * @param {string} portClass
 * @param {boolean} isOutput
 * @returns {{x: number, y: number}}
 */
export function getNodePortOffset(nodeType, portClass, isOutput) {
  const type = (nodeType || '').toLowerCase();
  if (type.includes('decision')) {
    if (isOutput) {
      return portClass === 'output_1' ? { x: 0, y: 55 } : { x: 190, y: 55 };
    }
    return { x: 95, y: 0 };
  }
  if (type.includes('loop')) {
    if (isOutput) {
      return portClass === 'output_1' ? { x: 200, y: 19 } : { x: 100, y: 95 };
    }
    return portClass === 'input_2' ? { x: 200, y: 76 } : { x: 100, y: 0 };
  }
  if (type.includes('start')) {
    return { x: 85, y: 60 };
  }
  if (type.includes('end')) {
    return { x: 85, y: 0 };
  }
  if (type.includes('input')) {
    return isOutput ? { x: 95, y: 80 } : { x: 95, y: 0 };
  }
  if (type.includes('output')) {
    return isOutput ? { x: 100, y: 95 } : { x: 100, y: 0 };
  }
  // assignment / process
  return isOutput ? { x: 95, y: 75 } : { x: 95, y: 0 };
}

/**
 * Full Manhattan 90-degree orthogonal router using exact port orientations and bus separation.
 *
 * @param {number} x1 - Source port X
 * @param {number} y1 - Source port Y
 * @param {number} x2 - Target port X
 * @param {number} y2 - Target port Y
 * @param {'north' | 'south' | 'east' | 'west'} [sourceDir='south']
 * @param {'north' | 'south' | 'east' | 'west'} [targetDir='north']
 * @param {Object} [options]
 * @param {number} [options.connIndex=0]
 * @returns {string} SVG Path 'd'
 */
export function routeOrthogonalConnection(x1, y1, x2, y2, sourceDir = 'south', targetDir = 'north', options = {}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const connIndex = options.connIndex || 0;
  const busOffset = connIndex * 16;

  let rawPoints = [];

  // =========================================================================
  // Target: EAST (Loop input_2 loopback return port on right edge)
  // The line MUST approach (x2, y2) from the right (+X) heading left (-X).
  // =========================================================================
  if (targetDir === 'east') {
    const corridorX = Math.round(x2 + 30 + busOffset);

    if (sourceDir === 'east') {
      // Source exits East (e.g. Decision False)
      const stubX = Math.round(x1 + 20);
      if (y1 > y2) {
        // Source is lower than target: drop below source to clear node, go to corridor, up to y2, enter left
        const clearY = Math.round(y1 + 30);
        rawPoints = [
          { x: x1, y: y1 },
          { x: stubX, y: y1 },
          { x: stubX, y: clearY },
          { x: corridorX, y: clearY },
          { x: corridorX, y: y2 },
          { x: x2, y: y2 }
        ];
      } else {
        // Source is higher than or level with target
        rawPoints = [
          { x: x1, y: y1 },
          { x: corridorX, y: y1 },
          { x: corridorX, y: y2 },
          { x: x2, y: y2 }
        ];
      }
    } else if (sourceDir === 'west') {
      // Source exits West (e.g. Decision True returning to loop)
      const stubX = Math.round(x1 - 20);
      const clearY = Math.round(y1 + (y1 > y2 ? 30 : -30));
      rawPoints = [
        { x: x1, y: y1 },
        { x: stubX, y: y1 },
        { x: stubX, y: clearY },
        { x: corridorX, y: clearY },
        { x: corridorX, y: y2 },
        { x: x2, y: y2 }
      ];
    } else {
      // Default: Source exits South (bottom port returning up to loop)
      const dropY = Math.round(y1 + 20);
      rawPoints = [
        { x: x1, y: y1 },
        { x: x1, y: dropY },
        { x: corridorX, y: dropY },
        { x: corridorX, y: y2 },
        { x: x2, y: y2 }
      ];
    }

    return createFilletedPath(rawPoints, 8);
  }

  // =========================================================================
  // Target: NORTH (All standard input_1 top ports)
  // The line MUST approach (x2, y2) from above heading down (+Y).
  // =========================================================================

  // Source exits EAST (e.g. Loop Body or Decision False)
  if (sourceDir === 'east') {
    if (x2 >= x1 && dy >= 15) {
      // Clean L-step: go right to x2, then down to y2
      rawPoints = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x2, y: y2 }
      ];
    } else if (x2 >= x1 && dy < 15) {
      // Target is level with or higher than source:
      // Step up above target top, go across to x2, drop down into y2
      const stepX = Math.round(x1 + Math.min(30, Math.max(15, dx * 0.35)));
      const clearTopY = Math.round(y2 - 20);
      rawPoints = [
        { x: x1, y: y1 },
        { x: stepX, y: y1 },
        { x: stepX, y: clearTopY },
        { x: x2, y: clearTopY },
        { x: x2, y: y2 }
      ];
    } else {
      // Target is to the left of East port (x2 < x1)
      const stubX = Math.round(x1 + 25);
      const midY = Math.max(y1 + 25, Math.round((y1 + y2) / 2));
      rawPoints = [
        { x: x1, y: y1 },
        { x: stubX, y: y1 },
        { x: stubX, y: midY },
        { x: x2, y: midY },
        { x: x2, y: y2 }
      ];
    }
    return createFilletedPath(rawPoints, 8);
  }

  // Source exits WEST (e.g. Decision True)
  if (sourceDir === 'west') {
    if (x2 <= x1 && dy >= 15) {
      // Clean L-step: go left to x2, then down to y2
      rawPoints = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x2, y: y2 }
      ];
    } else if (x2 <= x1 && dy < 15) {
      // Target is level with or higher than source:
      // Step up above target top, go left to x2, drop down into y2
      const stepX = Math.round(x1 - Math.min(30, Math.max(15, Math.abs(dx) * 0.35)));
      const clearTopY = Math.round(y2 - 20);
      rawPoints = [
        { x: x1, y: y1 },
        { x: stepX, y: y1 },
        { x: stepX, y: clearTopY },
        { x: x2, y: clearTopY },
        { x: x2, y: y2 }
      ];
    } else {
      // Target is to the right of West port (x2 > x1)
      const stubX = Math.round(x1 - 25);
      const midY = Math.max(y1 + 25, Math.round((y1 + y2) / 2));
      rawPoints = [
        { x: x1, y: y1 },
        { x: stubX, y: y1 },
        { x: stubX, y: midY },
        { x: x2, y: midY },
        { x: x2, y: y2 }
      ];
    }
    return createFilletedPath(rawPoints, 8);
  }

  // Source exits SOUTH (Default: Start, Assignment, Input, Output, Loop Exit)
  if (dy >= 15) {
    if (Math.abs(dx) <= 4) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    const midY = Math.round((y1 + y2) / 2);
    rawPoints = [
      { x: x1, y: y1 },
      { x: x1, y: midY },
      { x: x2, y: midY },
      { x: x2, y: y2 }
    ];
  } else {
    // Upward flow from bottom to top (U-shaped loop around side corridor)
    const clearBottomY = Math.round(y1 + 25);
    const clearTopY = Math.round(y2 - 25);
    const goLeft = dx <= 0;
    const corridorX = goLeft
      ? Math.round(Math.min(x1, x2) - 45 - busOffset)
      : Math.round(Math.max(x1, x2) + 45 + busOffset);

    rawPoints = [
      { x: x1, y: y1 },
      { x: x1, y: clearBottomY },
      { x: corridorX, y: clearBottomY },
      { x: corridorX, y: clearTopY },
      { x: x2, y: clearTopY },
      { x: x2, y: y2 }
    ];
  }

  return createFilletedPath(rawPoints, 8);
}

/**
 * Builds clean Orthogonal (Manhattan 90-degree) step paths with multi-corner routing and rounded corners.
 * Handles backward compatibility with tests while providing port-direction awareness.
 *
 * @param {number} x1 - Source port X
 * @param {number} y1 - Source port Y
 * @param {number} x2 - Target port X
 * @param {number} y2 - Target port Y
 * @param {'north' | 'south' | 'east' | 'west'} [sourceDir]
 * @param {'north' | 'south' | 'east' | 'west'} [targetDir]
 * @param {Object} [options]
 * @returns {string} SVG Path 'd' attribute
 */
export function buildOrthogonalPath(x1, y1, x2, y2, sourceDir, targetDir, options) {
  if (sourceDir && targetDir) {
    return routeOrthogonalConnection(x1, y1, x2, y2, sourceDir, targetDir, options);
  }

  const dx = x2 - x1;
  const dy = y2 - y1;

  // 1. Straight vertical alignment (within 5px)
  if (Math.abs(dx) <= 5 && dy > 0) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // 2. Upward loopback / return line (dy <= -10)
  if (dy <= -10) {
    const clearBottomY = y1 + 25;
    const clearTopY = y2 - 25;
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
  if (dx > 20 && dy < 30) {
    const clearTopY = y2 - 25;
    const stepRightX = Math.round(x1 + Math.min(35, dx * 0.35));
    return createFilletedPath([
      { x: x1, y: y1 },
      { x: stepRightX, y: y1 },
      { x: stepRightX, y: clearTopY },
      { x: x2, y: clearTopY },
      { x: x2, y: y2 }
    ]);
  }

  // 4. Return Wire going Left to Loop In port at horizontal level
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

  // 5. Exiting Right and flowing downwards
  if (dx > 20) {
    return createFilletedPath([
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 }
    ]);
  }

  // 6. Exiting Left and flowing downwards
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

    // Intercept updateConnectionNodes to calculate exact port-aware orthogonal routes
    const origUpdateConnectionNodes = this.editor.updateConnectionNodes.bind(this.editor);
    this.editor.updateConnectionNodes = (id) => {
      origUpdateConnectionNodes(id);
      this.routeAllNodeConnections(id);
    };
  }

  /**
   * Recalculates and updates the SVG path 'd' for all connections associated with a node (or all nodes if omitted).
   * Uses precise port positions, orientations, and bus corridor separation.
   * @param {string} [id] - e.g. "node-12" or "12"
   */
  routeAllNodeConnections(id) {
    const precanvas = this.container.querySelector('.drawflow');
    if (!precanvas) return;

    const precanvasRect = precanvas.getBoundingClientRect();
    const zoom = this.editor.zoom || 1;
    const rawData = this.editor.drawflow.drawflow[this.editor.module]?.data || {};

    let conns = [];
    if (id) {
      const cleanId = String(id).replace('node-', '');
      const outConns = Array.from(this.container.querySelectorAll(`.drawflow .connection.node_out_node-${cleanId}`));
      const inConns = Array.from(this.container.querySelectorAll(`.drawflow .connection.node_in_node-${cleanId}`));
      conns = Array.from(new Set([...outConns, ...inConns]));
    } else {
      conns = Array.from(this.container.querySelectorAll('.drawflow .connection'));
    }

    for (const conn of conns) {
      const path = conn.querySelector('.main-path');
      if (!path) continue;

      const classes = Array.from(conn.classList);
      const outNodeClass = classes.find(c => c.startsWith('node_out_node-'));
      const inNodeClass = classes.find(c => c.startsWith('node_in_node-'));
      const outPortClass = classes.find(c => c.startsWith('output_'));
      const inPortClass = classes.find(c => c.startsWith('input_'));

      if (!outNodeClass || !inNodeClass || !outPortClass || !inPortClass) continue;

      const sourceId = outNodeClass.replace('node_out_node-', '');
      const targetId = inNodeClass.replace('node_in_node-', '');

      const sourceNode = rawData[sourceId];
      const targetNode = rawData[targetId];
      if (!sourceNode || !targetNode) continue;

      const sourceEl = this.container.querySelector(`#node-${sourceId}`);
      const targetEl = this.container.querySelector(`#node-${targetId}`);

      const sourcePortEl = sourceEl?.querySelector(`.${outPortClass}`);
      const targetPortEl = targetEl?.querySelector(`.${inPortClass}`);

      let x1, y1, x2, y2;

      if (sourcePortEl && targetPortEl && precanvasRect.width > 0) {
        const outRect = sourcePortEl.getBoundingClientRect();
        const inRect = targetPortEl.getBoundingClientRect();

        if (outRect.width > 0 && inRect.width > 0) {
          x1 = (outRect.left + outRect.width / 2 - precanvasRect.left) / zoom;
          y1 = (outRect.top + outRect.height / 2 - precanvasRect.top) / zoom;
          x2 = (inRect.left + inRect.width / 2 - precanvasRect.left) / zoom;
          y2 = (inRect.top + inRect.height / 2 - precanvasRect.top) / zoom;
        }
      }

      // Fallback calculation using node pos_x, pos_y and port offsets
      if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
        const outOffset = getNodePortOffset(sourceNode.name || sourceNode.class, outPortClass, true);
        const inOffset = getNodePortOffset(targetNode.name || targetNode.class, inPortClass, false);
        x1 = (sourceNode.pos_x || 0) + outOffset.x;
        y1 = (sourceNode.pos_y || 0) + outOffset.y;
        x2 = (targetNode.pos_x || 0) + inOffset.x;
        y2 = (targetNode.pos_y || 0) + inOffset.y;
      }

      const sourceDir = getPortDirection(sourceNode.name || sourceNode.class, outPortClass, true);
      const targetDir = getPortDirection(targetNode.name || targetNode.class, inPortClass, false);

      let connIndex = 0;
      if (targetDir === 'east') {
        const loopConnections = targetNode.inputs?.input_2?.connections || [];
        const idx = loopConnections.findIndex(c => String(c.node) === String(sourceId));
        connIndex = idx >= 0 ? idx : 0;
      }

      const d = routeOrthogonalConnection(x1, y1, x2, y2, sourceDir, targetDir, {
        connIndex,
        sourceNode,
        targetNode
      });

      if (d) {
        path.setAttributeNS(null, 'd', d);
      }
    }
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
          <path class="arrow-marker-path" d="M 1 1 L 9 5 L 1 9 z" />
        </marker>
        <!-- True Branch Arrow (Green) -->
        <marker id="flowchart-arrow-true" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path class="arrow-marker-path" d="M 1 1 L 9 5 L 1 9 z" />
        </marker>
        <!-- False Branch Arrow (Red) -->
        <marker id="flowchart-arrow-false" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path class="arrow-marker-path" d="M 1 1 L 9 5 L 1 9 z" />
        </marker>
        <!-- Loop Body Arrow (Cyan) -->
        <marker id="flowchart-arrow-body" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path class="arrow-marker-path" d="M 1 1 L 9 5 L 1 9 z" />
        </marker>
        <!-- Loopback Return Arrow (Purple) -->
        <marker id="flowchart-arrow-loopback" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path class="arrow-marker-path" d="M 1 1 L 9 5 L 1 9 z" />
        </marker>
        <!-- Active Executing Glow Arrow (Gold) -->
        <marker id="flowchart-arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path class="arrow-marker-path" d="M 1 1 L 9 5 L 1 9 z" />
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

      // Real-time Input node validation feedback
      const shapeInput = target.closest('.shape-input');
      if (shapeInput) {
        const validation = InputNode.validateVariableName(target.value);
        shapeInput.classList.toggle('node-input-invalid', !validation.isValid);
        if (!validation.isValid) {
          target.title = `${target.value}\n⚠️ ${I18n.t('nodes.inputInvalidWarning')}`;
        }
      }

      const nodeElement = target.closest('.drawflow-node');
      if (!nodeElement) return;

      const nodeId = nodeElement.id.replace('node-', '');

      // Dynamically adjust textarea height based on line count
      if (target.tagName === 'TEXTAREA') {
        const lineCount = target.value.split('\n').length;
        target.rows = Math.min(6, Math.max(1, lineCount));
        this.routeAllNodeConnections(nodeId);
      }

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

      this.routeAllNodeConnections();
      this.classifyConnections();
      this.onDataChange?.();
    });

    this.editor.on('connectionRemoved', () => {
      this.routeAllNodeConnections();
      this.classifyConnections();
      this.onDataChange?.();
    });

    this.editor.on('nodeCreated', () => {
      this.routeAllNodeConnections();
      this.classifyConnections();
      this.onDataChange?.();
    });

    this.editor.on('nodeMoved', (id) => {
      this.routeAllNodeConnections(id);
      this.classifyConnections();
      this.onDataChange?.();
    });

    this.editor.on('nodeRemoved', () => {
      this.routeAllNodeConnections();
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
   * Highlights a node with an error state (e.g. missing connection or syntax error).
   * @param {string|null} nodeId
   */
  highlightErrorNode(nodeId) {
    this.clearErrorHighlight();
    if (!nodeId) return;

    this.errorNodeId = String(nodeId);
    const element = this.container.querySelector(`#node-${this.errorNodeId}`);
    if (element) {
      element.classList.add('error-executing-node');
    }
  }

  /**
   * Clears any error node highlight.
   */
  clearErrorHighlight() {
    if (this.errorNodeId) {
      const element = this.container.querySelector(`#node-${this.errorNodeId}`);
      if (element) {
        element.classList.remove('error-executing-node');
      }
      this.errorNodeId = null;
    }
    const allErrors = this.container.querySelectorAll('.error-executing-node');
    allErrors.forEach(el => el.classList.remove('error-executing-node'));
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
   * Clears any active highlight and error highlight.
   */
  clearHighlight() {
    this.highlightActiveNode(null);
    this.clearErrorHighlight();
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
      this.routeAllNodeConnections();
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
    setTimeout(() => this.zoomToFit(), 60);
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
   * Calculates canvas coordinates corresponding to the center of the visible viewport.
   * Useful for tap-to-add on mobile/tablets or keyboard node placement.
   * @returns {{ x: number, y: number }}
   */
  getVisibleCanvasCenter() {
    const rect = this.container.getBoundingClientRect();
    const viewW = rect.width || this.container.clientWidth || 800;
    const viewH = rect.height || this.container.clientHeight || 600;
    const zoom = this.editor.zoom || 1;
    const canvasX = this.editor.canvas_x || 0;
    const canvasY = this.editor.canvas_y || 0;

    const screenCenterX = viewW / 2;
    const screenCenterY = viewH / 2;

    const posX = Math.round((screenCenterX - canvasX) / zoom - 90);
    const posY = Math.round((screenCenterY - canvasY) / zoom - 40);

    return { x: Math.max(20, posX), y: Math.max(20, posY) };
  }

  /**
   * Centers and scales all diagram nodes within the visible viewport.
   * Capped at 100% zoom (1.0) so small diagrams don't blow up.
   * @param {Object} [options]
   * @param {number} [options.padding=70] - Padding around bounding box in pixels
   * @param {boolean} [options.animate=true] - Whether to animate smoothly
   */
  zoomToFit(options = {}) {
    const rawNodes = this.editor.drawflow?.drawflow?.[this.editor.module]?.data || {};
    const nodeIds = Object.keys(rawNodes);

    if (nodeIds.length === 0) {
      this.zoomReset();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const id of nodeIds) {
      const node = rawNodes[id];
      const posX = Number(node.pos_x) || 0;
      const posY = Number(node.pos_y) || 0;

      const el = this.container.querySelector(`#node-${id}`);
      const width = el ? (el.offsetWidth || 180) : 180;
      const height = el ? (el.offsetHeight || 80) : 80;

      if (posX < minX) minX = posX;
      if (posY < minY) minY = posY;
      if (posX + width > maxX) maxX = posX + width;
      if (posY + height > maxY) maxY = posY + height;
    }

    if (!isFinite(minX) || !isFinite(minY)) {
      this.zoomReset();
      return;
    }

    const rect = this.container.getBoundingClientRect();
    const viewW = rect.width || this.container.clientWidth || 800;
    const viewH = rect.height || this.container.clientHeight || 600;

    const padding = options.padding ?? 70;
    const availW = Math.max(100, viewW - padding * 2);
    const availH = Math.max(100, viewH - padding * 2);

    const contentW = Math.max(50, maxX - minX);
    const contentH = Math.max(50, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    let targetZoom = Math.min(availW / contentW, availH / contentH);
    targetZoom = Math.min(1.0, Math.max(0.2, targetZoom));
    targetZoom = Math.round(targetZoom * 100) / 100;

    const targetCanvasX = Math.round((viewW / 2) - (centerX * targetZoom));
    const targetCanvasY = Math.round((viewH / 2) - (centerY * targetZoom));

    const animate = options.animate !== false;
    const precanvas = this.container.querySelector('.drawflow');

    if (animate && precanvas) {
      precanvas.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
    }

    this.editor.zoom = targetZoom;
    this.editor.zoom_last_value = targetZoom;
    this.editor.canvas_x = targetCanvasX;
    this.editor.canvas_y = targetCanvasY;

    if (precanvas) {
      precanvas.style.transform = `translate(${targetCanvasX}px, ${targetCanvasY}px) scale(${targetZoom})`;
    }

    this.editor.dispatch('zoom', targetZoom);
    this.editor.dispatch('translate', { x: targetCanvasX, y: targetCanvasY });

    if (animate && precanvas) {
      setTimeout(() => {
        precanvas.style.transition = '';
        this.routeAllNodeConnections();
      }, 260);
    } else {
      this.routeAllNodeConnections();
    }
  }

  /**
   * Refreshes all rendered node titles, headers, port labels, and placeholders to match active language.
   */
  refreshNodeLabels() {
    const nodeElements = this.container.querySelectorAll('.drawflow-node');
    nodeElements.forEach((nodeEl) => {
      const numId = nodeEl.id.replace('node-', '');
      let nodeType = '';
      try {
        const rawData = this.editor.getNodeFromId(numId);
        nodeType = (rawData?.name || rawData?.class || '').toLowerCase();
      } catch {
        // Fallback to class search
      }

      if (!nodeType) {
        for (const cls of ['start', 'end', 'assignment', 'decision', 'loop', 'input', 'output']) {
          if (nodeEl.classList.contains(cls)) {
            nodeType = cls;
            break;
          }
        }
      }

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
