/**
 * Tests for Register component.
 *
 * Uses TanStack Query mutation to POST /api/auth/register.
 * On success: shows alert and navigates to "/login".
 * On failure: displays error message.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Register from '../../components/Register/Register';

// Mock SVG and image imports
vi.mock('../../assets/icons/close.svg?react', () => ({
    default: () => <span data-testid="close-icon">×</span>,
}));
vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }));

function renderRegister() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/register']}>
                <Register />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('Register component', () => {
    it('should render email, nickname, and password inputs with signup button', () => {
        // GIVEN: Component is rendered
        renderRegister();

        // WHEN: The form is visible
        // THEN: Three inputs and "Sign Up" button are present
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render "Create Account" heading', () => {
        // GIVEN: Component is rendered
        renderRegister();

        // WHEN: Looking at the header
        // THEN: Heading is visible
        expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('should render link to login page', () => {
        // GIVEN: Component is rendered
        renderRegister();

        // WHEN: Looking at the form footer
        // THEN: A "Log In" link is visible
        expect(screen.getByText(/Log In/)).toBeInTheDocument();
    });

    it('should render close button linking to home', () => {
        // GIVEN: Component is rendered
        renderRegister();

        // WHEN: Looking at the card
        // THEN: Close icon is present
        expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    it('should call fetch with correct user data on form submit', async () => {
        // GIVEN: User has filled in email, nickname, password
        renderRegister();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' }),
        } as Response);

        await user.type(screen.getByLabelText('Email'), 'new@example.com');
        await user.type(screen.getByLabelText('Nickname'), 'NewUser');
        await user.type(screen.getByLabelText('Password'), 'secret123');

        // WHEN: Form is submitted
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        // THEN: fetch called with POST /api/auth/register
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/auth/register',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ login: 'new@example.com', nickname: 'NewUser', password: 'secret123' }),
                })
            );
        });
    });

    it('should show alert on successful registration', async () => {
        // GIVEN: fetch returns 200
        renderRegister();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' }),
        } as Response);

        await user.type(screen.getByLabelText('Email'), 'new@example.com');
        await user.type(screen.getByLabelText('Nickname'), 'NewUser');
        await user.type(screen.getByLabelText('Password'), 'secret123');

        // WHEN: Form is submitted
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        // THEN: Success alert shown
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                'Account created successfully! You can now log in.'
            );
        });
    });

    it('should display error message when registration fails', async () => {
        // GIVEN: fetch returns 400 with error
        renderRegister();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Registration failed' }),
        } as Response);

        await user.type(screen.getByLabelText('Email'), 'existing@example.com');
        await user.type(screen.getByLabelText('Nickname'), 'Taken');
        await user.type(screen.getByLabelText('Password'), 'secret123');

        // WHEN: Form is submitted
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        // THEN: Error message is displayed
        await waitFor(() => {
            expect(screen.getByText('Registration failed')).toBeInTheDocument();
        });
    });

    it('should disable button while mutation is pending', async () => {
        // GIVEN: fetch is slow (never resolves)
        renderRegister();
        const user = userEvent.setup();

        vi.mocked(fetch).mockReturnValueOnce(new Promise(() => { }));

        await user.type(screen.getByLabelText('Email'), 'test@test.com');
        await user.type(screen.getByLabelText('Nickname'), 'Test');
        await user.type(screen.getByLabelText('Password'), 'secret123');

        // WHEN: Form submitted
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        // THEN: Button text changes and is disabled
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
        });
    });
});
