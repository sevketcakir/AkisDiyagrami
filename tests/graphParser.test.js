import { describe, it, expect } from 'vitest';
import { GraphParser } from '../src/ui/GraphParser.js';
import { FlowchartInterpreter } from '../src/engine/FlowchartInterpreter.js';
import { InterpreterContext } from '../src/engine/InterpreterContext.js';
import { SamplePrograms } from '../src/utils/SamplePrograms.js';

describe('GraphParser', () => {
  it('should parse a complete Drawflow exported structure and execute it', () => {
    const mockDrawflowExport = {
      drawflow: {
        Home: {
          data: {
            '1': {
              id: 1,
              name: 'start',
              outputs: {
                output_1: { connections: [{ node: '2', output: 'input_1' }] }
              }
            },
            '2': {
              id: 2,
              name: 'assignment',
              data: { expression: 'radius = 5' },
              outputs: {
                output_1: { connections: [{ node: '3', output: 'input_1' }] }
              }
            },
            '3': {
              id: 3,
              name: 'assignment',
              data: { expression: 'area = 3 * radius * radius' },
              outputs: {
                output_1: { connections: [{ node: '4', output: 'input_1' }] }
              }
            },
            '4': {
              id: 4,
              name: 'output',
              data: { expression: 'area' },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] }
              }
            },
            '5': {
              id: 5,
              name: 'end',
              outputs: {}
            }
          }
        }
      }
    };

    const { nodes, startNodeId, errors, warnings } = GraphParser.parseDrawflow(mockDrawflowExport);
    expect(errors).toEqual([]);
    expect(startNodeId).toBe('1');
    expect(nodes.size).toBe(5);

    const interpreter = new FlowchartInterpreter({ nodes, startNodeId });
    while (!interpreter.context.isFinished) {
      interpreter.step();
    }

    expect(interpreter.context.variables.radius).toBe(5);
    expect(interpreter.context.variables.area).toBe(75);
    expect(interpreter.context.output).toEqual(['75']);
  });

  it('should detect when no Start node is present', () => {
    const data = {
      drawflow: {
        Home: {
          data: {
            '1': { id: 1, name: 'assignment', data: { expression: 'x = 10' }, outputs: {} }
          }
        }
      }
    };
    const { errors } = GraphParser.parseDrawflow(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('No Start node found');
  });

  it('should detect when there is no path from Start to End', () => {
    const data = {
      drawflow: {
        Home: {
          data: {
            '1': { id: 1, name: 'start', outputs: {} }, // Unconnected start
            '2': { id: 2, name: 'end', outputs: {} }
          }
        }
      }
    };
    const { errors } = GraphParser.parseDrawflow(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('No valid execution path') || e.includes('not connected'))).toBe(true);
  });

  it('should execute evenOrOdd sample program correctly', () => {
    const { nodes, startNodeId, errors } = GraphParser.parseDrawflow(SamplePrograms.evenOrOdd.data);
    expect(errors).toEqual([]);

    // Test with even number 8
    const contextEven = new InterpreterContext({ inputQueue: ['8'] });
    const interpreterEven = new FlowchartInterpreter({ nodes, startNodeId, context: contextEven });
    while (!interpreterEven.context.isFinished) {
      interpreterEven.step();
    }
    expect(interpreterEven.context.output).toEqual(['Even number']);

    // Test with odd number 7
    const contextOdd = new InterpreterContext({ inputQueue: ['7'] });
    const interpreterOdd = new FlowchartInterpreter({ nodes, startNodeId, context: contextOdd });
    while (!interpreterOdd.context.isFinished) {
      interpreterOdd.step();
    }
    expect(interpreterOdd.context.output).toEqual(['Odd number']);
  });

  it('should execute sum1ToN loop sample program correctly', () => {
    const { nodes, startNodeId, errors } = GraphParser.parseDrawflow(SamplePrograms.sum1ToN.data);
    expect(errors).toEqual([]);

    const context = new InterpreterContext({ inputQueue: ['5'] }); // sum 1 to 5 = 15
    const interpreter = new FlowchartInterpreter({ nodes, startNodeId, context });
    let steps = 0;
    while (!interpreter.context.isFinished && steps < 100) {
      interpreter.step();
      steps++;
    }

    expect(interpreter.context.variables.sum).toBe(15);
    expect(interpreter.context.variables.i).toBe(6);
    expect(interpreter.context.output).toEqual(['Total sum is: 15']);
  });
});
