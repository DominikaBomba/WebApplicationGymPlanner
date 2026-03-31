import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../db/prisma'; // Dodaj ten import

const router = Router();
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = Number(req.user?.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {

                friendsAdded: {
                    include: {
                        friend: {
                            select: { id: true, nickname: true, profilePicture: true, level: true }
                        }
                    }
                },

                friendsOf: {
                    include: {
                        user: {
                            select: { id: true, nickname: true, profilePicture: true, level: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const friendsList = [
            ...user.friendsAdded.map(f => f.friend),
            ...user.friendsOf.map(f => f.user)
        ];

        // Usuwamy surowe relacje Prisma z obiektu przed wysłaniem
        const { friendsAdded, friendsOf, ...userProfile } = user;

        return res.status(200).json({
            message: 'Authenticated successfully!',
            user: {
                ...userProfile,
                friends: friendsList
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching user data' });
    }
});

router.get("/:nickname", authenticate, async (req: AuthRequest, res: Response) => {
    try{
        const targetUsername = String(req.params.nickname);
     //   console.log(targetUsername);
        const user  = await prisma.user.findMany({
            where: {
                nickname: {
                    contains: targetUsername,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                nickname: true,
                level: true,
                description: true,
                profilePicture: true,


            }
        });
        console.log(user);
        if (!user) return res.status(404).json({ error: "Użytkownik nie istnieje" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Błąd serwera" });
    }

});
router.get("/friends/:nickname", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const targetNickname = String(req.params.nickname);


        const user = await prisma.user.findFirst({
            where: { nickname: targetNickname },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ error: "Użytkownik o takim nicku nie istnieje" });
        }

        const targetId = user.id;

        // 2. Szukaj w tabeli Friends, gdzie targetId jest po dowolnej stronie relacji
        const friendsRelations = await prisma.friends.findMany({
            where: {
                OR: [
                    { userId: targetId },
                    { friendId: targetId }
                ]
            },
            include: {
                user: {
                    select: { id: true, nickname: true, profilePicture: true, level: true }
                },
                friend: {
                    select: { id: true, nickname: true, profilePicture: true, level: true }
                }
            }
        });



        const friendsList = friendsRelations.map(rel => {
            return rel.userId === targetId ? rel.friend : rel.user;
        });

        res.json(friendsList);
        console.log(friendsList)
    } catch (error) {
        //console.error(error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
router.post('/friends', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = Number(req.user?.userId);
        const { friendId } = req.body;

        if (currentUserId === Number(friendId)) {
            return res.status(400).json({ error: "Nie możesz dodać siebie do znajomych" });
        }


        const existingFriendship = await prisma.friends.findFirst({
            where: {
                OR: [
                    { userId: currentUserId, friendId: Number(friendId) },
                    { userId: Number(friendId), friendId: currentUserId }
                ]
            }
        });

        if (existingFriendship) {
            return res.status(400).json({ error: "Jesteście już znajomymi" });
        }


        const newFriendship = await prisma.friends.create({
            data: {
                userId: currentUserId,
                friendId: Number(friendId)
            }
        });

        res.status(201).json({ message: "Dodano do znajomych!", friendship: newFriendship });
    } catch (error) {
        res.status(500).json({ error: "Błąd podczas dodawania znajomego" });
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