import { describe, it, expect } from 'vitest';
import { SafeEvaluator } from '../src/evaluator/Evaluator.js';
import { InterpreterContext } from '../src/engine/InterpreterContext.js';

describe('SafeEvaluator', () => {
  it('should evaluate basic arithmetic and respect precedence', () => {
    expect(SafeEvaluator.evaluate('2 + 3 * 4')).toBe(14);
    expect(SafeEvaluator.evaluate('(2 + 3) * 4')).toBe(20);
    expect(SafeEvaluator.evaluate('10 / 2 - 1')).toBe(4);
    expect(SafeEvaluator.evaluate('10 % 3')).toBe(1);
  });

  it('should evaluate comparisons and booleans', () => {
    expect(SafeEvaluator.evaluate('5 > 3')).toBe(true);
    expect(SafeEvaluator.evaluate('10 <= 10')).toBe(true);
    expect(SafeEvaluator.evaluate('4 == 4')).toBe(true);
    expect(SafeEvaluator.evaluate('4 != 5')).toBe(true);
    expect(SafeEvaluator.evaluate('true && false')).toBe(false);
    expect(SafeEvaluator.evaluate('true || false')).toBe(true);
    expect(SafeEvaluator.evaluate('!false')).toBe(true);
  });

  it('should evaluate with variable scope', () => {
    const scope = { a: 10, b: 20, name: 'Alice' };
    expect(SafeEvaluator.evaluate('a + b', scope)).toBe(30);
    expect(SafeEvaluator.evaluate('a > 5 && b < 30', scope)).toBe(true);
  });

  it('should evaluate assignments and mutate context memory', () => {
    const context = new InterpreterContext();
    
    SafeEvaluator.evaluateAssignment('x = 10', context);
    expect(context.variables.x).toBe(10);

    SafeEvaluator.evaluateAssignment('y = x * 2 + 5', context);
    expect(context.variables.y).toBe(25);

    SafeEvaluator.evaluateAssignment('x += 5', context);
    expect(context.variables.x).toBe(15);
  });

  it('should throw safe errors on division by zero', () => {
    expect(() => SafeEvaluator.evaluate('10 / 0')).toThrow('Division by zero.');
    expect(() => SafeEvaluator.evaluate('10 % 0')).toThrow('Modulo by zero.');
  });
});
