/**
 * Tests for PlanCreator component.
 *
 * PlanCreator allows users to create a workout plan with a title and exercises.
 * Exercises can be added from an external API (wger.de) or as custom entries.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanCreator from '../../components/PlanCreator/PlanCreator';

describe('PlanCreator component', () => {
    const onSaved = vi.fn();

    beforeEach(() => {
        localStorage.setItem('token', 'valid-token');
        onSaved.mockClear();
    });

    it('should render title input and exercise search input', () => {
        // GIVEN: Component renders
        render(<PlanCreator onSaved={onSaved} />);

        // WHEN: Looking at the form
        // THEN: Title input and exercise search input are present
        expect(screen.getByPlaceholderText('e.g. Full Body Workout Monday')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search exercise database or type custom...')).toBeInTheDocument();
    });

    it('should render "New Workout Plan" heading', () => {
        // GIVEN: Component renders
        render(<PlanCreator onSaved={onSaved} />);

        // WHEN: Looking at the header
        // THEN: Heading is visible
        expect(screen.getByText('New Workout Plan')).toBeInTheDocument();
    });

    it('should disable "Add custom" button when query is empty', () => {
        // GIVEN: Query is empty
        render(<PlanCreator onSaved={onSaved} />);

        // WHEN: Looking at Add custom button
        // THEN: It is disabled
        expect(screen.getByText('Add custom')).toBeDisabled();
    });

    it('should enable "Add custom" button when query has text', async () => {
        // GIVEN: Component renders
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        // WHEN: User types in exercise search
        await user.type(
            screen.getByPlaceholderText('Search exercise database or type custom...'),
            'Push-ups'
        );

        // THEN: "Add custom" button is enabled
        expect(screen.getByText('Add custom')).not.toBeDisabled();
    });

    it('should add a custom exercise to the list when "Add custom" is clicked', async () => {
        // GIVEN: User typed "Push-ups"
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        await user.type(
            screen.getByPlaceholderText('Search exercise database or type custom...'),
            'Push-ups'
        );

        // WHEN: "Add custom" clicked
        await user.click(screen.getByText('Add custom'));

        // THEN: "Push-ups" appears in the exercise list with default reps
        expect(screen.getByText('Push-ups')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3x12')).toBeInTheDocument();
    });

    it('should clear query after adding exercise', async () => {
        // GIVEN: User typed an exercise name
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Squats');
        await user.click(screen.getByText('Add custom'));

        // WHEN: Exercise is added
        // THEN: Query input is cleared
        expect(input).toHaveValue('');
    });

    it('should remove exercise when ✕ button is clicked', async () => {
        // GIVEN: Exercise list has an item
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        // Add two exercises
        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Push-ups');
        await user.click(screen.getByText('Add custom'));
        await user.type(input, 'Squats');
        await user.click(screen.getByText('Add custom'));

        expect(screen.getByText('Push-ups')).toBeInTheDocument();
        expect(screen.getByText('Squats')).toBeInTheDocument();

        // WHEN: ✕ clicked on first item
        const removeButtons = screen.getAllByText('✕');
        await user.click(removeButtons[0]);

        // THEN: Only second item remains
        expect(screen.queryByText('Push-ups')).not.toBeInTheDocument();
        expect(screen.getByText('Squats')).toBeInTheDocument();
    });

    it('should update reps when reps input changes', async () => {
        // GIVEN: Exercise with default reps "3x12"
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Bench Press');
        await user.click(screen.getByText('Add custom'));

        // WHEN: User changes reps
        const repsInput = screen.getByDisplayValue('3x12');
        await user.clear(repsInput);
        await user.type(repsInput, '4x8');

        // THEN: Reps value is "4x8"
        expect(repsInput).toHaveValue('4x8');
    });

    it('should disable "Save plan to library" when no exercises added', () => {
        // GIVEN: No exercises
        render(<PlanCreator onSaved={onSaved} />);

        // WHEN: Looking at save button
        // THEN: It is disabled
        expect(screen.getByText('Save plan to library')).toBeDisabled();
    });

    it('should show alert when saving without title', async () => {
        // GIVEN: Exercise added but no title
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Squats');
        await user.click(screen.getByText('Add custom'));

        // WHEN: Save button clicked
        await user.click(screen.getByText('Save plan to library'));

        // THEN: Alert shown
        expect(window.alert).toHaveBeenCalledWith('Please enter a plan title!');
    });

    it('should call fetch POST /api/plans with title and exercises on save', async () => {
        // GIVEN: Title and exercises are set
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        // Set title
        await user.type(
            screen.getByPlaceholderText('e.g. Full Body Workout Monday'),
            'Leg Day'
        );

        // Add exercise
        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Squats');
        await user.click(screen.getByText('Add custom'));

        // Mock fetch for save
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 42 }),
        } as Response);

        // WHEN: "Save plan to library" clicked
        await user.click(screen.getByText('Save plan to library'));

        // THEN: fetch POST /api/plans with correct payload
        await waitFor(() => {
            const saveCalls = vi.mocked(fetch).mock.calls.filter(
                c => typeof c[0] === 'string' && c[0] === 'http://localhost:3000/api/plans'
            );
            expect(saveCalls.length).toBe(1);
            expect(saveCalls[0][1]?.method).toBe('POST');

            const body = JSON.parse(saveCalls[0][1]?.body as string);
            expect(body.title).toBe('Leg Day');
            expect(body.exercises).toHaveLength(1);
            expect(body.exercises[0].name).toBe('Squats');
        });
    });

    it('should call onSaved callback with plan ID on success', async () => {
        // GIVEN: Plan saved successfully
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        await user.type(
            screen.getByPlaceholderText('e.g. Full Body Workout Monday'),
            'My Plan'
        );

        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Push-ups');
        await user.click(screen.getByText('Add custom'));

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 42 }),
        } as Response);

        // WHEN: Save clicked
        await user.click(screen.getByText('Save plan to library'));

        // THEN: onSaved called with plan ID
        await waitFor(() => {
            expect(onSaved).toHaveBeenCalledWith(42);
        });
    });

    it('should reset form after successful save', async () => {
        // GIVEN: Plan saved
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        await user.type(
            screen.getByPlaceholderText('e.g. Full Body Workout Monday'),
            'My Plan'
        );

        const exerciseInput = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(exerciseInput, 'Push-ups');
        await user.click(screen.getByText('Add custom'));

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 42 }),
        } as Response);

        // WHEN: Save succeeds
        await user.click(screen.getByText('Save plan to library'));

        // THEN: Form is reset
        await waitFor(() => {
            expect(screen.getByPlaceholderText('e.g. Full Body Workout Monday')).toHaveValue('');
        });
    });

    it('should show "Saving..." and disable button while saving', async () => {
        // GIVEN: Plan ready to save
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        await user.type(
            screen.getByPlaceholderText('e.g. Full Body Workout Monday'),
            'Test'
        );

        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Ex');
        await user.click(screen.getByText('Add custom'));

        // Never-resolving promise
        vi.mocked(fetch).mockReturnValueOnce(new Promise(() => { }));

        // WHEN: Save clicked
        await user.click(screen.getByText('Save plan to library'));

        // THEN: "Saving..." shown and disabled
        await waitFor(() => {
            expect(screen.getByText('Saving...')).toBeDisabled();
        });
    });

    it('should show error alert when save fails', async () => {
        // GIVEN: Plan ready to save, but server fails
        render(<PlanCreator onSaved={onSaved} />);
        const user = userEvent.setup();

        await user.type(
            screen.getByPlaceholderText('e.g. Full Body Workout Monday'),
            'Test'
        );

        const input = screen.getByPlaceholderText('Search exercise database or type custom...');
        await user.type(input, 'Ex');
        await user.click(screen.getByText('Add custom'));

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Title already exists' }),
        } as Response);

        // WHEN: Save clicked
        await user.click(screen.getByText('Save plan to library'));

        // THEN: Error alert shown
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Title already exists');
        });
    });
});
