import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from '../db/prisma';

export const getUserStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = Number(req.user?.userId);
        const longestWorkout = await prisma.post.findFirst({
            where: { userId },
            orderBy: { trainingDuration: 'desc' },
            select: { trainingDuration: true, date: true }
        });

        const totalWorkoutsThisMonth = await prisma.post.count({
            where: {
                userId,
                date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
        });

        const totalPosts = await prisma.post.count({ where: { userId } });
        const totalPlans = await prisma.trainingPlan.count({ where: { authorId: userId } });

        const allWorkouts = await prisma.post.findMany({
            where: { userId },
            select: { date: true }
        });

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const distribution: Record<string, number> = {
            "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0
        };

        allWorkouts.forEach(workout => {
            const dayIndex = new Date(workout.date).getDay(); // 0-6
            const dayName = dayNames[dayIndex];
            distribution[dayName]++;
        });

        const durationStats = await prisma.post.groupBy({
            by: ['trainingDuration'],
            where: { userId },
            _count: { trainingDuration: true }
        });

        const durationChart = durationStats.map(stat => ({
            name: stat.trainingDuration.replace(/_/g, ' '),
            count: stat._count.trainingDuration,
            color: stat.trainingDuration === 'LESS_THAN_1_HOUR' ? '#ff6384' :
                stat.trainingDuration === 'FROM_1_TO_2_HOURS' ? '#36a2eb' : '#ffce56',
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        }));

        const topExercises = await prisma.exercise.groupBy({
            by: ['name'],
            where: { trainingPlan: { authorId: userId } },
            _count: { name: true },
            orderBy: { _count: { name: 'desc' } },
            take: 5
        });

        const gymStats = await prisma.post.groupBy({
            by: ['gymId'],
            where: { userId },
            _count: { gymId: true },
            orderBy: { _count: { gymId: 'desc' } },
            take: 3
        });

        const topGyms = await Promise.all(gymStats.map(async (stat) => {
            const gym = await prisma.gym.findUnique({ where: { id: stat.gymId } });
            return { name: gym?.name || "Nieznana", count: stat._count.gymId };
        }));

        res.json({
            summary: { totalPosts, totalPlans },
            weeklyChart: {
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                data: [
                    distribution["Mon"],
                    distribution["Tue"],
                    distribution["Wed"],
                    distribution["Thu"],
                    distribution["Fri"],
                    distribution["Sat"],
                    distribution["Sun"]
                ]
            },
            durationChart,
            topExercises,
            topGyms,
            records: {
                longestSession: longestWorkout?.trainingDuration?.replace(/_/g, ' ') || "N/A",
                monthlyCount: totalWorkoutsThisMonth

            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Błąd serwera" });
    }
};