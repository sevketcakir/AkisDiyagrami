import { renderNodeHtml } from '../ui/CanvasManager.js';
import { I18n } from '../i18n/I18n.js';

/**
 * Pre-built educational flowchart programs for C programming students,
 * laid out along clean vertical top-to-bottom axes using compact multi-statement blocks.
 */
export const SamplePrograms = {
  rectangleArea: {
    get name() { return I18n.t('samples.rectangleArea'); },
    get description() { return I18n.t('sampleDescriptions.rectangleArea'); },
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
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'assignment',
              data: { expression: 'width = 10\nheight = 5\narea = width * height' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'width = 10\nheight = 5\narea = width * height' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 150
            },
            '3': {
              id: 3,
              name: 'output',
              data: { expression: '"Rectangle Area: " + area' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Rectangle Area: " + area' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 300
            },
            '4': {
              id: 4,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: {},
              pos_x: 250,
              pos_y: 430
            }
          }
        }
      }
    }
  },

  evenOrOdd: {
    get name() { return I18n.t('samples.evenOrOdd'); },
    get description() { return I18n.t('sampleDescriptions.evenOrOdd'); },
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
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'number', variablename: 'number' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'number' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 150
            },
            '3': {
              id: 3,
              name: 'decision',
              data: { condition: 'number % 2 == 0' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'number % 2 == 0' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: {
                output_1: { connections: [{ node: '4', output: 'input_1' }] }, // True (Left)
                output_2: { connections: [{ node: '5', output: 'input_1' }] }  // False (Right)
              },
              pos_x: 250,
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
              pos_x: 90,
              pos_y: 390
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
              pos_x: 410,
              pos_y: 390
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
              pos_x: 250,
              pos_y: 520
            }
          }
        }
      }
    }
  },

  maxOfThree: {
    get name() { return I18n.t('samples.maxOfThree'); },
    get description() { return I18n.t('sampleDescriptions.maxOfThree'); },
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
              name: 'input',
              data: { variableName: 'a, b, c', variablename: 'a, b, c' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'a, b, c' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 130
            },
            '3': {
              id: 3,
              name: 'decision',
              data: { condition: 'a >= b && a >= c' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'a >= b && a >= c' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: {
                output_1: { connections: [{ node: '4', output: 'input_1' }] },
                output_2: { connections: [{ node: '5', output: 'input_1' }] }
              },
              pos_x: 250,
              pos_y: 240
            },
            '4': {
              id: 4,
              name: 'output',
              data: { expression: '"Max is A: " + a' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Max is A: " + a' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '8', output: 'input_1' }] } },
              pos_x: 80,
              pos_y: 360
            },
            '5': {
              id: 5,
              name: 'decision',
              data: { condition: 'b >= c' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'b >= c' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } },
              outputs: {
                output_1: { connections: [{ node: '6', output: 'input_1' }] },
                output_2: { connections: [{ node: '7', output: 'input_1' }] }
              },
              pos_x: 420,
              pos_y: 360
            },
            '6': {
              id: 6,
              name: 'output',
              data: { expression: '"Max is B: " + b' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Max is B: " + b' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '8', output: 'input_1' }] } },
              pos_x: 310,
              pos_y: 480
            },
            '7': {
              id: 7,
              name: 'output',
              data: { expression: '"Max is C: " + c' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Max is C: " + c' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '5', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '8', output: 'input_1' }] } },
              pos_x: 530,
              pos_y: 480
            },
            '8': {
              id: 8,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: {
                input_1: {
                  connections: [
                    { node: '4', input: 'output_1' },
                    { node: '6', input: 'output_1' },
                    { node: '7', input: 'output_1' }
                  ]
                }
              },
              outputs: {},
              pos_x: 250,
              pos_y: 610
            }
          }
        }
      }
    }
  },

  sum1ToN: {
    get name() { return I18n.t('samples.sum1ToN'); },
    get description() { return I18n.t('sampleDescriptions.sum1ToN'); },
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
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'N', variablename: 'N' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'N' }),
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
              pos_y: 240
            },
            '4': {
              id: 4,
              name: 'loop',
              data: { condition: 'i = 1, N, 1' },
              class: 'loop',
              html: renderNodeHtml('loop', { condition: 'i = 1, N, 1' }),
              typenode: false,
              inputs: {
                input_1: { connections: [{ node: '3', input: 'output_1' }] },
                input_2: { connections: [{ node: '5', input: 'output_1' }] }
              },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] },
                output_2: { connections: [{ node: '6', output: 'input_1' }] }
              },
              pos_x: 250,
              pos_y: 340
            },
            '5': {
              id: 5,
              name: 'assignment',
              data: { expression: 'sum = sum + i' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'sum = sum + i' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_2' }] } },
              pos_x: 520,
              pos_y: 340
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
              pos_x: 250,
              pos_y: 480
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
              pos_x: 250,
              pos_y: 600
            }
          }
        }
      }
    }
  },

  factorial: {
    get name() { return I18n.t('samples.factorial'); },
    get description() { return I18n.t('sampleDescriptions.factorial'); },
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
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'N', variablename: 'N' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'N' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 140
            },
            '3': {
              id: 3,
              name: 'assignment',
              data: { expression: 'fact = 1' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'fact = 1' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 240
            },
            '4': {
              id: 4,
              name: 'loop',
              data: { condition: 'i = 1, N, 1' },
              class: 'loop',
              html: renderNodeHtml('loop', { condition: 'i = 1, N, 1' }),
              typenode: false,
              inputs: {
                input_1: { connections: [{ node: '3', input: 'output_1' }] },
                input_2: { connections: [{ node: '5', input: 'output_1' }] }
              },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] },
                output_2: { connections: [{ node: '6', output: 'input_1' }] }
              },
              pos_x: 250,
              pos_y: 340
            },
            '5': {
              id: 5,
              name: 'assignment',
              data: { expression: 'fact = fact * i' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'fact = fact * i' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_2' }] } },
              pos_x: 520,
              pos_y: 340
            },
            '6': {
              id: 6,
              name: 'output',
              data: { expression: '"Factorial: " + fact' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Factorial: " + fact' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '7', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 480
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
              pos_x: 250,
              pos_y: 600
            }
          }
        }
      }
    }
  },

  isPrimeCheck: {
    get name() { return I18n.t('samples.isPrimeCheck'); },
    get description() { return I18n.t('sampleDescriptions.isPrimeCheck'); },
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
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'N', variablename: 'N' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'N' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 140
            },
            '3': {
              id: 3,
              name: 'assignment',
              data: { expression: 'asal = true' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'asal = true' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 240
            },
            '4': {
              id: 4,
              name: 'loop',
              data: { condition: 'i = 2, N - 1, 1' },
              class: 'loop',
              html: renderNodeHtml('loop', { condition: 'i = 2, N - 1, 1' }),
              typenode: false,
              inputs: {
                input_1: { connections: [{ node: '3', input: 'output_1' }] },
                input_2: {
                  connections: [
                    { node: '6', input: 'output_1' },
                    { node: '5', input: 'output_2' }
                  ]
                }
              },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] },
                output_2: { connections: [{ node: '7', output: 'input_1' }] }
              },
              pos_x: 250,
              pos_y: 340
            },
            '5': {
              id: 5,
              name: 'decision',
              data: { condition: 'N % i == 0' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'N % i == 0' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: {
                output_1: { connections: [{ node: '6', output: 'input_1' }] }, // True (Left)
                output_2: { connections: [{ node: '4', output: 'input_2' }] }  // False (Right loopback)
              },
              pos_x: 540,
              pos_y: 340
            },
            '6': {
              id: 6,
              name: 'assignment',
              data: { expression: 'asal = false' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'asal = false' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_2' }] } },
              pos_x: 540,
              pos_y: 470
            },
            '7': {
              id: 7,
              name: 'decision',
              data: { condition: 'asal && N >= 2' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'asal && N >= 2' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_2' }] } },
              outputs: {
                output_1: { connections: [{ node: '8', output: 'input_1' }] },
                output_2: { connections: [{ node: '9', output: 'input_1' }] }
              },
              pos_x: 250,
              pos_y: 500
            },
            '8': {
              id: 8,
              name: 'output',
              data: { expression: 'N + " is a PRIME number!"' },
              class: 'output',
              html: renderNodeHtml('output', { expression: 'N + " is a PRIME number!"' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '7', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '10', output: 'input_1' }] } },
              pos_x: 80,
              pos_y: 630
            },
            '9': {
              id: 9,
              name: 'output',
              data: { expression: 'N + " is NOT a prime number."' },
              class: 'output',
              html: renderNodeHtml('output', { expression: 'N + " is NOT a prime number."' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '7', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '10', output: 'input_1' }] } },
              pos_x: 420,
              pos_y: 630
            },
            '10': {
              id: 10,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: {
                input_1: {
                  connections: [
                    { node: '8', input: 'output_1' },
                    { node: '9', input: 'output_1' }
                  ]
                }
              },
              outputs: {},
              pos_x: 250,
              pos_y: 750
            }
          }
        }
      }
    }
  },

  allPrimesUpToN: {
    get name() { return I18n.t('samples.allPrimesUpToN'); },
    get description() { return I18n.t('sampleDescriptions.allPrimesUpToN'); },
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
              pos_y: 40
            },
            '2': {
              id: 2,
              name: 'input',
              data: { variableName: 'N', variablename: 'N' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'N' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 140
            },
            '3': {
              id: 3,
              name: 'assignment',
              data: { expression: 'adet = 0' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'adet = 0' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 240
            },
            '4': {
              id: 4,
              name: 'loop',
              data: { condition: 'I = 2, N, 1' },
              class: 'loop',
              html: renderNodeHtml('loop', { condition: 'I = 2, N, 1' }),
              typenode: false,
              inputs: {
                input_1: { connections: [{ node: '3', input: 'output_1' }] },
                input_2: {
                  connections: [
                    { node: '10', input: 'output_1' },
                    { node: '8', input: 'output_2' }
                  ]
                }
              },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] },
                output_2: { connections: [{ node: '11', output: 'input_1' }] }
              },
              pos_x: 250,
              pos_y: 340
            },
            '5': {
              id: 5,
              name: 'assignment',
              data: { expression: 'asal = true' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'asal = true' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 540,
              pos_y: 340
            },
            '6': {
              id: 6,
              name: 'loop',
              data: { condition: 'J = 2, I - 1, 1' },
              class: 'loop',
              html: renderNodeHtml('loop', { condition: 'J = 2, I - 1, 1' }),
              typenode: false,
              inputs: {
                input_1: { connections: [{ node: '5', input: 'output_1' }] },
                input_2: {
                  connections: [
                    { node: '7', input: 'output_2' },
                    { node: '12', input: 'output_1' }
                  ]
                }
              },
              outputs: {
                output_1: { connections: [{ node: '7', output: 'input_1' }] },
                output_2: { connections: [{ node: '8', output: 'input_1' }] }
              },
              pos_x: 540,
              pos_y: 460
            },
            '7': {
              id: 7,
              name: 'decision',
              data: { condition: 'I % J == 0' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'I % J == 0' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '6', input: 'output_1' }] } },
              outputs: {
                output_1: { connections: [{ node: '12', output: 'input_1' }] }, // True -> set false
                output_2: { connections: [{ node: '6', output: 'input_2' }] }    // False -> continue inner loop
              },
              pos_x: 820,
              pos_y: 460
            },
            '12': {
              id: 12,
              name: 'assignment',
              data: { expression: 'asal = false' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'asal = false' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '7', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_2' }] } },
              pos_x: 820,
              pos_y: 590
            },
            '8': {
              id: 8,
              name: 'decision',
              data: { condition: 'asal' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'asal' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '6', input: 'output_2' }] } },
              outputs: {
                output_1: { connections: [{ node: '9', output: 'input_1' }] }, // True -> increment & print
                output_2: { connections: [{ node: '4', output: 'input_2' }] }   // False -> outer loopback
              },
              pos_x: 540,
              pos_y: 600
            },
            '9': {
              id: 9,
              name: 'assignment',
              data: { expression: 'adet = adet + 1' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'adet = adet + 1' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '8', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '10', output: 'input_1' }] } },
              pos_x: 360,
              pos_y: 720
            },
            '10': {
              id: 10,
              name: 'output',
              data: { expression: '"Prime #" + adet + ": " + I' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Prime #" + adet + ": " + I' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '9', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_2' }] } },
              pos_x: 360,
              pos_y: 840
            },
            '11': {
              id: 11,
              name: 'output',
              data: { expression: '"Total primes found: " + adet' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Total primes found: " + adet' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '13', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 890
            },
            '13': {
              id: 13,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '11', input: 'output_1' }] } },
              outputs: {},
              pos_x: 250,
              pos_y: 1000
            }
          }
        }
      }
    }
  },

  fibonacci: {
    get name() { return I18n.t('samples.fibonacci'); },
    get description() { return I18n.t('sampleDescriptions.fibonacci'); },
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
              name: 'input',
              data: { variableName: 'N', variablename: 'N' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'N' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 130
            },
            '3': {
              id: 3,
              name: 'assignment',
              data: { expression: 'a = 0\nb = 1' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'a = 0\nb = 1' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 230
            },
            '4': {
              id: 4,
              name: 'loop',
              data: { condition: 'i = 1, N, 1' },
              class: 'loop',
              html: renderNodeHtml('loop', { condition: 'i = 1, N, 1' }),
              typenode: false,
              inputs: {
                input_1: { connections: [{ node: '3', input: 'output_1' }] },
                input_2: { connections: [{ node: '6', input: 'output_1' }] }
              },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] },
                output_2: { connections: [{ node: '7', output: 'input_1' }] }
              },
              pos_x: 250,
              pos_y: 350
            },
            '5': {
              id: 5,
              name: 'output',
              data: { expression: '"Fib #" + i + ": " + a' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"Fib #" + i + ": " + a' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 520,
              pos_y: 350
            },
            '6': {
              id: 6,
              name: 'assignment',
              data: { expression: 'next = a + b\na = b\nb = next' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'next = a + b\na = b\nb = next' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '4', output: 'input_2' }] } },
              pos_x: 520,
              pos_y: 470
            },
            '7': {
              id: 7,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_2' }] } },
              outputs: {},
              pos_x: 250,
              pos_y: 500
            }
          }
        }
      }
    }
  },

  gcdEuclideanSubtraction: {
    get name() { return I18n.t('samples.gcdEuclideanSubtraction'); },
    get description() { return I18n.t('sampleDescriptions.gcdEuclideanSubtraction'); },
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
              name: 'input',
              data: { variableName: 'a, b', variablename: 'a, b' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'a, b' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 130
            },
            '3': {
              id: 3,
              name: 'decision',
              data: { condition: 'a != b' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'a != b' }),
              typenode: false,
              inputs: {
                input_1: {
                  connections: [
                    { node: '2', input: 'output_1' },
                    { node: '5', input: 'output_1' },
                    { node: '6', input: 'output_1' }
                  ]
                }
              },
              outputs: {
                output_1: { connections: [{ node: '4', output: 'input_1' }] }, // True (Left) -> check a > b
                output_2: { connections: [{ node: '7', output: 'input_1' }] }  // False (Right) -> output GCD
              },
              pos_x: 250,
              pos_y: 250
            },
            '4': {
              id: 4,
              name: 'decision',
              data: { condition: 'a > b' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'a > b' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: {
                output_1: { connections: [{ node: '5', output: 'input_1' }] }, // True -> a = a - b
                output_2: { connections: [{ node: '6', output: 'input_1' }] }  // False -> b = b - a
              },
              pos_x: 100,
              pos_y: 380
            },
            '5': {
              id: 5,
              name: 'assignment',
              data: { expression: 'a = a - b' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'a = a - b' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 10,
              pos_y: 500
            },
            '6': {
              id: 6,
              name: 'assignment',
              data: { expression: 'b = b - a' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'b = b - a' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '4', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 200,
              pos_y: 500
            },
            '7': {
              id: 7,
              name: 'output',
              data: { expression: '"GCD (EBOB): " + a' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"GCD (EBOB): " + a' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '8', output: 'input_1' }] } },
              pos_x: 430,
              pos_y: 380
            },
            '8': {
              id: 8,
              name: 'end',
              data: {},
              class: 'end',
              html: renderNodeHtml('end', {}),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '7', input: 'output_1' }] } },
              outputs: {},
              pos_x: 250,
              pos_y: 620
            }
          }
        }
      }
    }
  },

  gcdEuclidean: {
    get name() { return I18n.t('samples.gcdEuclidean'); },
    get description() { return I18n.t('sampleDescriptions.gcdEuclidean'); },
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
              name: 'input',
              data: { variableName: 'a, b', variablename: 'a, b' },
              class: 'input',
              html: renderNodeHtml('input', { variableName: 'a, b' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 250,
              pos_y: 130
            },
            '3': {
              id: 3,
              name: 'decision',
              data: { condition: 'b != 0' },
              class: 'decision',
              html: renderNodeHtml('decision', { condition: 'b != 0' }),
              typenode: false,
              inputs: {
                input_1: {
                  connections: [
                    { node: '2', input: 'output_1' },
                    { node: '4', input: 'output_1' }
                  ]
                }
              },
              outputs: {
                output_1: { connections: [{ node: '4', output: 'input_1' }] }, // True -> compute remainder swap
                output_2: { connections: [{ node: '5', output: 'input_1' }] }  // False -> output GCD
              },
              pos_x: 250,
              pos_y: 250
            },
            '4': {
              id: 4,
              name: 'assignment',
              data: { expression: 'temp = b\nb = a % b\na = temp' },
              class: 'assignment',
              html: renderNodeHtml('assignment', { expression: 'temp = b\nb = a % b\na = temp' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } },
              outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } },
              pos_x: 80,
              pos_y: 380
            },
            '5': {
              id: 5,
              name: 'output',
              data: { expression: '"GCD (EBOB): " + a' },
              class: 'output',
              html: renderNodeHtml('output', { expression: '"GCD (EBOB): " + a' }),
              typenode: false,
              inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } },
              outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } },
              pos_x: 430,
              pos_y: 380
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
              pos_x: 250,
              pos_y: 530
            }
          }
        }
      }
    }
  }
};
