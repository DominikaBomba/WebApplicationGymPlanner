/**
 * Integration tests for stats routes.
 */
import { mockPrisma } from '../helpers/prisma.mock';

import request from 'supertest';
import app from '../../index';
import {
    TEST_JWT_SECRET,
    generateValidToken,
} from '../helpers/auth.helpers';

beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
});

const validToken = generateValidToken({ userId: '1', login: 'testuser@example.com' });

describe('GET /api/Stats/summary', () => {
    it('should return user stats summary (200)', async () => {
        // GIVEN: User has posts, plans, exercises, and gym visits
        mockPrisma.post.findFirst.mockResolvedValue({
            trainingDuration: 'MORE_THAN_2_HOURS',
            date: new Date('2025-06-10T10:00:00Z'),
        });
        mockPrisma.post.count
            .mockResolvedValueOnce(5)   // totalWorkoutsThisMonth
            .mockResolvedValueOnce(20); // totalPosts
        mockPrisma.trainingPlan.count.mockResolvedValue(3);
        mockPrisma.post.findMany.mockResolvedValue([
            { date: new Date('2025-06-09T10:00:00Z') }, // Monday
            { date: new Date('2025-06-11T10:00:00Z') }, // Wednesday
            { date: new Date('2025-06-13T10:00:00Z') }, // Friday
        ]);
        mockPrisma.post.groupBy.mockResolvedValue([
            { trainingDuration: 'FROM_1_TO_2_HOURS', _count: { trainingDuration: 10 } },
            { trainingDuration: 'LESS_THAN_1_HOUR', _count: { trainingDuration: 5 } },
        ]);
        mockPrisma.exercise.groupBy.mockResolvedValue([
            { name: 'Bench Press', _count: { name: 8 } },
            { name: 'Squats', _count: { name: 5 } },
        ]);

        mockPrisma.post.groupBy
            .mockResolvedValueOnce([
                { trainingDuration: 'FROM_1_TO_2_HOURS', _count: { trainingDuration: 10 } },
            ])
            .mockResolvedValueOnce([
                { gymId: 1, _count: { gymId: 8 } },
            ]);
        mockPrisma.gym.findUnique.mockResolvedValue({ id: 1, name: 'PowerGym' });

        // WHEN: GET /api/Stats/summary with valid auth
        const res = await request(app)
            .get('/api/Stats/summary')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with full stats object
        expect(res.status).toBe(200);
        expect(res.body.summary).toBeDefined();
        expect(res.body.weeklyChart).toBeDefined();
        expect(res.body.weeklyChart.labels).toHaveLength(7);
        expect(res.body.records).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
        // GIVEN: No Authorization header
        // WHEN: GET /api/Stats/summary
        const res = await request(app).get('/api/Stats/summary');

        // THEN: 401
        expect(res.status).toBe(401);
    });

    it('should return stats with zero/default values for user with no data (200)', async () => {
        // GIVEN: User has no posts, plans, or exercises
        mockPrisma.post.findFirst.mockResolvedValue(null);
        mockPrisma.post.count
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);
        mockPrisma.trainingPlan.count.mockResolvedValue(0);
        mockPrisma.post.findMany.mockResolvedValue([]);
        mockPrisma.post.groupBy
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);
        mockPrisma.exercise.groupBy.mockResolvedValue([]);

        // WHEN: GET /api/Stats/summary
        const res = await request(app)
            .get('/api/Stats/summary')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with zero counts
        expect(res.status).toBe(200);
        expect(res.body.summary.totalPosts).toBe(0);
        expect(res.body.summary.totalPlans).toBe(0);
        expect(res.body.records.monthlyCount).toBe(0);
        expect(res.body.records.longestSession).toBe('N/A');
    });
});
