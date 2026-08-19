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
              html: 'start',
              typenode: false,
              inputs: {},
              outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } },
              pos_x: 200,
              pos_y: 50
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'width', prompt: 'Enter width:' },
              class: 'input',
              html: 'input',
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 200,
              pos_y: 170
            },
            '3': {
              id: 3,
              name: 'input',
              data: { variableName: 'height', prompt: 'Enter height:' },
              class: 'input',
              html: 'input',
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 200,
              pos_y: 290
            },
            '4': {
              id: 4,
              name: 'assignment',
              data: { expression: 'area = width * height' },
              class: 'assignment',
              html: 'assignment',
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } },
              pos_x: 200,
              pos_y: 410
            },
            '5': {
              id: 5,
              name: 'output',
              data: { expression: '"Area is: " + area' },
              class: 'output',
              html: 'output',
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 200,
              pos_y: 530
            },
            '6': {
              id: 6,
              name: 'end',
              data: {},
              class: 'end',
              html: 'end',
              typenode: false,
              inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } },
              outputs: {},
              pos_x: 200,
              pos_y: 650
            }
          }
        }
      }
    }
  },

  evenOrOdd: {
    name: '2. Even or Odd Number (Decision / If-Else)',
    description: 'Checks if an input number is even or odd using modulo operation (n % 2 == 0).',
    data: {
      drawflow: {
        Home: {
          data: {
            '1': {
              id: 1,
              name: 'start',
              data: {},
              class: 'start',
              html: 'start',
              inputs: {},
              outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } },
              pos_x: 220,
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'num', prompt: 'Enter an integer:' },
              class: 'input',
              html: 'input',
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 220,
              pos_y: 160
            },
            '3': {
              id: 3,
              name: 'decision',
              data: { condition: 'num % 2 == 0' },
              class: 'decision',
              html: 'decision',
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: {
                output_1: { connections: [{ node: '4', output: 'input_1' }] }, // True
                output_2: { connections: [{ node: '5', output: 'input_1' }] }  // False
              },
              pos_x: 220,
              pos_y: 280
            },
            '4': {
              id: 4,
              name: 'output',
              data: { expression: '"Even number"' },
              class: 'output',
              html: 'output',
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 70,
              pos_y: 440
            },
            '5': {
              id: 5,
              name: 'output',
              data: { expression: '"Odd number"' },
              class: 'output',
              html: 'output',
              inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 370,
              pos_y: 440
            },
            '6': {
              id: 6,
              name: 'end',
              data: {},
              class: 'end',
              html: 'end',
              inputs: {
                input_1: {
                  connections: [
                    { node: '4', input: 'output_1' },
                    { node: '5', input: 'output_1' }
                  ]
                }
              },
              outputs: {},
              pos_x: 220,
              pos_y: 570
            }
          }
        }
      }
    }
  },

  sum1ToN: {
    name: '3. Sum of 1 to N (Loop / Iteration)',
    description: 'Computes sum = 1 + 2 + ... + N using a loop.',
    data: {
      drawflow: {
        Home: {
          data: {
            '1': {
              id: 1,
              name: 'start',
              data: {},
              class: 'start',
              html: 'start',
              inputs: {},
              outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 30
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'N', prompt: 'Enter N (e.g. 5):' },
              class: 'input',
              html: 'input',
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
              html: 'assignment',
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 250
            },
            '4': {
              id: 4,
              name: 'assignment',
              data: { expression: 'i = 1' },
              class: 'assignment',
              html: 'assignment',
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 360
            },
            '5': {
              id: 5,
              name: 'loop',
              data: { condition: 'i <= N' },
              class: 'loop',
              html: 'loop',
              inputs: {
                input_1: {
                  connections: [
                    { node: '4', input: 'output_1' },
                    { node: '7', input: 'output_1' }
                  ]
                }
              },
              outputs: {
                output_1: { connections: [{ node: '6', output: 'input_1' }] }, // Body
                output_2: { connections: [{ node: '8', output: 'input_1' }] }  // Exit
              },
              pos_x: 250,
              pos_y: 470
            },
            '6': {
              id: 6,
              name: 'assignment',
              data: { expression: 'sum = sum + i' },
              class: 'assignment',
              html: 'assignment',
              inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '7', output: 'input_1' }] } },
              pos_x: 100,
              pos_y: 600
            },
            '7': {
              id: 7,
              name: 'assignment',
              data: { expression: 'i = i + 1' },
              class: 'assignment',
              html: 'assignment',
              inputs: { input_1: { connections: [{ node: '6', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } },
              pos_x: 100,
              pos_y: 720
            },
            '8': {
              id: 8,
              name: 'output',
              data: { expression: '"Total sum is: " + sum' },
              class: 'output',
              html: 'output',
              inputs: { input_1: { connections: [{ node: '5', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '9', output: 'input_1' }] } },
              pos_x: 420,
              pos_y: 600
            },
            '9': {
              id: 9,
              name: 'end',
              data: {},
              class: 'end',
              html: 'end',
              inputs: { input_1: { connections: [{ node: '8', input: 'output_1' }] } },
              outputs: {},
              pos_x: 420,
              pos_y: 720
            }
          }
        }
      }
    }
  }
};
