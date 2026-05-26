/**
 * Shared test fixtures and auth helpers.
 * Provides reusable mock data objects and JWT generation functions.
 */
import jwt from 'jsonwebtoken';

export const TEST_JWT_SECRET = 'test_secret_key_for_testing';

// ---------- JWT helpers ----------

/** Generate a valid JWT token with the given payload */
export function generateValidToken(payload: { userId: string; login: string }): string {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });
}

/** Generate an expired JWT token */
export function generateExpiredToken(payload: { userId: string; login: string }): string {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '-1s' });
}

/** Generate a JWT signed with a different (wrong) secret */
export function generateWrongSecretToken(payload: { userId: string; login: string }): string {
    return jwt.sign(payload, 'wrong_secret_key', { expiresIn: '1h' });
}

// ---------- Mock data fixtures ----------

export const mockUser = {
    id: 1,
    login: 'testuser@example.com',
    nickname: 'TestUser',
    password: '$2b$10$hashedpassword123456789012345678901234567890', // bcrypt hash placeholder
    profilePicture: 'https://example.com/pic.jpg',
    level: 'BEGINNER',
    description: 'Hi, I just joined Gym Buddy!',
    friendsAdded: [],
    friendsOf: [],
};

export const mockUser2 = {
    id: 2,
    login: 'friend@example.com',
    nickname: 'FriendUser',
    password: '$2b$10$hashedpassword123456789012345678901234567890',
    profilePicture: null,
    level: 'MID',
    description: 'Gym enthusiast',
    friendsAdded: [],
    friendsOf: [],
};

export const mockGym = {
    id: 1,
    name: 'PowerGym',
    city: 'Warsaw',
    address: 'ul. Testowa 1',
    latitude: 52.2297,
    longitude: 21.0122,
    link: 'https://powergym.pl',
};

export const mockPost = {
    id: 1,
    userId: 1,
    gymId: 1,
    title: 'Morning Workout',
    description: 'Chest and back day',
    date: new Date('2025-06-15T08:00:00Z'),
    trainingDuration: 'FROM_1_TO_2_HOURS',
    additionalInfo: 'Bring water',
    isPublic: true,
    createdAt: new Date('2025-06-01T12:00:00Z'),
    maxParticipants: 5,
    trainingPlanId: null,
};

export const mockTrainingPlan = {
    id: 1,
    title: 'Push Day',
    authorId: 1,
    createdAt: new Date('2025-06-01T12:00:00Z'),
    exercises: [
        { id: 1, name: 'Bench Press', reps: '4x10', externalId: null, planId: 1 },
        { id: 2, name: 'Shoulder Press', reps: '3x12', externalId: null, planId: 1 },
    ],
};

export const mockFriendship = {
    id: 1,
    userId: 1,
    friendId: 2,
    createdAt: new Date('2025-06-01T12:00:00Z'),
    status: 'ACCEPTED',
};
