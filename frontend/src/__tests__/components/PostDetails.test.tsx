/**
 * Tests for PostDetails component.
 *
 * PostDetails is a modal that fetches and displays full post details
 * including author info, gym, training plan, and participants.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostDetails from '../../components/PostDetails/PostDetails';
import { mockPostDetails, mockFetchSuccess } from '../../__tests__/helpers/mocks';

describe('PostDetails component', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        localStorage.setItem('token', 'valid-token');
        onClose.mockClear();
    });

    it('should display loading state initially', () => {
        // GIVEN: fetch is pending
        vi.mocked(fetch).mockReturnValueOnce(new Promise(() => { }));

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: "Loading..." text is visible
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display post title and author info after loading', async () => {
        // GIVEN: fetch returns full post data
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Title and author info shown
        await waitFor(() => {
            expect(screen.getByText('Chest Training')).toBeInTheDocument();
            expect(screen.getAllByText('OtherUser').length).toBeGreaterThan(0);
            expect(screen.getByText('PRO')).toBeInTheDocument();
        });
    });

    it('should display "Public" badge for public posts', async () => {
        // GIVEN: Post with isPublic=true
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: "Public" badge shown
        await waitFor(() => {
            expect(screen.getByText('Public')).toBeInTheDocument();
        });
    });

    it('should display "Friends" badge for private posts', async () => {
        // GIVEN: Post with isPublic=false
        mockFetchSuccess({ ...mockPostDetails, isPublic: false });

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: "Friends" badge shown
        await waitFor(() => {
            expect(screen.getByText('Friends')).toBeInTheDocument();
        });
    });

    it('should display gym info (name, address, city)', async () => {
        // GIVEN: Post with gym data
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Gym info is displayed
        await waitFor(() => {
            expect(screen.getByText('IronHouse Gym')).toBeInTheDocument();
            expect(screen.getByText(/ul\. Siłowa 1/)).toBeInTheDocument();
        });
    });

    it('should display post description', async () => {
        // GIVEN: Post with description
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Description is displayed
        await waitFor(() => {
            expect(screen.getByText('Intense chest workout')).toBeInTheDocument();
        });
    });

    it('should display additional info when present', async () => {
        // GIVEN: Post with additionalInfo
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Additional info shown
        await waitFor(() => {
            expect(screen.getByText('Bring towel')).toBeInTheDocument();
        });
    });

    it('should display training plan with exercises when plan exists', async () => {
        // GIVEN: Post has trainingPlan with exercises
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Plan title and exercises listed
        await waitFor(() => {
            expect(screen.getByText(/Full Body Workout/)).toBeInTheDocument();
            expect(screen.getByText('Bench Press')).toBeInTheDocument();
            expect(screen.getByText('Squats')).toBeInTheDocument();
            expect(screen.getByText('Deadlift')).toBeInTheDocument();
        });
    });

    it('should NOT render training plan section when no plan attached', async () => {
        // GIVEN: Post without trainingPlan
        mockFetchSuccess({ ...mockPostDetails, trainingPlan: null });

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: No plan section
        await waitFor(() => {
            expect(screen.getByText('Chest Training')).toBeInTheDocument();
        });
        expect(screen.queryByText('Training plan')).not.toBeInTheDocument();
    });

    it('should display participant list with nicknames', async () => {
        // GIVEN: Post has 2 participants
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: 2 participants shown
        const label = await screen.findByTestId('participants-label');
        expect(label.textContent).toContain('2');
        expect(screen.getAllByText('OtherUser').length).toBeGreaterThan(0);
        expect(screen.getByText('ThirdUser')).toBeInTheDocument();
    });

    it('should show "No one has joined yet." when no participants', async () => {
        // GIVEN: Post with empty participants
        mockFetchSuccess({ ...mockPostDetails, participants: [] });

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Empty message shown
        await waitFor(() => {
            expect(screen.getByText('No one has joined yet.')).toBeInTheDocument();
        });
    });

    it('should call onClose when overlay is clicked', async () => {
        // GIVEN: Modal is open
        mockFetchSuccess(mockPostDetails);
        const { container } = render(<PostDetails postId={1} onClose={onClose} />);
        const user = userEvent.setup();

        await waitFor(() => {
            expect(screen.getByText('Chest Training')).toBeInTheDocument();
        });

        // WHEN: Overlay is clicked (outermost div)
        const overlay = container.firstChild as HTMLElement;
        await user.click(overlay);

        // THEN: onClose callback is called
        expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
        // GIVEN: Modal is open
        mockFetchSuccess(mockPostDetails);
        render(<PostDetails postId={1} onClose={onClose} />);

        await waitFor(() => {
            expect(screen.getByLabelText('Close')).toBeInTheDocument();
        });

        // WHEN: Close button clicked
        fireEvent.click(screen.getByLabelText('Close'));

        // THEN: onClose is called
        expect(onClose).toHaveBeenCalled();
    });

    it('should render gym website link when gym.link exists', async () => {
        // GIVEN: Post with gym that has a link
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Gym website link is rendered
        await waitFor(() => {
            const link = screen.getByText('Gym website');
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', 'https://ironhouse.example.com');
        });
    });

    it('should display training duration', async () => {
        // GIVEN: Post with training duration
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Duration is displayed (underscores replaced with spaces)
        await waitFor(() => {
            expect(screen.getByText(/FROM 1 TO 2 HOURS/)).toBeInTheDocument();
        });
    });

    it('should display participant count with slots info', async () => {
        // GIVEN: Post with 2 participants and max 5
        mockFetchSuccess(mockPostDetails);

        // WHEN: Component renders
        render(<PostDetails postId={1} onClose={onClose} />);

        // THEN: Slots info shown
        const slots = await screen.findByTestId('spots-taken');
        expect(slots.textContent).toContain('2');
        expect(slots.textContent).toContain('5');
    });
});
