import { describe, it, expect } from 'vitest';
import {
  InterpreterContext,
  FlowchartInterpreter,
  FlowchartNode,
  StartNode,
  EndNode,
  AssignmentNode,
  DecisionNode,
  LoopNode,
  InputNode,
  OutputNode
} from '../src/engine/index.js';
import { SafeEvaluator } from '../src/evaluator/Evaluator.js';

describe('InterpreterContext', () => {
  it('should initialize with default state', () => {
    const context = new InterpreterContext();
    expect(context.variables).toEqual({});
    expect(context.output).toEqual([]);
    expect(context.currentNodeId).toBeNull();
    expect(context.isFinished).toBe(false);
    expect(context.error).toBeNull();
    expect(context.stepCount).toBe(0);
  });

  it('should manage variables and outputs', () => {
    const context = new InterpreterContext();
    context.setVariable('x', 42);
    expect(context.getVariable('x')).toBe(42);

    context.writeOutput('Hello C');
    expect(context.output).toEqual(['Hello C']);
  });

  it('should reset properly and prevent state pollution', () => {
    const context = new InterpreterContext({ variables: { a: 10 } });
    context.writeOutput('test');
    context.loopStates = { loop1: { current: 5 } };
    context.recordSnapshot();
    context.stepCount = 12;
    context.isFinished = true;
    context.error = 'Some error';

    context.reset('start_1');
    expect(context.variables).toEqual({});
    expect(context.output).toEqual([]);
    expect(context.currentNodeId).toBe('start_1');
    expect(context.isFinished).toBe(false);
    expect(context.error).toBeNull();
    expect(context.stepCount).toBe(0);
    expect(context.history).toEqual([]);
    expect(context.loopStates).toEqual({});
  });
});

describe('FlowchartNode Base Class', () => {
  it('should prevent direct instantiation', () => {
    expect(() => new FlowchartNode('1', 'base')).toThrow(TypeError);
  });
});

describe('Linear Flowchart Execution (Start -> Assign -> Output -> End)', () => {
  it('should step through a sequence and update state accurately', () => {
    const evaluator = SafeEvaluator.hook;

    const start = new StartNode('node_start', 'node_assign');
    const assign = new AssignmentNode('node_assign', {
      expression: 'x = 10 + 5',
      nextNodeId: 'node_output',
      evaluator
    });
    const output = new OutputNode('node_output', {
      expression: 'x * 2',
      nextNodeId: 'node_end',
      evaluator
    });
    const end = new EndNode('node_end');

    const interpreter = new FlowchartInterpreter({
      nodes: {
        node_start: start,
        node_assign: assign,
        node_output: output,
        node_end: end
      },
      evaluator
    });

    expect(interpreter.context.currentNodeId).toBe('node_start');

    // Step 1: Start -> Assign
    let snap = interpreter.step();
    expect(snap.executedNodeId).toBe('node_start');
    expect(snap.nextNodeId).toBe('node_assign');
    expect(snap.isFinished).toBe(false);

    // Step 2: Assign (x = 15) -> Output
    snap = interpreter.step();
    expect(snap.executedNodeId).toBe('node_assign');
    expect(snap.variables.x).toBe(15);
    expect(snap.nextNodeId).toBe('node_output');

    // Step 3: Output (prints 30) -> End
    snap = interpreter.step();
    expect(snap.executedNodeId).toBe('node_output');
    expect(snap.output).toEqual(['30']);
    expect(snap.nextNodeId).toBe('node_end');

    // Step 4: End
    snap = interpreter.step();
    expect(snap.executedNodeId).toBe('node_end');
    expect(snap.isFinished).toBe(true);
    expect(snap.nextNodeId).toBeNull();
  });
});

describe('Conditional Branching with DecisionNode', () => {
  it('should take the true branch when condition is true', () => {
    const evaluator = SafeEvaluator.hook;

    const start = new StartNode('start', 'assign_score');
    const assign = new AssignmentNode('assign_score', {
      expression: 'score = 75',
      nextNodeId: 'decision_check',
      evaluator
    });
    const decision = new DecisionNode('decision_check', {
      condition: 'score >= 50',
      trueNodeId: 'out_pass',
      falseNodeId: 'out_fail',
      evaluator
    });
    const outPass = new OutputNode('out_pass', { expression: '"Passed"', nextNodeId: 'end', evaluator });
    const outFail = new OutputNode('out_fail', { expression: '"Failed"', nextNodeId: 'end', evaluator });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { start, assign, decision, outPass, outFail, end },
      evaluator
    });

    // Run until finish
    while (!interpreter.context.isFinished) {
      interpreter.step();
    }

    expect(interpreter.context.variables.score).toBe(75);
    expect(interpreter.context.output).toEqual(['Passed']);
  });

  it('should take the false branch when condition is false', () => {
    const evaluator = SafeEvaluator.hook;

    const start = new StartNode('start', 'assign_score');
    const assign = new AssignmentNode('assign_score', {
      expression: 'score = 30',
      nextNodeId: 'decision_check',
      evaluator
    });
    const decision = new DecisionNode('decision_check', {
      condition: 'score >= 50',
      trueNodeId: 'out_pass',
      falseNodeId: 'out_fail',
      evaluator
    });
    const outPass = new OutputNode('out_pass', { expression: '"Passed"', nextNodeId: 'end', evaluator });
    const outFail = new OutputNode('out_fail', { expression: '"Failed"', nextNodeId: 'end', evaluator });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { start, assign, decision, outPass, outFail, end },
      evaluator
    });

    while (!interpreter.context.isFinished) {
      interpreter.step();
    }

    expect(interpreter.context.variables.score).toBe(30);
    expect(interpreter.context.output).toEqual(['Failed']);
  });
});

