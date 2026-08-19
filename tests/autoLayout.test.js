import { describe, it, expect } from 'vitest';
import { AutoLayout } from '../src/ui/AutoLayout.js';

describe('AutoLayout', () => {
  it('should layout linear flowchart nodes along a single vertical axis', () => {
    const rawData = {
      drawflow: {
        Home: {
          data: {
            '1': { id: 1, name: 'start', outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 0, pos_y: 0 },
            '2': { id: 2, name: 'assignment', outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 999, pos_y: 999 },
            '3': { id: 3, name: 'end', outputs: {}, pos_x: -100, pos_y: -100 }
          }
        }
      }
    };

    const result = AutoLayout.layout(rawData, { startX: 300, startY: 50, verticalSpacing: 120 });
    const nodes = result.drawflow.Home.data;

    expect(nodes['1'].pos_x).toBe(300);
    expect(nodes['1'].pos_y).toBe(50);

    expect(nodes['2'].pos_x).toBe(300);
    expect(nodes['2'].pos_y).toBe(170);

    expect(nodes['3'].pos_x).toBe(300);
    expect(nodes['3'].pos_y).toBe(290);
  });

  it('should layout decision branches with symmetric left and right columns', () => {
    const rawData = {
      drawflow: {
        Home: {
          data: {
            '1': { id: 1, name: 'start', outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } } },
            '2': {
              id: 2,
              name: 'decision',
              outputs: {
                output_1: { connections: [{ node: '3', output: 'input_1' }] }, // True (Left)
                output_2: { connections: [{ node: '4', output: 'input_1' }] }  // False (Right)
              }
            },
            '3': { id: 3, name: 'output', outputs: {} },
            '4': { id: 4, name: 'output', outputs: {} }
          }
        }
      }
    };

    const result = AutoLayout.layout(rawData, { startX: 300, startY: 50, verticalSpacing: 100, branchSpacing: 200 });
    const nodes = result.drawflow.Home.data;

    expect(nodes['1'].pos_x).toBe(300);
    expect(nodes['2'].pos_x).toBe(300);

    // True branch to the left
    expect(nodes['3'].pos_x).toBe(100);
    expect(nodes['3'].pos_y).toBe(250);

    // False branch to the right
    expect(nodes['4'].pos_x).toBe(500);
    expect(nodes['4'].pos_y).toBe(250);
  });
});
