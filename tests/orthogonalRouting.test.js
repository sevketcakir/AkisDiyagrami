import { describe, it, expect } from 'vitest';
import {
  buildOrthogonalPath,
  createFilletedPath,
  cleanPoints,
  getPortDirection,
  routeOrthogonalConnection
} from '../src/ui/CanvasManager.js';

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
    // Clears below bottom of process at 425 + 25 = 450
    expect(path).toContain('450');
    expect(path).toContain('450 421');
  });

  it('should generate a clean rectangular corridor path for loopback return wires returning upward', () => {
    // Return upward: source (540, 500) -> target (380, 250)
    const pathLoopback = buildOrthogonalPath(540, 500, 380, 250);
    expect(pathLoopback).toContain('M 540 500');
    expect(pathLoopback).toContain('330'); // Corridor X
    expect(pathLoopback).toContain('380 250');
  });

  describe('cleanPoints utility', () => {
    it('should eliminate redundant collinear points and duplicates', () => {
      const raw = [
        { x: 100, y: 50 },
        { x: 150, y: 50 },
        { x: 200, y: 50 }, // Collinear horizontal
        { x: 200, y: 50 }, // Duplicate
        { x: 200, y: 120 }
      ];
      const cleaned = cleanPoints(raw);
      expect(cleaned).toHaveLength(3);
      expect(cleaned[0]).toEqual({ x: 100, y: 50 });
      expect(cleaned[1]).toEqual({ x: 200, y: 50 });
      expect(cleaned[2]).toEqual({ x: 200, y: 120 });
    });
  });

  describe('getPortDirection mapping', () => {
    it('should correctly determine port normal vectors', () => {
      expect(getPortDirection('decision', 'output_1', true)).toBe('west');  // True = Left
      expect(getPortDirection('decision', 'output_2', true)).toBe('east');  // False = Right
      expect(getPortDirection('decision', 'input_1', false)).toBe('north'); // Top

      expect(getPortDirection('loop', 'output_1', true)).toBe('east');      // Body = Right
      expect(getPortDirection('loop', 'output_2', true)).toBe('south');     // Exit = Bottom
      expect(getPortDirection('loop', 'input_1', false)).toBe('north');     // Entry = Top
      expect(getPortDirection('loop', 'input_2', false)).toBe('east');      // Loopback = Right

      expect(getPortDirection('assignment', 'output_1', true)).toBe('south');
      expect(getPortDirection('assignment', 'input_1', false)).toBe('north');
    });
  });

  describe('routeOrthogonalConnection with port orientations', () => {
    it('should route Decision True (West) to target North cleanly without zig-zag', () => {
      // Decision at (1230, 880) True branch -> Process at (975, 950)
      const path = routeOrthogonalConnection(1230, 880, 975, 950, 'west', 'north');
      expect(path).toContain('M 1230 880');
      expect(path).toContain('975 880'); // Horizontal to target axis
      expect(path).toContain('975 950'); // Drops down into top port
    });

    it('should route loopback return wire into Loop input_2 approaching from the right outside corridor', () => {
      // Process at (880, 800) returning to Loop input_2 at (440, 480)
      const path = routeOrthogonalConnection(880, 800, 440, 480, 'south', 'east', { connIndex: 0 });
      expect(path).toContain('M 880 800');
      // Drops below source
      expect(path).toContain('820');
      // Corridor to the right of loop port (440 + 30 = 470)
      expect(path).toContain('470');
      // Enters horizontally into (440, 480)
      expect(path).toContain('440 480');
    });

    it('should apply bus corridor separation for multiple return wires into loop input_2', () => {
      const wire0 = routeOrthogonalConnection(880, 800, 440, 480, 'south', 'east', { connIndex: 0 });
      const wire1 = routeOrthogonalConnection(575, 870, 440, 480, 'east', 'east', { connIndex: 1 });

      // Wire 0 uses corridor 440 + 30 = 470
      expect(wire0).toContain('470');
      // Wire 1 uses corridor 440 + 30 + 16 = 486
      expect(wire1).toContain('486');
    });

    it('should route Decision False returning to Loop input_2 around the Decision block without collision', () => {
      // Decision False (1424, 879) -> Loop input_2 (775, 784)
      const path = routeOrthogonalConnection(1424, 879, 775, 784, 'east', 'east', { connIndex: 0 });
      expect(path).toContain('M 1424 879');
      // Enters horizontally into loop input_2 (775, 784)
      expect(path).toContain('775 784');
      // Corridor to right of target (775 + 30 = 805)
      expect(path).toContain('805');
    });

    it('should route Decision True to target North cleanly when target is level or higher', () => {
      // Decision True at (1234, 879) -> Process top at (977, 755)
      const path = routeOrthogonalConnection(1234, 879, 977, 755, 'west', 'north');
      expect(path).toContain('M 1234 879');
      expect(path).toContain('977 755');
    });
  });
});
