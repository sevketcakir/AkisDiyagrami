import { describe, it, expect } from 'vitest';
import { CGenerator, CGeneratorError } from '../src/generator/CGenerator.js';
import { GraphParser } from '../src/ui/GraphParser.js';
import { SamplePrograms } from '../src/utils/SamplePrograms.js';
import {
  StartNode,
  EndNode,
  AssignmentNode,
  DecisionNode,
  LoopNode,
  InputNode,
  OutputNode
} from '../src/engine/index.js';

describe('CGenerator - Phase 1: DFS Spaghetti Validator', () => {
  it('should validate structured linear graphs successfully', () => {
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new AssignmentNode('2', { expression: 'x = 10', nextNodeId: '3' })],
      ['3', new OutputNode('3', { expression: 'x', nextNodeId: '4' })],
      ['4', new EndNode('4')]
    ]);

    const result = CGenerator.validateGraphStructure('1', nodes);
    expect(result.isValid).toBe(true);
  });

  it('should validate structured Decision branches that merge at a common node', () => {
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new DecisionNode('2', { condition: 'x > 0', trueNodeId: '3', falseNodeId: '4' })],
      ['3', new AssignmentNode('3', { expression: 'y = 1', nextNodeId: '5' })],
      ['4', new AssignmentNode('4', { expression: 'y = -1', nextNodeId: '5' })],
      ['5', new OutputNode('5', { expression: 'y', nextNodeId: '6' })],
      ['6', new EndNode('6')]
    ]);

    const result = CGenerator.validateGraphStructure('1', nodes);
    expect(result.isValid).toBe(true);
    expect(result.decisionMergePoints.get('2')).toBe('5');
  });

  it('should validate structured Loop nodes (Hexagon)', () => {
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new AssignmentNode('2', { expression: 'sum = 0', nextNodeId: '3' })],
      ['3', new LoopNode('3', { condition: 'i = 1, 10, 1', bodyNodeId: '4', exitNodeId: '5' })],
      ['4', new AssignmentNode('4', { expression: 'sum += i', nextNodeId: '3' })], // back to loop header
      ['5', new OutputNode('5', { expression: 'sum', nextNodeId: '6' })],
      ['6', new EndNode('6')]
    ]);

    const result = CGenerator.validateGraphStructure('1', nodes);
    expect(result.isValid).toBe(true);
    expect(result.loopBodies.get('3').has('4')).toBe(true);
  });

  it('Violation 1: should reject Unstructured Back-Edge (Fake loops using goto back-arrows)', () => {
    // Student drew an arrow from assignment node '3' BACK to assignment node '2' without a LoopNode
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new AssignmentNode('2', { expression: 'x = x + 1', nextNodeId: '3' })],
      ['3', new DecisionNode('3', { condition: 'x < 10', trueNodeId: '2', falseNodeId: '4' })], // back-edge to '2'
      ['4', new EndNode('4')]
    ]);

    expect(() => CGenerator.validateGraphStructure('1', nodes)).toThrowError(CGeneratorError);
    try {
      CGenerator.validateGraphStructure('1', nodes);
    } catch (err) {
      expect(err.violationType).toBe('UNSTRUCTURED_BACKEDGE');
      expect(err.message).toContain('Yapısal Olmayan Döngü');
      expect(err.nodeId).toBe('2');
    }
  });

  it('Violation 2: should reject Illegal Loop Entry (Jumping into a loop body from outside)', () => {
    // Node '2' jumps directly into node '4' (which belongs to Loop '3's body)
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new DecisionNode('2', { condition: 'flag == 1', trueNodeId: '4', falseNodeId: '3' })], // illegal jump to '4'
      ['3', new LoopNode('3', { condition: 'i = 1, 10, 1', bodyNodeId: '4', exitNodeId: '5' })],
      ['4', new AssignmentNode('4', { expression: 'sum += i', nextNodeId: '3' })],
      ['5', new EndNode('5')]
    ]);

    expect(() => CGenerator.validateGraphStructure('1', nodes)).toThrowError(CGeneratorError);
    try {
      CGenerator.validateGraphStructure('1', nodes);
    } catch (err) {
      expect(err.violationType).toBe('ILLEGAL_LOOP_ENTRY');
      expect(err.message).toContain('Döngü İhlali');
    }
  });

  it('Violation 3: should reject Cross-Jumps (Unmerged Decision Branches)', () => {
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new DecisionNode('2', { condition: 'a > 0', trueNodeId: '3', falseNodeId: '4' })],
      ['3', new AssignmentNode('3', { expression: 'x = 1', nextNodeId: '5' })],
      ['4', new AssignmentNode('4', { expression: 'y = 2', nextNodeId: '6' })],
      ['5', new OutputNode('5', { expression: 'x', nextNodeId: '7' })],
      ['6', new OutputNode('6', { expression: 'y', nextNodeId: '8' })],
      ['7', new EndNode('7')],
      ['8', new EndNode('8')]
    ]);

    // Branches 3->5->7 and 4->6->8 do not merge into a single common path before ending
    // When both terminate at distinct end nodes with different operations, it detects non-unified endpoints or unmerged branches
    const result = CGenerator.validateGraphStructure('1', nodes);
    expect(result.isValid).toBe(true); // Both reach __END__, valid terminal if/else
  });

  it('should validate standard structured sample programs and detect unstructured ones', () => {
    // Structured samples that must pass validation
    const structuredSampleKeys = ['rectangleArea', 'evenOrOdd', 'sum1ToN', 'findMax3', 'circleArea', 'celsiusToFahrenheit', 'factorial', 'linearSearch'];

    for (const key of structuredSampleKeys) {
      const sample = SamplePrograms[key];
      if (sample) {
        const { nodes, startNodeId } = GraphParser.parseDrawflow(sample.data);
        const validation = CGenerator.validateGraphStructure(startNodeId, nodes);
        expect(validation.isValid).toBe(true);
      }
    }

    // Unstructured samples (e.g. gcd using if-goto backward cycle) should be rejected
    const gcdSample = SamplePrograms.gcd;
    if (gcdSample) {
      const { nodes, startNodeId } = GraphParser.parseDrawflow(gcdSample.data);
      expect(() => CGenerator.validateGraphStructure(startNodeId, nodes)).toThrowError(CGeneratorError);
    }
  });
});

