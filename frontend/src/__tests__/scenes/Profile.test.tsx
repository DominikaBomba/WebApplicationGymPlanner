/**
 * Tests for Profile scene.
 *
 * Profile shows user data (own or other's), friends list, posts, and plans.
 * Handles add/remove friend actions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from '../../scenes/Profile/Profile';
import { mockUser, mockOtherUser, mockFetchSuccess, mockFetchFailure } from '../../__tests__/helpers/mocks';

// Mock AuthContext
vi.mock('../../AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        loading: false,
        refreshUser: vi.fn(),
        logout: vi.fn(),
    }),
}));

// Mock Post component
vi.mock('../../components/Posts', () => ({
    default: (props: any) => <div data-testid={`post-${props.feedType}`}>Posts</div>,
}));

function renderProfile(nickname?: string) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const route = nickname ? `/profile/${nickname}` : '/profile';
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:nickname" element={<Profile />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('Profile scene', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'valid-token');
        vi.clearAllMocks();
    });

    describe('own profile (no nickname param)', () => {
        beforeEach(() => {
            // Mock friends and posts fetch calls
            vi.mocked(fetch)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response) // friends/me
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response) // posts
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response) // friends
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response); // plans
        });

        it('should display current user nickname', async () => {
            // GIVEN: Viewing own profile
            // WHEN: Component renders
            renderProfile();

            // THEN: Current user's nickname is shown
            await waitFor(() => {
                expect(screen.getByText('TestUser')).toBeInTheDocument();
            });
        });

        it('should show "You" badge', async () => {
            // GIVEN: Viewing own profile
            renderProfile();

            // THEN: "You" badge is visible
            await waitFor(() => {
                expect(screen.getByText('You')).toBeInTheDocument();
            });
        });

        it('should show "Edit profile" link to /settings', async () => {
            // GIVEN: Viewing own profile
            renderProfile();

            // THEN: "Edit profile" link is present
            await waitFor(() => {
                expect(screen.getByText('Edit profile')).toBeInTheDocument();
            });
        });

        it('should display user level', async () => {
            // GIVEN: User with level "MID"
            renderProfile();

            // THEN: Level is shown
            await waitFor(() => {
                expect(screen.getByText('MID')).toBeInTheDocument();
            });
        });

        it('should display description or fallback', async () => {
            // GIVEN: User with description
            renderProfile();

            // THEN: Description is shown
            await waitFor(() => {
                expect(screen.getByText('Test description')).toBeInTheDocument();
            });
        });

        it('should render Post component with feedType="profile"', async () => {
            // GIVEN: Own profile
            renderProfile();

            // THEN: Post component with profile feedType is rendered
            await waitFor(() => {
                expect(screen.getByTestId('post-profile')).toBeInTheDocument();
            });
        });

        it('should display "My training ads" section title', async () => {
            // GIVEN: Own profile
            renderProfile();

            // THEN: Section title uses "My"
            await waitFor(() => {
                expect(screen.getByText('My training ads')).toBeInTheDocument();
            });
        });

        it('should display "My training plans" section title', async () => {
            // GIVEN: Own profile
            renderProfile();

            // THEN: Plans section uses "My"
            await waitFor(() => {
                expect(screen.getByText('My training plans')).toBeInTheDocument();
            });
        });
    });

    describe('other user profile (with nickname param)', () => {
        it('should fetch user by nickname from API', async () => {
            // GIVEN: Viewing another user's profile
            vi.mocked(fetch)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response) // current user friends
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOtherUser) } as Response) // user by nickname
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response) // user posts
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response) // plans
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response); // friends

            // WHEN: Profile loads
            renderProfile('OtherUser');

            // THEN: Other user's data shown
            await waitFor(() => {
                expect(screen.getByText('OtherUser')).toBeInTheDocument();
            });
        });

        it('should NOT show "You" badge on other profile', async () => {
            // GIVEN: Viewing another user's profile
            vi.mocked(fetch)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOtherUser) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response);

            renderProfile('OtherUser');

            // THEN: "You" badge is NOT visible
            await waitFor(() => {
                expect(screen.getByText('OtherUser')).toBeInTheDocument();
            });
            expect(screen.queryByText('You')).not.toBeInTheDocument();
        });

        it('should show "Add friend" button when not friends', async () => {
            // GIVEN: Other user is not in friends list
            vi.mocked(fetch)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response) // my friends (empty)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOtherUser) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response);

            renderProfile('OtherUser');

            // THEN: "Add friend" button shown
            await waitFor(() => {
                expect(screen.getByText('Add friend')).toBeInTheDocument();
            });
        });
    });

    describe('loading and error states', () => {
        it('should show "Loading..." while data is being fetched', async () => {
            // GIVEN: Auth is loading — mock it temporarily
            vi.mocked(fetch).mockReturnValueOnce(new Promise(() => { }));

            // We re-mock auth to set loading=true
            const authModule = await import('../../AuthContext');
            const originalUseAuth = authModule.useAuth;
            authModule.useAuth = () => ({ user: null, loading: true, refreshUser: vi.fn(), logout: vi.fn() });

            // WHEN: Profile renders
            renderProfile();

            // THEN: Loading shown
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Restore
            authModule.useAuth = originalUseAuth;
        });
    });

    describe('training plans display', () => {
        it('should display "No training plans yet." when plans array is empty', async () => {
            // GIVEN: Own profile, no plans
            vi.mocked(fetch)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response);

            renderProfile();

            // THEN: Empty message shown
            await waitFor(() => {
                expect(screen.getByText('No training plans yet.')).toBeInTheDocument();
            });
        });
    });
});
