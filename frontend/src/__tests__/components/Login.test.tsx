/**
 * Tests for Login component.
 *
 * Uses TanStack Query mutation to POST /api/auth/login.
 * On success: stores JWT in localStorage and navigates to "/".
 * On failure: displays error message.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../../components/Login/Login';

// Mock SVG and image imports
vi.mock('../../assets/icons/close.svg?react', () => ({
    default: () => <span data-testid="close-icon">×</span>,
}));
vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }));

function renderLogin() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/login']}>
                <Login />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('Login component', () => {
    it('should render email and password inputs with login button', () => {
        // GIVEN: Component is rendered
        renderLogin();

        // WHEN: The form is visible
        // THEN: Email input, password input, and "Login" button are present
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render link to register page', () => {
        // GIVEN: Component is rendered
        renderLogin();

        // WHEN: Looking at the form footer
        // THEN: A "SignUp" link is visible
        expect(screen.getByText(/SignUp/)).toBeInTheDocument();
    });

    it('should render close button linking to home', () => {
        // GIVEN: Component is rendered
        renderLogin();

        // WHEN: Looking at the card
        // THEN: A close icon is present
        expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    it('should update email state when user types in email field', async () => {
        // GIVEN: Component is rendered
        renderLogin();
        const user = userEvent.setup();

        // WHEN: User types into the email input
        const emailInput = screen.getByLabelText('Email');
        await user.type(emailInput, 'test@example.com');

        // THEN: The input value reflects the typed text
        expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password state when user types in password field', async () => {
        // GIVEN: Component is rendered
        renderLogin();
        const user = userEvent.setup();

        // WHEN: User types into the password input
        const passwordInput = screen.getByLabelText('Password');
        await user.type(passwordInput, 'mypassword');

        // THEN: The input value reflects the typed text
        expect(passwordInput).toHaveValue('mypassword');
    });

    it('should call fetch with correct credentials on form submit', async () => {
        // GIVEN: User has entered valid email and password
        renderLogin();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ token: 'jwt-token-123' }),
        } as Response);

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123');

        // WHEN: User submits the form
        await user.click(screen.getByRole('button', { name: /login/i }));

        // THEN: fetch is called with POST /api/auth/login and correct body
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/auth/login',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ login: 'test@example.com', password: 'password123' }),
                })
            );
        });
    });

    it('should store token in localStorage on successful login', async () => {
        // GIVEN: fetch returns 200 with { token: "abc123" }
        renderLogin();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ token: 'abc123' }),
        } as Response);

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123');

        // WHEN: Form is submitted
        await user.click(screen.getByRole('button', { name: /login/i }));

        // THEN: localStorage.setItem("token", "abc123") is called
        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('abc123');
        });
    });

    it('should display error message when login fails', async () => {
        // GIVEN: fetch returns 401 with { error: "Login failed" }
        renderLogin();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Login failed' }),
        } as Response);

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'wrong');

        // WHEN: Form is submitted
        await user.click(screen.getByRole('button', { name: /login/i }));

        // THEN: Error message is displayed
        await waitFor(() => {
            expect(screen.getByText('Login failed')).toBeInTheDocument();
        });
    });

    it('should show "Logging in..." text while mutation is pending', async () => {
        // GIVEN: fetch is slow (never resolves during this test)
        renderLogin();
        const user = userEvent.setup();

        let resolvePromise: (value: Response) => void;
        vi.mocked(fetch).mockReturnValueOnce(
            new Promise((resolve) => { resolvePromise = resolve; })
        );

        await user.type(screen.getByLabelText('Email'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123');

        // WHEN: Form is submitted
        await user.click(screen.getByRole('button', { name: /login/i }));

        // THEN: Button text changes to "Logging in..."
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
        });
    });

    it('should show forgot password message when link is clicked', async () => {
        // GIVEN: Component is rendered
        renderLogin();
        const user = userEvent.setup();

        // WHEN: User clicks "Forgot password?"
        await user.click(screen.getByText('Forgot password?'));

        // THEN: The humorous message appears
        expect(screen.getByText("we're sorry to hear that")).toBeInTheDocument();
    });

    it('should render the "Welcome Back!" heading', () => {
        // GIVEN: Component is rendered
        renderLogin();

        // WHEN: Looking at the form header
        // THEN: The welcome heading is visible
        expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });
});
