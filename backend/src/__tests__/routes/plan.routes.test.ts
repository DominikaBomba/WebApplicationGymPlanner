/**
 * Integration tests for training plan routes.
 */
import { mockPrisma } from '../helpers/prisma.mock';

import request from 'supertest';
import app from '../../index';
import {
    TEST_JWT_SECRET,
    generateValidToken,
    mockTrainingPlan,
} from '../helpers/auth.helpers';

beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
});

const validToken = generateValidToken({ userId: '1', login: 'testuser@example.com' });

// ─────────────────────────────────────────────────────
// POST /api/plans (create training plan)
// ─────────────────────────────────────────────────────
describe('POST /api/plans', () => {
    const validBody = {
        title: 'Push Day',
        exercises: [
            { name: 'Bench Press', reps: '4x10' },
            { name: 'Shoulder Press', reps: '3x12' },
        ],
    };

    it('should create a training plan successfully (201)', async () => {
        // GIVEN: Valid auth, valid body with title and exercises
        mockPrisma.trainingPlan.create.mockResolvedValue(mockTrainingPlan);

        // WHEN: POST /api/plans
        const res = await request(app)
            .post('/api/plans')
            .set('Authorization', `Bearer ${validToken}`)
            .send(validBody);

        // THEN: 201 with plan data including exercises
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Push Day');
        expect(res.body.exercises).toHaveLength(2);
    });

    it('should return 400 when title is missing', async () => {
        // GIVEN: No title in body
        // WHEN: POST /api/plans
        const res = await request(app)
            .post('/api/plans')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ exercises: [{ name: 'Bench Press', reps: '4x10' }] });

        // THEN: 400
        expect(res.status).toBe(400);
    });

    it('should return 400 when exercises array is empty', async () => {
        // GIVEN: Empty exercises array
        // WHEN: POST /api/plans
        const res = await request(app)
            .post('/api/plans')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ title: 'Empty Plan', exercises: [] });

        // THEN: 400
        expect(res.status).toBe(400);
    });

    it('should return 400 when exercises is missing', async () => {
        // GIVEN: No exercises field
        // WHEN: POST /api/plans
        const res = await request(app)
            .post('/api/plans')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ title: 'No Exercises' });

        // THEN: 400
        expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
        // GIVEN: No Authorization header
        // WHEN: POST /api/plans
        const res = await request(app)
            .post('/api/plans')
            .send({ title: 'Plan', exercises: [{ name: 'X', reps: '3x10' }] });

        // THEN: 401
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────
// GET /api/plans/my-plans
// ─────────────────────────────────────────────────────
describe('GET /api/plans/my-plans', () => {
    it('should return user\'s own plans (200)', async () => {
        // GIVEN: User has plans in DB
        mockPrisma.trainingPlan.findMany.mockResolvedValue([mockTrainingPlan]);

        // WHEN: GET /api/plans/my-plans
        const res = await request(app)
            .get('/api/plans/my-plans')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with array of plans
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
    });

    it('should return empty array when user has no plans', async () => {
        // GIVEN: No plans for this user
        mockPrisma.trainingPlan.findMany.mockResolvedValue([]);

        // WHEN: GET /api/plans/my-plans
        const res = await request(app)
            .get('/api/plans/my-plans')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with empty array
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────
// DELETE /api/plans/:planId
// ─────────────────────────────────────────────────────
describe('DELETE /api/plans/:planId', () => {
    it('should delete own plan successfully (200)', async () => {
        // GIVEN: Plan exists, user is the author
        mockPrisma.trainingPlan.findUnique.mockResolvedValue({ ...mockTrainingPlan, authorId: 1 });
        mockPrisma.trainingPlan.delete.mockResolvedValue(mockTrainingPlan);

        // WHEN: DELETE /api/plans/1
        const res = await request(app)
            .delete('/api/plans/1')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Plan deleted successfully');
    });

    it('should return 403 when deleting another user\'s plan', async () => {
        // GIVEN: Plan exists but author is a different user
        mockPrisma.trainingPlan.findUnique.mockResolvedValue({ ...mockTrainingPlan, authorId: 2 });

        // WHEN: DELETE /api/plans/1
        const res = await request(app)
            .delete('/api/plans/1')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 403
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Unauthorized to delete this plan');
    });

    it('should return 404 when plan does not exist', async () => {
        // GIVEN: Plan not found
        mockPrisma.trainingPlan.findUnique.mockResolvedValue(null);

        // WHEN: DELETE /api/plans/999
        const res = await request(app)
            .delete('/api/plans/999')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 404
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Plan not found');
    });

    it('should return 400 for invalid planId format', async () => {
        // GIVEN: planId is not a number
        // WHEN: DELETE /api/plans/abc
        const res = await request(app)
            .delete('/api/plans/abc')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 400
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid Plan ID');
    });
});
