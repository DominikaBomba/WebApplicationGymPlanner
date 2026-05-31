/**
 * Tests for Settings scene.
 *
 * Settings allows the user to update their level, description,
 * and profile picture (via Supabase storage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Settings from '../../scenes/Settings/Settings';
import { mockUser } from '../../__tests__/helpers/mocks';

// Mock AuthContext
const mockRefreshUser = vi.fn().mockResolvedValue(undefined);
const mockAuthUser = {
    id: 1,
    nickname: 'TestUser',
    email: 'test@example.com',
    level: 'MID',
    description: 'Test description',
    profilePicture: 'https://example.com/avatar.png',
};

vi.mock('../../AuthContext.tsx', () => ({
    useAuth: () => ({
        user: mockAuthUser,
        loading: false,
        refreshUser: mockRefreshUser,
        logout: vi.fn(),
    }),
}));

// Mock Supabase client
vi.mock('../../supabaseClient.ts', () => ({
    supabase: {
        storage: {
            from: () => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'avatar.png' }, error: null }),
                getPublicUrl: () => ({
                    data: { publicUrl: 'https://supabase.example.com/avatar.png' },
                }),
            }),
        },
    },
}));

function renderSettings() {
    return render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );
}

describe('Settings scene', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'valid-token');
        mockRefreshUser.mockClear();
    });

    it('should render form with nickname (disabled), level select, and description', () => {
        // GIVEN: User is logged in
        renderSettings();

        // WHEN: Looking at the form
        // THEN: All fields are present
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
        expect(screen.getByDisplayValue('TestUser')).toBeDisabled();
        expect(screen.getByLabelText('Level')).toBeInTheDocument();
        expect(screen.getByLabelText('About Me')).toBeInTheDocument();
    });

    it('should pre-populate level and description from user context', () => {
        // GIVEN: User has level="MID", description="Test description"
        renderSettings();

        // WHEN: Settings renders
        // THEN: Select value is "MID", textarea value is "Test description"
        expect(screen.getByLabelText('Level')).toHaveValue('MID');
        expect(screen.getByLabelText('About Me')).toHaveValue('Test description');
    });

    it('should display avatar preview from user profile picture', () => {
        // GIVEN: User has profilePicture
        renderSettings();

        // WHEN: Looking at avatar section
        // THEN: Avatar preview shown
        const avatar = screen.getByAltText('Avatar Preview');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('should render "Change Photo" button', () => {
        // GIVEN: Settings renders
        renderSettings();

        // WHEN: Looking at avatar section
        // THEN: "Change Photo" button present
        expect(screen.getByText('Change Photo')).toBeInTheDocument();
    });

    it('should call PATCH /api/users/update with updated fields on submit', async () => {
        // GIVEN: User changes level and description
        renderSettings();
        const user = userEvent.setup();

        // Change level
        await user.selectOptions(screen.getByLabelText('Level'), 'ADVANCED');

        // Change description
        const textarea = screen.getByLabelText('About Me');
        await user.clear(textarea);
        await user.type(textarea, 'Updated bio');

        // Mock fetch for update
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ message: 'Updated' }),
        } as Response);

        // WHEN: "Save Changes" clicked
        await user.click(screen.getByText('Save Changes'));

        // THEN: fetch PATCH with correct data
        await waitFor(() => {
            const updateCalls = vi.mocked(fetch).mock.calls.filter(
                c => typeof c[0] === 'string' && c[0].includes('/api/users/update')
            );
            expect(updateCalls.length).toBe(1);
            expect(updateCalls[0][1]?.method).toBe('PATCH');

            const body = JSON.parse(updateCalls[0][1]?.body as string);
            expect(body.level).toBe('ADVANCED');
            expect(body.description).toBe('Updated bio');
        });
    });

    it('should call refreshUser on successful update', async () => {
        // GIVEN: Update succeeds
        renderSettings();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ message: 'Updated' }),
        } as Response);

        // WHEN: Save clicked
        await user.click(screen.getByText('Save Changes'));

        // THEN: refreshUser called
        await waitFor(() => {
            expect(mockRefreshUser).toHaveBeenCalled();
        });
    });

    it('should display success message after update', async () => {
        // GIVEN: Update succeeds
        renderSettings();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({}),
        } as Response);

        // WHEN: Save clicked
        await user.click(screen.getByText('Save Changes'));

        // THEN: Success message shown
        await waitFor(() => {
            expect(screen.getByText('Post updated successfully!')).toBeInTheDocument();
        });
    });

    it('should display error message on failed update', async () => {
        // GIVEN: Update fails
        renderSettings();
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({}),
        } as Response);

        // WHEN: Save clicked
        await user.click(screen.getByText('Save Changes'));

        // THEN: Error message shown
        await waitFor(() => {
            expect(screen.getByText('Failed to update profile.')).toBeInTheDocument();
        });
    });

    it('should render "Back" link to /profile', () => {
        // GIVEN: Settings renders
        renderSettings();

        // WHEN: Looking at actions
        // THEN: "Back" link present
        const backLink = screen.getByText('Back');
        expect(backLink).toBeInTheDocument();
        expect(backLink.closest('a')).toHaveAttribute('href', '/profile');
    });

    it('should render all level options', () => {
        // GIVEN: Settings renders
        renderSettings();

        // WHEN: Looking at level select
        // THEN: All level options present
        const select = screen.getByLabelText('Level');
        expect(select).toBeInTheDocument();
        expect(screen.getByText('BEGGINER')).toBeInTheDocument();
        expect(screen.getByText('MID')).toBeInTheDocument();
        expect(screen.getByText('ADVANCED')).toBeInTheDocument();
        expect(screen.getByText('PRO')).toBeInTheDocument();
    });
});
