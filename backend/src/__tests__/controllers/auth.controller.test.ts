/**
 * Integration tests for auth controller endpoints (POST /api/auth/register, POST /api/auth/login).
 * 
 * Uses Supertest to make HTTP requests against the Express app.
 * Prisma is mocked
 */
import { mockPrisma } from '../helpers/prisma.mock';

import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import { TEST_JWT_SECRET, mockUser } from '../helpers/auth.helpers';

// Set JWT_SECRET for consistent token generation
beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
});

// ─────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
    const validBody = {
        login: 'newuser@example.com',
        nickname: 'NewUser',
        password: 'secret123',
    };

    it('should register a new user successfully (201)', async () => {
        // GIVEN: No existing user with that email/nickname
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
            id: 10,
            login: validBody.login,
            nickname: validBody.nickname,
            password: 'hashed_password',
            level: 'BEGINNER',
            description: 'Hi, I just joined Gym Buddy!',
            profilePicture: '',
        });

        // WHEN: POST /api/auth/register is called with valid data
        const res = await request(app)
            .post('/api/auth/register')
            .send(validBody);

        // THEN: 201 with user data
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Registration successfull');
        expect(res.body.user).toBeDefined();
        expect(res.body.user.id).toBe(10);
        expect(res.body.user.login).toBe(validBody.login);
        expect(res.body.user.nickname).toBe(validBody.nickname);
        expect(res.body.user.level).toBe('BEGINNER');
    });

    it('should return 400 when email already exists', async () => {
        // GIVEN: A user with the same login already exists in DB
        mockPrisma.user.findFirst.mockResolvedValue({
            ...mockUser,
            login: validBody.login,
            nickname: 'DifferentNickname',
        });

        // WHEN: POST /api/auth/register with duplicate email
        const res = await request(app)
            .post('/api/auth/register')
            .send(validBody);

        // THEN: 400 with specific email-taken error
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('User with this email already exists.');
    });

    it('should return 400 when nickname is already taken', async () => {
        // GIVEN: A user with the same nickname but different login exists
        mockPrisma.user.findFirst.mockResolvedValue({
            ...mockUser,
            login: 'different@example.com',
            nickname: validBody.nickname,
        });

        // WHEN: POST /api/auth/register with duplicate nickname
        const res = await request(app)
            .post('/api/auth/register')
            .send(validBody);

        // THEN: 400 with nickname-taken error
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('This nickname is already taken.');
    });

    it('should return 400 when validation fails (missing required fields)', async () => {
        // GIVEN: An empty request body — Zod validation will fail before controller
        // WHEN: POST /api/auth/register with no data
        const res = await request(app)
            .post('/api/auth/register')
            .send({});

        // THEN: 400 from validation middleware
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when email format is invalid', async () => {
        // GIVEN: Login is not a valid email
        // WHEN: POST /api/auth/register with bad email
        const res = await request(app)
            .post('/api/auth/register')
            .send({ login: 'not-email', nickname: 'Nick', password: 'secret123' });

        // THEN: 400 from Zod validation
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 500 when Prisma create throws an error', async () => {
        // GIVEN: No existing user, but Prisma create throws
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.create.mockRejectedValue(new Error('DB connection failed'));

        // WHEN: POST /api/auth/register
        const res = await request(app)
            .post('/api/auth/register')
            .send(validBody);

        // THEN: 500 internal server error
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error during registration.');
    });
});

// ─────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
    const validBody = {
        login: 'testuser@example.com',
        password: 'correctpassword',
    };

    it('should log in successfully and return JWT (200)', async () => {
        // GIVEN: User exists in DB with matching password hash
        const hashedPassword = await bcrypt.hash(validBody.password, 10);
        mockPrisma.user.findUnique.mockResolvedValue({
            ...mockUser,
            login: validBody.login,
            password: hashedPassword,
            friendsAdded: [],
            friendsOf: [],
        });

        // WHEN: POST /api/auth/login with correct credentials
        const res = await request(app)
            .post('/api/auth/login')
            .send(validBody);

        // THEN: 200 with token and user data
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(typeof res.body.token).toBe('string');
        expect(res.body.user).toBeDefined();
        expect(res.body.user.id).toBe(mockUser.id);
        expect(res.body.user.login).toBe(validBody.login);
        expect(res.body.user.friends).toBeDefined();
    });

    it('should return 401 when user does not exist', async () => {
        // GIVEN: No user with that login in DB
        mockPrisma.user.findUnique.mockResolvedValue(null);

        // WHEN: POST /api/auth/login
        const res = await request(app)
            .post('/api/auth/login')
            .send(validBody);

        // THEN: 401 with generic error
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid email or password.');
    });

    it('should return 401 when password is wrong', async () => {
        // GIVEN: User exists but password doesn't match
        const wrongHash = await bcrypt.hash('different_password', 10);
        mockPrisma.user.findUnique.mockResolvedValue({
            ...mockUser,
            login: validBody.login,
            password: wrongHash,
            friendsAdded: [],
            friendsOf: [],
        });

        // WHEN: POST /api/auth/login with wrong password
        const res = await request(app)
            .post('/api/auth/login')
            .send(validBody);

        // THEN: 401
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid email or password.');
    });

    it('should return 400 when validation fails (empty body)', async () => {
        // GIVEN: Empty request body — Zod validation fails
        // WHEN: POST /api/auth/login with no data
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        // THEN: 400 from validation middleware
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 500 when Prisma findUnique throws', async () => {
        // GIVEN: Prisma throws a database error
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB connection lost'));

        // WHEN: POST /api/auth/login
        const res = await request(app)
            .post('/api/auth/login')
            .send(validBody);

        // THEN: 500
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error during login.');
    });
});
