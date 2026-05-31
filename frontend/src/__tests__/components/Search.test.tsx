/**
 * Tests for Search component.
 *
 * Search is a debounced user search — fires API call after 300ms
 * when the search term is >= 2 characters. Displays results in a dropdown.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Search from '../../components/Search/Search';

// Mock SVG import
vi.mock('../../assets/icons/search.svg?react', () => ({
    default: () => <span data-testid="search-icon" />,
}));

function renderSearch() {
    return render(
        <MemoryRouter>
            <Search />
        </MemoryRouter>
    );
}

describe('Search component', () => {
    it('should render search input with placeholder for logged-in user', () => {
        // GIVEN: Token exists in localStorage
        localStorage.setItem('token', 'valid-token');

        // WHEN: Component renders
        renderSearch();

        // THEN: Input is enabled with "Search for friends..." placeholder
        const input = screen.getByPlaceholderText('Search for friends...');
        expect(input).toBeInTheDocument();
        expect(input).not.toBeDisabled();
    });

    it('should render disabled input with login prompt when not logged in', () => {
        // GIVEN: No token in localStorage

        // WHEN: Component renders
        renderSearch();

        // THEN: Input is disabled with login prompt
        const input = screen.getByPlaceholderText("Login to search for other's profiles.");
        expect(input).toBeInTheDocument();
        expect(input).toBeDisabled();
    });

    it('should NOT fetch when search term is less than 2 characters', async () => {
        // GIVEN: User is logged in
        localStorage.setItem('token', 'valid-token');
        renderSearch();
        const user = userEvent.setup();

        // WHEN: User types single character "A"
        await user.type(screen.getByPlaceholderText('Search for friends...'), 'A');

        // Wait for potential debounce
        await act(async () => {
            await new Promise(r => setTimeout(r, 400));
        });

        // THEN: fetch is NOT called (setup.ts sets a global mock but it shouldn't
        // be called for search since the term is too short)
        // fetch may have been called 0 times or only during setup — but NOT for search
        const searchCalls = vi.mocked(fetch).mock.calls.filter(
            call => typeof call[0] === 'string' && call[0].includes('/api/users/')
        );
        expect(searchCalls.length).toBe(0);
    });

    it('should fetch users after debounce when search term >= 2 chars', async () => {
        // GIVEN: User is logged in, fetch returns user results
        localStorage.setItem('token', 'valid-token');
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([
                { id: 1, nickname: 'Mike', level: 'PRO', profilePicture: null },
            ]),
        } as Response);

        renderSearch();
        const user = userEvent.setup();

        // WHEN: User types "Mi" and debounce completes
        await user.type(screen.getByPlaceholderText('Search for friends...'), 'Mi');

        // THEN: fetch is called with /api/users/Mi
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/users/Mi',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer valid-token',
                    }),
                })
            );
        });
    });

    it('should display search results in a dropdown', async () => {
        // GIVEN: Fetch returns user results
        localStorage.setItem('token', 'valid-token');
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([
                { id: 1, nickname: 'MikeTrainer', level: 'PRO', profilePicture: null },
            ]),
        } as Response);

        renderSearch();
        const user = userEvent.setup();

        // WHEN: User types and results load
        await user.type(screen.getByPlaceholderText('Search for friends...'), 'Mi');

        // THEN: Dropdown shows user nickname
        await waitFor(() => {
            expect(screen.getByText('MikeTrainer')).toBeInTheDocument();
            expect(screen.getByText('PRO')).toBeInTheDocument();
        });
    });

    it('should render search icon', () => {
        // GIVEN: Component renders
        renderSearch();

        // WHEN: Looking at the input area
        // THEN: Search icon is present
        expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });
});
