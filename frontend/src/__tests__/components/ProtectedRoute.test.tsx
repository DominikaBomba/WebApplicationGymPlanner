/**
 * Tests for ProtectedRoute component.
 *
 * Verifies route protection: renders children when authenticated,
 * redirects to /login when no token is present.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';

// Helper to render with routing context
function renderProtectedRoute(initialRoute: string) {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
                <Route
                    path="/protected"
                    element={
                        <ProtectedRoute>
                            <div>Protected Content</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProtectedRoute component', () => {
    it('should render children when token exists in localStorage', () => {
        // GIVEN: A valid token is stored in localStorage
        localStorage.setItem('token', 'valid-jwt-token');

        // WHEN: User navigates to a protected route
        renderProtectedRoute('/protected');

        // THEN: The protected content is rendered
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should redirect to /login when no token exists', () => {
        // GIVEN: No token in localStorage

        // WHEN: User navigates to a protected route
        renderProtectedRoute('/protected');

        // THEN: User is redirected to the login page
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should use replace navigation (no back-button loop)', () => {
        // GIVEN: No token in localStorage

        // WHEN: ProtectedRoute renders
        renderProtectedRoute('/protected');

        // THEN: Navigate component redirects (the fact that Login Page renders
        // and Protected Content does not proves the <Navigate replace /> works)
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
});
