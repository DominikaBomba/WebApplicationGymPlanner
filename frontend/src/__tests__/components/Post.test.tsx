/**
 * Tests for Post component.
 *
 * The Post component:
 * - Fetches posts based on feedType
 * - Filters posts by city, level, date range, upcoming-only, exclude-own
 * - Sorts posts (latest, soonest, oldest) with past posts pushed to end
 * - Handles join/leave actions
 * - Displays countdown labels for joined posts
 * - Opens PostDetails modal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Post from '../../components/Posts/Post';
import { mockUser, mockPost, mockPastPost, mockOwnPost, mockJoinedPost, mockFetchSuccess } from '../../__tests__/helpers/mocks';
import { defaultFilters } from '../../types/filters';

// Mock AuthContext
vi.mock('../../AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        loading: false,
        refreshUser: vi.fn(),
        logout: vi.fn(),
    }),
}));

// Mock PostDetails to isolate Post
vi.mock('../../components/PostDetails/PostDetails', () => ({
    default: ({ postId, onClose }: { postId: number; onClose: () => void }) => (
        <div data-testid="post-details">
            <span>Details for post {postId}</span>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

function renderPost(props: Partial<Parameters<typeof Post>[0]> = {}) {
    const defaultProps = {
        feedType: 'all' as const,
        ...props,
    };
    return render(
        <MemoryRouter>
            <Post {...defaultProps} />
        </MemoryRouter>
    );
}

describe('Post component', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'valid-token');
        vi.clearAllMocks();
    });

    // ─────────────────────────────────────────────────────
    // Data fetching
    // ─────────────────────────────────────────────────────
    describe('data fetching', () => {
        it('should fetch posts from /api/posts/all for feedType="all"', async () => {
            // GIVEN: feedType="all"
            mockFetchSuccess([mockPost]);

            // WHEN: Component mounts
            renderPost({ feedType: 'all' });

            // THEN: fetch called with /api/posts/all
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3000/api/posts/all',
                    expect.objectContaining({
                        headers: { Authorization: 'Bearer valid-token' },
                    })
                );
            });
        });

        it('should fetch from /api/posts/friends-feed for feedType="friends"', async () => {
            // GIVEN: feedType="friends"
            mockFetchSuccess([]);

            // WHEN: Component mounts
            renderPost({ feedType: 'friends' });

            // THEN: Correct URL used
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3000/api/posts/friends-feed',
                    expect.any(Object)
                );
            });
        });

        it('should fetch from /api/posts/joined for feedType="joined"', async () => {
            // GIVEN: feedType="joined"
            mockFetchSuccess([]);

            // WHEN: Component mounts
            renderPost({ feedType: 'joined' });

            // THEN: Correct URL used
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3000/api/posts/joined',
                    expect.any(Object)
                );
            });
        });

        it('should fetch from /api/posts/discover for feedType="discover"', async () => {
            // GIVEN: feedType="discover"
            mockFetchSuccess([]);

            // WHEN: Component mounts
            renderPost({ feedType: 'discover' });

            // THEN: Correct URL used
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3000/api/posts/discover',
                    expect.any(Object)
                );
            });
        });

        it('should fetch from /api/posts/{userId} for feedType="profile"', async () => {
            // GIVEN: feedType="profile" with userId=2
            mockFetchSuccess([]);

            // WHEN: Component mounts
            renderPost({ feedType: 'profile', userId: 2 });

            // THEN: Correct URL used
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3000/api/posts/2',
                    expect.any(Object)
                );
            });
        });

        it('should NOT fetch when feedType="profile" and userId is undefined', async () => {
            // GIVEN: feedType="profile" without userId

            // WHEN: Component mounts
            renderPost({ feedType: 'profile' });

            // THEN: fetch is NOT called for posts endpoint
            // (wait a tick to be sure)
            await new Promise(r => setTimeout(r, 100));
            const postCalls = vi.mocked(fetch).mock.calls.filter(
                c => typeof c[0] === 'string' && c[0].includes('/api/posts')
            );
            expect(postCalls.length).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────
    // Loading & empty states
    // ─────────────────────────────────────────────────────
    describe('loading and empty states', () => {
        it('should display "Loading sessions..." while fetching', () => {
            // GIVEN: fetch is pending (never resolves)
            vi.mocked(fetch).mockReturnValueOnce(new Promise(() => { }));

            // WHEN: Component renders
            renderPost();

            // THEN: Loading text is visible
            expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
        });

        it('should display "No active training sessions." when posts array is empty', async () => {
            // GIVEN: fetch returns empty array
            mockFetchSuccess([]);

            // WHEN: Component renders
            renderPost();

            // THEN: Empty message is shown
            await waitFor(() => {
                expect(screen.getByText('No active training sessions.')).toBeInTheDocument();
            });
        });
    });

    // ─────────────────────────────────────────────────────
    // Post card rendering
    // ─────────────────────────────────────────────────────
    describe('post card rendering', () => {
        it('should render post title, author nickname, gym name, and city', async () => {
            // GIVEN: fetch returns a post
            mockFetchSuccess([mockPost]);

            // WHEN: Component renders
            renderPost();

            // THEN: Post data is displayed
            await waitFor(() => {
                expect(screen.getByText('Chest Training')).toBeInTheDocument();
                expect(screen.getByText('OtherUser')).toBeInTheDocument();
                expect(screen.getByText(/IronHouse Gym/)).toBeInTheDocument();
            });
        });

        it('should display training duration label "1-2 hours" for FROM_1_TO_2_HOURS', async () => {
            // GIVEN: Post with trainingDuration="FROM_1_TO_2_HOURS"
            mockFetchSuccess([mockPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: "1-2 hours" is displayed
            await waitFor(() => {
                expect(screen.getByText('1-2 hours')).toBeInTheDocument();
            });
        });

        it('should map LESS_THAN_1_HOUR to "<1 hour"', async () => {
            // GIVEN: Post with LESS_THAN_1_HOUR duration
            mockFetchSuccess([{ ...mockPost, trainingDuration: 'LESS_THAN_1_HOUR' }]);

            // WHEN: Card renders
            renderPost();

            // THEN: "<1 hour" is displayed
            await waitFor(() => {
                expect(screen.getByText('<1 hour')).toBeInTheDocument();
            });
        });

        it('should map MORE_THAN_2_HOURS to ">2 hours"', async () => {
            // GIVEN: Post with unknown/MORE_THAN_2_HOURS duration
            mockFetchSuccess([{ ...mockPost, trainingDuration: 'MORE_THAN_2_HOURS' }]);

            // WHEN: Card renders
            renderPost();

            // THEN: ">2 hours" is displayed
            await waitFor(() => {
                expect(screen.getByText('>2 hours')).toBeInTheDocument();
            });
        });

        it('should display participant count and max slots', async () => {
            // GIVEN: Post with 0 participants, max 5
            mockFetchSuccess([mockPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: "0 / 5 spots" is shown
            await waitFor(() => {
                expect(screen.getByText('0 / 5 spots')).toBeInTheDocument();
            });
        });

        it('should display "Public" badge for public posts', async () => {
            // GIVEN: Post with isPublic=true
            mockFetchSuccess([mockPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: "Public" badge is shown
            await waitFor(() => {
                expect(screen.getByText('Public')).toBeInTheDocument();
            });
        });

        it('should display "Friends" badge for private posts', async () => {
            // GIVEN: Post with isPublic=false
            mockFetchSuccess([{ ...mockPost, isPublic: false }]);

            // WHEN: Card renders
            renderPost();

            // THEN: "Friends" badge is shown
            await waitFor(() => {
                expect(screen.getByText('Friends')).toBeInTheDocument();
            });
        });
    });

    // ─────────────────────────────────────────────────────
    // Filtering logic
    // ─────────────────────────────────────────────────────
    describe('filtering logic', () => {
        it('should filter posts by city (case-insensitive)', async () => {
            // GIVEN: Posts with cities ["Warsaw", "Kraków"]
            const krakPost = {
                ...mockPost, id: 10, gym: { ...mockPost.gym, city: 'Kraków', name: 'Fit Zone' },
            };
            mockFetchSuccess([mockPost, krakPost]);

            // WHEN: Filter with city="war"
            renderPost({
                filters: { ...defaultFilters, city: 'war' },
            });

            // THEN: Only Warsaw post is shown
            await waitFor(() => {
                expect(screen.getByText(/IronHouse Gym/)).toBeInTheDocument();
                expect(screen.queryByText(/Fit Zone/)).not.toBeInTheDocument();
            });
        });

        it('should filter posts by level', async () => {
            // GIVEN: Posts with user levels ["MID", "PRO"]
            const midPost = {
                ...mockPost, id: 10, user: { ...mockPost.user, level: 'MID', nickname: 'MidUser' },
            };
            mockFetchSuccess([mockPost, midPost]);

            // WHEN: Filter with levels=["PRO"]
            renderPost({
                filters: { ...defaultFilters, levels: ['PRO'] },
            });

            // THEN: Only PRO post shown
            await waitFor(() => {
                expect(screen.getByText('OtherUser')).toBeInTheDocument();
                expect(screen.queryByText('MidUser')).not.toBeInTheDocument();
            });
        });

        it('should exclude own posts when excludeOwn=true', async () => {
            // GIVEN: Mix of own and other posts
            mockFetchSuccess([mockPost, mockOwnPost]);

            // WHEN: excludeOwn=true
            renderPost({ excludeOwn: true });

            // THEN: Own post is not shown
            await waitFor(() => {
                expect(screen.getByText('Chest Training')).toBeInTheDocument();
                expect(screen.queryByText('My Training')).not.toBeInTheDocument();
            });
        });
    });

    // ─────────────────────────────────────────────────────
    // Sorting logic
    // ─────────────────────────────────────────────────────
    describe('sorting logic', () => {
        it('should push past posts to the end regardless of sort key', async () => {
            // GIVEN: Mix of past and future posts
            mockFetchSuccess([mockPastPost, mockPost]);

            // WHEN: Sorted (default = latest)
            renderPost();

            // THEN: Future posts come first in the DOM
            await waitFor(() => {
                const titles = screen.getAllByRole('heading', { level: 3 });
                expect(titles[0].textContent).toBe('Chest Training');
                expect(titles[1].textContent).toBe('Past Session');
            });
        });
    });

    // ─────────────────────────────────────────────────────
    // Post actions — Join/Leave
    // ─────────────────────────────────────────────────────
    describe('post actions', () => {
        it('should show "Join" button for non-owner, non-joined, non-past post', async () => {
            // GIVEN: Post by another user, not joined, not past
            mockFetchSuccess([mockPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: "Join" button is visible
            await waitFor(() => {
                expect(screen.getByText('Join')).toBeInTheDocument();
            });
        });

        it('should show "Leave" button when user has joined', async () => {
            // GIVEN: Post that user has joined
            mockFetchSuccess([mockJoinedPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: "Leave" button is visible
            await waitFor(() => {
                expect(screen.getByText('Leave')).toBeInTheDocument();
            });
        });

        it('should show "Your post" tag when user is the owner', async () => {
            // GIVEN: Post owned by current user
            mockFetchSuccess([mockOwnPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: "Your post" tag is visible
            await waitFor(() => {
                expect(screen.getByText('Your post')).toBeInTheDocument();
            });
        });

        it('should show "Ended" tag for past posts', async () => {
            // GIVEN: Post in the past
            mockFetchSuccess([mockPastPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: "Ended" tag is visible
            await waitFor(() => {
                expect(screen.getByText('Ended')).toBeInTheDocument();
            });
        });

        it('should call fetch POST /api/posts/join_post when Join is clicked', async () => {
            // GIVEN: Post to join
            mockFetchSuccess([mockPost]);

            renderPost();

            await waitFor(() => {
                expect(screen.getByText('Join')).toBeInTheDocument();
            });

            // Reset fetch mock to track join call
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Joined' }),
            } as Response);

            // WHEN: Join button is clicked
            fireEvent.click(screen.getByText('Join'));

            // THEN: fetch called with POST, body { postId }
            await waitFor(() => {
                const joinCalls = vi.mocked(fetch).mock.calls.filter(
                    c => typeof c[0] === 'string' && c[0].includes('join_post')
                );
                expect(joinCalls.length).toBe(1);
            });
        });

        it('should navigate to /login when joining without token', async () => {
            // GIVEN: No token
            localStorage.removeItem('token');
            mockFetchSuccess([mockPost]);

            renderPost();

            await waitFor(() => {
                expect(screen.getByText('Join')).toBeInTheDocument();
            });

            // WHEN: Join button is clicked
            fireEvent.click(screen.getByText('Join'));

            // THEN: Navigate to /login
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    // ─────────────────────────────────────────────────────
    // Finished banner
    // ─────────────────────────────────────────────────────
    describe('finished banner', () => {
        it('should display "Finished" banner for past posts', async () => {
            // GIVEN: Post with date in the past
            mockFetchSuccess([mockPastPost]);

            // WHEN: Card renders
            renderPost();

            // THEN: Finished banner is shown
            await waitFor(() => {
                expect(screen.getByText(/Finished — this session has already taken place/)).toBeInTheDocument();
            });
        });
    });

    // ─────────────────────────────────────────────────────
    // "See training plan & more" link
    // ─────────────────────────────────────────────────────
    describe('post details modal', () => {
        it('should navigate to /login if not authenticated when clicking "more"', async () => {
            // GIVEN: No token
            localStorage.removeItem('token');
            mockFetchSuccess([mockPost]);

            renderPost();

            await waitFor(() => {
                expect(screen.getByText('See training plan & more')).toBeInTheDocument();
            });

            // WHEN: Clicks "See training plan & more"
            fireEvent.click(screen.getByText('See training plan & more'));

            // THEN: Navigated to /login
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    // ─────────────────────────────────────────────────────
    // Event listener
    // ─────────────────────────────────────────────────────
    describe('event listener', () => {
        it('should refetch posts on "post-action-success" window event', async () => {
            // GIVEN: Posts are loaded
            mockFetchSuccess([mockPost]);
            renderPost();

            await waitFor(() => {
                expect(screen.getByText('Chest Training')).toBeInTheDocument();
            });

            // Set up the next fetch response
            mockFetchSuccess([mockPost, { ...mockPost, id: 99, title: 'New Post' }]);

            // WHEN: window dispatches "post-action-success"
            window.dispatchEvent(new CustomEvent('post-action-success'));

            // THEN: fetch is called again
            await waitFor(() => {
                const postCalls = vi.mocked(fetch).mock.calls.filter(
                    c => typeof c[0] === 'string' && c[0].includes('/api/posts/')
                );
                expect(postCalls.length).toBeGreaterThanOrEqual(2);
            });
        });
    });
});
