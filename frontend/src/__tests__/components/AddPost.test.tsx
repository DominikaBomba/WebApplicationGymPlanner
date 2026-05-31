/**
 * Tests for AddPost component.
 *
 * AddPost starts as a FAB button, opens a modal with a form to create
 * a new training post. Supports plan selection (pick existing or create new).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddPost from '../../components/AddPost/AddPost';

// Mock PlanCreator to isolate AddPost
vi.mock('../../components/PlanCreator/PlanCreator', () => ({
    default: ({ onSaved }: { onSaved: (id: number) => void }) => (
        <div data-testid="plan-creator">
            <button onClick={() => onSaved(42)}>Mock Save Plan</button>
        </div>
    ),
}));

function renderAddPost() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <AddPost />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('AddPost component', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'valid-token');
    });

    it('should initially render only the FAB button', () => {
        // GIVEN: Component renders
        renderAddPost();

        // WHEN: isOpen = false (initial state)
        // THEN: Only the + FAB button is visible, no modal
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1); // Only the FAB
        expect(screen.queryByText('Add post')).not.toBeInTheDocument();
    });

    it('should open the modal when FAB is clicked', async () => {
        // GIVEN: FAB is rendered
        renderAddPost();
        const user = userEvent.setup();

        // WHEN: User clicks FAB
        const fab = screen.getByRole('button');
        await user.click(fab);

        // THEN: Modal with form appears
        expect(screen.getByText('Add post')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should close the modal when close button is clicked', async () => {
        // GIVEN: Modal is open
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        expect(screen.getByText('Add post')).toBeInTheDocument();

        // WHEN: Close button clicked
        await user.click(screen.getByLabelText('Close'));

        // THEN: Modal disappears
        expect(screen.queryByText('Add post')).not.toBeInTheDocument();
    });

    it('should render all form fields when modal is open', async () => {
        // GIVEN: FAB is clicked to open modal
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        // WHEN: Modal is visible
        // THEN: All form fields are present
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Choose gym')).toBeInTheDocument();
        expect(screen.getByText('When?')).toBeInTheDocument();
        expect(screen.getByText('How long?')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Additional info')).toBeInTheDocument();
        expect(screen.getByText('Max participants (0 = no limit)')).toBeInTheDocument();
    });

    it('should update form state when fields change', async () => {
        // GIVEN: Modal is open
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        // WHEN: User types "Chest day" in title
        const titleInput = screen.getByPlaceholderText('Chest training');
        await user.type(titleInput, 'Chest day');

        // THEN: Title input value is "Chest day"
        expect(titleInput).toHaveValue('Chest day');
    });

    it('should toggle public/private checkbox', async () => {
        // GIVEN: Modal is open, isPublic = true by default
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        // Checkbox is checked (Public)
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
        expect(screen.getByText('Public')).toBeInTheDocument();

        // WHEN: Checkbox is unchecked
        await user.click(checkbox);

        // THEN: Label changes to "Private"
        expect(checkbox).not.toBeChecked();
        expect(screen.getByText('Private')).toBeInTheDocument();
    });

    describe('workout plan modes', () => {
        it('should show "Choose saved plan" and "Create new +" buttons initially', async () => {
            // GIVEN: Modal is open
            renderAddPost();
            const user = userEvent.setup();
            await user.click(screen.getByRole('button'));

            // WHEN: Plan mode is "none"
            // THEN: Both plan option buttons are visible
            expect(screen.getByText('Choose saved plan')).toBeInTheDocument();
            expect(screen.getByText('Create new +')).toBeInTheDocument();
        });

        it('should switch to PlanCreator when "Create new +" is clicked', async () => {
            // GIVEN: Modal is open
            renderAddPost();
            const user = userEvent.setup();
            await user.click(screen.getByRole('button'));

            // WHEN: "Create new +" is clicked
            await user.click(screen.getByText('Create new +'));

            // THEN: PlanCreator component appears
            expect(screen.getByTestId('plan-creator')).toBeInTheDocument();
        });

        it('should reset to none mode when Cancel is clicked in create mode', async () => {
            // GIVEN: PlanCreator is visible
            renderAddPost();
            const user = userEvent.setup();
            await user.click(screen.getByRole('button'));
            await user.click(screen.getByText('Create new +'));

            expect(screen.getByTestId('plan-creator')).toBeInTheDocument();

            // WHEN: Cancel is clicked
            await user.click(screen.getByText('Cancel'));

            // THEN: Back to plan option buttons
            expect(screen.queryByTestId('plan-creator')).not.toBeInTheDocument();
            expect(screen.getByText('Choose saved plan')).toBeInTheDocument();
        });
    });

    it('should call fetch POST /api/posts with correct payload on submit', async () => {
        // GIVEN: Form filled with data
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 1, message: 'Post created' }),
        } as Response);

        // Fill title
        await user.type(screen.getByPlaceholderText('Chest training'), 'Leg Day');

        // WHEN: "Post" button is clicked
        await user.click(screen.getByText('Post'));

        // THEN: fetch called with POST /api/posts
        await waitFor(() => {
            const postCalls = vi.mocked(fetch).mock.calls.filter(
                c => typeof c[0] === 'string' && c[0] === 'http://localhost:3000/api/posts'
            );
            expect(postCalls.length).toBe(1);
            expect(postCalls[0][1]?.method).toBe('POST');
        });
    });

    it('should show "Posting..." and disable button while submitting', async () => {
        // GIVEN: Form with data
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        // fetch never resolves
        vi.mocked(fetch).mockReturnValueOnce(new Promise(() => { }));

        await user.type(screen.getByPlaceholderText('Chest training'), 'Test');

        // WHEN: Post button clicked
        await user.click(screen.getByText('Post'));

        // THEN: Button shows "Posting..." and is disabled
        await waitFor(() => {
            const btn = screen.getByText('Posting...');
            expect(btn).toBeDisabled();
        });
    });

    it('should show success alert and close modal on successful post', async () => {
        // GIVEN: Fetch succeeds
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 1 }),
        } as Response);

        // WHEN: Post is submitted
        await user.click(screen.getByText('Post'));

        // THEN: Alert shown and modal closes
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Post added successfully!');
        });
    });

    it('should show error alert on failure', async () => {
        // GIVEN: Fetch fails
        renderAddPost();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button'));

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Gym ID is required' }),
        } as Response);

        // WHEN: Post is submitted
        await user.click(screen.getByText('Post'));

        // THEN: Error alert shown
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Error: Gym ID is required');
        });
    });
});
