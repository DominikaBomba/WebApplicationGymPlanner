/**
 * Tests for authenticate and optionalAuthenticate middlewares.
 */
import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate, AuthRequest } from '../../middlewares/auth.middleware';
import {
    TEST_JWT_SECRET,
    generateValidToken,
    generateExpiredToken,
    generateWrongSecretToken,
} from '../helpers/auth.helpers';

// Mock process.env for consistent JWT_SECRET
beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
});

// Helper to create mock Express req/res/next
function createMocks() {
    const req = {
        headers: {},
    } as Partial<AuthRequest>;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    const next = jest.fn() as NextFunction;

    return {
        req: req as AuthRequest,
        res: res as Response,
        next,
    };
}

// ─────────────────────────────────────────────────────
// authenticate middleware
// ─────────────────────────────────────────────────────
describe('authenticate middleware', () => {
    it('should return 401 when no Authorization header is present', () => {
        // GIVEN: Request has no Authorization header
        const { req, res, next } = createMocks();

        // WHEN: authenticate is called
        authenticate(req, res, next);

        // THEN: 401 is returned with appropriate error
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has no Bearer token', () => {
        // GIVEN: Authorization header exists but token part is empty after split
        const { req, res, next } = createMocks();
        req.headers.authorization = 'Bearer ';

        // WHEN: authenticate is called
        authenticate(req, res, next);

        // THEN: 401 (empty string is falsy in javascript)
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid/malformed', () => {
        // GIVEN: Authorization header has a malformed JWT
        const { req, res, next } = createMocks();
        req.headers.authorization = 'Bearer invalid.token.here';

        // WHEN: authenticate is called
        authenticate(req, res, next);

        // THEN: 403 because jwt.verify throws
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when token is expired', () => {
        // GIVEN: A properly-signed but expired JWT
        const { req, res, next } = createMocks();
        const expiredToken = generateExpiredToken({ userId: '1', login: 'test@test.com' });
        req.headers.authorization = `Bearer ${expiredToken}`;

        // WHEN: authenticate is called
        authenticate(req, res, next);

        // THEN: 403 because token has expired
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when token is signed with wrong secret', () => {
        // GIVEN: Token signed with a different secret than JWT_SECRET
        const { req, res, next } = createMocks();
        const wrongToken = generateWrongSecretToken({ userId: '1', login: 'test@test.com' });
        req.headers.authorization = `Bearer ${wrongToken}`;

        // WHEN: authenticate is called
        authenticate(req, res, next);

        // THEN: 403 because signature verification fails
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should attach decoded user to req and call next() for a valid token', () => {
        // GIVEN: A valid JWT with userId and login in payload
        const { req, res, next } = createMocks();
        const validToken = generateValidToken({ userId: '1', login: 'test@test.com' });
        req.headers.authorization = `Bearer ${validToken}`;

        // WHEN: authenticate is called
        authenticate(req, res, next);

        // THEN: req.user is set with decoded payload, next() is called
        expect(req.user).toBeDefined();
        expect(req.user?.userId).toBe('1');
        expect(req.user?.login).toBe('test@test.com');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────
// optionalAuthenticate middleware
// ─────────────────────────────────────────────────────
describe('optionalAuthenticate middleware', () => {
    it('should call next() without setting user when no token is provided', () => {
        // GIVEN: Request has no Authorization header
        const { req, res, next } = createMocks();

        // WHEN: optionalAuthenticate is called
        optionalAuthenticate(req, res, next);

        // THEN: next() called, user remains undefined
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeUndefined();
    });

    it('should call next() without setting user when token is the string "null"', () => {
        // GIVEN: Authorization header contains literal string "null"
        const { req, res, next } = createMocks();
        req.headers.authorization = 'Bearer null';

        // WHEN: optionalAuthenticate is called
        optionalAuthenticate(req, res, next);

        // THEN: next() called, user remains undefined (special case in code)
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeUndefined();
    });

    it('should call next() without setting user when token is invalid', () => {
        // GIVEN: An invalid token in the Authorization header
        const { req, res, next } = createMocks();
        req.headers.authorization = 'Bearer invalid.token.data';

        // WHEN: optionalAuthenticate is called
        optionalAuthenticate(req, res, next);

        // THEN: next() called, user undefined (error is silently ignored)
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeUndefined();
    });

    it('should attach user and call next() when token is valid', () => {
        // GIVEN: A valid JWT in the Authorization header
        const { req, res, next } = createMocks();
        const validToken = generateValidToken({ userId: '1', login: 'test@test.com' });
        req.headers.authorization = `Bearer ${validToken}`;

        // WHEN: optionalAuthenticate is called
        optionalAuthenticate(req, res, next);

        // THEN: req.user is set, next() called
        expect(req.user).toBeDefined();
        expect(req.user?.userId).toBe('1');
        expect(req.user?.login).toBe('test@test.com');
        expect(next).toHaveBeenCalled();
    });
});
