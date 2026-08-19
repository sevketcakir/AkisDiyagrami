import { describe, it, expect } from 'vitest';
import { buildOrthogonalPath, createFilletedPath } from '../src/ui/CanvasManager.js';

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

  it('should route Loop Body wire ABOVE the process node into its top input port', () => {
    // Loop body out (450, 354) -> Process top in (575, 335)
    const path = buildOrthogonalPath(450, 354, 575, 335);
    expect(path).toContain('M 450 354');
    // Clears above top of target at 335 - 25 = 310
    expect(path).toContain('310');
    expect(path).toContain('575 335');
  });

  it('should route Return Wire UNDER the process node into Loop In port', () => {
    // Process bottom out (575, 425) -> Loop in (450, 421)
    const path = buildOrthogonalPath(575, 425, 450, 421);
    expect(path).toContain('M 575 425');
    // Clears below bottom of process at 425 + 22 = 447
    expect(path).toContain('447');
    expect(path).toContain('450 421');
  });

  it('should generate a clean rectangular corridor path for loopback return wires returning upward', () => {
    // Return upward: source (540, 500) -> target (380, 250)
    const pathLoopback = buildOrthogonalPath(540, 500, 380, 250);
    expect(pathLoopback).toContain('M 540 500');
    expect(pathLoopback).toContain('405'); // Approach X corridor
    expect(pathLoopback).toContain('380 250');
  });
});
