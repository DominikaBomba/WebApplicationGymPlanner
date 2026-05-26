/**
 * Unit tests for Zod createPostSchema.
 * 
 * Tests validation rules for post creation input directly.
 */
import { createPostSchema } from '../../schemas/post.schema';

describe('createPostSchema', () => {
    const validData = {
        body: {
            title: 'Morning Workout',
            gymId: 1,
            description: 'Chest and back day',
            date: '2025-06-15T08:00:00.000Z',
            trainingDuration: 'FROM_1_TO_2_HOURS',
            additionalInfo: 'Bring water',
            isPublic: true,
            maxParticipants: 5,
            trainingPlanId: null,
        },
    };

    it('should accept valid full post data', async () => {
        // GIVEN: A complete, valid post creation payload
        // WHEN: parseAsync is called
        // THEN: It resolves without throwing
        await expect(createPostSchema.parseAsync(validData)).resolves.toBeDefined();
    });

    it('should accept data with only required fields (optional fields omitted)', async () => {
        // GIVEN: Only required fields: title, gymId, description, date
        const minimalData = {
            body: {
                title: 'Quick Session',
                gymId: 1,
                description: 'Some workout',
                date: '2025-06-15T08:00:00.000Z',
            },
        };

        // WHEN: parseAsync is called
        // THEN: Resolves with defaults (isPublic: true, trainingDuration: 'FROM_1_TO_2_HOURS')
        const result = await createPostSchema.parseAsync(minimalData);
        expect(result.body.isPublic).toBe(true);
        expect(result.body.trainingDuration).toBe('FROM_1_TO_2_HOURS');
        expect(result.body.additionalInfo).toBe('');
    });

    it('should reject title shorter than 3 characters', async () => {
        // GIVEN: Title is only 2 characters
        const data = { body: { ...validData.body, title: 'Ab' } };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject missing gymId', async () => {
        // GIVEN: gymId is omitted
        const { gymId, ...bodyWithoutGym } = validData.body;
        const data = { body: bodyWithoutGym };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject non-number gymId', async () => {
        // GIVEN: gymId is a string instead of number
        const data = { body: { ...validData.body, gymId: 'abc' } };

        // WHEN: parseAsync is called
        // THEN: It rejects with "must be a number" error
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject invalid date format', async () => {
        // GIVEN: date is not a valid ISO 8601 string
        const data = { body: { ...validData.body, date: '2025-13-99' } };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject empty description', async () => {
        // GIVEN: description is empty string
        const data = { body: { ...validData.body, description: '' } };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject invalid trainingDuration enum value', async () => {
        // GIVEN: trainingDuration has a non-enum value
        const data = { body: { ...validData.body, trainingDuration: 'INVALID_DURATION' } };

        // WHEN: parseAsync is called
        // THEN: It rejects
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject negative maxParticipants', async () => {
        // GIVEN: maxParticipants is negative
        const data = { body: { ...validData.body, maxParticipants: -1 } };

        // WHEN: parseAsync is called
        // THEN: It rejects with "greater than 0" error
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject non-integer maxParticipants', async () => {
        // GIVEN: maxParticipants is a float
        const data = { body: { ...validData.body, maxParticipants: 2.5 } };

        // WHEN: parseAsync is called
        // THEN: It rejects with "Must be an integer" error
        await expect(createPostSchema.parseAsync(data)).rejects.toThrow();
    });
});
