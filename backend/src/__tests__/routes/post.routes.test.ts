/**
 * Integration tests for post routes.
 */
import { mockPrisma } from '../helpers/prisma.mock';

import request from 'supertest';
import app from '../../index';
import {
    TEST_JWT_SECRET,
    generateValidToken,
    mockPost,
    mockGym,
} from '../helpers/auth.helpers';

beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
});

const validToken = generateValidToken({ userId: '1', login: 'testuser@example.com' });

// ─────────────────────────────────────────────────────
// POST /api/posts (create post)
// ─────────────────────────────────────────────────────
describe('POST /api/posts', () => {
    const validBody = {
        title: 'Morning Workout',
        gymId: 1,
        description: 'Chest and back day',
        date: '2025-06-15T08:00:00.000Z',
        trainingDuration: 'FROM_1_TO_2_HOURS',
        additionalInfo: 'Bring water',
        isPublic: true,
        maxParticipants: 5,
    };

    it('should create a post successfully (201)', async () => {
        // GIVEN: Valid auth, gym exists
        mockPrisma.gym.findUnique.mockResolvedValue(mockGym);
        mockPrisma.post.create.mockResolvedValue({ id: 1, ...validBody, userId: 1 });

        // WHEN: POST /api/posts with valid data
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${validToken}`)
            .send(validBody);

        // THEN: 201 with created post
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Post created successfully!');
        expect(res.body.post).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
        // GIVEN: No Authorization header
        // WHEN: POST /api/posts
        const res = await request(app)
            .post('/api/posts')
            .send(validBody);

        // THEN: 401
        expect(res.status).toBe(401);
    });

    it('should return 400 with invalid body (Zod validation fails)', async () => {
        // GIVEN: Missing required fields
        // WHEN: POST /api/posts with empty body
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${validToken}`)
            .send({});

        // THEN: 400 from validation middleware
        expect(res.status).toBe(400);
    });

    it('should return 404 when gym does not exist', async () => {
        // GIVEN: Gym not found in DB
        mockPrisma.gym.findUnique.mockResolvedValue(null);

        // WHEN: POST /api/posts
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${validToken}`)
            .send(validBody);

        // THEN: 404
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Selected gym does not exist.');
    });

    it('should return 400 when userId from token is not a valid number', async () => {
        // GIVEN: Token has non-numeric userId
        const badToken = generateValidToken({ userId: 'abc', login: 'test@test.com' });

        // WHEN: POST /api/posts with valid body but bad token
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${badToken}`)
            .send(validBody);

        // THEN: 400 — invalid user ID from token
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid user ID from token.');
    });
});

// ─────────────────────────────────────────────────────
// GET /api/posts/all (public feed)
// ─────────────────────────────────────────────────────
describe('GET /api/posts/all', () => {
    it('should return public posts without auth (200)', async () => {
        // GIVEN: Public posts exist
        mockPrisma.post.findMany.mockResolvedValue([
            { ...mockPost, user: { id: 1, nickname: 'Test', profilePicture: null, level: 'BEGINNER' }, gym: mockGym, participants: [], _count: { participants: 0 } },
        ]);

        // WHEN: GET /api/posts/all without auth (optional auth)
        const res = await request(app).get('/api/posts/all');

        // THEN: 200 with posts array
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return public posts with auth (200)', async () => {
        // GIVEN: Posts exist
        mockPrisma.post.findMany.mockResolvedValue([]);

        // WHEN: GET /api/posts/all with valid token
        const res = await request(app)
            .get('/api/posts/all')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200
        expect(res.status).toBe(200);
    });

    it('should support filter query parameters', async () => {
        // GIVEN: Posts exist
        mockPrisma.post.findMany.mockResolvedValue([]);

        // WHEN: GET /api/posts/all with filters
        const res = await request(app)
            .get('/api/posts/all?city=Warsaw&sort=soonest')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 — Prisma is called (we verify it doesn't crash)
        expect(res.status).toBe(200);
    });
});

// ─────────────────────────────────────────────────────
// GET /api/posts/discover
// ─────────────────────────────────────────────────────
describe('GET /api/posts/discover', () => {
    it('should return discover posts (excluding friends and self) (200)', async () => {
        // GIVEN: User has friends
        mockPrisma.friends.findMany.mockResolvedValue([
            { id: 1, userId: 1, friendId: 2, status: 'ACCEPTED', createdAt: new Date() }
        ]);

        mockPrisma.post.findMany.mockResolvedValue([
            { ...mockPost, user: { id: 3, nickname: 'Stranger', profilePicture: null, level: 'BEGINNER' }, gym: mockGym, participants: [], _count: { participants: 0 } },
        ]);

        // WHEN: GET /api/posts/discover with valid token
        const res = await request(app)
            .get('/api/posts/discover')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with posts array
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].user.id).toBe(3);

        // Verify that Prisma was called with correct exclusions
        expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    isPublic: true,
                    userId: { notIn: expect.arrayContaining([1, 2]) } // 1 is currentUserId, 2 is friendId
                })
            })
        );
    });

    it('should return 401 without auth token', async () => {
        // WHEN: GET /api/posts/discover without auth
        const res = await request(app).get('/api/posts/discover');

        // THEN: 401
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────
// POST /api/posts/join_post
// ─────────────────────────────────────────────────────
describe('POST /api/posts/join_post', () => {
    it('should join a post successfully (201)', async () => {
        // GIVEN: Post exists, user is not author, not already joined, not full
        mockPrisma.post.findUnique.mockResolvedValue({
            ...mockPost,
            userId: 2, // different user is author
            _count: { participants: 1 },
        });
        mockPrisma.participants.findFirst.mockResolvedValue(null);
        mockPrisma.participants.create.mockResolvedValue({ id: 1, participantId: 1, postId: 1 });

        // WHEN: POST /api/posts/join_post
        const res = await request(app)
            .post('/api/posts/join_post')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 1 });

        // THEN: 201
        expect(res.status).toBe(201);
        expect(res.body.message).toBeDefined();
    });

    it('should return 400 when postId is missing', async () => {
        // GIVEN: Empty request body
        // WHEN: POST /api/posts/join_post
        const res = await request(app)
            .post('/api/posts/join_post')
            .set('Authorization', `Bearer ${validToken}`)
            .send({});

        // THEN: 400
        expect(res.status).toBe(400);
    });

    it('should return 404 when post does not exist', async () => {
        // GIVEN: Post not found in DB
        mockPrisma.post.findUnique.mockResolvedValue(null);

        // WHEN: POST /api/posts/join_post
        const res = await request(app)
            .post('/api/posts/join_post')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 999 });

        // THEN: 404
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Post not found');
    });

    it('should return 400 when trying to join own post', async () => {
        // GIVEN: Post author is the current user (userId: 1)
        mockPrisma.post.findUnique.mockResolvedValue({
            ...mockPost,
            userId: 1,
            _count: { participants: 0 },
        });

        // WHEN: POST /api/posts/join_post
        const res = await request(app)
            .post('/api/posts/join_post')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 1 });

        // THEN: 400
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('You cannot join your own training session');
    });

    it('should return 400 when session is full', async () => {
        // GIVEN: Post has maxParticipants=2 and already 2 participants
        mockPrisma.post.findUnique.mockResolvedValue({
            ...mockPost,
            userId: 2,
            maxParticipants: 2,
            _count: { participants: 2 },
        });

        // WHEN: POST /api/posts/join_post
        const res = await request(app)
            .post('/api/posts/join_post')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 1 });

        // THEN: 400
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('This training session is already full.');
    });

    it('should return 400 when already participating', async () => {
        // GIVEN: User already joined this post
        mockPrisma.post.findUnique.mockResolvedValue({
            ...mockPost,
            userId: 2,
            _count: { participants: 1 },
        });
        mockPrisma.participants.findFirst.mockResolvedValue({ id: 1, participantId: 1, postId: 1 });

        // WHEN: POST /api/posts/join_post
        const res = await request(app)
            .post('/api/posts/join_post')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 1 });

        // THEN: 400
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('You are already participating in this activity');
    });
});

