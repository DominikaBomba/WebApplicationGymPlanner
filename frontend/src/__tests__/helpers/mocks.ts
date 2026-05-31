/**
 * Shared mock data used across all frontend tests.
 *
 * Mirrors the backend's helpers/auth.helpers.ts
 */
import type { UserData } from '../../types/UserData';
import { type FilterState, defaultFilters } from '../../types/filters';

// ── Mock User ────────────────────────────────────────
export const mockUser: UserData = {
    id: 1,
    login: 'testuser@example.com',
    nickname: 'TestUser',
    password: 'hashed_password',
    profilePicture: 'https://example.com/avatar.png',
    level: 'MID',
    description: 'Test description',
    friends: [],
    friendsAdded: [],
    friendsOf: [],
};

export const mockOtherUser: UserData = {
    id: 2,
    login: 'other@example.com',
    nickname: 'OtherUser',
    password: 'hashed_password',
    profilePicture: 'https://example.com/other-avatar.png',
    level: 'PRO',
    description: 'Another user',
    friends: [],
    friendsAdded: [],
    friendsOf: [],
};

// ── Mock Gym ─────────────────────────────────────────
export const mockGym = {
    id: 1,
    name: 'IronHouse Gym',
    address: 'ul. Siłowa 1',
    city: 'Warsaw',
    link: 'https://ironhouse.example.com',
    latitude: 52.23,
    longitude: 21.01,
};

// ── Mock Post ────────────────────────────────────────
export const mockPost = {
    id: 1,
    title: 'Chest Training',
    description: 'Intense chest workout',
    date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    createdAt: new Date().toISOString(),
    trainingDuration: 'FROM_1_TO_2_HOURS',
    isPublic: true,
    maxParticipants: 5,
    additionalInfo: 'Bring towel',
    userId: 2,
    user: {
        id: 2,
        nickname: 'OtherUser',
        profilePicture: 'https://example.com/avatar.png',
        level: 'PRO',
    },
    gym: mockGym,
    participants: [],
    _count: { participants: 0 },
    trainingPlan: null,
};

/** A post that is already past */
export const mockPastPost = {
    ...mockPost,
    id: 2,
    title: 'Past Session',
    date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
};

/** A post owned by mockUser */
export const mockOwnPost = {
    ...mockPost,
    id: 3,
    title: 'My Training',
    userId: mockUser.id,
    user: {
        id: mockUser.id,
        nickname: mockUser.nickname,
        profilePicture: mockUser.profilePicture,
        level: mockUser.level,
    },
};

/** A post the user has joined */
export const mockJoinedPost = {
    ...mockPost,
    id: 4,
    title: 'Joined Workout',
    participants: [{ participantId: mockUser.id, id: 100, postId: 4, user: { id: mockUser.id, nickname: mockUser.nickname, profilePicture: mockUser.profilePicture } }],
    _count: { participants: 1 },
};

// ── Mock Plan ────────────────────────────────────────
export const mockPlan = {
    id: 1,
    title: 'Full Body Workout',
    exercises: [
        { id: 1, name: 'Bench Press', reps: '3x12', externalId: '100' },
        { id: 2, name: 'Squats', reps: '4x8', externalId: '101' },
        { id: 3, name: 'Deadlift', reps: '3x5', externalId: '102' },
    ],
    author: { nickname: 'TestUser' },
};

// ── Mock Post with Plan ──────────────────────────────
export const mockPostWithPlan = {
    ...mockPost,
    id: 5,
    trainingPlan: mockPlan,
};

// ── Mock Post Details (full API response) ────────────
export const mockPostDetails = {
    ...mockPost,
    gym: { ...mockGym },
    participants: [
        { id: 100, user: { id: 2, nickname: 'OtherUser', profilePicture: 'https://example.com/avatar.png' } },
        { id: 101, user: { id: 3, nickname: 'ThirdUser', profilePicture: null } },
    ],
    trainingPlan: mockPlan,
};

// ── Mock Stats ───────────────────────────────────────
export const mockStats = {
    summary: { totalPosts: 10, totalPlans: 3 },
    weeklyChart: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [1, 0, 2, 1, 3, 2, 0],
    },
    durationChart: [
        { name: 'Less than 1 hour', count: 2 },
        { name: '1-2 hours', count: 5 },
        { name: 'More than 2 hours', count: 3 },
    ],
    topExercises: [
        { name: 'Bench Press', _count: { name: 8 } },
        { name: 'Squats', _count: { name: 6 } },
    ],
    topGyms: [
        { name: 'IronHouse Gym', count: 5 },
        { name: 'Fit Zone', count: 3 },
    ],
    records: { longestSession: 'MORE_THAN_2_HOURS', monthlyCount: 5 },
};

// ── Filter helpers ───────────────────────────────────
export { defaultFilters };

export const filtersWithCity: FilterState = {
    ...defaultFilters,
    city: 'Warsaw',
};

export const filtersWithLevel: FilterState = {
    ...defaultFilters,
    levels: ['PRO'],
};

export const filtersWithDates: FilterState = {
    ...defaultFilters,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
};

// ── Helpers ──────────────────────────────────────────

/** Create a fetch mock that resolves with the given data. */
export function mockFetchSuccess(data: unknown, ok = true) {
    return vi.mocked(fetch).mockResolvedValueOnce({
        ok,
        json: () => Promise.resolve(data),
        status: ok ? 200 : 400,
    } as Response);
}

/** Create a fetch mock that rejects with an error. */
export function mockFetchError(message = 'Network error') {
    return vi.mocked(fetch).mockRejectedValueOnce(new Error(message));
}

/** Create a fetch mock with a non-OK response. */
export function mockFetchFailure(data: unknown, status = 400) {
    return vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(data),
        status,
    } as Response);
}
