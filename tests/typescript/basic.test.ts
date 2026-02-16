/**
 * Basic tests to verify the project structure and imports.
 */

import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('should have vitest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should be able to import core types', async () => {
    const types = await import('../../src/types/index');
    expect(types).toBeDefined();
  });
});
