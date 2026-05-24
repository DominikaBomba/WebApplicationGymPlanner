import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();


router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { title, exercises } = req.body;
        const userId = Number(req.user?.userId);

        if (!title || !exercises || exercises.length === 0) {
            return res.status(400).json({ error: "Tytuł i co najmniej jedno ćwiczenie są wymagane." });
        }


        // @ts-ignore
        const newPlan = await prisma.trainingPlan.create({
            data: {
                title,
                authorId: userId,
                exercises: {
                    create: exercises.map((ex: any) => ({
                        name: ex.name,
                        reps: ex.reps,
                        externalId: ex.externalId ? String(ex.externalId) : null
                    }))
                }
            },
            include: { exercises: true }
        });

        res.status(201).json(newPlan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Błąd podczas tworzenia planu treningowego." });
    }
});

router.get('/my-plans', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = Number(req.user?.userId);

        // @ts-ignore
        const plans = await prisma.trainingPlan.findMany({
            where: { authorId: userId },
            include: { exercises: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: "Błąd podczas pobierania Twoich planów." });
    }
});

router.get('/friends-plans', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = Number(req.user?.userId);

        const friends = await prisma.friends.findMany({
            where: {
                OR: [
                    { userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        const friendIds = friends.map(f => f.userId === userId ? f.friendId : f.userId);

        if (friendIds.length === 0) return res.json([]);

        const plans = await prisma.trainingPlan.findMany({
            where: { authorId: { in: friendIds } },
            include: {
                exercises: true,
                author: { select: { id: true, nickname: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: "Błąd podczas pobierania planów znajomych." });
    }
});

router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = Number(req.params.userId);

        const plans = await prisma.trainingPlan.findMany({
            where: { authorId: userId },
            include: { exercises: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: "Error fetching plans." });
    }
});
router.delete('/:planId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const planId = Number(req.params.planId);

        if (isNaN(planId)) return res.status(400).json({ error: "Invalid Plan ID" });

        const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });

        if (!plan) return res.status(404).json({ error: "Plan not found" });
        if (plan.authorId !== currentUserId) {
            return res.status(403).json({ error: "Unauthorized to delete this plan" });
        }

        await prisma.trainingPlan.delete({ where: { id: planId } });

        return res.status(200).json({ message: "Plan deleted successfully" });
    } catch (error) {
        console.error("Error deleting plan:", error);
        return res.status(500).json({ error: "An error occurred while deleting the plan" });
    }
});

export default router;