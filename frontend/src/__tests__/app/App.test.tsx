/**
 * Tests for App component — routing.
 *
 * Verifies that the App router renders the correct components
 * for each route and hides the Navbar on auth pages.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';
import { mockUser } from '../../__tests__/helpers/mocks';

// Mock AuthContext
vi.mock('../../AuthContext.tsx', () => ({
    useAuth: () => ({
        user: mockUser,
        loading: false,
        refreshUser: vi.fn(),
        logout: vi.fn(),
    }),
    AuthProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock all complex child components to isolate routing behavior
vi.mock('../../components/Navbar/Navbar', () => ({
    default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('../../components/Login', () => ({
    default: () => <div data-testid="login-page">Login</div>,
}));

vi.mock('../../components/Register', () => ({
    default: () => <div data-testid="register-page">Register</div>,
}));

vi.mock('../../scenes/Home', () => ({
    default: () => <div data-testid="home-page">Home</div>,
}));

vi.mock('../../scenes/Profile', () => ({
    default: () => <div data-testid="profile-page">Profile</div>,
}));

vi.mock('../../scenes/Settings/Settings.tsx', () => ({
    default: () => <div data-testid="settings-page">Settings</div>,
}));

vi.mock('../../scenes/Stats', () => ({
    default: () => <div data-testid="stats-page">Stats</div>,
}));

vi.mock('../../components/ProtectedRoute/ProtectedRoute.tsx', () => ({
    default: ({ children }: any) => {
        const token = localStorage.getItem('token');
        if (!token) return <div data-testid="redirect-login">Redirected to Login</div>;
        return children;
    },
}));

function renderApp(route: string) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[route]}>
                <App />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('App component — routing', () => {
    it('should NOT render Navbar on /login route', () => {
        // GIVEN: Route is /login
        // WHEN: App renders
        renderApp('/login');

        // THEN: Navbar is not in the DOM
        expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should NOT render Navbar on /register route', () => {
        // GIVEN: Route is /register
        // WHEN: App renders
        renderApp('/register');

        // THEN: Navbar is not in the DOM
        expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
    });

    it('should render Navbar on "/" route', () => {
        // GIVEN: Route is /
        // WHEN: App renders
        renderApp('/');

        // THEN: Navbar is rendered
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('should render Home component at "/" route', () => {
        // GIVEN: Route is /
        // WHEN: App renders
        renderApp('/');

        // THEN: Home page rendered
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('should render Login component at "/login" route', () => {
        // GIVEN: Route is /login
        renderApp('/login');

        // THEN: Login page rendered
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should render Register component at "/register" route', () => {
        // GIVEN: Route is /register
        renderApp('/register');

        // THEN: Register page rendered
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
    });

    it('should protect /profile route — redirect to /login without token', () => {
        // GIVEN: No token
        localStorage.removeItem('token');

        // WHEN: Navigating to /profile
        renderApp('/profile');

        // THEN: Redirected to login
        expect(screen.getByTestId('redirect-login')).toBeInTheDocument();
    });

    it('should render Profile when authenticated at /profile', () => {
        // GIVEN: Token exists
        localStorage.setItem('token', 'valid-token');

        // WHEN: Navigating to /profile
        renderApp('/profile');

        // THEN: Profile page rendered
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
    });

    it('should protect /settings route', () => {
        // GIVEN: No token
        localStorage.removeItem('token');

        // WHEN: Navigating to /settings
        renderApp('/settings');

        // THEN: Redirected
        expect(screen.getByTestId('redirect-login')).toBeInTheDocument();
    });

    it('should protect /stats route', () => {
        // GIVEN: No token
        localStorage.removeItem('token');

        // WHEN: Navigating to /stats
        renderApp('/stats');

        // THEN: Redirected
        expect(screen.getByTestId('redirect-login')).toBeInTheDocument();
    });

    it('should render Profile for /profile/:nickname route', () => {
        // GIVEN: Route with nickname param
        // (This route is NOT protected)
        renderApp('/profile/SomeUser');

        // THEN: Profile page rendered
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
    });
});
