import { createPost } from '../controllers/post.controller';
import { validate } from '../middlewares/validate';
import { createPostSchema } from '../schemas/post.schema';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middlewares/auth.middleware';
import { Router, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();
router.post('/', authenticate, validate(createPostSchema), createPost);

router.get('/all', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId ? Number(req.user.userId) : -1;
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

router.get('/joined', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);

        const posts = await prisma.post.findMany({
            where: {
                userId: { not: currentUserId },
                participants: {
                    some: {
                        participantId: currentUserId
                    }
                }
            },
            include: {
                user: { select: { id: true, nickname: true, profilePicture: true, level: true } },
                gym: { select: { id: true, name: true, address: true, city: true, link: true, latitude: true, longitude: true } },
                participants: { where: { participantId: currentUserId } },
                _count: { select: { participants: true } }
            },
            orderBy: { date: 'asc' }
        });

        return res.status(200).json(posts || []);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching posts joined by the user' });
    }
});

router.get('/friends-feed', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);

        const friendsRelations = await prisma.friends.findMany({
            where: {
                OR: [
                    { userId: currentUserId },
                    { friendId: currentUserId }
                ]
            }
        });

        const friendIds = friendsRelations.map(rel =>
            rel.userId === currentUserId ? rel.friendId : rel.userId
        );

        const posts = await prisma.post.findMany({
            where: {
                userId: { in: friendIds }
            },
            include: {
                user: { select: { id: true, nickname: true, profilePicture: true, level: true } },
                gym: { select: { id: true, name: true, address: true, city: true } },
                participants: { where: { participantId: currentUserId } },
                _count: { select: { participants: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Błąd pobierania postów znajomych' });
    }
});

router.get('/details/:postId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const postId = Number(req.params.postId);
        const currentUserId = Number(req.user?.userId);

        if (isNaN(postId)) return res.status(400).json({ error: "Nieprawidłowe ID posta" });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                user: {
                    select: { id: true, nickname: true, profilePicture: true, level: true }
                },
                gym: true,
                trainingPlan: {
                    include: {
                        exercises: true // Pobieramy listę ćwiczeń wewnątrz planu
                    }
                },
                participants: {
                    include: {
                        user: { select: { nickname: true, profilePicture: true } }
                    }
                },
                _count: {
                    select: { participants: true }
                }
            }
        });

        if (!post) return res.status(404).json({ error: "Post nie istnieje" });

        // Opcjonalnie: Tutaj możesz dodać sprawdzenie, czy użytkownik ma prawo widzieć ten post
        // (np. jeśli isPublic: false i nie są znajomymi)

        return res.status(200).json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Błąd serwera" });
    }
});
router.get('/discover', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);

        const friendsRelations = await prisma.friends.findMany({
            where: {
                OR: [
                    { userId: currentUserId },
                    { friendId: currentUserId }
                ]
            }
        });

        const friendIds = friendsRelations.map(rel =>
            rel.userId === currentUserId ? rel.friendId : rel.userId
        );

        const excludedIds = [...friendIds, currentUserId];

        const posts = await prisma.post.findMany({
            where: {
                isPublic: true,
                userId: { notIn: excludedIds }
            },
            include: {
                user: { select: { id: true, nickname: true, profilePicture: true, level: true } },
                gym: { select: { id: true, name: true, address: true, city: true, link: true, latitude: true, longitude: true } },
                participants: { where: { participantId: currentUserId } },
                _count: { select: { participants: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching discover posts' });
    }
});
router.get('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const targetUserId = Number(req.params.userId);
        if (isNaN(targetUserId)) return res.status(400).json({ error: 'Invalid Id format' });

        const whereClause: any = { userId: targetUserId };

        if (currentUserId !== targetUserId) {
            const isFriend = await prisma.friends.findFirst({
                where: {
                    OR: [
                        { userId: currentUserId, friendId: targetUserId },
                        { userId: targetUserId, friendId: currentUserId }
                    ]
                }
            });

            if (!isFriend) {
                whereClause.isPublic = true;
            }
        }

        const posts = await prisma.post.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, nickname: true, profilePicture: true, level: true } },
                gym: { select: { id: true, name: true, address: true, city: true, link: true, latitude: true, longitude: true } },
                participants: { where: { participantId: Number(req.user?.userId) } },
                _count: { select: { participants: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(posts || []);
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching user posts' });
    }
});

router.post('/join_post', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const { postId } = req.body;

        if (!postId) return res.status(400).json({ error: "Post ID is required" });

        const targetPost = await prisma.post.findUnique({
            where: { id: Number(postId) },
            include: {
                _count: {
                    select: { participants: true }
                }
            }
        });

        if (!targetPost) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (targetPost.userId === currentUserId) {
            return res.status(400).json({ error: "You cannot join your own training session" });
        }


        if (targetPost.maxParticipants !== null && targetPost._count.participants >= targetPost.maxParticipants) {
            return res.status(400).json({ error: "This training session is already full." });
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

        res.status(201).json({ message: "You signed up successfully", participant: newParticipant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error occurred while joining the session" });
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

router.delete('/kick_participant', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const { postId, participantId } = req.body;

        if (!postId || !participantId) {
            return res.status(400).json({ error: "Post ID and Participant ID are required" });
        }

        const post = await prisma.post.findUnique({
            where: { id: Number(postId) }
        });

        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.userId !== currentUserId) {
            return res.status(403).json({ error: "Only the author can remove participants from this training" });
        }

        await prisma.participants.deleteMany({
            where: {
                postId: Number(postId),
                participantId: Number(participantId)
            }
        });

        res.status(200).json({ message: "Participant has been removed from the training" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during removing participant" });
    }
});

router.delete('/:postId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const postId = Number(req.params.postId);

        if (isNaN(postId)) {
            return res.status(400).json({ error: "Invalid Post ID format" });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.userId !== currentUserId) {
            return res.status(403).json({ error: "You are not authorized to delete this post. You can only delete your own posts." });
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        return res.status(200).json({ message: "Post has been successfully deleted" });
    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ error: "An error occurred while deleting the post" });
    }
});

export default router;