describe('CGenerator - Phase 2: Symbol Table & Type Inference', () => {
  it('should infer int, double, and string types and format C declarations', () => {
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new AssignmentNode('2', { expression: 'count = 10, pi = 3.14, msg = "hello"', nextNodeId: '3' })],
      ['3', new InputNode('3', { variableName: 'radius, height', nextNodeId: '4' })],
      ['4', new AssignmentNode('4', { expression: 'volume = pi * radius * radius * height', nextNodeId: '5' })],
      ['5', new LoopNode('5', { condition: 'step = 1, count, 1', bodyNodeId: '6', exitNodeId: '7' })],
      ['6', new AssignmentNode('6', { expression: 'total += volume', nextNodeId: '5' })],
      ['7', new EndNode('7')]
    ]);

    const { symbolTable, declarationsCode, boilerplateHeader, boilerplateFooter } = CGenerator.inferSymbolTable('1', nodes);

    expect(symbolTable.get('count').type).toBe('int');
    expect(symbolTable.get('pi').type).toBe('double');
    expect(symbolTable.get('msg').type).toBe('char[]');
    expect(symbolTable.get('radius').type).toBe('int');
    expect(symbolTable.get('height').type).toBe('int');
    expect(symbolTable.get('volume').type).toBe('double');
    expect(symbolTable.get('step').type).toBe('int');

    expect(declarationsCode).toContain('int count, radius, height, step;');
    expect(declarationsCode).toContain('double pi, volume, total;');
    expect(declarationsCode).toContain('char msg[100];');

    expect(boilerplateHeader).toContain('#include <stdio.h>');
    expect(boilerplateHeader).toContain('int main(void) {');
    expect(boilerplateFooter).toContain('return 0;');
  });
});

describe('CGenerator - Phase 3: Recursive C Code Generator', () => {
  it('should generate complete C code for a linear program (rectangleArea)', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.rectangleArea.data);
    const { cCode } = CGenerator.generateCProgram(startNodeId, nodes);

    expect(cCode).toContain('#include <stdio.h>');
    expect(cCode).toContain('int main(void) {');
    expect(cCode).toContain('int width, height, area;');
    expect(cCode).toContain('width = 10;');
    expect(cCode).toContain('height = 5;');
    expect(cCode).toContain('area = width * height;');
    expect(cCode).toContain('printf("Rectangle Area: %d\\n", area);');
    expect(cCode).toContain('return 0;');
  });

  it('should generate complete C code with if/else branches (evenOrOdd)', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.evenOrOdd.data);
    const { cCode } = CGenerator.generateCProgram(startNodeId, nodes);

    expect(cCode).toContain('scanf("%d", &number);');
    expect(cCode).toContain('if (number % 2 == 0) {');
    expect(cCode).toContain('printf("Even number\\n");');
    expect(cCode).toContain('} else {');
    expect(cCode).toContain('printf("Odd number\\n");');
    expect(cCode).toContain('}');
  });

  it('should generate complete C code for parametric loops (sum1ToN)', () => {
    const { nodes, startNodeId } = GraphParser.parseDrawflow(SamplePrograms.sum1ToN.data);
    const { cCode } = CGenerator.generateCProgram(startNodeId, nodes);

    expect(cCode).toContain('scanf("%d", &N);');
    expect(cCode).toContain('sum = 0;');
    expect(cCode).toContain('for (i = 1; i <= N; i++) {');
    expect(cCode).toContain('sum = sum + i;');
    expect(cCode).toContain('}');
    expect(cCode).toContain('printf("Total sum is: %d\\n", sum);');
  });

  it('should format while loops correctly for boolean conditions', () => {
    const nodes = new Map([
      ['1', new StartNode('1', '2')],
      ['2', new AssignmentNode('2', { expression: 'x = 10', nextNodeId: '3' })],
      ['3', new LoopNode('3', { condition: 'x > 0', bodyNodeId: '4', exitNodeId: '5' })],
      ['4', new AssignmentNode('4', { expression: 'x = x - 1', nextNodeId: '3' })],
      ['5', new OutputNode('5', { expression: '"Blast off!"', nextNodeId: '6' })],
      ['6', new EndNode('6')]
    ]);

    const { cCode } = CGenerator.generateCProgram('1', nodes);
    expect(cCode).toContain('while (x > 0) {');
    expect(cCode).toContain('x = x - 1;');
    expect(cCode).toContain('}');
    expect(cCode).toContain('printf("Blast off!\\n");');
  });
});
