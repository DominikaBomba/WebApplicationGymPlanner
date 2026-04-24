import { createPost } from '../controllers/post.controller';
import { validate } from '../middlewares/validate';
import { createPostSchema } from '../schemas/post.schema';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { Router, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();
router.post('/', authenticate, validate(createPostSchema), createPost);

router.get('/all', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const { city, gymId, levels, durations, startDate, endDate, startTime, endTime, sort } = req.query;

        const whereClause: any = { isPublic: true };

        if (city) whereClause.gym = { city: { contains: String(city), mode: 'insensitive' } };
        if (gymId) whereClause.gymId = Number(gymId);
        if (levels) whereClause.user = { level: { in: String(levels).split(',') } };
        if (durations) whereClause.trainingDuration = { in: String(durations).split(',') };

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(String(startDate));
            if (endDate) whereClause.date.lte = new Date(String(endDate));
        }

        let orderByClause: any = { createdAt: 'desc' };
        if (sort === 'soonest') orderByClause = { date: 'asc' };
        else if (sort === 'latest') orderByClause = { createdAt: 'desc' };
        else if (sort === 'oldest') orderByClause = { createdAt: 'asc' };

        let posts = await prisma.post.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { id: true, nickname: true, profilePicture: true, level: true }
                },
                gym: {
                    select: { id: true, name: true, address: true, city: true, link: true, latitude: true, longitude: true }
                },
                participants: {
                    where: { participantId: currentUserId }
                },
                _count: {
                    select: { participants: true }
                }
            },
            orderBy: orderByClause
        });

        if (startTime || endTime) {
            posts = posts.filter(post => {
                const postTime = post.date.getHours() * 60 + post.date.getMinutes();
                const start = startTime ? parseInt(String(startTime).split(':')[0]) * 60 + parseInt(String(startTime).split(':')[1]) : 0;
                const end = endTime ? parseInt(String(endTime).split(':')[0]) * 60 + parseInt(String(endTime).split(':')[1]) : 1439;
                return postTime >= start && postTime <= end;
            });
        }

        return res.status(200).json(posts || []);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching user posts' });
    }
});

router.post('/join_post', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const { postId } = req.body;

        if (!postId) return res.status(400).json({ error: "Post ID is required" });

        const targetPost = await prisma.post.findUnique({
            where: { id: Number(postId) }
        });

        if (!targetPost) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (targetPost.userId === currentUserId) {
            return res.status(400).json({ error: "You cannot join your own training session" });
        }

        const existingParticipant = await prisma.participants.findFirst({
            where: { participantId: currentUserId, postId: Number(postId) }
        });

        if (existingParticipant) {
            return res.status(400).json({ error: "You are already participating in this activity" });
        }

        const newParticipant = await prisma.participants.create({
            data: { participantId: currentUserId, postId: Number(postId) }
        });

        res.status(201).json({ message: "You signed up", participant: newParticipant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during adding you" });
    }
});

router.delete('/leave_post', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const { postId } = req.body;

        if (!postId) return res.status(400).json({ error: "Post ID is required" });

        const deleteResult = await prisma.participants.deleteMany({
            where: { participantId: currentUserId, postId: Number(postId) }
        });

        if (deleteResult.count === 0) {
            return res.status(404).json({ error: "Nie byłeś zapisany na ten trening." });
        }

        res.status(200).json({ message: "Zrezygnowano z treningu" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Błąd podczas wypisywania się z treningu" });
    }
});

export default router;