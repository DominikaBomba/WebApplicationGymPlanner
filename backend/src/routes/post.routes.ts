
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
        const posts = await prisma.post.findMany({
            where: {
                isPublic: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                        profilePicture: true
                    }
                },
                gym: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        link: true,
                         latitude: true,
                         longitude: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!posts || posts.length === 0) {
            return res.status(200).json([]);
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Błąd podczas pobierania postów użytkownika' });
    }
});

// post.routes.ts

router.get('/friends-feed', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);

        // 1. Pobieramy relacje znajomości zalogowanego użytkownika
        const friendships = await prisma.friends.findMany({
            where: {
                OR: [
                    { userId: currentUserId },
                    { friendId: currentUserId }
                ]
            }
        });

        // 2. Tworzymy listę ID (znajomi + ja sam)
        const friendIds = friendships.map(rel =>
            rel.userId === currentUserId ? rel.friendId : rel.userId
        );
        const authorsToShow = [...friendIds, currentUserId];

        // 3. Pobieramy posty tych osób
        const posts = await prisma.post.findMany({
            where: {
                userId: { in: authorsToShow }
            },
            include: {
                user: {
                    select: { id: true, nickname: true, profilePicture: true }
                },
                gym: {
                    select: { name: true, city: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Błąd podczas pobierania tablicy znajomych" });
    }
});

router.get('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const targetUserId = Number(req.params.userId);

        if (isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Nieprawidłowy format ID użytkownika' });
        }
        else{
            console.log("dalej")
        }

        const posts = await prisma.post.findMany({
            where: {
                userId: targetUserId,

                // isPublic: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                        profilePicture: true
                    }
                },
                gym: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        link: true,
                        latitude: true,
                         longitude: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!posts || posts.length === 0) {
            return res.status(200).json([]); // Zwracamy pustą tablicę, jeśli brak postów
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Błąd podczas pobierania postów użytkownika' });
    }
});


export default router;