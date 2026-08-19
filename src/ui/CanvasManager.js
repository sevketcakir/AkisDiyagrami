import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';

/**
 * @class CanvasManager
 * Manages the Drawflow visual canvas, custom flowchart node shapes, and canvas events.
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
    // Listen to node input changes to keep node data synced
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
  }

  /**
   * Adds a node to the canvas at (posX, posY).
   * @param {string} type
   * @param {number} posX
   * @param {number} posY
   * @param {Object} [customData]
   */
  addNode(type, posX, posY, customData = {}) {
    switch (type) {
      case 'start': {
        const html = `
          <div class="flowchart-node-content shape-oval shape-start">
            <div class="node-title">START</div>
            <div class="node-subtitle">Entry (main)</div>
          </div>
        `;
        return this.editor.addNode('start', 0, 1, posX, posY, 'start', customData, html);
      }

      case 'end': {
        const html = `
          <div class="flowchart-node-content shape-oval shape-end">
            <div class="node-title">END</div>
            <div class="node-subtitle">return 0;</div>
          </div>
        `;
        return this.editor.addNode('end', 1, 0, posX, posY, 'end', customData, html);
      }

      case 'assignment': {
        const expr = customData.expression ?? 'x = 0';
        const html = `
          <div class="flowchart-node-content shape-rectangle">
            <div class="node-header">Process / Assignment</div>
            <div class="node-body">
              <input type="text" df-expression value="${expr}" placeholder="e.g. x = y + 5" />
            </div>
          </div>
        `;
        return this.editor.addNode('assignment', 1, 1, posX, posY, 'assignment', { expression: expr, ...customData }, html);
      }

      case 'decision': {
        const cond = customData.condition ?? 'x > 0';
        const html = `
          <div class="flowchart-node-content shape-diamond-wrapper">
            <div class="shape-diamond"></div>
            <div class="diamond-inner">
              <div class="node-header">Decision (If)</div>
              <input type="text" df-condition value="${cond}" placeholder="e.g. score >= 50" />
            </div>
            <div class="port-label-true">True (T)</div>
            <div class="port-label-false">False (F)</div>
          </div>
        `;
        // 1 input, 2 outputs (output_1: True, output_2: False)
        return this.editor.addNode('decision', 1, 2, posX, posY, 'decision', { condition: cond, ...customData }, html);
      }

      case 'loop': {
        const cond = customData.condition ?? 'i < 10';
        const html = `
          <div class="flowchart-node-content shape-hexagon-wrapper">
            <div class="shape-hexagon"></div>
            <div class="hexagon-inner">
              <div class="node-header">Loop (While)</div>
              <input type="text" df-condition value="${cond}" placeholder="e.g. i <= 10" />
            </div>
            <div class="port-label-body">Body</div>
            <div class="port-label-exit">Exit</div>
          </div>
        `;
        // 2 inputs (entry + loopback), 2 outputs (output_1: Body, output_2: Exit)
        return this.editor.addNode('loop', 2, 2, posX, posY, 'loop', { condition: cond, ...customData }, html);
      }

      case 'input': {
        const varName = customData.variableName ?? 'x';
        const prompt = customData.prompt ?? `Enter ${varName}:`;
        const html = `
          <div class="flowchart-node-content shape-parallelogram shape-input">
            <div class="parallelogram-inner">
              <div class="node-header">Input (scanf)</div>
              <input type="text" df-variableName value="${varName}" placeholder="Variable (e.g. x)" />
            </div>
          </div>
        `;
        return this.editor.addNode('input', 1, 1, posX, posY, 'input', { variableName: varName, prompt, ...customData }, html);
      }

      case 'output': {
        const expr = customData.expression ?? '"Result: " + x';
        const html = `
          <div class="flowchart-node-content shape-parallelogram shape-output">
            <div class="parallelogram-inner">
              <div class="node-header">Output (printf)</div>
              <input type="text" df-expression value="${expr}" placeholder="Expression to print" />
            </div>
          </div>
        `;
        return this.editor.addNode('output', 1, 1, posX, posY, 'output', { expression: expr, ...customData }, html);
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

    this.activeNodeId = nodeId;
    if (nodeId) {
      const currentElement = this.container.querySelector(`#node-${nodeId}`);
      if (currentElement) {
        currentElement.classList.add('active-executing-node');
        // Scroll into view if out of viewport
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
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
   * Exports diagram JSON.
   */
  exportData() {
    // Before export, ensure latest input values are reflected in node data
    const inputs = this.container.querySelectorAll('.drawflow-node input');
    for (const input of inputs) {
      const nodeEl = input.closest('.drawflow-node');
      if (!nodeEl) continue;
      const nodeId = nodeEl.id.replace('node-', '');
      const nodeData = this.editor.getNodeFromId(nodeId);
      if (!nodeData) continue;

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
   * Loads diagram data into canvas.
   * @param {Object} data
   */
  loadData(data) {
    this.clear();
    this.editor.import(data);

    // Re-bind input values from loaded node data into the DOM inputs
    setTimeout(() => {
      const moduleData = data?.drawflow?.Home?.data || data?.data || {};
      for (const [id, node] of Object.entries(moduleData)) {
        const nodeEl = this.container.querySelector(`#node-${id}`);
        if (!nodeEl) continue;

        const exprInput = nodeEl.querySelector('input[df-expression]');
        if (exprInput && node.data?.expression !== undefined) {
          exprInput.value = node.data.expression;
        }

        const condInput = nodeEl.querySelector('input[df-condition]');
        if (condInput && node.data?.condition !== undefined) {
          condInput.value = node.data.condition;
        }

        const varInput = nodeEl.querySelector('input[df-variableName]');
        if (varInput && node.data?.variableName !== undefined) {
          varInput.value = node.data.variableName;
        }
      }
    }, 50);
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
