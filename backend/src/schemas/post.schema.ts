import { z } from 'zod';

// Zod musi wiedzieć, jakich dokładnie wartości oczekuje Twój enum w Prisma
const TrainingDurationEnum = z.enum([
    'LESS_THAN_1_HOUR',
    'FROM_1_TO_2_HOURS',
    'MORE_THAN_2_HOURS'
]);

export const createPostSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(3, "Title must be at least 3 characters long"),

        gymId: z
            .number({ message: "Gym selection is required. Gym ID must be a number" }),

        description: z
            .string()
            .min(1, "Description or workout plan is required"),

        date: z
            .string()
            .datetime({ message: "Invalid date format. Must be a valid ISO 8601 string" }),

        trainingDuration: TrainingDurationEnum
            .optional()
            .default('FROM_1_TO_2_HOURS'),

        additionalInfo: z
            .string()
            .optional()
            .default(""),

        isPublic: z
            .boolean()
            .optional()
            .default(true),

        maxParticipants: z
            .number()
            .int("Must be an integer")
            .positive("Limit must be greater than 0")
            .nullable()
            .optional()
    }),
});