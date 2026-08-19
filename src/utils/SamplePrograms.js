import { renderNodeHtml } from '../ui/CanvasManager.js';

/**
 * Pre-built educational flowchart programs for C programming students.
 */
export const SamplePrograms = {
  rectangleArea: {
    name: '1. Rectangle Area (Linear Sequence)',
    description: 'Calculates the area of a rectangle given width and height.',
    data: {
      drawflow: {
        Home: {
          data: {
            '1': {
              id: 1,
              name: 'start',
              data: {},
              class: 'start',
              html: renderNodeHtml('start', {}),
              typenode: false,
              inputs: {},
              outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } },
              pos_x: 220,
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'assignment',
              data: { expression: 'width = 10' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'width = 10' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 220,
              pos_y: 150
            },
            '3': {
              id: 3,
              name: 'assignment',
              data: { expression: 'height = 5' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'height = 5' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 220,
              pos_y: 260
            },
            '4': {
              id: 4,
              name: 'assignment',
              data: { expression: 'area = width * height' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'area = width * height' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } },
              pos_x: 220,
              pos_y: 370
            },
            '5': {
              id: 5,
              name: 'output',
              data: { expression: '"Area is: " + area' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Area is: " + area' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 220,
              pos_y: 480
            },
            '6': {
              id: 6,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } },
              outputs: {},
              pos_x: 220,
              pos_y: 590
            }
          }
        }
      }
    }
  },

  evenOrOdd: {
    name: '2. Even or Odd Number (Decision / If-Else)',
    description: 'Checks if a number is even or odd using modulo operation (num % 2 == 0).',
    data: {
      drawflow: {
        Home: {
          data: {
            '1': {
              id: 1,
              name: 'start',
              data: {},
              class: 'start',
              html: renderNodeHtml('start', {}),
              typenode: false,
              inputs: {},
              outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } },
              pos_x: 240,
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'num', prompt: 'Enter an integer:' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'num' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 240,
              pos_y: 150
            },
            '3': {
              id: 3,
              name: 'decision',
              data: { condition: 'num % 2 == 0' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'num % 2 == 0' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: {
                output_1: { connections: [{ node: '4', output: 'input_1' }] }, // True
                output_2: { connections: [{ node: '5', output: 'input_1' }] }  // False
              },
              pos_x: 240,
              pos_y: 260
            },
            '4': {
              id: 4,
              name: 'output',
              data: { expression: '"Even number"' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Even number"' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 80,
              pos_y: 410
            },
            '5': {
              id: 5,
              name: 'output',
              data: { expression: '"Odd number"' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Odd number"' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 400,
              pos_y: 410
            },
            '6': {
              id: 6,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: {
                input_1: {
                  connections: [
                    { node: '4', input: 'output_1' },
                    { node: '5', input: 'output_1' }
                  ]
                }
              },
              outputs: {},
              pos_x: 240,
              pos_y: 540
            }
          }
        }
      }
    }
  },

  sum1ToN: {
    name: '3. Sum of 1 to N (Loop / Iteration)',
    description: 'Computes sum = 1 + 2 + ... + N using a loop (i = 1, N, 1).',
    data: {
      drawflow: {
        Home: {
          data: {
            '1': {
              id: 1,
              name: 'start',
              data: {},
              class: 'start',
              html: renderNodeHtml('start', {}),
              typenode: false,
              inputs: {},
              outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 30
            },
            '2': {
              id: 2,
              name: 'assignment',
              data: { expression: 'N = 5' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'N = 5' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 140
            },
            '3': {
              id: 3,
              name: 'assignment',
              data: { expression: 'sum = 0' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'sum = 0' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 250
            },
            '4': {
              id: 4,
              name: 'loop',
              data: { condition: 'i = 1, N, 1' },
              class: 'loop',
              html: renderNodeHtml('loop', { condition: 'i = 1, N, 1' }),
              typenode: false,
              inputs: {
                input_1: {
                  connections: [
                    { node: '3', input: 'output_1' },
                    { node: '5', input: 'output_1' }
                  ]
                }
              },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] }, // Body
                output_2: { connections: [{ node: '6', output: 'input_1' }] }  // Exit
              },
              pos_x: 250,
              pos_y: 370
            },
            '5': {
              id: 5,
              name: 'assignment',
              data: { expression: 'sum = sum + i' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'sum = sum + i' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', input: 'output_1' }] } },
              pos_x: 90,
              pos_y: 520
            },
            '6': {
              id: 6,
              name: 'output',
              data: { expression: '"Total sum is: " + sum' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Total sum is: " + sum' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '7', output: 'input_1' }] } },
              pos_x: 420,
              pos_y: 520
            },
            '7': {
              id: 7,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '6', input: 'output_1' }] } },
              outputs: {},
              pos_x: 420,
              pos_y: 640
            }
          }
        }
      }
    }
  }
};
