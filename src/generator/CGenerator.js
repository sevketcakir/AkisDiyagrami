import { SafeEvaluator } from '../evaluator/Evaluator.js';

/**
 * @class CGeneratorError
 * Custom error class for educational flowchart validation violations.
 */
export class CGeneratorError extends Error {
  /**
   * @param {string} message
   * @param {string|null} [nodeId]
   * @param {'UNSTRUCTURED_BACKEDGE'|'ILLEGAL_LOOP_ENTRY'|'CROSS_JUMP'|'GRAPH_ERROR'} [violationType]
   */
  constructor(message, nodeId = null, violationType = 'GRAPH_ERROR') {
    super(message);
    this.name = 'CGeneratorError';
    this.nodeId = nodeId;
    this.violationType = violationType;
  }
}

/**
 * @class CGenerator
 * Static compiler and validator that converts structured flowchart AST models into idiomatic C99 code.
 * Rejects unstructured "spaghetti" control flows (fake goto loops, illegal loop entries, cross jumps).
 */
export class CGenerator {
  /**
   * =========================================================================
   * PHASE 1: THE DFS SPAGHETTI VALIDATOR
   * =========================================================================
   * Validates that the flowchart forms a Reducible Control Flow Graph (Structured Programming).
   *
   * Checks for 3 educational violations:
   * 1. Unstructured Back-Edge (Fake Loops): Cycle targeting non-LoopNode.
   * 2. Illegal Loop Entry: Traversing directly into a loop's body without passing its header.
   * 3. Cross-Jumps (Unmerged Branches): Decision branches (if/else) failing to merge cleanly.
   *
   * @param {string} startNodeId - Entry point node ID.
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes - Node map.
   * @returns {{
   *   isValid: boolean,
   *   loopBodies: Map<string, Set<string>>,
   *   decisionMergePoints: Map<string, string|null>
   * }}
   * @throws {CGeneratorError}
   */
  static validateGraphStructure(startNodeId, nodes) {
    if (!startNodeId || !nodes || nodes.size === 0) {
      throw new CGeneratorError('Akış şeması boş veya Başla düğümü bulunamadı.', null, 'GRAPH_ERROR');
    }

    const startNode = nodes.get(String(startNodeId));
    if (!startNode) {
      throw new CGeneratorError(`Başla düğümü (${startNodeId}) bulunamadı.`, startNodeId, 'GRAPH_ERROR');
    }

    // Step A: Map all Loop bodies (Sub-graphs belonging to each LoopNode)
    const loopBodies = CGenerator.analyzeLoopScopes(nodes);

    // Step B: Perform DFS Traversal to detect Unstructured Back-Edges and Illegal Loop Entries
    const visited = new Set();
    const recursionStack = new Set();
    const activeLoopHeaders = []; // Stack of currently enclosing loop header IDs

    /**
     * @param {string|null} currentId
     * @param {string|null} fromId
     */
    function dfs(currentId, fromId = null) {
      if (!currentId) return;
      const node = nodes.get(String(currentId));
      if (!node) return;

      const id = String(currentId);

      // Check 1: Cycle Detection / Back-Edges
      if (recursionStack.has(id)) {
        // A cycle is detected: current path encountered an already active ancestor
        if (node.type !== 'loop') {
          throw new CGeneratorError(
            `Yapısal Olmayan Döngü: [${id}] numaralı bloğa geriye dönük ok (goto) çekilmiş. Geriye dönük akışlar için 'Döngü' (Altıgen) bloğunu kullanmalısınız.`,
            id,
            'UNSTRUCTURED_BACKEDGE'
          );
        }
        // If it IS a LoopNode, verify the back-edge is coming from inside its registered body (valid latch)
        const currentLoopBody = loopBodies.get(id) || new Set();
        if (fromId && !currentLoopBody.has(fromId) && fromId !== id) {
          throw new CGeneratorError(
            `Döngü İhlali: [${id}] döngüsüne gövde dışından geçersiz geri dönüş yapılmış.`,
            id,
            'ILLEGAL_LOOP_ENTRY'
          );
        }
        return; // Valid loop back-edge (latch), stop DFS branch expansion
      }

      // Check 2: Illegal Loop Entry
      // If node 'id' belongs to a loop's body, verify that the traversal is currently inside that loop header's scope
      for (const [loopHeaderId, bodySet] of loopBodies.entries()) {
        if (bodySet.has(id)) {
          const isEnclosed = activeLoopHeaders.includes(loopHeaderId);
          if (!isEnclosed && fromId !== loopHeaderId) {
            throw new CGeneratorError(
              `Döngü İhlali: [${id}] bloğu [${loopHeaderId}] döngüsünün gövdesine aittir. Döngü gövdesine dışarıdan doğrudan ok çekilemez.`,
              id,
              'ILLEGAL_LOOP_ENTRY'
            );
          }
        }
      }

      if (visited.has(id)) {
        return;
      }

      visited.add(id);
      recursionStack.add(id);

      if (node.type === 'loop') {
        const loopNode = /** @type {import('../engine/nodes/LoopNode.js').LoopNode} */ (node);
        // Traverse Loop Body with activeLoopHeader set
        if (loopNode.bodyNodeId) {
          activeLoopHeaders.push(id);
          dfs(loopNode.bodyNodeId, id);
          activeLoopHeaders.pop();
        }
        // Traverse Loop Exit outside the loop scope
        if (loopNode.exitNodeId) {
          dfs(loopNode.exitNodeId, id);
        }
      } else if (node.type === 'decision') {
        const decisionNode = /** @type {import('../engine/nodes/DecisionNode.js').DecisionNode} */ (node);
        if (decisionNode.trueNodeId) {
          dfs(decisionNode.trueNodeId, id);
        }
        if (decisionNode.falseNodeId) {
          dfs(decisionNode.falseNodeId, id);
        }
      } else if ('nextNodeId' in node && node.nextNodeId) {
        dfs(node.nextNodeId, id);
      }

      recursionStack.delete(id);
    }

    dfs(startNode.id);

    // Step C: Validate DecisionNode merge points (Check 3: Cross-Jumps)
    const decisionMergePoints = new Map();
    for (const [id, node] of nodes.entries()) {
      if (node.type === 'decision') {
        const decisionNode = /** @type {import('../engine/nodes/DecisionNode.js').DecisionNode} */ (node);
        const mergeNodeId = CGenerator.findDecisionMergePoint(decisionNode, nodes, loopBodies);
        decisionMergePoints.set(id, mergeNodeId);
      }
    }

    return {
      isValid: true,
      loopBodies,
      decisionMergePoints
    };
  }

