import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./src/__tests__/helpers/setup.ts'],
            include: ['src/__tests__/**/*.test.{ts,tsx}'],
            css: { modules: { classNameStrategy: 'non-scoped' } },
        },
    })
);
