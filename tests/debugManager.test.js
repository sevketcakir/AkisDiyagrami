import { describe, it, expect, beforeEach } from 'vitest';
import { DebugManager } from '../src/ui/DebugManager.js';
import { InterpreterContext } from '../src/engine/InterpreterContext.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

describe('DebugManager - Watch Expressions & REPL Evaluator', () => {
  let context;
  let debugManager;
  let mutatedVariables = null;

  beforeEach(() => {
    // Clear localStorage mockup
    storage.clear();

    context = new InterpreterContext();
    context.setVariable('a', 10);
    context.setVariable('b', 20);
    context.setVariable('delta', 16);
    context.setVariable('name', 'Antigravity');
    context.setVariable('flag', true);

    mutatedVariables = null;

    debugManager = new DebugManager({
      getContext: () => context,
      onVariableMutated: (vars, floatVars) => {
        mutatedVariables = { ...vars };
      }
    });
  });

  describe('Watch Expressions', () => {
    it('should add, remove, and avoid duplicate watches', () => {
      expect(debugManager.watches).toEqual([]);

      debugManager.addWatch('a + b');
      debugManager.addWatch('a + b'); // duplicate
      debugManager.addWatch('sqrt(delta)');

      expect(debugManager.watches).toEqual(['a + b', 'sqrt(delta)']);

      debugManager.removeWatch(0);
      expect(debugManager.watches).toEqual(['sqrt(delta)']);

      debugManager.clearWatches();
      expect(debugManager.watches).toEqual([]);
    });

    it('should edit an existing watch expression and persist to localStorage', () => {
      debugManager.addWatch('a + b');
      debugManager.addWatch('delta * 2');

      const success = debugManager.editWatch(0, 'a * b + 5');
      expect(success).toBe(true);
      expect(debugManager.watches).toEqual(['a * b + 5', 'delta * 2']);

      // Check localStorage persistence
      const stored = JSON.parse(storage.get('flowchart_watches'));
      expect(stored).toEqual(['a * b + 5', 'delta * 2']);

      // Editing with empty or invalid index should fail and not alter watches
      expect(debugManager.editWatch(0, '   ')).toBe(false);
      expect(debugManager.editWatch(99, 'x + 1')).toBe(false);
      expect(debugManager.editWatch(-1, 'x + 1')).toBe(false);
      expect(debugManager.watches[0]).toBe('a * b + 5');
    });

    it('should evaluate watch expressions correctly with types', () => {
      debugManager.addWatch('a + b');
      debugManager.addWatch('sqrt(delta)');
      debugManager.addWatch('a > 5 && flag');
      debugManager.addWatch('name');

      const results = debugManager.evaluateWatches(context);

      expect(results[0]).toEqual({
        expr: 'a + b',
        value: 30,
        cType: 'int',
        isError: false
      });

      expect(results[1]).toEqual({
        expr: 'sqrt(delta)',
        value: 4,
        cType: 'double',
        isError: false
      });

      expect(results[2]).toEqual({
        expr: 'a > 5 && flag',
        value: true,
        cType: 'bool',
        isError: false
      });

      expect(results[3]).toEqual({
        expr: 'name',
        value: 'Antigravity',
        cType: 'char[]',
        isError: false
      });
    });

    it('should handle undefined variables and syntax errors gracefully', () => {
      debugManager.addWatch('uninitialized_var');
      debugManager.addWatch('a + * 5'); // Invalid syntax

      const results = debugManager.evaluateWatches(context);

      expect(results[0].value).toBeUndefined();
      expect(results[0].isError).toBe(false);

      expect(results[1].isError).toBe(true);
      expect(results[1].cType).toBe('error');
    });
  });

  describe('Debug REPL (Expression Evaluator & Variable Mutator)', () => {
    it('should evaluate pure expressions without mutating variables', () => {
      let loggedOutput = null;
      debugManager.logReplOutput = (input, res) => {
        loggedOutput = { input, res };
      };

      debugManager.executeRepl('a * 2 + b', context);
      expect(loggedOutput.input).toBe('a * 2 + b');
      expect(loggedOutput.res.isAssignment).toBe(false);
      expect(loggedOutput.res.result).toBe(40);
      expect(loggedOutput.res.cType).toBe('int');
      expect(context.variables.a).toBe(10); // unchanged
    });

    it('should mutate variables when assignment statements are evaluated', () => {
      let loggedOutput = null;
      debugManager.logReplOutput = (input, res) => {
        loggedOutput = { input, res };
      };

      // Standard assignment
      debugManager.executeRepl('a = 99', context);
      expect(context.variables.a).toBe(99);
      expect(mutatedVariables?.a).toBe(99);
      expect(loggedOutput.res.isAssignment).toBe(true);
      expect(loggedOutput.res.result).toBe(99);

      // Compound assignment
      debugManager.executeRepl('a += 1', context);
      expect(context.variables.a).toBe(100);

      // Float assignment
      debugManager.executeRepl('pi = 3.14159', context);
      expect(context.variables.pi).toBe(3.14159);
      expect(context.floatVars.has('pi')).toBe(true);

      // Expression using modified variables
      debugManager.executeRepl('a / 2', context);
      expect(loggedOutput.res.result).toBe(50);
    });

    it('should support multi-statement assignments in REPL', () => {
      debugManager.executeRepl('x = 5, y = 10, z = x + y', context);
      expect(context.variables.x).toBe(5);
      expect(context.variables.y).toBe(10);
      expect(context.variables.z).toBe(15);
    });

    it('should report safe errors for invalid expressions or division by zero in REPL', () => {
      let loggedOutput = null;
      debugManager.logReplOutput = (input, res) => {
        loggedOutput = { input, res };
      };

      debugManager.executeRepl('a / 0', context);
      expect(loggedOutput.res.error).toBe('Division by zero.');

      debugManager.executeRepl('sqrt(-1)', context);
      expect(loggedOutput.res.error).toContain('sqrt()');
    });
  });
});
