/**
 * Tests for Navbar component.
 *
 * Navbar conditionally shows Login/Logout, navigation links,
 * user avatar, and the AddPost FAB based on auth state.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Navbar from '../../components/Navbar/Navbar';
import { mockUser } from '../../__tests__/helpers/mocks';

// Mock all SVG icon imports
vi.mock('../../assets/icons/chevron_right.svg?react', () => ({ default: () => <span data-testid="chevron-icon" /> }));
vi.mock('../../assets/icons/home_app_logo.svg?react', () => ({ default: () => <span data-testid="home-icon" /> }));
vi.mock('../../assets/icons/person.svg?react', () => ({ default: () => <span data-testid="person-icon" /> }));
vi.mock('../../assets/icons/bar_chart_4_bars.svg?react', () => ({ default: () => <span data-testid="chart-icon" /> }));
vi.mock('../../assets/icons/logout.svg?react', () => ({ default: () => <span data-testid="logout-icon" /> }));
vi.mock('../../assets/icons/settings.svg?react', () => ({ default: () => <span data-testid="settings-icon" /> }));
vi.mock('../../assets/icons/search.svg?react', () => ({ default: () => <span data-testid="search-icon" /> }));
vi.mock('../../assets/icon.png', () => ({ default: 'icon.png' }));
vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }));
vi.mock('../../assets/no_avatar.png', () => ({ default: 'no-avatar.png' }));

// Mock AuthContext
const mockLogout = vi.fn();
vi.mock('../../AuthContext.tsx', () => ({
    useAuth: () => ({
        user: null as any,
        loading: false,
        refreshUser: vi.fn(),
        logout: mockLogout,
    }),
}));

// Mock Search and AddPost to isolate Navbar
vi.mock('../../components/Search', () => ({
    default: () => <div data-testid="search-component">Search</div>,
}));
vi.mock('../../components/AddPost', () => ({
    default: () => <div data-testid="addpost-component">AddPost</div>,
}));

function renderNavbar(isExpanded = false) {
    const setIsExpanded = vi.fn();
    const result = render(
        <MemoryRouter initialEntries={['/']}>
            <Navbar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        </MemoryRouter>
    );
    return { ...result, setIsExpanded };
}

describe('Navbar component', () => {
    describe('when user is NOT logged in', () => {
        beforeEach(() => {
            localStorage.removeItem('token');
        });

        it('should render "Log In" link instead of "Log Out" button', () => {
            // GIVEN: No token in localStorage
            // WHEN: Navbar renders
            renderNavbar();

            // THEN: "Log In" link is visible, "Log Out" is not
            expect(screen.getByText('Log In')).toBeInTheDocument();
            expect(screen.queryByText('Log Out')).not.toBeInTheDocument();
        });

        it('should NOT render AddPost FAB', () => {
            // GIVEN: No token
            // WHEN: Navbar renders
            renderNavbar();

            // THEN: AddPost FAB is not in the DOM
            expect(screen.queryByTestId('addpost-component')).not.toBeInTheDocument();
        });
    });

    describe('when user IS logged in', () => {
        beforeEach(async () => {
            localStorage.setItem('token', 'valid-token');
            // Re-mock useAuth for logged-in state
            const authModule = vi.mocked(await import('../../AuthContext.tsx'));
            authModule.useAuth = vi.fn(() => ({
                user: mockUser,
                loading: false,
                refreshUser: vi.fn(),
                logout: mockLogout,
            }));
        });

        it('should render "Log Out" button', () => {
            // GIVEN: Token in localStorage
            // WHEN: Navbar renders
            renderNavbar();

            // THEN: "Log Out" button is visible
            expect(screen.getByText('Log Out')).toBeInTheDocument();
        });

        it('should render AddPost FAB', () => {
            // GIVEN: Token exists
            // WHEN: Navbar renders
            renderNavbar();

            // THEN: AddPost FAB is in the DOM
            expect(screen.getByTestId('addpost-component')).toBeInTheDocument();
        });
    });

    describe('navigation links', () => {
        it('should render Home, Profile, Stats, and Settings links', () => {
            // GIVEN: Navbar renders in expanded mode
            renderNavbar(true);

            // WHEN: Checking sidebar links (labels visible when expanded)
            // THEN: All navigation icons are present
            expect(screen.getByTestId('home-icon')).toBeInTheDocument();
            expect(screen.getByTestId('person-icon')).toBeInTheDocument();
            expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
            expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
        });
    });

    describe('expand/collapse behavior', () => {
        it('should call setIsExpanded when hamburger button is clicked', () => {
            // GIVEN: Navbar is collapsed
            const { setIsExpanded } = renderNavbar(false);

            // WHEN: Hamburger button is clicked
            const hamburger = screen.getByLabelText('Menu');
            fireEvent.click(hamburger);

            // THEN: setIsExpanded is called with true
            expect(setIsExpanded).toHaveBeenCalledWith(true);
        });
    });

    describe('search component', () => {
        it('should render the Search component', () => {
            // GIVEN: Navbar renders
            renderNavbar();

            // WHEN: Checking header area
            // THEN: Search component is rendered
            expect(screen.getByTestId('search-component')).toBeInTheDocument();
        });
    });
});
