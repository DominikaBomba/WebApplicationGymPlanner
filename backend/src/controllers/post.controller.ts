import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from '../db/prisma';

export const createPost = async(req: AuthRequest, res: Response) => {
    try {
        console.log("DANE Z POSTMANA PO ZODZIE:", req.body);
        const userId = Number(req.user?.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID from token.' });
        }

        const {
            title,
            gymId,
            description,
            date,
            trainingDuration,
            additionalInfo,
            isPublic,
            maxParticipants
        } = req.body;

        const gymExists = await prisma.gym.findUnique({
            where: { id: gymId }
        });

        if (!gymExists) {
            return res.status(404).json({ error: 'Selected gym does not exist.' });
        }

        const newPost = await prisma.post.create({
            data: {
                userId,
                gymId,
                title,
                description,
                date: new Date(date),
                trainingDuration,
                additionalInfo,
                isPublic,
                maxParticipants
            }
        });

        return res.status(201).json({
            message: 'Post created successfully!',
            post: newPost
        });

    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Internal server error while creating post.' + error });
    }
};