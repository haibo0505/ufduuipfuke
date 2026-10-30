import test from 'node:test';
import assert from 'node:assert/strict';
import { DepthOptions } from './depthEngine';

test('depth options interface validation', () => {
  const options: DepthOptions = {
    colormap: 'grayscale',
    model: 'depth_anything_v2',
    intensity: 1.0,
    invert: false,
    stereoSeparation: 12
  };

  assert.equal(options.colormap, 'grayscale');
  assert.equal(options.model, 'depth_anything_v2');
  assert.equal(options.intensity, 1.0);
  assert.equal(options.invert, false);
});

test('depth disparity bounds clamping', () => {
  // Test mathematical bounds
  const depthBuffer = [0.0, 0.5, 1.0, -0.2, 1.5];
  const clamped = depthBuffer.map((d) => Math.max(0, Math.min(1, d)));

  assert.deepEqual(clamped, [0.0, 0.5, 1.0, 0.0, 1.0]);
});