// ─────────────────────────────────────────────────────
// DELETE /api/posts/:postId (delete post)
// ─────────────────────────────────────────────────────
describe('DELETE /api/posts/:postId', () => {
    it('should delete own post successfully (200)', async () => {
        // GIVEN: Post exists and current user is the author
        mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, userId: 1 });
        mockPrisma.post.delete.mockResolvedValue(mockPost);

        // WHEN: DELETE /api/posts/1
        const res = await request(app)
            .delete('/api/posts/1')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Post has been successfully deleted');
    });

    it('should return 403 when trying to delete another user\'s post', async () => {
        // GIVEN: Post exists but author is a different user
        mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, userId: 2 });

        // WHEN: DELETE /api/posts/1
        const res = await request(app)
            .delete('/api/posts/1')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 403
        expect(res.status).toBe(403);
    });

    it('should return 404 when post does not exist', async () => {
        // GIVEN: Post not found in DB
        mockPrisma.post.findUnique.mockResolvedValue(null);

        // WHEN: DELETE /api/posts/999
        const res = await request(app)
            .delete('/api/posts/999')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 404
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Post not found');
    });

    it('should return 400 for invalid postId format', async () => {
        // GIVEN: postId is not a number
        // WHEN: DELETE /api/posts/abc
        const res = await request(app)
            .delete('/api/posts/abc')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 400
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid Post ID format');
    });
});

// ─────────────────────────────────────────────────────
// DELETE /api/posts/kick_participant
// ─────────────────────────────────────────────────────
describe('DELETE /api/posts/kick_participant', () => {
    it('should kick participant successfully when user is post author (200)', async () => {
        // GIVEN: Current user is the post author
        mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, userId: 1 });
        mockPrisma.participants.deleteMany.mockResolvedValue({ count: 1 });

        // WHEN: DELETE /api/posts/kick_participant
        const res = await request(app)
            .delete('/api/posts/kick_participant')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 1, participantId: 2 });

        // THEN: 200
        expect(res.status).toBe(200);
    });

    it('should return 403 when non-author tries to kick', async () => {
        // GIVEN: Current user is NOT the post author
        mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, userId: 2 });

        // WHEN: DELETE /api/posts/kick_participant
        const res = await request(app)
            .delete('/api/posts/kick_participant')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 1, participantId: 3 });

        // THEN: 403
        expect(res.status).toBe(403);
    });

    it('should return 404 when post does not exist', async () => {
        // GIVEN: Post not found
        mockPrisma.post.findUnique.mockResolvedValue(null);

        // WHEN: DELETE /api/posts/kick_participant
        const res = await request(app)
            .delete('/api/posts/kick_participant')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 999, participantId: 2 });

        // THEN: 404
        expect(res.status).toBe(404);
    });

    it('should return 400 when postId or participantId is missing', async () => {
        // GIVEN: Missing required fields
        // WHEN: DELETE /api/posts/kick_participant with partial data
        const res = await request(app)
            .delete('/api/posts/kick_participant')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ postId: 1 }); // missing participantId

        // THEN: 400
        expect(res.status).toBe(400);
    });
});
