/**
 * Tests for Filter component.
 *
 * The Filter is a controlled component: it receives `filters` state
 * and calls `onChange` when the user interacts with filter controls.
 * No API calls — purely input/output testing.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Filter from '../../components/Filter/Filter';
import { defaultFilters, type FilterState } from '../../types/filters';

describe('Filter component', () => {
    const onChange = vi.fn();

    const renderFilter = (filters: FilterState = defaultFilters) => {
        onChange.mockClear();
        return render(<Filter filters={filters} onChange={onChange} />);
    };

    it('should render city input, date inputs, level pills, and sort select', () => {
        // GIVEN: Default filters
        // WHEN: Component renders
        renderFilter();

        // THEN: All filter controls are present
        expect(screen.getByPlaceholderText('e.g. Warsaw')).toBeInTheDocument();
        expect(screen.getAllByDisplayValue('')).toBeTruthy(); // date inputs
        expect(screen.getByText('BEGINNER')).toBeInTheDocument();
        expect(screen.getByText('MID')).toBeInTheDocument();
        expect(screen.getByText('ADVANCED')).toBeInTheDocument();
        expect(screen.getByText('PRO')).toBeInTheDocument();
        expect(screen.getByText('Sort by')).toBeInTheDocument();
    });

    it('should call onChange with updated city when user types in city input', () => {
        // GIVEN: Filters with city=""
        renderFilter();

        // WHEN: User types "Warsaw" into the city input
        fireEvent.change(screen.getByPlaceholderText('e.g. Warsaw'), {
            target: { value: 'Warsaw' },
        });

        // THEN: onChange called with city: "Warsaw"
        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, city: 'Warsaw' });
    });

    it('should toggle level pill ON when clicked', () => {
        // GIVEN: No levels selected
        renderFilter();

        // WHEN: User clicks "BEGINNER" pill
        fireEvent.click(screen.getByText('BEGINNER'));

        // THEN: onChange called with levels: ["BEGINNER"]
        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, levels: ['BEGINNER'] });
    });

    it('should toggle level pill OFF when already selected', () => {
        // GIVEN: BEGINNER is already selected
        renderFilter({ ...defaultFilters, levels: ['BEGINNER'] });

        // WHEN: User clicks "BEGINNER" again
        fireEvent.click(screen.getAllByText('BEGINNER')[0]);

        // THEN: onChange called with levels: []
        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, levels: [] });
    });

    it('should allow multiple levels to be selected', () => {
        // GIVEN: BEGINNER is already selected
        renderFilter({ ...defaultFilters, levels: ['BEGINNER'] });

        // WHEN: User clicks "PRO"
        fireEvent.click(screen.getAllByText('PRO')[0]);

        // THEN: onChange called with levels: ["BEGINNER", "PRO"]
        expect(onChange).toHaveBeenCalledWith({
            ...defaultFilters,
            levels: ['BEGINNER', 'PRO'],
        });
    });

    it('should change sort option when select value changes', () => {
        // GIVEN: sort = "latest"
        renderFilter();

        // WHEN: User selects "Soonest"
        const select = screen.getByDisplayValue('newest first');
        fireEvent.change(select, { target: { value: 'soonest' } });

        // THEN: onChange called with sort: "soonest"
        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, sort: 'soonest' });
    });

    it('should display active filter chips when filters are applied', () => {
        // GIVEN: city="Warsaw", levels=["PRO"], startDate="2026-01-01"
        renderFilter({
            ...defaultFilters,
            city: 'Warsaw',
            levels: ['PRO'],
            startDate: '2026-01-01',
        });

        // WHEN: Component renders
        // THEN: Chips are visible
        expect(screen.getByText('Warsaw')).toBeInTheDocument();
        // PRO appears as level pill AND as chip — use getAllByText
        expect(screen.getAllByText('PRO').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('From 2026-01-01')).toBeInTheDocument();
        expect(screen.getByText('Active:')).toBeInTheDocument();
    });

    it('should remove individual chip when × is clicked', () => {
        // GIVEN: city="Warsaw" chip is displayed
        renderFilter({ ...defaultFilters, city: 'Warsaw' });

        // WHEN: × on "Warsaw" chip is clicked
        const chipX = screen.getByText('×');
        fireEvent.click(chipX);

        // THEN: onChange called with city: ""
        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, city: '' });
    });

    it('should clear all filters when "Clear all" button is clicked', () => {
        // GIVEN: Multiple active filters
        renderFilter({
            city: 'Warsaw',
            levels: ['PRO'],
            startDate: '2026-01-01',
            endDate: '2026-06-30',
            sort: 'soonest',
        });

        // WHEN: "Clear all" clicked
        fireEvent.click(screen.getByText('Clear all'));

        // THEN: onChange called with defaultFilters
        expect(onChange).toHaveBeenCalledWith(defaultFilters);
    });

    it('should display endDate chip when endDate is set', () => {
        // GIVEN: endDate is set
        renderFilter({ ...defaultFilters, endDate: '2026-12-31' });

        // WHEN: Component renders
        // THEN: "To 2026-12-31" chip is visible
        expect(screen.getByText('To 2026-12-31')).toBeInTheDocument();
    });
});