  /**
   * Discovers the nodes belonging to each LoopNode's body by following body paths until looping back to header.
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @returns {Map<string, Set<string>>} Map of LoopNode ID -> Set of Body Node IDs
   */
  static analyzeLoopScopes(nodes) {
    const loopBodies = new Map();

    for (const [id, node] of nodes.entries()) {
      if (node.type === 'loop') {
        const loopNode = /** @type {import('../engine/nodes/LoopNode.js').LoopNode} */ (node);
        const bodySet = new Set();
        const headerId = String(id);

        if (loopNode.bodyNodeId) {
          const queue = [String(loopNode.bodyNodeId)];
          const seen = new Set();

          while (queue.length > 0) {
            const currId = queue.shift();
            if (!currId || currId === headerId || seen.has(currId)) continue;
            seen.add(currId);
            bodySet.add(currId);

            const currNode = nodes.get(currId);
            if (!currNode) continue;

            if (currNode.type === 'decision') {
              const dec = /** @type {import('../engine/nodes/DecisionNode.js').DecisionNode} */ (currNode);
              if (dec.trueNodeId && dec.trueNodeId !== headerId) queue.push(String(dec.trueNodeId));
              if (dec.falseNodeId && dec.falseNodeId !== headerId) queue.push(String(dec.falseNodeId));
            } else if (currNode.type === 'loop') {
              const innerLoop = /** @type {import('../engine/nodes/LoopNode.js').LoopNode} */ (currNode);
              if (innerLoop.bodyNodeId && innerLoop.bodyNodeId !== headerId) queue.push(String(innerLoop.bodyNodeId));
              if (innerLoop.exitNodeId && innerLoop.exitNodeId !== headerId) queue.push(String(innerLoop.exitNodeId));
            } else if ('nextNodeId' in currNode && currNode.nextNodeId && currNode.nextNodeId !== headerId) {
              queue.push(String(currNode.nextNodeId));
            }
          }
        }

        loopBodies.set(headerId, bodySet);
      }
    }

    return loopBodies;
  }

