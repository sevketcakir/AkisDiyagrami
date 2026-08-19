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

  it('should enforce C-style integer division for integer operands and float division for float literals', () => {
    // 5 / 2 in C evaluates to 2 (integer division truncated towards zero)
    expect(SafeEvaluator.evaluate('5 / 2')).toBe(2);
    expect(SafeEvaluator.evaluate('7 / 3')).toBe(2);
    expect(SafeEvaluator.evaluate('-7 / 3')).toBe(-2);
    expect(SafeEvaluator.evaluate('1 / 2')).toBe(0);

    // Explicit floating-point literals (with dot) in C evaluate to double/float division
    expect(SafeEvaluator.evaluate('5.0 / 2.0')).toBe(2.5);
    expect(SafeEvaluator.evaluate('5.0 / 2')).toBe(2.5);
    expect(SafeEvaluator.evaluate('5 / 2.0')).toBe(2.5);
    expect(SafeEvaluator.evaluate('5.5 / 2')).toBe(2.75);

    // Variable float tracking
    const context = new InterpreterContext();
    SafeEvaluator.evaluateAssignment('a = 5.0', context);
    SafeEvaluator.evaluateAssignment('b = a / 2', context);
    expect(context.variables.b).toBe(2.5);
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

  it('should evaluate mathematical functions like sqrt, pow, abs, etc.', () => {
    expect(SafeEvaluator.evaluate('sqrt(16)')).toBe(4);
    expect(SafeEvaluator.evaluate('sqrt(25)')).toBe(5);
    expect(SafeEvaluator.evaluate('pow(2, 3)')).toBe(8);
    expect(SafeEvaluator.evaluate('abs(-42)')).toBe(42);
    expect(SafeEvaluator.evaluate('fabs(-3.14)')).toBe(3.14);
    expect(SafeEvaluator.evaluate('floor(5.9)')).toBe(5);
    expect(SafeEvaluator.evaluate('ceil(5.1)')).toBe(6);

    // Second degree equation discriminant (b^2 - 4ac) and quadratic roots
    const context = new InterpreterContext();
    SafeEvaluator.evaluateAssignment('a = 1, b = -5, c = 6', context);
    SafeEvaluator.evaluateAssignment('delta = pow(b, 2) - 4 * a * c', context);
    expect(context.variables.delta).toBe(1); // (-5)^2 - 4*1*6 = 25 - 24 = 1

    SafeEvaluator.evaluateAssignment('x1 = (-b + sqrt(delta)) / (2 * a)', context);
    SafeEvaluator.evaluateAssignment('x2 = (-b - sqrt(delta)) / (2 * a)', context);
    expect(context.variables.x1).toBe(3); // (5 + 1) / 2 = 3
    expect(context.variables.x2).toBe(2); // (5 - 1) / 2 = 2
  });

  it('should split multi-statement code by commas, semicolons, and newlines', () => {
    expect(SafeEvaluator.splitStatements('a = 5, b = 6, c = 7')).toEqual(['a = 5', 'b = 6', 'c = 7']);
    expect(SafeEvaluator.splitStatements('a = 5; b = 6; c = 7;')).toEqual(['a = 5', 'b = 6', 'c = 7']);
    expect(SafeEvaluator.splitStatements('a = 5\nb = 6\nc = 7')).toEqual(['a = 5', 'b = 6', 'c = 7']);
    expect(SafeEvaluator.splitStatements('msg = "hello, world", x = 10')).toEqual(['msg = "hello, world"', 'x = 10']);
  });
});