describe('Loop Iteration with LoopNode', () => {
  it('should compute sum of 1 to 3 iteratively', () => {
    const evaluator = SafeEvaluator.hook;

    // Flow:
    // start -> init_sum (sum = 0) -> init_i (i = 1) -> loop (i <= 3)
    // loop body -> add_sum (sum = sum + i) -> inc_i (i = i + 1) -> loop
    // loop exit -> out_sum (print sum) -> end

    const start = new StartNode('start', 'init_sum');
    const initSum = new AssignmentNode('init_sum', { expression: 'sum = 0', nextNodeId: 'init_i', evaluator });
    const initI = new AssignmentNode('init_i', { expression: 'i = 1', nextNodeId: 'loop_check', evaluator });
    const loop = new LoopNode('loop_check', {
      condition: 'i <= 3',
      bodyNodeId: 'add_sum',
      exitNodeId: 'out_sum',
      evaluator
    });
    const addSum = new AssignmentNode('add_sum', { expression: 'sum = sum + i', nextNodeId: 'inc_i', evaluator });
    const incI = new AssignmentNode('inc_i', { expression: 'i = i + 1', nextNodeId: 'loop_check', evaluator });
    const outSum = new OutputNode('out_sum', { expression: 'sum', nextNodeId: 'end', evaluator });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { start, initSum, initI, loop, addSum, incI, outSum, end },
      evaluator
    });

    let safetyCount = 0;
    while (!interpreter.context.isFinished && safetyCount < 100) {
      interpreter.step();
      safetyCount++;
    }

    expect(interpreter.context.variables.sum).toBe(6); // 1 + 2 + 3 = 6
    expect(interpreter.context.variables.i).toBe(4);
    expect(interpreter.context.output).toEqual(['6']);
    expect(interpreter.context.isFinished).toBe(true);
  });

  it('should execute standard engineering loop syntax I = 1, N, 1', () => {
    const evaluator = SafeEvaluator.hook;

    // Flow:
    // start -> init_N (N = 4) -> init_sum (sum = 0) -> loop (i = 1, N, 1)
    // loop body -> add_sum (sum = sum + i) -> loop
    // loop exit -> out_sum (print sum) -> end

    const start = new StartNode('start', 'init_N');
    const initN = new AssignmentNode('init_N', { expression: 'N = 4', nextNodeId: 'init_sum', evaluator });
    const initSum = new AssignmentNode('init_sum', { expression: 'sum = 0', nextNodeId: 'loop_header', evaluator });
    const loop = new LoopNode('loop_header', {
      condition: 'i = 1, N, 1',
      bodyNodeId: 'add_sum',
      exitNodeId: 'out_sum',
      evaluator
    });
    const addSum = new AssignmentNode('add_sum', { expression: 'sum = sum + i', nextNodeId: 'loop_header', evaluator });
    const outSum = new OutputNode('out_sum', { expression: 'sum', nextNodeId: 'end', evaluator });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { start, initN, initSum, loop, addSum, outSum, end },
      evaluator
    });

    let safetyCount = 0;
    while (!interpreter.context.isFinished && safetyCount < 100) {
      interpreter.step();
      safetyCount++;
    }

    expect(interpreter.context.variables.sum).toBe(10); // 1 + 2 + 3 + 4 = 10
    expect(interpreter.context.variables.i).toBe(5);
    expect(interpreter.context.output).toEqual(['10']);
    expect(interpreter.context.isFinished).toBe(true);
  });
});

