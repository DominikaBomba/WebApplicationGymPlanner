/**
 * Integration tests for user routes.
 */
import { mockPrisma } from '../helpers/prisma.mock';

import request from 'supertest';
import app from '../../index';
import {
    TEST_JWT_SECRET,
    generateValidToken,
    mockUser,
    mockUser2,
    mockFriendship,
} from '../helpers/auth.helpers';

beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
});

const validToken = generateValidToken({ userId: '1', login: 'testuser@example.com' });

// ─────────────────────────────────────────────────────
// GET /api/users/me
// ─────────────────────────────────────────────────────
describe('GET /api/users/me', () => {
    it('should return current user profile with friends list (200)', async () => {
        // GIVEN: User exists in DB with friends relations
        mockPrisma.user.findUnique.mockResolvedValue({
            ...mockUser,
            friendsAdded: [{ friend: { id: 2, nickname: 'Friend1', profilePicture: null, level: 'MID' } }],
            friendsOf: [],
        });

        // WHEN: GET /api/users/me with valid token
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with user data including flattened friends list
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Authenticated successfully!');
        expect(res.body.user).toBeDefined();
        expect(res.body.user.friends).toHaveLength(1);
    });

    it('should return 401 when no token is provided', async () => {
        // GIVEN: No Authorization header
        // WHEN: GET /api/users/me
        const res = await request(app).get('/api/users/me');

        // THEN: 401
        expect(res.status).toBe(401);
    });

    it('should return 404 when authenticated user is not found in DB', async () => {
        // GIVEN: Valid token but user no longer exists in DB
        mockPrisma.user.findUnique.mockResolvedValue(null);

        // WHEN: GET /api/users/me
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 404
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('User not found');
    });

    it('should return 400 when userId in token is not a valid number', async () => {
        // GIVEN: Token has a non-numeric userId
        const badToken = generateValidToken({ userId: 'abc', login: 'test@test.com' });

        // WHEN: GET /api/users/me
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${badToken}`);

        // THEN: 400 with invalid user ID error
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid user ID format');
    });
});

// ─────────────────────────────────────────────────────
// GET /api/users/:nickname (search)
// ─────────────────────────────────────────────────────
describe('GET /api/users/:nickname', () => {
    it('should return matching users (200)', async () => {
        // GIVEN: Users matching the nickname pattern exist
        mockPrisma.user.findMany.mockResolvedValue([
            { id: 1, nickname: 'TestUser', level: 'BEGINNER', description: 'Hello', profilePicture: null },
        ]);

        // WHEN: GET /api/users/TestUser with auth
        const res = await request(app)
            .get('/api/users/TestUser')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with array of matching users
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
        // GIVEN: No auth header
        // WHEN: GET /api/users/TestUser
        const res = await request(app).get('/api/users/TestUser');

        // THEN: 401
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────
// POST /api/users/friends (add friend)
// ─────────────────────────────────────────────────────
describe('POST /api/users/friends', () => {
    it('should add a friend successfully (201)', async () => {
        // GIVEN: No existing friendship between users
        mockPrisma.friends.findFirst.mockResolvedValue(null);
        mockPrisma.friends.create.mockResolvedValue(mockFriendship);

        // WHEN: POST /api/users/friends with friendId
        const res = await request(app)
            .post('/api/users/friends')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ friendId: 2 });

        // THEN: 201 with success message
        expect(res.status).toBe(201);
        expect(res.body.message).toBeDefined();
    });

    it('should return 400 when trying to add self as friend', async () => {
        // GIVEN: friendId equals the current user's ID (1)
        // WHEN: POST /api/users/friends with friendId = 1
        const res = await request(app)
            .post('/api/users/friends')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ friendId: 1 });

        // THEN: 400 — cannot add yourself
        expect(res.status).toBe(400);
    });

    it('should return 400 when already friends', async () => {
        // GIVEN: Friendship already exists
        mockPrisma.friends.findFirst.mockResolvedValue(mockFriendship);

        // WHEN: POST /api/users/friends
        const res = await request(app)
            .post('/api/users/friends')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ friendId: 2 });

        // THEN: 400 — already friends
        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────────────
// DELETE /api/users/friends (remove friend)
// ─────────────────────────────────────────────────────
describe('DELETE /api/users/friends', () => {
    it('should remove a friend successfully (200)', async () => {
        // GIVEN: Friendship exists in DB
        mockPrisma.friends.deleteMany.mockResolvedValue({ count: 1 });

        // WHEN: DELETE /api/users/friends with friendId
        const res = await request(app)
            .delete('/api/users/friends')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ friendId: 2 });

        // THEN: 200
        expect(res.status).toBe(200);
    });

    it('should return 400 when friendId is missing', async () => {
        // GIVEN: No friendId in request body
        // WHEN: DELETE /api/users/friends with empty body
        const res = await request(app)
            .delete('/api/users/friends')
            .set('Authorization', `Bearer ${validToken}`)
            .send({});

        // THEN: 400
        expect(res.status).toBe(400);
    });

    it('should return 404 when friendship does not exist', async () => {
        // GIVEN: No friendship found to delete
        mockPrisma.friends.deleteMany.mockResolvedValue({ count: 0 });

        // WHEN: DELETE /api/users/friends
        const res = await request(app)
            .delete('/api/users/friends')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ friendId: 999 });

        // THEN: 404
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────
// PATCH /api/users/update
// ─────────────────────────────────────────────────────
describe('PATCH /api/users/update', () => {
    it('should update user profile successfully (200)', async () => {
        // GIVEN: Prisma update succeeds
        const updatedUser = { ...mockUser, level: 'MID', description: 'Updated bio' };
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        // WHEN: PATCH /api/users/update with new data
        const res = await request(app)
            .patch('/api/users/update')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ level: 'MID', description: 'Updated bio', profilePicture: '' });

        // THEN: 200 with updated user
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Updated successfully!');
        expect(res.body.user.level).toBe('MID');
    });

    it('should return 401 without auth token', async () => {
        // GIVEN: No Authorization header
        // WHEN: PATCH /api/users/update
        const res = await request(app)
            .patch('/api/users/update')
            .send({ level: 'MID' });

        // THEN: 401
        expect(res.status).toBe(401);
    });
});
