/**
 * Tests for Home scene.
 *
 * Home conditionally shows LandingPage (no token) or the dashboard
 * with Filter + Post sections (authenticated user).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../../scenes/Home/Home';
import { mockUser } from '../../__tests__/helpers/mocks';

// Mock AuthContext
const mockAuthReturn = {
    user: mockUser,
    loading: false,
    refreshUser: vi.fn(),
    logout: vi.fn(),
};

vi.mock('../../AuthContext', () => ({
    useAuth: () => mockAuthReturn,
}));

// Mock child components to isolate Home
vi.mock('../../components/Filter/Filter', () => ({
    default: ({ filters, onChange }: any) => <div data-testid="filter">Filter</div>,
}));

vi.mock('../../components/Posts', () => ({
    default: (props: any) => <div data-testid={`post-${props.feedType}`}>Post: {props.feedType}</div>,
}));

vi.mock('../../scenes/LandingPage/LandingPage', () => ({
    default: () => <div data-testid="landing-page">LandingPage</div>,
}));

function renderHome() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('Home scene', () => {
    it('should render LandingPage when user is not logged in', () => {
        // GIVEN: No token in localStorage
        localStorage.removeItem('token');

        // WHEN: Home renders
        renderHome();

        // THEN: LandingPage is shown
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
        expect(screen.queryByTestId('filter')).not.toBeInTheDocument();
    });

    it('should render dashboard with Filter and Post sections when logged in', () => {
        // GIVEN: Token exists, auth loaded
        localStorage.setItem('token', 'valid-token');
        mockAuthReturn.loading = false;

        // WHEN: Home renders
        renderHome();

        // THEN: Filter bar and post sections are visible
        expect(screen.getByTestId('filter')).toBeInTheDocument();
        expect(screen.getByTestId('post-joined')).toBeInTheDocument();
        expect(screen.getByTestId('post-friends')).toBeInTheDocument();
        expect(screen.getByTestId('post-discover')).toBeInTheDocument();
    });

    it('should render nothing while auth is loading', () => {
        // GIVEN: Token exists, auth loading = true
        localStorage.setItem('token', 'valid-token');
        mockAuthReturn.loading = true;

        // WHEN: Home renders
        renderHome();

        // THEN: Nothing is rendered
        expect(screen.queryByTestId('filter')).not.toBeInTheDocument();
        expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();

        // Reset for other tests
        mockAuthReturn.loading = false;
    });

    it('should render section titles', () => {
        // GIVEN: Token exists
        localStorage.setItem('token', 'valid-token');

        // WHEN: Home renders
        renderHome();

        // THEN: Section titles are visible
        expect(screen.getByText("Upcoming – You're in")).toBeInTheDocument();
        expect(screen.getByText("Discover More")).toBeInTheDocument();
        expect(screen.getByText("Friends' Activity")).toBeInTheDocument();
        expect(screen.getByText("Public Trainings")).toBeInTheDocument();
    });
});
