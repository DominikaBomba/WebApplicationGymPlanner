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

export default router;