/**
 * Global test setup for the frontend test suite.
 *
 * - Imports @testing-library/jest-dom matchers (toBeInTheDocument, toBeDisabled, etc.)
 * - Mocks global fetch
 * - Mocks localStorage
 * - Cleans up after each test
 */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Clean up rendered components after each test
afterEach(() => {
    cleanup();
});

// ── Global fetch mock ────────────────────────────────
// Each test can override: vi.mocked(fetch).mockResolvedValue(...)
const fetchMock = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    } as Response)
);

vi.stubGlobal('fetch', fetchMock);

// ── window.alert / confirm mocks ─────────────────────
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('confirm', vi.fn(() => true));

// ── URL.createObjectURL stub ─────────────────────────
if (typeof URL.createObjectURL === 'undefined') {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}

// ── Reset mocks between tests ────────────────────────
afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});