  /**
   * Finds the single common merge point (lowest common post-dominator) for a DecisionNode.
   * If branches cross into unrelated scopes or fail to merge structuredly, throws CGeneratorError.
   *
   * @param {import('../engine/nodes/DecisionNode.js').DecisionNode} decisionNode
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @param {Map<string, Set<string>>} loopBodies
   * @returns {string|null} Merge node ID or null if both branches terminate at EndNode
   * @throws {CGeneratorError}
   */
  static findDecisionMergePoint(decisionNode, nodes, loopBodies) {
    const trueId = decisionNode.trueNodeId ? String(decisionNode.trueNodeId) : null;
    const falseId = decisionNode.falseNodeId ? String(decisionNode.falseNodeId) : null;

    if (!trueId || !falseId) {
      throw new CGeneratorError(
        `Karar bloğu [${decisionNode.id}] her iki çıkışa (Doğru ve Yanlış) bağlanmalıdır.`,
        decisionNode.id,
        'CROSS_JUMP'
      );
    }

    // Trace all reachable nodes from True branch (collect ordered paths)
    const trueReachable = CGenerator.collectReachablePath(trueId, nodes, decisionNode.id);
    const falseReachable = CGenerator.collectReachablePath(falseId, nodes, decisionNode.id);

    // Case 1: Simple if-statement (True branch directly merges into False branch target, or vice versa)
    if (trueId === falseId) {
      return trueId;
    }
    if (falseReachable.has(trueId)) {
      return trueId; // False path leads to True branch (if-without-else pattern)
    }
    if (trueReachable.has(falseId)) {
      return falseId; // True path leads to False branch (if-without-else pattern)
    }

    // Case 2: Both branches terminate at an EndNode
    const trueEnds = trueReachable.has('__END__');
    const falseEnds = falseReachable.has('__END__');

    // Case 3: Find first common post-dominator node
    let mergeNodeId = null;
    for (const candidateId of trueReachable) {
      if (candidateId === '__END__') continue;
      if (falseReachable.has(candidateId)) {
        mergeNodeId = candidateId;
        break;
      }
    }

    if (!mergeNodeId && !(trueEnds && falseEnds)) {
      // One branch terminates and the other continues, or paths never merge
      const nonTerminatingTarget = trueEnds ? falseId : (falseEnds ? trueId : null);
      if (!nonTerminatingTarget) {
        throw new CGeneratorError(
          `Kesişen Dallar: [${decisionNode.id}] numaralı Karar bloğunun Doğru ve Yanlış kolları ortak bir noktada birleşmiyor.`,
          decisionNode.id,
          'CROSS_JUMP'
        );
      }
      return null;
    }

    return mergeNodeId;
  }

  /**
   * Helper that collects the ordered set of reachable nodes from a given starting node.
   * @param {string} startId
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @param {string} stopAtHeaderId
   * @returns {Set<string>}
   */
  static collectReachablePath(startId, nodes, stopAtHeaderId = null) {
    const reachable = new Set();
    const queue = [String(startId)];
    const visited = new Set();

    while (queue.length > 0) {
      const currId = queue.shift();
      if (!currId || visited.has(currId) || currId === stopAtHeaderId) continue;
      visited.add(currId);
      reachable.add(currId);

      const node = nodes.get(currId);
      if (!node) continue;

      if (node.type === 'end') {
        reachable.add('__END__');
        continue;
      }

      if (node.type === 'decision') {
        const dec = /** @type {import('../engine/nodes/DecisionNode.js').DecisionNode} */ (node);
        if (dec.trueNodeId) queue.push(String(dec.trueNodeId));
        if (dec.falseNodeId) queue.push(String(dec.falseNodeId));
      } else if (node.type === 'loop') {
        const loop = /** @type {import('../engine/nodes/LoopNode.js').LoopNode} */ (node);
        if (loop.exitNodeId) queue.push(String(loop.exitNodeId));
      } else if ('nextNodeId' in node && node.nextNodeId) {
        queue.push(String(node.nextNodeId));
      }
    }

    return reachable;
  }

