/**
 * Unit tests for Zod auth schemas (registerSchema, loginSchema).
 * 
 * Tests validation rules directly (without Express middleware).
 */
import { registerSchema, loginSchema } from '../../schemas/auth.schema';

describe('registerSchema', () => {
    const validData = {
        body: {
            login: 'user@example.com',
            nickname: 'TestUser',
            password: 'secret123',
        },
    };

    it('should accept valid registration data', async () => {
        // GIVEN: A complete, valid registration payload
        // WHEN: parseAsync is called
        // THEN: It resolves without throwing
        await expect(registerSchema.parseAsync(validData)).resolves.toBeDefined();
    });

    it('should reject invalid email format', async () => {
        // GIVEN: Login field is not a valid email
        const data = { body: { ...validData.body, login: 'not-an-email' } };

        // WHEN: parseAsync is called
        // THEN: It rejects with "Invalid email format" error
        await expect(registerSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject empty login (email)', async () => {
        // GIVEN: Login field is empty string
        const data = { body: { ...validData.body, login: '' } };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(registerSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject nickname shorter than 3 characters', async () => {
        // GIVEN: Nickname is only 2 characters long
        const data = { body: { ...validData.body, nickname: 'ab' } };

        // WHEN: parseAsync is called
        // THEN: It rejects with "at least 3 characters" error
        await expect(registerSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject password shorter than 6 characters', async () => {
        // GIVEN: Password is only 5 characters long
        const data = { body: { ...validData.body, password: '12345' } };

        // WHEN: parseAsync is called
        // THEN: It rejects with "at least 6 characters" error
        await expect(registerSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject when all fields are missing', async () => {
        // GIVEN: Body is empty
        const data = { body: {} };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(registerSchema.parseAsync(data)).rejects.toThrow();
    });
});

describe('loginSchema', () => {
    const validData = {
        body: {
            login: 'user@example.com',
            password: 'anypassword',
        },
    };

    it('should accept valid login credentials', async () => {
        // GIVEN: A valid email and non-empty password
        // WHEN: parseAsync is called
        // THEN: It resolves
        await expect(loginSchema.parseAsync(validData)).resolves.toBeDefined();
    });

    it('should reject invalid email format', async () => {
        // GIVEN: Login is not a valid email
        const data = { body: { ...validData.body, login: 'bad-email' } };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(loginSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject empty password', async () => {
        // GIVEN: Password is empty string
        const data = { body: { ...validData.body, password: '' } };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(loginSchema.parseAsync(data)).rejects.toThrow();
    });
});
