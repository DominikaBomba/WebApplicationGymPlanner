/**
 * Centralized Prisma mock factory.
 * Provides a deeply-mocked PrismaClient where every model method is a jest.fn().
 * 
 * Usage: Import this BEFORE importing any module that uses `../db/prisma`.
 * Jest will intercept the import and return the mock.
 */

const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    post: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    gym: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
    },
    friends: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
    },
    participants: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
    },
    trainingPlan: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    exercise: {
        groupBy: jest.fn(),
    },
};

// Mock the prisma module so every import of '../db/prisma' gets the mock
jest.mock('../../db/prisma', () => ({
    prisma: mockPrisma,
}));

export { mockPrisma };
