import { describe, it, expect } from 'vitest';
import { buildOrthogonalPath } from '../src/ui/CanvasManager.js';

describe('Orthogonal Routing', () => {
  it('should generate a straight vertical line when nodes are vertically aligned', () => {
    const path = buildOrthogonalPath(280, 50, 280, 150);
    expect(path).toBe('M 280 50 L 280 150');
  });

  it('should generate a 90-degree orthogonal step for lateral branches', () => {
    const pathRight = buildOrthogonalPath(380, 200, 540, 320);
    expect(pathRight).toContain('M 380 200');
    expect(pathRight).toContain('L');
    expect(pathRight).toContain('Q'); // Smooth fillet corner
    expect(pathRight).toContain('540 320');

    const pathLeft = buildOrthogonalPath(180, 200, 80, 320);
    expect(pathLeft).toContain('M 180 200');
    expect(pathLeft).toContain('80 320');
  });

  it('should generate a clean rectangular outer gutter path for loopback return wires', () => {
    // Return upward: source (540, 350) -> target (380, 250)
    const pathLoopback = buildOrthogonalPath(540, 350, 380, 250);
    expect(pathLoopback).toContain('M 540 350');
    // Gutter at Math.max(540, 380) + 40 = 580
    expect(pathLoopback).toContain('580');
    expect(pathLoopback).toContain('380 250');
  });
});
