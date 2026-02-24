import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../db/prisma'; // Dodaj ten import

const router = Router();
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Konwersja stringa na liczbę (Number), aby pasowało do int4 w bazie
        const userId = Number(req.user?.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }, // Teraz typy się zgadzają (number === number)
            select: {
                id: true,
                login: true,
                nickname: true,
                level: true,
                description: true,
                profilePicture: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            message: 'Authenticated successfully!',
            user: user
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching user data' });
    }
});
router.patch('/update', authenticate, async (req: AuthRequest, res: Response) => {
    try{
        const userId = Number(req.user?.userId);
        const {level, description, profilePicture} = req.body;
        console.log(level);
        const updateUser = await prisma.user.update({
            where: { id: userId },
            data: {
                level:level,
                description: description,
                profilePicture : profilePicture

            }

        })

        return res.status(200).json({
            message: 'Updated successfully!',
            user:updateUser
        })
    }
    catch(error){
        return res.status(500).json({ error: 'Error updating user data' });
    }

});
export default router;