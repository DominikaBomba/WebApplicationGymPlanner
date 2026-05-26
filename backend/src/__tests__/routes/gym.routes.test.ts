/**
 * Integration tests for gym routes.
 */
import { mockPrisma } from '../helpers/prisma.mock';

import request from 'supertest';
import app from '../../index';
import {
    TEST_JWT_SECRET,
    generateValidToken,
    mockGym,
} from '../helpers/auth.helpers';

beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
});

const validToken = generateValidToken({ userId: '1', login: 'testuser@example.com' });

describe('GET /api/gyms', () => {
    it('should return all gyms (200)', async () => {
        // GIVEN: Gyms exist in the database
        mockPrisma.gym.findMany.mockResolvedValue([mockGym, { ...mockGym, id: 2, name: 'FitFlex' }]);

        // WHEN: GET /api/gyms with valid auth
        const res = await request(app)
            .get('/api/gyms')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with array of gyms
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toBe('PowerGym');
    });

    it('should return empty array when no gyms exist (200)', async () => {
        // GIVEN: No gyms in database
        mockPrisma.gym.findMany.mockResolvedValue([]);

        // WHEN: GET /api/gyms with valid auth
        const res = await request(app)
            .get('/api/gyms')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 200 with empty array
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    it('should return 401 without auth token', async () => {
        // GIVEN: No Authorization header
        // WHEN: GET /api/gyms
        const res = await request(app).get('/api/gyms');

        // THEN: 401
        expect(res.status).toBe(401);
    });

    it('should return 500 when Prisma throws an error', async () => {
        // GIVEN: Prisma findMany rejects with an error
        mockPrisma.gym.findMany.mockRejectedValue(new Error('DB connection failed'));

        // WHEN: GET /api/gyms
        const res = await request(app)
            .get('/api/gyms')
            .set('Authorization', `Bearer ${validToken}`);

        // THEN: 500
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error while fetching gyms.');
    });
});