  /**
   * =========================================================================
   * PHASE 2: SYMBOL TABLE & TYPE INFERENCE
   * =========================================================================
   * Scans all reachable AST nodes to deduce variable types (int, double, char[])
   * and creates variable declarations and standard C boilerplate.
   *
   * @param {string} startNodeId
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @returns {{
   *   symbolTable: Map<string, { name: string, type: 'int'|'double'|'char[]', initialValue?: any }>,
   *   declarationsCode: string,
   *   boilerplateHeader: string,
   *   boilerplateFooter: string
   * }}
   */
  static inferSymbolTable(startNodeId, nodes) {
    /** @type {Map<string, { name: string, type: 'int'|'double'|'char[]', initialValue?: any }>} */
    const symbolTable = new Map();
    const visited = new Set();
    const queue = [String(startNodeId)];

    /**
     * Helper to register or upgrade variable type in the symbol table.
     * @param {string} varName
     * @param {'int'|'double'|'char[]'} inferredType
     */
    function registerVar(varName, inferredType) {
      if (!varName || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName)) return;
      const existing = symbolTable.get(varName);

      if (!existing) {
        symbolTable.set(varName, { name: varName, type: inferredType });
      } else if (existing.type === 'int' && inferredType === 'double') {
        // Upgrade int to double if floating point assignment is encountered
        existing.type = 'double';
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);

      const node = nodes.get(currentId);
      if (!node) continue;

      if (node.type === 'assignment') {
        const assignNode = /** @type {import('../engine/nodes/AssignmentNode.js').AssignmentNode} */ (node);
        const statements = SafeEvaluator.splitStatements(assignNode.expression || '');

        for (const stmt of statements) {
          const match = stmt.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(\+=|-=|\*=|\/=|%=|=)\s*(.+)$/);
          if (match) {
            const lhs = match[1];
            const rhs = match[3].trim();

            let inferredType = 'int';
            if (rhs.startsWith('"') && rhs.endsWith('"')) {
              inferredType = 'char[]';
            } else if (/\d+\.\d+/.test(rhs) || /\d+e[+-]?\d+/i.test(rhs)) {
              inferredType = 'double';
            } else {
              // Propagate double type if RHS references an already known double variable
              for (const [knownVar, entry] of symbolTable.entries()) {
                if (entry.type === 'double' && new RegExp(`\\b${knownVar}\\b`).test(rhs)) {
                  inferredType = 'double';
                  break;
                }
              }
            }
            registerVar(lhs, inferredType);
          } else if (assignNode.variableName) {
            registerVar(assignNode.variableName, 'int');
          }
        }
      } else if (node.type === 'input') {
        const inputNode = /** @type {import('../engine/nodes/InputNode.js').InputNode} */ (node);
        const varNames = (inputNode.variableName || 'x').split(',').map(s => s.trim());
        for (const v of varNames) {
          registerVar(v, 'int'); // Default input variable to int
        }
      } else if (node.type === 'loop') {
        const loopNode = /** @type {import('../engine/nodes/LoopNode.js').LoopNode} */ (node);
        const cond = (loopNode.condition || '').trim();
        const paramMatch = cond.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
        if (paramMatch) {
          registerVar(paramMatch[1], 'int'); // Loop index variable
        }
      }

