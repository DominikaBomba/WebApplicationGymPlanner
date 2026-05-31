/**
 * Tests for filter types and default values.
 *
 * Verifies that the defaultFilters constant satisfies the FilterState
 * interface and has correct initial values.
 */
import { describe, it, expect } from 'vitest';
import { defaultFilters, type FilterState } from '../../types/filters';

describe('FilterState types and defaults', () => {
    it('should have correct defaultFilters values', () => {
        // GIVEN: defaultFilters is imported
        // WHEN: Inspected
        // THEN: All properties have correct initial values
        expect(defaultFilters.city).toBe('');
        expect(defaultFilters.levels).toEqual([]);
        expect(defaultFilters.startDate).toBe('');
        expect(defaultFilters.endDate).toBe('');
        expect(defaultFilters.sort).toBe('latest');
    });

    it('defaultFilters should have all required FilterState keys', () => {
        // GIVEN: defaultFilters
        // WHEN: Checking keys
        // THEN: All keys match FilterState
        const keys = Object.keys(defaultFilters);
        expect(keys).toContain('city');
        expect(keys).toContain('levels');
        expect(keys).toContain('startDate');
        expect(keys).toContain('endDate');
        expect(keys).toContain('sort');
        expect(keys.length).toBe(5);
    });

    it('defaultFilters.levels should be an empty array (not undefined)', () => {
        // GIVEN: defaultFilters
        // WHEN: Checking levels
        // THEN: It's an empty array
        expect(Array.isArray(defaultFilters.levels)).toBe(true);
        expect(defaultFilters.levels.length).toBe(0);
    });

    it('defaultFilters.sort should be a valid sort option', () => {
        // GIVEN: defaultFilters
        // WHEN: Checking sort value
        // THEN: It's one of the valid options
        const validSorts = ['latest', 'soonest', 'oldest'];
        expect(validSorts).toContain(defaultFilters.sort);
    });

    it('should allow creating a FilterState with custom values', () => {
        // GIVEN: A custom filter state
        const customFilter: FilterState = {
            city: 'Warsaw',
            levels: ['PRO', 'ADVANCED'],
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            sort: 'soonest',
        };

        // WHEN: Inspected
        // THEN: All values are correct
        expect(customFilter.city).toBe('Warsaw');
        expect(customFilter.levels).toEqual(['PRO', 'ADVANCED']);
        expect(customFilter.sort).toBe('soonest');
    });
});