describe('InputNode handling', () => {
  it('should consume values from inputQueue', () => {
    const context = new InterpreterContext({ inputQueue: ['42'] });
    const inputNode = new InputNode('in_1', { variableName: 'userAge', nextNodeId: 'end' });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { in_1: inputNode, end },
      startNodeId: 'in_1',
      context
    });

    interpreter.step();
    expect(interpreter.context.variables.userAge).toBe(42);
    expect(interpreter.context.currentNodeId).toBe('end');
  });

  it('should handle multiple input variables in a single Input node', () => {
    const context = new InterpreterContext({ inputQueue: ['10', '20', '30'] });
    const inputNode = new InputNode('in_multi', { variableName: 'a, b, c', nextNodeId: 'end' });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { in_multi: inputNode, end },
      startNodeId: 'in_multi',
      context
    });

    interpreter.step();
    expect(interpreter.context.variables.a).toBe(10);
    expect(interpreter.context.variables.b).toBe(20);
    expect(interpreter.context.variables.c).toBe(30);
  });

  it('should recognize float inputs like 3.0 as double and propagate to expressions', () => {
    // Test the exact scenario reported by the user:
    // radius is input as '3.0', height as '5', pi is 3 (integer).
    // Because radius is '3.0' (double), volume must also be recognized as double!
    const context = new InterpreterContext({
      inputQueue: ['3.0', '5']
    });
    const initPi = new AssignmentNode('init_pi', { expression: 'pi = 3', nextNodeId: 'in_1' });
    const inNode = new InputNode('in_1', { variableName: 'r, h', nextNodeId: 'calc' });
    const calcNode = new AssignmentNode('calc', {
      expression: 'V = pi * r * r * h',
      nextNodeId: 'end',
      evaluator: SafeEvaluator.hook
    });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { init_pi: initPi, in_1: inNode, calc: calcNode, end },
      startNodeId: 'init_pi',
      context,
      evaluator: SafeEvaluator.hook
    });

    // Step 0: init_pi executes (pi = 3)
    interpreter.step();
    expect(interpreter.context.variables.pi).toBe(3);
    expect(interpreter.context.floatVars.has('pi')).toBe(false); // pi is integer

    // Step 1: Input node executes (r = '3.0', h = '5')
    interpreter.step();
    expect(interpreter.context.variables.r).toBe(3);
    expect(interpreter.context.floatVars.has('r')).toBe(true); // Must be double!
    expect(interpreter.context.variables.h).toBe(5);
    expect(interpreter.context.floatVars.has('h')).toBe(false); // Integer

    // Step 2: Calculation executes
    interpreter.step();
    expect(interpreter.context.variables.V).toBe(135);
    expect(interpreter.context.floatVars.has('V')).toBe(true); // Must be double due to r!

    // Verify division with r uses floating point division instead of integer truncation
    const divResult = SafeEvaluator.evaluate('r / 2', {
      ...interpreter.context.variables,
      __floatVars: interpreter.context.floatVars
    });
    expect(divResult).toBe(1.5); // 3.0 / 2 = 1.5, not 1!
  });

  it('should support explicit type prefix in InputNode e.g. double r', () => {
    const context = new InterpreterContext({ inputQueue: ['3'] });
    const inNode = new InputNode('in_1', { variableName: 'double r', nextNodeId: 'end' });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { in_1: inNode, end },
      startNodeId: 'in_1',
      context
    });

    interpreter.step();
    expect(interpreter.context.variables.r).toBe(3);
    expect(interpreter.context.floatVars.has('r')).toBe(true);
  });

  it('validateVariableName should accept valid variable names and type annotations', () => {
    expect(InputNode.validateVariableName('x').isValid).toBe(true);
    expect(InputNode.validateVariableName('a, b, c').isValid).toBe(true);
    expect(InputNode.validateVariableName('double r').isValid).toBe(true);
    expect(InputNode.validateVariableName('int count, float rate').isValid).toBe(true);
  });

  it('validateVariableName should reject assignment expressions like T=0', () => {
    const res = InputNode.validateVariableName('T=0');
    expect(res.isValid).toBe(false);
    expect(res.errorType).toBe('ASSIGNMENT');
  });

  it('validateVariableName should reject invalid identifiers', () => {
    const res = InputNode.validateVariableName('123abc');
    expect(res.isValid).toBe(false);
    expect(res.errorType).toBe('INVALID_IDENTIFIER');
  });

  it('execute should throw educational error when InputNode contains assignment', () => {
    const context = new InterpreterContext({ inputQueue: ['0'] });
    const inNode = new InputNode('in_bad', { variableName: 'T = 0', nextNodeId: 'end' });
    expect(() => inNode.execute(context)).toThrow(/atama/i);
  });
});

describe('Multi-Statement Nodes (Compact Flowchart Blocks)', () => {
  it('should execute multiple assignments in a single Assignment node', () => {
    const evaluator = SafeEvaluator.hook;
    const start = new StartNode('start', 'assign_multi');
    const assignMulti = new AssignmentNode('assign_multi', {
      expression: 'x = 5, y = 10, z = x + y',
      nextNodeId: 'out_multi',
      evaluator
    });
    const outMulti = new OutputNode('out_multi', {
      expression: '"X: " + x, "Y: " + y, "Z: " + z',
      nextNodeId: 'end',
      evaluator
    });
    const end = new EndNode('end');

    const interpreter = new FlowchartInterpreter({
      nodes: { start, assignMulti, outMulti, end },
      evaluator
    });

    while (!interpreter.context.isFinished) {
      interpreter.step();
    }

    expect(interpreter.context.variables.x).toBe(5);
    expect(interpreter.context.variables.y).toBe(10);
    expect(interpreter.context.variables.z).toBe(15);
    expect(interpreter.context.output).toEqual(['X: 5', 'Y: 10', 'Z: 15']);
  });
});
