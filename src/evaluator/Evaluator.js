import jsep from 'jsep';

/**
 * @class SafeEvaluator
 * Evaluates mathematical and logical AST expressions safely without eval().
 */
export class SafeEvaluator {
  /**
   * Splits multi-statement text into individual statements.
   * Supports semicolon (;), newline (\n), and comma (,) separators when outside quotes/parens.
   * @param {string} code
   * @returns {string[]}
   */
  static splitStatements(code) {
    if (!code) return [];
    const statements = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (let i = 0; i < code.length; i++) {
      const ch = code[i];

      if ((ch === '"' || ch === "'") && (i === 0 || code[i - 1] !== '\\')) {
        if (!inQuote) {
          inQuote = true;
          quoteChar = ch;
        } else if (quoteChar === ch) {
          inQuote = false;
        }
        current += ch;
      } else if (inQuote) {
        current += ch;
      } else if (ch === '(' || ch === '[' || ch === '{') {
        parenDepth++;
        current += ch;
      } else if (ch === ')' || ch === ']' || ch === '}') {
        parenDepth = Math.max(0, parenDepth - 1);
        current += ch;
      } else if ((ch === ';' || ch === '\n' || (ch === ',' && parenDepth === 0)) && parenDepth === 0) {
        const trimmed = current.trim();
        if (trimmed) statements.push(trimmed);
        current = '';
      } else {
        current += ch;
      }
    }

    const finalTrimmed = current.trim();
    if (finalTrimmed) statements.push(finalTrimmed);
    return statements;
  }

  /**
   * Checks if an AST node represents a floating point number in C syntax (e.g. 5.0, .5, 1e-3)
   * or evaluates to a floating point value.
   * @param {Object} node - AST node from jsep
   * @param {Record<string, any>} scope - Variable dictionary
   * @returns {boolean}
   */
  static isFloatAST(node, scope = {}) {
    if (!node) return false;

    switch (node.type) {
      case 'Literal':
        if (typeof node.value === 'number') {
          // If raw text has a decimal dot or exponent (e.g. '5.0', '2.0', '1e-2'), it is explicitly a C float/double
          if (node.raw && (node.raw.includes('.') || node.raw.toLowerCase().includes('e'))) {
            return true;
          }
          return !Number.isInteger(node.value);
        }
        return false;

      case 'Identifier': {
        const val = scope[node.name];
        if (typeof val === 'number') {
          if (!Number.isInteger(val)) return true;
          if (scope.__floatVars && scope.__floatVars.has(node.name)) return true;
        }
        return false;
      }

      case 'UnaryExpression':
        return SafeEvaluator.isFloatAST(node.argument, scope);

      case 'BinaryExpression':
        return SafeEvaluator.isFloatAST(node.left, scope) || SafeEvaluator.isFloatAST(node.right, scope);

      default:
        return false;
    }
  }

  /**
   * Evaluates a node from jsep AST against a variables scope.
   * @param {Object} node - AST node from jsep
   * @param {Record<string, any>} scope - Variable dictionary
   * @returns {any}
   */
  static evaluateAST(node, scope = {}) {
    if (!node) return undefined;

    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier':
        if (node.name === 'true') return true;
        if (node.name === 'false') return false;
        if (node.name === 'null') return null;
        if (node.name === 'undefined') return undefined;
        if (node.name in scope) {
          return scope[node.name];
        }
        // If undefined in scope, return undefined or 0
        return undefined;

      case 'UnaryExpression': {
        const arg = SafeEvaluator.evaluateAST(node.argument, scope);
        switch (node.operator) {
          case '-': return -arg;
          case '+': return +arg;
          case '!': return !arg;
          case '~': return ~arg;
          default:
            throw new Error(`Unsupported unary operator: "${node.operator}"`);
        }
      }

      case 'BinaryExpression':
      case 'LogicalExpression': {
        const left = SafeEvaluator.evaluateAST(node.left, scope);

        // Short-circuit logical operators
        if (node.operator === '&&') {
          return left ? SafeEvaluator.evaluateAST(node.right, scope) : left;
        }
        if (node.operator === '||') {
          return left ? left : SafeEvaluator.evaluateAST(node.right, scope);
        }

        const right = SafeEvaluator.evaluateAST(node.right, scope);

        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/':
            if (right === 0) {
              throw new Error('Division by zero.');
            }
            // Enforce C-style division:
            // If either operand is explicitly a float literal (e.g. 5.0, 2.0) or a float variable, do standard floating-point division.
            // If both are pure integers (e.g. 5 / 2), truncate towards zero like in C.
            {
              const isLeftFloat = SafeEvaluator.isFloatAST(node.left, scope);
              const isRightFloat = SafeEvaluator.isFloatAST(node.right, scope);

              if (!isLeftFloat && !isRightFloat && typeof left === 'number' && typeof right === 'number' && Number.isInteger(left) && Number.isInteger(right)) {
                return Math.trunc(left / right);
              }
              return left / right;
            }
          case '%':
            if (right === 0) {
              throw new Error('Modulo by zero.');
            }
            return left % right;
          case '==':
          case '===':
            return left == right;
          case '!=':
          case '!==':
            return left != right;
          case '<': return left < right;
          case '<=': return left <= right;
          case '>': return left > right;
          case '>=': return left >= right;
          case '&': return left & right;
          case '|': return left | right;
          case '^': return left ^ right;
          default:
            throw new Error(`Unsupported binary operator: "${node.operator}"`);
        }
      }

