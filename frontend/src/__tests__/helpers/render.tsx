/**
 * Custom render helper that wraps components in all required providers.
 *
 * Provides:
 *  - MemoryRouter (with configurable initial route)
 *  - QueryClientProvider (fresh QueryClient per render)
 *  - AuthContext override (user, loading, logout, refreshUser)
 */
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import type { UserData } from '../../types/UserData';
import { mockUser } from './mocks';

// ── Auth context value type ──────────────────────────
interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => void;
}

// We create a *test-only* AuthContext so tests can inject values
// without depending on the real AuthProvider (which fetches /api/users/me).
const TestAuthContext = createContext<AuthContextType | undefined>(undefined);

export function useTestAuth() {
    const ctx = useContext(TestAuthContext);
    if (!ctx) throw new Error('useTestAuth must be used within TestAuthProvider');
    return ctx;
}

// ── Provider wrapper ─────────────────────────────────
interface WrapperOptions {
    /** Initial route for MemoryRouter. Defaults to "/" */
    route?: string;
    /** Override auth context user. `null` = logged-out. Defaults to mockUser. */
    authUser?: UserData | null;
    /** Override auth loading state. Defaults to false. */
    authLoading?: boolean;
}

function createWrapper({
    route = '/',
    authUser = mockUser,
    authLoading = false,
}: WrapperOptions = {}) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        const authValue: AuthContextType = {
            user: authUser,
            loading: authLoading,
            refreshUser: vi.fn().mockResolvedValue(undefined),
            logout: vi.fn(),
        };

        return (
            <QueryClientProvider client={queryClient}>
                <TestAuthContext.Provider value={authValue}>
                    <MemoryRouter initialEntries={[route]}>
                        {children}
                    </MemoryRouter>
                </TestAuthContext.Provider>
            </QueryClientProvider>
        );
    };
}

// ── Custom render function ───────────────────────────
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    route?: string;
    authUser?: UserData | null;
    authLoading?: boolean;
}

export function renderWithProviders(
    ui: React.ReactElement,
    options: CustomRenderOptions = {},
) {
    const { route, authUser, authLoading, ...renderOptions } = options;
    const Wrapper = createWrapper({ route, authUser, authLoading });

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
// Override the default render
export { renderWithProviders as render };
