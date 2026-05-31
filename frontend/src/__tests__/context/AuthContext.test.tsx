/**
 * Tests for AuthContext (AuthProvider and useAuth hook).
 *
 * AuthProvider fetches /api/users/me on mount when a token exists,
 * provides user state, and exposes logout/refreshUser methods.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../AuthContext';
import type { ReactNode } from 'react';

// Wrapper component for testing useAuth hook
function AuthWrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}

// Helper component that displays auth state
function AuthConsumer() {
    const { user, loading, logout } = useAuth();
    return (
        <div>
            <span data-testid="loading">{loading ? 'loading' : 'loaded'}</span>
            <span data-testid="user">{user ? user.nickname : 'null'}</span>
            <button onClick={logout}>Logout</button>
        </div>
    );
}

describe('AuthContext', () => {
    describe('AuthProvider', () => {
        it('should fetch user from /api/users/me on mount when token exists', async () => {
            // GIVEN: localStorage has token "abc"
            localStorage.setItem('token', 'abc');
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    user: { id: 1, nickname: 'TestUser', level: 'MID', profilePicture: null }
                }),
            } as Response);

            // WHEN: AuthProvider mounts
            render(
                <AuthProvider>
                    <AuthConsumer />
                </AuthProvider>
            );

            // THEN: fetch called with Bearer abc, user state is set
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3000/api/users/me',
                    expect.objectContaining({
                        headers: { Authorization: 'Bearer abc' },
                    })
                );
                expect(screen.getByTestId('user')).toHaveTextContent('TestUser');
            });
        });

        it('should set user to null when no token exists', async () => {
            // GIVEN: No token in localStorage
            localStorage.removeItem('token');

            // WHEN: AuthProvider mounts
            render(
                <AuthProvider>
                    <AuthConsumer />
                </AuthProvider>
            );

            // THEN: user is null, loading becomes false
            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('null');
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });
        });

        it('should set loading to false after fetch completes', async () => {
            // GIVEN: Token exists
            localStorage.setItem('token', 'abc');
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ user: { id: 1, nickname: 'Test' } }),
            } as Response);

            // WHEN: AuthProvider mounts
            render(
                <AuthProvider>
                    <AuthConsumer />
                </AuthProvider>
            );

            // THEN: Loading transitions from true to false
            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });
        });

        it('should call logout when /api/users/me returns non-OK response', async () => {
            // GIVEN: Token exists but API returns 401
            localStorage.setItem('token', 'expired-token');
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Unauthorized' }),
            } as Response);

            // WHEN: AuthProvider mounts
            render(
                <AuthProvider>
                    <AuthConsumer />
                </AuthProvider>
            );

            // THEN: User is null (logout was called) and token is removed
            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('null');
                expect(localStorage.getItem('token')).toBeNull();
            });
        });

        it('should handle network error gracefully without crashing', async () => {
            // GIVEN: Token exists, fetch throws
            localStorage.setItem('token', 'abc');
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            // WHEN: AuthProvider mounts
            render(
                <AuthProvider>
                    <AuthConsumer />
                </AuthProvider>
            );

            // THEN: App doesn't crash, loading completes
            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });
        });
    });

    describe('logout', () => {
        it('should remove token from localStorage and set user to null', async () => {
            // GIVEN: User is logged in
            localStorage.setItem('token', 'abc');
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    user: { id: 1, nickname: 'TestUser', level: 'MID' }
                }),
            } as Response);

            render(
                <AuthProvider>
                    <AuthConsumer />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('TestUser');
            });

            // WHEN: logout() is called
            act(() => {
                screen.getByText('Logout').click();
            });

            // THEN: token removed, user becomes null
            expect(localStorage.getItem('token')).toBeNull();
            expect(screen.getByTestId('user')).toHaveTextContent('null');
        });
    });

    describe('useAuth hook', () => {
        it('should throw error when used outside AuthProvider', () => {
            // GIVEN: Component using useAuth is NOT wrapped in AuthProvider

            // WHEN/THEN: Error is thrown
            expect(() => {
                renderHook(() => useAuth());
            }).toThrow('useAuth must be used within AuthProvider');
        });
    });
});
