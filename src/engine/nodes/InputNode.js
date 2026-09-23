import { FlowchartNode } from './FlowchartNode.js';
import { SafeEvaluator } from '../../evaluator/Evaluator.js';
import { I18n } from '../../i18n/I18n.js';

/**
 * @class InputNode
 * Flowchart interactive data input (scanf / prompt).
 * Shape: Parallelogram.
 */
export class InputNode extends FlowchartNode {
  /**
   * @param {string} id
   * @param {Object} options
   * @param {string} options.variableName - Variable name(s) where the input will be stored (e.g. "a, b, c")
   * @param {string} [options.prompt] - Optional prompt displayed to the user
   * @param {string|null} [options.nextNodeId] - Target node ID after input is processed
   */
  constructor(id, { variableName = 'x', prompt = 'Enter value:', nextNodeId = null } = {}) {
    super(id, 'input');
    this.variableName = String(variableName || 'x').trim();
    this.prompt = String(prompt || 'Enter value:').trim();
    this.nextNodeId = nextNodeId;
  }

  /**
   * Validates variable name(s) in an Input block.
   * Ensures that assignments (e.g. "T=0") and invalid identifiers are rejected.
   * @param {string} rawStr - Comma/statement-separated variable declaration string
   * @returns {{
   *   isValid: boolean,
   *   error?: string,
   *   errorType?: 'ASSIGNMENT' | 'INVALID_IDENTIFIER' | 'EMPTY',
   *   tokens: Array<{ raw: string, name: string, type: string|null }>
   * }}
   */
  static validateVariableName(rawStr) {
    const trimmed = String(rawStr || '').trim();
    if (!trimmed) {
      return { isValid: false, errorType: 'EMPTY', error: 'Değişken adı boş olamaz.', tokens: [] };
    }

    const tokens = [];
    const statements = SafeEvaluator.splitStatements(trimmed).map(s => s.trim()).filter(Boolean);

    for (const stmt of statements) {
      // 1. Check for assignment operator (e.g. T=0, a = 5)
      if (stmt.includes('=')) {
        return {
          isValid: false,
          errorType: 'ASSIGNMENT',
          error: `Girdi bloğunda atama ("${stmt}") kullanılamaz! Yalnızca okunacak değişken adını (örn: "T") girmelisiniz. Atama yapmak için "İşlem" bloğunu kullanın.`,
          tokens
        };
      }

      // 2. Check for optional type prefix, e.g. "double r", "float h", "int x"
      const typeMatch = stmt.match(/^(int|float|double|char|string)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)$/i);
      let varName = stmt;
      let explicitType = null;

      if (typeMatch) {
        explicitType = typeMatch[1].toLowerCase();
        varName = typeMatch[2];
      }

      // 3. Check if varName is a valid C identifier
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName)) {
        return {
          isValid: false,
          errorType: 'INVALID_IDENTIFIER',
          error: `Geçersiz değişken adı: "${varName}". Değişken adları bir harfle başlamalı ve boşluk ya da özel karakter içermemelidir.`,
          tokens
        };
      }

      tokens.push({ raw: stmt, name: varName, type: explicitType });
    }

    return { isValid: true, tokens };
  }

  /**
   * @param {import('../InterpreterContext.js').InterpreterContext} context
   */
  execute(context) {
    const validation = InputNode.validateVariableName(this.variableName);
    if (!validation.isValid) {
      if (validation.errorType === 'ASSIGNMENT') {
        throw new Error(I18n.t('errors.inputHasAssignment', { id: this.id, expr: this.variableName }) || validation.error);
      }
      throw new Error(I18n.t('errors.invalidIdentifier', { id: this.id, name: this.variableName }) || validation.error);
    }

    const tokens = validation.tokens.length > 0 ? validation.tokens : [{ name: 'x', type: null }];

    for (const token of tokens) {
      const varName = token.name;
      const explicitType = token.type;

      let rawValue = null;

      if (context.inputQueue && context.inputQueue.length > 0) {
        rawValue = context.inputQueue.shift();
      } else if (typeof context.inputProvider === 'function') {
        const promptText = `Enter value for ${varName}:`;
        rawValue = context.inputProvider(promptText, varName);
      } else {
        rawValue = '0';
      }

      // Automatically convert numeric inputs to numbers (standard for C-like introductory logic)
      let parsedValue = rawValue;
      let isFloat = explicitType === 'double' || explicitType === 'float';

      if (typeof rawValue === 'number') {
        isFloat = isFloat || !Number.isInteger(rawValue);
      } else if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        // Support European/Turkish comma decimals if matching pure float e.g. "3,0" or "3,14"
        const normalized = (/^[+-]?\d+,\d+$/.test(trimmed)) ? trimmed.replace(',', '.') : trimmed;

        if (normalized !== '' && !isNaN(Number(normalized))) {
          parsedValue = Number(normalized);
          // If input explicitly contains a decimal dot or exponent (e.g. "3.0", "2.", ".5", "1e-3"), treat as float/double
          if (normalized.includes('.') || normalized.toLowerCase().includes('e')) {
            isFloat = true;
          }
        }
      }

      context.setVariable(varName, parsedValue, isFloat);
    }

    if (!this.nextNodeId) {
      throw new Error(`Input node [${this.id}] executed, but has no outgoing connection to the next node.`);
    }

    context.currentNodeId = this.nextNodeId;
  }
}
