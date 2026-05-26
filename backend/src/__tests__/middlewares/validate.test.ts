/**
 * Tests for the validate middleware (Zod schema validation).
 * 
 * The validate middleware parses req.body/query/params against a Zod schema
 * and returns 400 with structured error details on validation failure.
 */
import { Request, Response, NextFunction } from 'express';
import { validate } from '../../middlewares/validate';
import { registerSchema, loginSchema } from '../../schemas/auth.schema';

// Helper to create mock Express req/res/next
function createMocks(body: any = {}, query: any = {}, params: any = {}) {
    const req = { body, query, params } as Partial<Request>;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    const next = jest.fn() as NextFunction;

    return {
        req: req as Request,
        res: res as Response,
        next,
    };
}

describe('validate middleware', () => {
    it('should call next() when body passes loginSchema validation', async () => {
        // GIVEN: A request body with valid login credentials
        const { req, res, next } = createMocks({
            login: 'user@example.com',
            password: 'secret123',
        });

        // WHEN: validate(loginSchema) middleware is invoked
        const middleware = validate(loginSchema);
        await middleware(req, res, next);

        // THEN: next() is called, no error response
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 with field errors when body has invalid email', async () => {
        // GIVEN: A request body with an invalid email format
        const { req, res, next } = createMocks({
            login: 'not-an-email',
            password: 'secret123',
        });

        // WHEN: validate(loginSchema) middleware is invoked
        const middleware = validate(loginSchema);
        await middleware(req, res, next);

        // THEN: 400 returned with "Validation failed" error and field details
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'Validation failed' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing (empty body)', async () => {
        // GIVEN: An empty request body (missing all required fields)
        const { req, res, next } = createMocks({});

        // WHEN: validate(registerSchema) middleware is invoked
        const middleware = validate(registerSchema);
        await middleware(req, res, next);

        // THEN: 400 returned with validation errors for each missing field
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'Validation failed' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when body passes registerSchema validation', async () => {
        // GIVEN: A valid registration body
        const { req, res, next } = createMocks({
            login: 'newuser@example.com',
            nickname: 'NewUser',
            password: 'strongpass123',
        });

        // WHEN: validate(registerSchema) middleware is invoked
        const middleware = validate(registerSchema);
        await middleware(req, res, next);

        // THEN: next() is called, validated data is applied to req.body
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