      // Enqueue next nodes
      if (node.type === 'decision') {
        const dec = /** @type {import('../engine/nodes/DecisionNode.js').DecisionNode} */ (node);
        if (dec.trueNodeId) queue.push(String(dec.trueNodeId));
        if (dec.falseNodeId) queue.push(String(dec.falseNodeId));
      } else if (node.type === 'loop') {
        const loop = /** @type {import('../engine/nodes/LoopNode.js').LoopNode} */ (node);
        if (loop.bodyNodeId) queue.push(String(loop.bodyNodeId));
        if (loop.exitNodeId) queue.push(String(loop.exitNodeId));
      } else if ('nextNodeId' in node && node.nextNodeId) {
        queue.push(String(node.nextNodeId));
      }
    }

    // Generate formatted C declarations grouped by type
    const intVars = [];
    const doubleVars = [];
    const stringVars = [];

    for (const entry of symbolTable.values()) {
      if (entry.type === 'int') {
        intVars.push(entry.name);
      } else if (entry.type === 'double') {
        doubleVars.push(entry.name);
      } else if (entry.type === 'char[]') {
        stringVars.push(`${entry.name}[100]`);
      }
    }

    const declLines = [];
    if (intVars.length > 0) {
      declLines.push(`    int ${intVars.join(', ')};`);
    }
    if (doubleVars.length > 0) {
      declLines.push(`    double ${doubleVars.join(', ')};`);
    }
    if (stringVars.length > 0) {
      declLines.push(`    char ${stringVars.join(', ')};`);
    }

    const declarationsCode = declLines.join('\n');
    const boilerplateHeader = [
      '#include <stdio.h>',
      '#include <stdbool.h>',
      '#include <math.h>',
      '',
      'int main(void) {',
      declarationsCode ? declarationsCode + '\n' : ''
    ].filter(Boolean).join('\n');

    const boilerplateFooter = [
      '    return 0;',
      '}'
    ].join('\n');

    return {
      symbolTable,
      declarationsCode,
      boilerplateHeader,
      boilerplateFooter
    };
  }

  /**
   * =========================================================================
   * PHASE 3: RECURSIVE C CODE GENERATOR
   * =========================================================================
   * Translates the validated flowchart AST into clean, idiomatic structured C99 code.
   */

  /**
   * Formats a printf statement from an OutputNode expression.
   * @param {string} rawExpr
   * @param {Map<string, { name: string, type: 'int'|'double'|'char[]' }>} symbolTable
   * @returns {string} e.g. 'printf("Area is: %lf\\n", area);'
   */
  static formatPrintf(rawExpr, symbolTable) {
    const expr = String(rawExpr || '').trim();
    if (!expr) return 'printf("\\n");';

    // Check if expression is a pure quoted string literal: "Hello World"
    if (/^"[^"]*"$/.test(expr) || /^'[^']*'$/.test(expr)) {
      const cleanStr = expr.slice(1, -1);
      return `printf("${cleanStr}\\n");`;
    }

    // Split concatenated expressions: e.g. `"Sonuc: " + alan` or `"x: " + x + ", y: " + y`
    const parts = expr.split(/\s*\+\s*/);
    let formatStr = '';
    const args = [];

    for (const part of parts) {
      const trimmedPart = part.trim();
      if ((trimmedPart.startsWith('"') && trimmedPart.endsWith('"')) ||
          (trimmedPart.startsWith("'") && trimmedPart.endsWith("'"))) {
        formatStr += trimmedPart.slice(1, -1);
      } else {
        // Variable or arithmetic expression
        const varEntry = symbolTable.get(trimmedPart);
        if (varEntry?.type === 'double' || trimmedPart.includes('.') || trimmedPart.includes('/')) {
          formatStr += '%lf';
        } else if (varEntry?.type === 'char[]') {
          formatStr += '%s';
        } else {
          formatStr += '%d';
        }
        args.push(trimmedPart);
      }
    }

    formatStr += '\\n';

    if (args.length > 0) {
      return `printf("${formatStr}", ${args.join(', ')});`;
    }
    return `printf("${formatStr}");`;
  }

  /**
   * Formats a scanf statement from an InputNode variable name list.
   * @param {string} variableName
   * @param {Map<string, { name: string, type: 'int'|'double'|'char[]' }>} symbolTable
   * @returns {string} e.g. 'scanf("%d %lf", &a, &b);'
   */
  static formatScanf(variableName, symbolTable) {
    const names = String(variableName || 'x').split(',').map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return 'scanf("%d", &x);';

    const formatTokens = [];
    const scanArgs = [];

    for (const name of names) {
      const varEntry = symbolTable.get(name);
      if (varEntry?.type === 'double') {
        formatTokens.push('%lf');
        scanArgs.push(`&${name}`);
      } else if (varEntry?.type === 'char[]') {
        formatTokens.push('%99s');
        scanArgs.push(name); // char array doesn't require & in scanf
      } else {
        formatTokens.push('%d');
        scanArgs.push(`&${name}`);
      }
    }

    return `scanf("${formatTokens.join(' ')}", ${scanArgs.join(', ')});`;
  }

  /**
   * Formats assignment statements from an AssignmentNode expression.
   * @param {string} expression
   * @param {string|null} variableName
   * @returns {string[]} Formatted C statement lines
   */
  static formatAssignment(expression, variableName = null) {
    const raw = String(expression || '').trim();
    if (!raw && variableName) {
      return [`${variableName} = 0;`];
    }

    const statements = SafeEvaluator.splitStatements(raw);
    const lines = [];

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;

      if (!trimmed.includes('=') && variableName) {
        lines.push(`${variableName} = ${trimmed};`);
      } else {
        lines.push(`${trimmed};`);
      }
    }

    return lines;
  }

  /**
   * Recursively generates C statement lines from a given AST node ID down to an optional merge stop point.
   *
   * @param {string|null} nodeId - Node ID to generate
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes - Node dictionary
   * @param {Map<string, { name: string, type: 'int'|'double'|'char[]' }>} symbolTable
   * @param {Map<string, string|null>} decisionMergePoints - Map of decision nodes to their post-dominator merge points
   * @param {string|null} stopAtNodeId - Merge point node where branch traversal must halt
   * @param {number} indentLevel - Current indentation level (spaces = indentLevel * 4)
   * @param {Set<string>} [visitedInPath] - Path recursion tracker to avoid cycles
   * @returns {string[]} Array of formatted C code lines
   */
  static generateCNode(nodeId, nodes, symbolTable, decisionMergePoints, stopAtNodeId = null, indentLevel = 1, visitedInPath = new Set()) {
    if (!nodeId || nodeId === stopAtNodeId) {
      return [];
    }

    const node = nodes.get(String(nodeId));
    if (!node || node.type === 'end' || node.type === 'start') {
      if (node?.type === 'start' && node.nextNodeId) {
        return CGenerator.generateCNode(node.nextNodeId, nodes, symbolTable, decisionMergePoints, stopAtNodeId, indentLevel, visitedInPath);
      }
      return [];
    }

    const id = String(nodeId);
    if (visitedInPath.has(id)) {
      return []; // Loop latch back-edge already completed
    }

    const nextPathSet = new Set(visitedInPath);
    nextPathSet.add(id);
    const indent = '    '.repeat(indentLevel);
    const lines = [];

    if (node.type === 'assignment') {
      const assignNode = /** @type {import('../engine/nodes/AssignmentNode.js').AssignmentNode} */ (node);
      const stmts = CGenerator.formatAssignment(assignNode.expression, assignNode.variableName);
      for (const s of stmts) {
        lines.push(`${indent}${s}`);
      }
      const nextLines = CGenerator.generateCNode(assignNode.nextNodeId, nodes, symbolTable, decisionMergePoints, stopAtNodeId, indentLevel, nextPathSet);
      lines.push(...nextLines);
    } else if (node.type === 'input') {
      const inputNode = /** @type {import('../engine/nodes/InputNode.js').InputNode} */ (node);
      lines.push(`${indent}${CGenerator.formatScanf(inputNode.variableName, symbolTable)}`);
      const nextLines = CGenerator.generateCNode(inputNode.nextNodeId, nodes, symbolTable, decisionMergePoints, stopAtNodeId, indentLevel, nextPathSet);
      lines.push(...nextLines);
    } else if (node.type === 'output') {
      const outputNode = /** @type {import('../engine/nodes/OutputNode.js').OutputNode} */ (node);
      lines.push(`${indent}${CGenerator.formatPrintf(outputNode.expression, symbolTable)}`);
      const nextLines = CGenerator.generateCNode(outputNode.nextNodeId, nodes, symbolTable, decisionMergePoints, stopAtNodeId, indentLevel, nextPathSet);
      lines.push(...nextLines);
    } else if (node.type === 'decision') {
      const decNode = /** @type {import('../engine/nodes/DecisionNode.js').DecisionNode} */ (node);
      const mergeNodeId = decisionMergePoints.get(id);

      const trueLines = CGenerator.generateCNode(decNode.trueNodeId, nodes, symbolTable, decisionMergePoints, mergeNodeId, indentLevel + 1, new Set(nextPathSet));
      const falseLines = CGenerator.generateCNode(decNode.falseNodeId, nodes, symbolTable, decisionMergePoints, mergeNodeId, indentLevel + 1, new Set(nextPathSet));

      const cond = decNode.condition.trim() || '1';

      if (falseLines.length === 0 && trueLines.length > 0) {
        // if without else
        lines.push(`${indent}if (${cond}) {`);
        lines.push(...trueLines);
        lines.push(`${indent}}`);
      } else if (trueLines.length === 0 && falseLines.length > 0) {
        // inverted condition if
        lines.push(`${indent}if (!(${cond})) {`);
        lines.push(...falseLines);
        lines.push(`${indent}}`);
      } else {
        // full if / else
        lines.push(`${indent}if (${cond}) {`);
        lines.push(...trueLines);
        lines.push(`${indent}} else {`);
        lines.push(...falseLines);
        lines.push(`${indent}}`);
      }

      // Continue after the merge point
      if (mergeNodeId && mergeNodeId !== stopAtNodeId) {
        const continuation = CGenerator.generateCNode(mergeNodeId, nodes, symbolTable, decisionMergePoints, stopAtNodeId, indentLevel, nextPathSet);
        lines.push(...continuation);
      }
    } else if (node.type === 'loop') {
      const loopNode = /** @type {import('../engine/nodes/LoopNode.js').LoopNode} */ (node);
      const cond = loopNode.condition.trim();

      // Check if parametric for loop: `i = 1, N, 1` or `i = 1, 10`
      const paramMatch = cond.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^,]+),\s*([^,]+)(?:,\s*([^,]+))?$/);

      let loopHeaderCode = '';
      if (paramMatch) {
        const varName = paramMatch[1];
        const startVal = paramMatch[2].trim();
        const endVal = paramMatch[3].trim();
        const stepVal = paramMatch[4] ? paramMatch[4].trim() : '1';
        const numStep = Number(stepVal);

        if (!isNaN(numStep) && numStep < 0) {
          loopHeaderCode = `for (${varName} = ${startVal}; ${varName} >= ${endVal}; ${varName} -= ${Math.abs(numStep)})`;
        } else if (stepVal === '1') {
          loopHeaderCode = `for (${varName} = ${startVal}; ${varName} <= ${endVal}; ${varName}++)`;
        } else {
          loopHeaderCode = `for (${varName} = ${startVal}; ${varName} <= ${endVal}; ${varName} += ${stepVal})`;
        }
      } else {
        loopHeaderCode = `while (${cond || '1'})`;
      }

      // Generate Loop Body stopping when latching back to loop header ID
      const bodyLines = CGenerator.generateCNode(loopNode.bodyNodeId, nodes, symbolTable, decisionMergePoints, id, indentLevel + 1, new Set(nextPathSet));

      lines.push(`${indent}${loopHeaderCode} {`);
      lines.push(...bodyLines);
      lines.push(`${indent}}`);

      // Continue with Exit node after loop terminates
      if (loopNode.exitNodeId && loopNode.exitNodeId !== stopAtNodeId) {
        const exitLines = CGenerator.generateCNode(loopNode.exitNodeId, nodes, symbolTable, decisionMergePoints, stopAtNodeId, indentLevel, nextPathSet);
        lines.push(...exitLines);
      }
    }

    return lines;
  }

  /**
   * Translates a complete flowchart into an executable C99 source file.
   *
   * @param {string} startNodeId
   * @param {Map<string, import('../engine/nodes/FlowchartNode.js').FlowchartNode>} nodes
   * @returns {{
   *   cCode: string,
   *   symbolTable: Map<string, { name: string, type: 'int'|'double'|'char[]' }>
   * }}
   * @throws {CGeneratorError}
   */
  static generateCProgram(startNodeId, nodes) {
    // Phase 1: Validate Graph Structure (DFS Spaghetti Validator)
    const { decisionMergePoints } = CGenerator.validateGraphStructure(startNodeId, nodes);

    // Phase 2: Symbol Table & Type Inference
    const { symbolTable, boilerplateHeader, boilerplateFooter } = CGenerator.inferSymbolTable(startNodeId, nodes);

    // Phase 3: Recursive C AST Generation
    const bodyLines = CGenerator.generateCNode(startNodeId, nodes, symbolTable, decisionMergePoints, null, 1);

    const fullCode = [
      boilerplateHeader,
      bodyLines.length > 0 ? bodyLines.join('\n') : '',
      boilerplateFooter
    ].filter(Boolean).join('\n');

    return {
      cCode: fullCode,
      symbolTable
    };
  }
}