      case 'Compound':
        // Evaluates compound comma-separated expressions
        let lastVal;
        for (const expr of node.body) {
          lastVal = SafeEvaluator.evaluateAST(expr, scope);
        }
        return lastVal;

      default:
        throw new Error(`Unsupported AST node type: "${node.type}"`);
    }
  }

  /**
   * Safely evaluates an expression string against variable scope or InterpreterContext.
   * @param {string} expressionStr
   * @param {Record<string, any>|import('../engine/InterpreterContext.js').InterpreterContext} scopeOrContext
   * @returns {any}
   */
  static evaluate(expressionStr, scopeOrContext = {}) {
    if (!expressionStr || typeof expressionStr !== 'string') return undefined;

    const trimmed = expressionStr.trim();
    if (!trimmed) return undefined;

    const scope = (scopeOrContext && typeof scopeOrContext === 'object' && 'variables' in scopeOrContext)
      ? { ...scopeOrContext.variables, __floatVars: scopeOrContext.floatVars }
      : scopeOrContext;

    const ast = jsep(trimmed);
    return SafeEvaluator.evaluateAST(ast, scope);
  }

  /**
   * Evaluates an assignment statement (e.g. "x = y + 5", "count = count + 1", "sum += i").
   * @param {string} assignmentStr
   * @param {import('../engine/InterpreterContext.js').InterpreterContext} context
   * @param {Object} [options]
   * @param {string} [options.variableName]
   */
  static evaluateAssignment(assignmentStr, context, { variableName = null } = {}) {
    if (!assignmentStr) return;

    const trimmed = assignmentStr.trim();
    const scope = { ...context.variables, __floatVars: context.floatVars };

    // If explicit variable name is given and assignmentStr has no '=', treat assignmentStr as RHS expression
    if (variableName && !trimmed.includes('=')) {
      const ast = jsep(trimmed);
      const isFloat = SafeEvaluator.isFloatAST(ast, scope);
      const value = SafeEvaluator.evaluateAST(ast, scope);
      context.setVariable(variableName, value, isFloat);
      return value;
    }

    // Check for compound assignments like +=, -=, *=, /=
    const compoundMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(\+=|-=|\*=|\/=|%=)\s*(.+)$/);
    if (compoundMatch) {
      const varName = compoundMatch[1];
      const op = compoundMatch[2];
      const rhsExpr = compoundMatch[3];
      const ast = jsep(rhsExpr);
      const isRhsFloat = SafeEvaluator.isFloatAST(ast, scope);
      const isCurrentFloat = context.floatVars?.has(varName) || false;
      const isFloat = isRhsFloat || isCurrentFloat;
      const rhsVal = SafeEvaluator.evaluateAST(ast, scope);
      const currentVal = context.getVariable(varName) ?? 0;

      let newVal;
      switch (op) {
        case '+=': newVal = currentVal + rhsVal; break;
        case '-=': newVal = currentVal - rhsVal; break;
        case '*=': newVal = currentVal * rhsVal; break;
        case '/=':
          if (rhsVal === 0) throw new Error('Division by zero in assignment.');
          newVal = isFloat ? currentVal / rhsVal : Math.trunc(currentVal / rhsVal);
          break;
        case '%=':
          if (rhsVal === 0) throw new Error('Modulo by zero in assignment.');
          newVal = currentVal % rhsVal;
          break;
      }
      context.setVariable(varName, newVal, isFloat);
      return newVal;
    }

    // Standard assignment: var = expression
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const targetVar = trimmed.substring(0, eqIdx).trim();
      const rhsExpr = trimmed.substring(eqIdx + 1).trim();

      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(targetVar)) {
        throw new Error(`Invalid variable identifier: "${targetVar}"`);
      }

      const ast = jsep(rhsExpr);
      const isFloat = SafeEvaluator.isFloatAST(ast, scope);
      const value = SafeEvaluator.evaluateAST(ast, scope);
      context.setVariable(targetVar, value, isFloat);
      return value;
    }

    // Standalone expression or single variable assignment
    if (variableName) {
      const ast = jsep(trimmed);
      const isFloat = SafeEvaluator.isFloatAST(ast, scope);
      const value = SafeEvaluator.evaluateAST(ast, scope);
      context.setVariable(variableName, value, isFloat);
      return value;
    }

    throw new Error(`Invalid assignment statement: "${assignmentStr}". Expected format "varName = expression"`);
  }

  /**
   * Unified evaluator hook suitable for passing into FlowchartNodes / FlowchartInterpreter.
   * @param {string} exprOrStatement
   * @param {import('../engine/InterpreterContext.js').InterpreterContext} context
   * @param {Object} [options]
   */
  static hook(exprOrStatement, context, options = {}) {
    if (options && options.variableName) {
      return SafeEvaluator.evaluateAssignment(exprOrStatement, context, options);
    }
    if (exprOrStatement.includes('=') && !exprOrStatement.includes('==') && !exprOrStatement.includes('!=') && !exprOrStatement.includes('<=') && !exprOrStatement.includes('>=')) {
      return SafeEvaluator.evaluateAssignment(exprOrStatement, context, options);
    }
    return SafeEvaluator.evaluate(exprOrStatement, context);
  }
}
