import { describe, it, expect } from 'vitest';
import { SamplePrograms } from '../src/utils/SamplePrograms.js';
import { GraphParser } from '../src/ui/GraphParser.js';
import { FlowchartInterpreter } from '../src/engine/index.js';

describe('Sample Programs Curriculum', () => {
  it('should include all 9 educational sample programs', () => {
    const keys = Object.keys(SamplePrograms);
    expect(keys).toEqual([
      'rectangleArea',
      'evenOrOdd',
      'maxOfThree',
      'sum1ToN',
      'factorial',
      'isPrimeCheck',
      'allPrimesUpToN',
      'fibonacci',
      'gcdEuclidean'
    ]);
  });

  it('should compile and run Rectangle Area correctly', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.rectangleArea.data);
    const interpreter = new FlowchartInterpreter({ nodes, startNodeId });
    while (!interpreter.context.isFinished) {
      interpreter.step();
    }
    expect(interpreter.context.error).toBeNull();
    expect(interpreter.context.variables.area).toBe(50);
    expect(interpreter.context.output).toEqual(['Rectangle Area: 50']);
  });

  it('should compile and run Factorial of 5 correctly', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.factorial.data);
    const interpreter = new FlowchartInterpreter({ nodes, startNodeId });
    interpreter.context.inputQueue = [5];
    while (!interpreter.context.isFinished && !interpreter.context.error) {
      interpreter.step();
    }
    expect(interpreter.context.error).toBeNull();
    expect(interpreter.context.variables.fact).toBe(120);
    expect(interpreter.context.output).toEqual(['Factorial: 120']);
  });

  it('should compile and run Prime Test for N = 7 (prime) and N = 8 (not prime)', () => {
    // 1. Test N = 7
    const { nodes: nodes1, startNodeId: start1 } = GraphParser.parseDrawflow(SamplePrograms.isPrimeCheck.data);
    const interpreter1 = new FlowchartInterpreter({ nodes: nodes1, startNodeId: start1 });
    interpreter1.context.inputQueue = [7];
    while (!interpreter1.context.isFinished && !interpreter1.context.error) {
      interpreter1.step();
    }
    expect(interpreter1.context.error).toBeNull();
    expect(interpreter1.context.variables.asal).toBe(true);
    expect(interpreter1.context.output).toEqual(['7 is a PRIME number!']);

    // 2. Test N = 8
    const { nodes: nodes2, startNodeId: start2 } = GraphParser.parseDrawflow(SamplePrograms.isPrimeCheck.data);
    const interpreter2 = new FlowchartInterpreter({ nodes: nodes2, startNodeId: start2 });
    interpreter2.context.inputQueue = [8];
    while (!interpreter2.context.isFinished && !interpreter2.context.error) {
      interpreter2.step();
    }
    expect(interpreter2.context.error).toBeNull();
    expect(interpreter2.context.variables.asal).toBe(false);
    expect(interpreter2.context.output).toEqual(['8 is NOT a prime number.']);
  });

  it('should compile and list all prime numbers up to N = 10', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.allPrimesUpToN.data);
    const interpreter = new FlowchartInterpreter({ nodes, startNodeId });
    interpreter.context.inputQueue = [10];
    let steps = 0;
    while (!interpreter.context.isFinished && !interpreter.context.error && steps < 1000) {
      interpreter.step();
      steps++;
    }
    expect(interpreter.context.error).toBeNull();
    expect(interpreter.context.variables.adet).toBe(4); // 2, 3, 5, 7
    expect(interpreter.context.output).toEqual([
      'Prime #1: 2',
      'Prime #2: 3',
      'Prime #3: 5',
      'Prime #4: 7'
    ]);
  });

  it('should compile and compute Fibonacci terms for N = 6', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.fibonacci.data);
    const interpreter = new FlowchartInterpreter({ nodes, startNodeId });
    interpreter.context.inputQueue = [6];
    while (!interpreter.context.isFinished && !interpreter.context.error) {
      interpreter.step();
    }
    expect(interpreter.context.error).toBeNull();
    expect(interpreter.context.output).toEqual([
      'Fib #1: 0',
      'Fib #2: 1',
      'Fib #3: 1',
      'Fib #4: 2',
      'Fib #5: 3',
      'Fib #6: 5'
    ]);
  });

  it('should compile and compute GCD(48, 18) = 6', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.gcdEuclidean.data);
    const interpreter = new FlowchartInterpreter({ nodes, startNodeId });
    interpreter.context.inputQueue = [48, 18];
    while (!interpreter.context.isFinished && !interpreter.context.error) {
      interpreter.step();
    }
    expect(interpreter.context.error).toBeNull();
    expect(interpreter.context.variables.a).toBe(6);
    expect(interpreter.context.output).toEqual(['GCD (EBOB): 6']);
  });
});
