import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    // Campaign simulations are CPU work with bounded rounds and attempts.
    // Avoid launching every era at once and timing out on slower computers.
    maxWorkers: 4,
    testTimeout: 15000
  }
});
