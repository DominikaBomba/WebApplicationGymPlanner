import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// ścieżka chroniona autoryzacją
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
    // jeżeli mamy odpowiedni token
    return res.status(200).json({
        message: 'Authenticated successfully!',
        user: req.user
    });
});

export default router;